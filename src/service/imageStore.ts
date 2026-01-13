const DB_NAME = 'dailydrive_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

type StoredImage = {
  id: string;
  blob: Blob;
  createdAt: number;
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runTransaction = async <T,>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

export const putImageBlob = async (blob: Blob, id?: string) => {
  const imageId = id ?? crypto.randomUUID();
  const record: StoredImage = { id: imageId, blob, createdAt: Date.now() };
  await runTransaction('readwrite', (store) => store.put(record));
  return imageId;
};

export const getImageBlob = async (id: string) => {
  const record = await runTransaction<StoredImage | undefined>('readonly', (store) => store.get(id));
  return record?.blob ?? null;
};

export const deleteImageBlob = async (id: string) => {
  await runTransaction('readwrite', (store) => store.delete(id));
};

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
