<?php

namespace App\Controller\Competition;

use App\Entity\Competition\Competition;
use App\Entity\Competition\CompetitionParticipantInvitation;
use App\Entity\Security\User;
use App\Repository\Competition\CompetitionParticipantInvitationRepository;
use App\Repository\Security\UserRepository;
use App\Service\CompetitionAccessService;
use App\Service\EmailService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class CompetitionParticipantInvitationController extends AbstractController
{
    private const MAX_EMAILS_PER_REQUEST = 80;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CompetitionAccessService $access,
        private readonly CompetitionParticipantInvitationRepository $invitationRepository,
        private readonly UserRepository $userRepository,
        private readonly EmailService $emailService,
        private readonly NotificationService $notificationService,
    ) {
    }

    #[Route('/competitions/{id}/participant-invitations', name: 'competition_participant_invitations_list', methods: ['GET'])]
    public function list(Competition $competition): JsonResponse
    {
        $this->access->denyUnlessManage($this->getUser(), $competition);

        return $this->json([
            'success' => true,
            'invitations' => array_map(
                fn (CompetitionParticipantInvitation $invitation) => $this->serialize($invitation),
                $this->invitationRepository->findBy(['competition' => $competition], ['createdAt' => 'DESC'])
            ),
        ]);
    }

    #[Route('/competitions/{id}/participant-invitations', name: 'competition_participant_invite', methods: ['POST'])]
    public function invite(Request $request, Competition $competition): JsonResponse
    {
        $this->access->denyUnlessManage($this->getUser(), $competition);
        $inviter = $this->getUser();
        if (!$inviter instanceof User) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non connecté'], 401);
        }
        if (!$competition->isPrivate()) {
            return $this->json([
                'success' => false,
                'message' => 'Les invitations par e-mail concernent les compétitions privées.',
            ], 400);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        [$emails, $invalid] = $this->parseEmails($data);
        if ($emails === [] && $invalid === []) {
            return $this->json(['success' => false, 'message' => 'Indiquez au moins une adresse e-mail.'], 400);
        }
        if (\count($emails) > self::MAX_EMAILS_PER_REQUEST) {
            return $this->json([
                'success' => false,
                'message' => 'Maximum '.self::MAX_EMAILS_PER_REQUEST.' adresses à la fois.',
            ], 400);
        }

        $sent = 0;
        $failed = 0;
        $invitations = [];
        foreach ($emails as $email) {
            $result = $this->inviteOne($competition, $inviter, $email);
            $invitations[] = $result['invitation'];
            if ($result['emailSent']) {
                ++$sent;
            } else {
                ++$failed;
            }
        }

        $parts = [];
        if ($sent > 0) {
            $parts[] = $sent === 1 ? '1 invitation envoyée' : "{$sent} invitations envoyées";
        }
        if ($failed > 0) {
            $parts[] = $failed === 1 ? '1 e-mail n’a pas pu partir' : "{$failed} e-mails n’ont pas pu partir";
        }
        if ($invalid !== []) {
            $parts[] = \count($invalid) === 1
                ? '1 adresse invalide ('.implode(', ', $invalid).')'
                : \count($invalid).' adresses invalides';
        }
        if ($emails === [] && $invalid !== []) {
            return $this->json([
                'success' => false,
                'message' => 'Aucune adresse valide. '.implode(' · ', $parts),
                'invalid' => $invalid,
            ], 400);
        }

        return $this->json([
            'success' => true,
            'message' => implode(' · ', $parts) ?: 'Invitations enregistrées.',
            'sent' => $sent,
            'failed' => $failed,
            'invalid' => $invalid,
            'invitations' => $invitations,
            'emailSent' => $failed === 0 && $invalid === [],
        ], 201);
    }

    /**
     * @return array{0: list<string>, 1: list<string>}
     */
    private function parseEmails(array $data): array
    {
        $raw = [];
        if (isset($data['emails']) && \is_array($data['emails'])) {
            foreach ($data['emails'] as $item) {
                $raw[] = (string) $item;
            }
        }
        foreach (['emails', 'email'] as $key) {
            if (isset($data[$key]) && \is_string($data[$key])) {
                foreach (preg_split('/[\s,;]+/u', $data[$key]) ?: [] as $part) {
                    $raw[] = $part;
                }
            }
        }

        $valid = [];
        $invalid = [];
        foreach ($raw as $item) {
            $email = mb_strtolower(trim($item));
            if ($email === '') {
                continue;
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $invalid[$email] = $email;
                continue;
            }
            $valid[$email] = $email;
        }

        return [array_values($valid), array_values($invalid)];
    }

    /** @return array{invitation: array<string, mixed>, emailSent: bool} */
    private function inviteOne(Competition $competition, User $inviter, string $email): array
    {
        $invitedUser = $this->userRepository->findByEmailOrUsername($email);
        if ($invitedUser instanceof User && $invitedUser->isDeleted()) {
            $invitedUser = null;
        }

        $existing = $this->invitationRepository->findForCompetitionAndEmail($competition, $email);
        if ($existing) {
            $invitation = $existing;
            if ($invitedUser && !$invitation->getInvitedUser()) {
                $invitation->setInvitedUser($invitedUser);
                $this->entityManager->flush();
            }
        } else {
            $invitation = new CompetitionParticipantInvitation();
            $invitation->setCompetition($competition);
            $invitation->setEmail($email);
            $invitation->setInvitedUser($invitedUser);
            $invitation->setInvitedBy($inviter);
            while ($this->invitationRepository->findByCode($invitation->getCode())) {
                $invitation->setCode(CompetitionParticipantInvitation::generateCode());
            }
            $this->entityManager->persist($invitation);
            $this->entityManager->flush();
        }

        $emailSent = true;
        try {
            $this->emailService->sendParticipantInvitationEmail($invitation);
        } catch (\Throwable) {
            $emailSent = false;
        }

        if ($invitedUser) {
            try {
                $this->notificationService->notifyCompetitionInvitation(
                    $invitedUser,
                    $competition->getName() ?? '',
                    (int) $competition->getId(),
                    $invitation->getCode()
                );
            } catch (\Throwable) {
            }
        }

        return ['invitation' => $this->serialize($invitation), 'emailSent' => $emailSent];
    }

    /** @return array<string, mixed> */
    private function serialize(CompetitionParticipantInvitation $invitation): array
    {
        return [
            'id' => $invitation->getId(),
            'email' => $invitation->getEmail(),
            'code' => $invitation->getCode(),
            'status' => $invitation->getStatus(),
            'createdAt' => $invitation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'hasAccount' => $invitation->getInvitedUser() !== null,
        ];
    }
}
