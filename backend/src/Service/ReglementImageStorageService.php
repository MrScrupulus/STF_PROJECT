<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\File\UploadedFile;

final class ReglementImageStorageService
{
    private const SUB_DIR = 'reglements';

    public function __construct(
        private string $uploadsPath,
        private string $uploadsUrlPrefix = '/api/uploads',
        private ?string $backendBaseUrl = null
    ) {
    }

    /**
     * Sauvegarde une image de règlement et retourne le chemin relatif.
     */
    public function save(UploadedFile|string $source): string
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
        $tmpFile = tempnam(sys_get_temp_dir(), 'reglement_');
        file_put_contents($tmpFile, $binary);
        try {
            return $this->writeFile($tmpFile, $extension);
        } finally {
            @unlink($tmpFile);
        }
    }

    private function writeFile(string $sourcePath, string $extension): string
    {
        $fullDir = rtrim($this->uploadsPath, '/') . '/' . self::SUB_DIR;

        if (!is_dir($fullDir) && !mkdir($fullDir, 0755, true)) {
            throw new \RuntimeException(sprintf('Unable to create directory: %s', $fullDir));
        }

        $filename = sprintf('%s.%s', bin2hex(random_bytes(8)), $extension);
        $targetPath = $fullDir . '/' . $filename;

        if (!copy($sourcePath, $targetPath)) {
            throw new \RuntimeException(sprintf('Unable to save file to: %s', $targetPath));
        }

        return self::SUB_DIR . '/' . $filename;
    }

    public function getPublicUrl(string $relativePath): string
    {
        $base = rtrim($this->backendBaseUrl ?? '', '/');
        return $base . '/' . ltrim($this->uploadsUrlPrefix, '/') . '/' . ltrim($relativePath, '/');
    }

    public function getAbsolutePath(string $relativePath): string
    {
        return rtrim($this->uploadsPath, '/') . '/' . ltrim($relativePath, '/');
    }

    public function delete(?string $relativePath): void
    {
        if (!$relativePath) {
            return;
        }
        $path = $this->getAbsolutePath($relativePath);
        if (is_file($path)) {
            @unlink($path);
        }
    }
}
