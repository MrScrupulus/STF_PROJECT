<?php

namespace App\Security;

use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Response\JWTAuthenticationSuccessResponse;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationSuccessHandlerInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use App\Entity\Security\User;
use Doctrine\ORM\EntityManagerInterface;

class AuthenticationSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function __construct(
        private JWTTokenManagerInterface $jwtManager,
        private LoggerInterface $logger,
        private RefreshTokenGeneratorInterface $refreshTokenGenerator,
        private RefreshTokenManagerInterface $refreshTokenManager,
        private EntityManagerInterface $entityManager
    ) {}

    public function onAuthenticationSuccess(Request $request, TokenInterface $token): JWTAuthenticationSuccessResponse
    {
        /** @var User $user */
        $user = $token->getUser();

        // Recharger l'utilisateur depuis la base de données pour avoir les données à jour
        // (au cas où is_verified a été modifié directement en base)
        try {
            $this->entityManager->refresh($user);
        } catch (\Exception $e) {
            // Si l'utilisateur n'est pas géré par Doctrine, continuer avec l'utilisateur tel quel
        }

        // Vérifier si l'email est vérifié
        if (!$user->isVerified()) {
            throw new CustomUserMessageAuthenticationException(
                'Votre compte n\'est pas encore activé. Veuillez vérifier votre adresse email en cliquant sur le lien reçu lors de votre inscription. Si vous n\'avez pas reçu l\'email, vérifiez votre dossier spam ou contactez le support.'
            );
        }

        $jwt = $this->jwtManager->create($user);

        // Générer le refresh token
        $refreshToken = $this->refreshTokenGenerator->createForUserWithTtl(
            $user,
            2592000 // 30 jours en secondes
        );

        // Persister le refresh token
        $this->refreshTokenManager->save($refreshToken);

        $response = new JWTAuthenticationSuccessResponse($jwt);
        $response->setData([
            'token' => $jwt,
            'refresh_token' => $refreshToken->getRefreshToken(),
            'user' => [
                'email' => $user->getUserIdentifier(),
                'roles' => $user->getRoles()
            ]
        ]);

        return $response;
    }
}
