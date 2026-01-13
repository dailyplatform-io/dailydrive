const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ImageUploadResult {
  id: string;
  url: string;
  blobName: string;
}

export const uploadImageToServer = async (file: File, token: string): Promise<ImageUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/images/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image upload failed: ${error}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    url: result.url,
    blobName: result.blobName,
  };
};

export const deleteImageFromServer = async (imageId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image deletion failed: ${error}`);
  }
};

export const getImageUrl = async (imageId: string, token?: string): Promise<string> => {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get image URL for ${imageId}`);
  }

  const result = await response.json();
  return result.url;
};

// Helper function to create thumbnail from blob
export const createImageThumbnailDataUrl = async (
  blob: Blob,
  { maxWidth = 900, maxHeight = 700, quality = 0.78 }: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
) => {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
};

// Maintain backward compatibility with existing local storage functions
export const dataUrlToBlob = (dataUrl: string) => {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || 'application/octet-stream';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

export const blobToObjectUrl = (blob: Blob) => URL.createObjectURL(blob);
export const revokeObjectUrl = (url: string) => URL.revokeObjectURL(url);