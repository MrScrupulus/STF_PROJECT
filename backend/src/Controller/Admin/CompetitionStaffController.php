<?php

namespace App\Controller\Admin;

use App\Entity\Competition\Competition;
use App\Entity\Competition\CompetitionStaff;
use App\Entity\Security\User;
use App\Repository\Competition\CompetitionStaffRepository;
use App\Repository\Security\UserRepository;
use App\Security\AppRoles;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin/competitions/{id}/staff')]
class CompetitionStaffController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CompetitionStaffRepository $staffRepository,
        private readonly UserRepository $userRepository,
    ) {
    }

    #[Route('', name: 'admin_competition_staff_list', methods: ['GET'])]
    public function list(Competition $competition): JsonResponse
    {
        return $this->json([
            'createdBy' => $this->serializeUser($competition->getCreatedBy()),
            'staff' => array_map(
                fn (CompetitionStaff $staff) => [
                    'id' => $staff->getId(),
                    'role' => $staff->getRole(),
                    'user' => $this->serializeUser($staff->getUser()),
                ],
                $this->staffRepository->findByCompetition($competition)
            ),
        ]);
    }

    #[Route('', name: 'admin_competition_staff_replace', methods: ['PUT'])]
    public function replace(Request $request, Competition $competition): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $incoming = $data['staff'] ?? null;
        if (!\is_array($incoming)) {
            return $this->json(['message' => 'Le champ staff est requis.'], 400);
        }

        foreach ($competition->getStaff()->toArray() as $existing) {
            $competition->removeStaff($existing);
            $this->entityManager->remove($existing);
        }

        $seen = [];
        foreach ($incoming as $row) {
            if (!\is_array($row)) {
                continue;
            }
            $userId = isset($row['userId']) ? (int) $row['userId'] : 0;
            $role = \is_string($row['role'] ?? null) ? $row['role'] : '';
            if ($userId < 1 || isset($seen[$userId])) {
                continue;
            }
            if (!\in_array($role, [AppRoles::STAFF_MANAGER, AppRoles::STAFF_JUDGE], true)) {
                return $this->json(['message' => 'Rôle d\'affectation invalide (manager ou judge).'], 400);
            }
            $user = $this->userRepository->find($userId);
            if (!$user instanceof User || $user->isDeleted()) {
                return $this->json(['message' => 'Utilisateur introuvable.'], 400);
            }
            $seen[$userId] = true;
            $staff = new CompetitionStaff();
            $staff->setUser($user);
            $staff->setRole($role);
            $competition->addStaff($staff);
        }

        $this->entityManager->flush();

        return $this->list($competition);
    }

    private function serializeUser(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'firstname' => $user->getFirstname(),
            'lastname' => $user->getLastname(),
            'email' => $user->getEmail(),
        ];
    }
}
