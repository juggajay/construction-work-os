/**
 * EXIF Data Extraction Utility
 * Extract GPS coordinates, timestamps, and device information from photos
 */

import * as exifr from 'exifr';

export interface PhotoMetadata {
  // GPS Data
  latitude?: number;
  longitude?: number;
  altitude?: number;

  // Timestamp
  dateTaken?: Date;
  dateModified?: Date;

  // Device Information
  make?: string; // Camera/phone manufacturer (e.g., "Apple")
  model?: string; // Device model (e.g., "iPhone 14 Pro")
  software?: string; // Software version

  // Camera Settings
  fNumber?: number; // Aperture
  exposureTime?: number; // Shutter speed
  iso?: number; // ISO speed
  focalLength?: number; // Lens focal length

  // Image Dimensions
  width?: number;
  height?: number;
  orientation?: number;

  // Other
  flash?: boolean;
  whiteBalance?: string;
}

/**
 * Extract all EXIF metadata from an image file
 */
export async function extractExifData(file: File): Promise<PhotoMetadata | null> {
  try {
    const exif = await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
      jfif: true,
    });

    if (!exif) {
      return null;
    }

    const metadata: PhotoMetadata = {};

    // GPS Data
    if (exif.latitude !== undefined && exif.longitude !== undefined) {
      metadata.latitude = exif.latitude;
      metadata.longitude = exif.longitude;
    }
    if (exif.GPSAltitude !== undefined) {
      metadata.altitude = exif.GPSAltitude;
    }

    // Timestamps
    if (exif.DateTimeOriginal) {
      metadata.dateTaken = new Date(exif.DateTimeOriginal);
    }
    if (exif.ModifyDate) {
      metadata.dateModified = new Date(exif.ModifyDate);
    }

    // Device Information
    if (exif.Make) {
      metadata.make = exif.Make;
    }
    if (exif.Model) {
      metadata.model = exif.Model;
    }
    if (exif.Software) {
      metadata.software = exif.Software;
    }

    // Camera Settings
    if (exif.FNumber !== undefined) {
      metadata.fNumber = exif.FNumber;
    }
    if (exif.ExposureTime !== undefined) {
      metadata.exposureTime = exif.ExposureTime;
    }
    if (exif.ISO !== undefined) {
      metadata.iso = exif.ISO;
    }
    if (exif.FocalLength !== undefined) {
      metadata.focalLength = exif.FocalLength;
    }

    // Image Dimensions
    if (exif.ImageWidth !== undefined) {
      metadata.width = exif.ImageWidth;
    }
    if (exif.ImageHeight !== undefined) {
      metadata.height = exif.ImageHeight;
    }
    if (exif.Orientation !== undefined) {
      metadata.orientation = exif.Orientation;
    }

    // Other
    if (exif.Flash !== undefined) {
      metadata.flash = exif.Flash !== 0;
    }
    if (exif.WhiteBalance !== undefined) {
      metadata.whiteBalance = exif.WhiteBalance;
    }

    return metadata;
  } catch (error) {
    console.error('EXIF extraction failed:', error);
    return null;
  }
}

/**
 * Extract GPS coordinates from an image
 */
export async function extractGPSCoordinates(
  file: File
): Promise<{ latitude: number; longitude: number; altitude?: number } | null> {
  try {
    const gps = await exifr.gps(file);

    if (!gps || gps.latitude === undefined || gps.longitude === undefined) {
      return null;
    }

    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
      altitude: (gps as any).altitude,
    };
  } catch (error) {
    console.error('GPS extraction failed:', error);
    return null;
  }
}

/**
 * Extract timestamp from an image
 */
export async function extractTimestamp(file: File): Promise<Date | null> {
  try {
    const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate'] });

    if (!exif) {
      return null;
    }

    if (exif.DateTimeOriginal) {
      return new Date(exif.DateTimeOriginal);
    }

    if (exif.CreateDate) {
      return new Date(exif.CreateDate);
    }

    return null;
  } catch (error) {
    console.error('Timestamp extraction failed:', error);
    return null;
  }
}

/**
 * Format GPS coordinates for display
 */
export function formatGPSCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';

  const latAbs = Math.abs(latitude).toFixed(6);
  const lonAbs = Math.abs(longitude).toFixed(6);

  return `${latAbs}° ${latDir}, ${lonAbs}° ${lonDir}`;
}

/**
 * Create Google Maps URL from GPS coordinates
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Check if GPS coordinates are valid
 */
export function isValidGPSCoordinates(
  latitude?: number,
  longitude?: number
): boolean {
  if (latitude === undefined || longitude === undefined) {
    return false;
  }

  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Extract metadata from multiple images
 */
export async function extractBatchMetadata(
  files: File[]
): Promise<(PhotoMetadata | null)[]> {
  const extractionPromises = files.map((file) => extractExifData(file));
  return Promise.all(extractionPromises);
}
