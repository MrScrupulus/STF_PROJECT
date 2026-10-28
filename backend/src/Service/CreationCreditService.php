<?php

namespace App\Service;

use App\Entity\Competition\Competition;
use App\Entity\Competition\CreationCredit;
use App\Entity\Security\User;
use App\Repository\Competition\CreationCreditRepository;
use App\Security\AppRoles;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class CreationCreditService
{
    public const DEFAULT_DAYS = 90;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CreationCreditRepository $credits,
        private readonly EmailService $emailService,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function grant(
        User $user,
        ?User $grantedBy,
        int $days = self::DEFAULT_DAYS,
        bool $complimentary = true,
    ): CreationCredit {
        if ($days < 1 || $days > 730) {
            throw new BadRequestHttpException('La durée du bon de création doit être entre 1 et 730 jours.');
        }

        $now = new \DateTimeImmutable();
        $credit = new CreationCredit();
        $credit->setUser($user);
        $credit->setGrantedBy($grantedBy);
        $credit->setExpiresAt($now->modify(sprintf('+%d days', $days)));
        $credit->setIsComplimentary($complimentary);

        $roles = $user->getRoles();
        if (!\in_array(AppRoles::ORGANIZER, $roles, true) && !\in_array(AppRoles::ADMIN, $roles, true)) {
            $user->setRoles(AppRoles::normalize([...$roles, AppRoles::ORGANIZER]));
        }

        $this->entityManager->persist($credit);
        $this->entityManager->flush();

        $expiresParis = $credit->getExpiresAt()->setTimezone(new \DateTimeZone('Europe/Paris'));
        $this->notificationService->createNotification(
            $user,
            'creation_credit',
            'Vous avez un bon de création de compétition, valable jusqu’au ' . $expiresParis->format('d/m/Y') . '.',
            [
                'creditId' => $credit->getId(),
                'expiresAt' => DateTimeHelper::formatParis($credit->getExpiresAt()),
            ]
        );

        try {
            $this->emailService->sendCreationCreditGrantedEmail($credit);
        } catch (\Throwable $e) {
            // L’attribution reste valable même si l’e-mail échoue.
        }

        return $credit;
    }

    public function cancel(CreationCredit $credit): void
    {
        if ($credit->getConsumedAt() !== null) {
            throw new BadRequestHttpException('Ce bon de création a déjà été utilisé.');
        }
        if ($credit->getCancelledAt() !== null) {
            throw new BadRequestHttpException('Ce bon de création est déjà annulé.');
        }
        $credit->cancel();
        $this->entityManager->flush();
    }

    public function consume(User $user, Competition $competition): void
    {
        $this->entityManager->beginTransaction();
        try {
            $credit = $this->credits->findOneAvailableForUpdate($user);
            if (!$credit instanceof CreationCredit) {
                throw new AccessDeniedHttpException(
                    'Vous n’avez pas de bon de création valide. Un administrateur peut vous en attribuer un.'
                );
            }
            $credit->consume($competition);
            $this->entityManager->flush();
            $this->entityManager->commit();
        } catch (\Throwable $e) {
            if ($this->entityManager->getConnection()->isTransactionActive()) {
                $this->entityManager->rollback();
            }
            throw $e;
        }
    }

    /**
     * @return array{canCreate: bool, canManage: bool, unusedCount: int, nextExpiresAt: ?string, isAdmin: bool, credits: list<array<string, mixed>>}
     */
    public function rightsFor(User $user, bool $isAdmin): array
    {
        $available = $this->credits->findAvailable($user);
        $next = $available[0] ?? null;

        return [
            'canCreate' => $isAdmin || $available !== [],
            'canManage' => $isAdmin
                || \in_array(AppRoles::ORGANIZER, $user->getRoles(), true)
                || $available !== [],
            'unusedCount' => \count($available),
            'nextExpiresAt' => $next ? DateTimeHelper::formatParis($next->getExpiresAt()) : null,
            'isAdmin' => $isAdmin,
            'credits' => array_map(fn (CreationCredit $c) => $this->serialize($c), $available),
        ];
    }

    /** @return array<string, mixed> */
    public function serialize(CreationCredit $credit): array
    {
        return [
            'id' => $credit->getId(),
            'expiresAt' => DateTimeHelper::formatParis($credit->getExpiresAt()),
            'grantedAt' => DateTimeHelper::formatParis($credit->getGrantedAt()),
            'complimentary' => $credit->isComplimentary(),
            'consumedAt' => $credit->getConsumedAt() ? DateTimeHelper::formatParis($credit->getConsumedAt()) : null,
            'cancelledAt' => $credit->getCancelledAt() ? DateTimeHelper::formatParis($credit->getCancelledAt()) : null,
            'competitionId' => $credit->getCompetition()?->getId(),
        ];
    }
}
