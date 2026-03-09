<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;

final class CatchPhotoStorageService
{
    public function __construct(
        private string $uploadsPath,
        private string $uploadsUrlPrefix = '/api/uploads',
        private ?string $backendBaseUrl = null
    ) {
    }

    /**
     * Transforme photo_url (path ou base64 legacy) en URL complète pour l'API.
     */
    public function resolvePhotoUrl(?string $photoUrl): ?string
    {
        if (null === $photoUrl || '' === $photoUrl) {
            return null;
        }
        if (str_starts_with($photoUrl, 'data:')) {
            return $photoUrl;
        }
        $base = rtrim($this->backendBaseUrl ?? '', '/');
        return $base . '/' . ltrim($this->uploadsUrlPrefix, '/') . '/' . ltrim($photoUrl, '/');
    }

    /**
     * Sauvegarde une photo de prise et retourne le chemin relatif à stocker en BDD.
     *
     * @param UploadedFile|string $source UploadedFile ou contenu base64 (data:image/...;base64,...)
     * @return string Chemin relatif (ex: catches/2026/01/uuid.jpg) pour photo_url
     */
    public function save($source): string
    {
        if ($source instanceof UploadedFile) {
            return $this->saveUploadedFile($source);
        }

        if (\is_string($source) && preg_match('#^data:image/(\w+);base64,([\s\S]+)$#', trim($source), $m)) {
            return $this->saveBase64($m[1], $m[2]);
        }

        throw new \InvalidArgumentException('Source must be UploadedFile or base64 data URL');
    }

    private function saveUploadedFile(UploadedFile $file): string
    {
        $extension = $file->guessExtension() ?: 'jpg';
        if (!\in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $extension = 'jpg';
        }
        return $this->writeFile($file->getPathname(), $extension);
    }

    private function saveBase64(string $format, string $base64Data): string
    {
        $extension = match (strtolower($format)) {
            'jpeg', 'jpg' => 'jpg',
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };
        $binary = base64_decode(str_replace(["\r", "\n", " "], '', $base64Data), true);
        if (false === $binary) {
            throw new \InvalidArgumentException('Invalid base64 data');
        }
        $tmpFile = tempnam(sys_get_temp_dir(), 'catch_');
        file_put_contents($tmpFile, $binary);
        try {
            return $this->writeFile($tmpFile, $extension);
        } finally {
            @unlink($tmpFile);
        }
    }

    private function writeFile(string $sourcePath, string $extension): string
    {
        $now = new \DateTimeImmutable();
        $subDir = sprintf('catches/%d/%02d', $now->format('Y'), (int) $now->format('m'));
        $fullDir = rtrim($this->uploadsPath, '/') . '/' . $subDir;

        if (!is_dir($fullDir) && !mkdir($fullDir, 0755, true)) {
            throw new \RuntimeException(sprintf('Unable to create directory: %s', $fullDir));
        }

        $filename = sprintf('%s.%s', bin2hex(random_bytes(8)), $extension);
        $targetPath = $fullDir . '/' . $filename;

        if (!copy($sourcePath, $targetPath)) {
            throw new \RuntimeException(sprintf('Unable to save file to: %s', $targetPath));
        }

        return $subDir . '/' . $filename;
    }

    /**
     * Retourne l'URL publique pour afficher une photo (chemin relatif stocké en BDD).
     */
    public function getPublicUrl(string $relativePath): string
    {
        return $this->uploadsUrlPrefix . '/' . ltrim($relativePath, '/');
    }

    /**
     * Retourne le chemin de base des uploads (pour debug).
     */
    public function getUploadsPath(): string
    {
        return $this->uploadsPath;
    }

    /**
     * Retourne le chemin absolu du fichier sur le disque.
     */
    public function getAbsolutePath(string $relativePath): string
    {
        return rtrim($this->uploadsPath, '/') . '/' . ltrim($relativePath, '/');
    }
}
