<?php

namespace App\Security;

final class AppRoles
{
    public const USER = 'ROLE_USER';
    public const COMMISSAIRE = 'ROLE_COMMISSAIRE';
    public const ORGANIZER = 'ROLE_ORGANIZER';
    public const SCIENCE = 'ROLE_SCIENCE';
    public const ADMIN = 'ROLE_ADMIN';

    public const STAFF_MANAGER = 'manager';
    public const STAFF_JUDGE = 'judge';

    /** @var list<string> */
    public const ASSIGNABLE = [
        self::COMMISSAIRE,
        self::ORGANIZER,
        self::SCIENCE,
        self::ADMIN,
    ];

    public static function labels(): array
    {
        return [
            self::USER => 'Utilisateur',
            self::COMMISSAIRE => 'Commissaire',
            self::ORGANIZER => 'Créateur',
            self::SCIENCE => 'Sciences+',
            self::ADMIN => 'Admin',
        ];
    }

    /**
     * @param list<string>|array<int, mixed> $roles
     * @return list<string>
     */
    public static function normalize(array $roles): array
    {
        $clean = [self::USER];
        foreach ($roles as $role) {
            if (!\is_string($role)) {
                continue;
            }
            if (\in_array($role, self::ASSIGNABLE, true)) {
                $clean[] = $role;
            }
        }

        return array_values(array_unique($clean));
    }
}
