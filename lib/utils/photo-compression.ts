/**
 * Photo Compression Utility
 * Client-side image compression to reduce file sizes before upload
 * Target: Reduce 5MB images to <500KB while maintaining quality
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  success: boolean;
  error?: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.5, // 500KB max
  maxWidthOrHeight: 1920, // Max dimension 1920px
  useWebWorker: true, // Use web worker for better performance
  fileType: 'image/jpeg', // Convert to JPEG for better compression
  initialQuality: 0.85, // Quality setting (0.0 - 1.0)
};

/**
 * Compress a single image file
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> {
  const originalSize = file.size;

  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB!,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight!,
      useWebWorker: mergedOptions.useWebWorker!,
      fileType: mergedOptions.fileType,
      initialQuality: mergedOptions.initialQuality,
    });

    const compressedSize = compressedFile.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      success: true,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown compression error',
    };
  }
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions
): Promise<CompressionResult[]> {
  const compressionPromises = files.map((file) => compressImage(file, options));
  return Promise.all(compressionPromises);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate image file type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  return validTypes.includes(file.type.toLowerCase());
}

/**
 * Validate image file size (before compression)
 */
export function isValidImageSize(file: File, maxSizeMB: number = 20): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Get compression statistics for display
 */
export function getCompressionStats(results: CompressionResult[]): {
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  totalSaved: number;
} {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSaved = totalOriginalSize - totalCompressedSize;
  const averageCompressionRatio =
    results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;

  return {
    totalOriginalSize,
    totalCompressedSize,
    averageCompressionRatio,
    totalSaved,
  };
}
