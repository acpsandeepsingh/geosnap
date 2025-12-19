'use client';

import type { PhotoData } from './types';

const STORAGE_KEY = 'geosnap_photos';

function getPhotosFromStorage(): PhotoData[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse photos from localStorage', error);
    return [];
  }
}

function savePhotosToStorage(photos: PhotoData[]) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

export function savePhoto(photo: Omit<PhotoData, 'id'>): PhotoData {
  const photos = getPhotosFromStorage();
  const newPhoto: PhotoData = {
    ...photo,
    id: `${photo.timestamp}-${Math.random().toString(36).substring(2, 9)}`,
  };
  photos.unshift(newPhoto); // Add to the beginning for chronological order
  savePhotosToStorage(photos);
  return newPhoto;
}

export function deletePhoto(photoId: string): void {
  let photos = getPhotosFromStorage();
  photos = photos.filter((p) => p.id !== photoId);
  savePhotosToStorage(photos);
}

export function getAllPhotos(): PhotoData[] {
  const photos = getPhotosFromStorage();
  // Sort by timestamp descending to show newest first
  return [...photos].sort((a, b) => b.timestamp - a.timestamp);
}
