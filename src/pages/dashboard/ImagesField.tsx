import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  uploadImageToServer,
  deleteImageFromServer,
  getImageUrl,
  createImageThumbnailDataUrl,
  revokeObjectUrl,
  ImageUploadResult,
} from '../../service/imageService';

interface ImagesFieldProps {
  imageIds: string[];
  coverImageId?: string;
  error?: string;
  onChange: (next: { imageIds: string[]; coverImageId?: string; coverThumbnailDataUrl?: string }) => void;
}

export const ImagesField: React.FC<ImagesFieldProps> = ({
  imageIds,
  coverImageId,
  error,
  onChange,
}) => {
  const { t } = useLanguage();
  const { token, refreshToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    previewUrlsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    let cancelled = false;
    const missing = imageIds.filter((id) => !previews[id]);
    if (!missing.length) return;

    void (async () => {
      const nextEntries: Record<string, string> = {};
      for (const id of missing) {
        try {
          const url = await getImageUrl(id, token || undefined);
          if (url && url.trim()) {
            nextEntries[id] = url;
          } else {
            console.warn(`Empty URL returned for image ${id}, using fallback`);
            nextEntries[id] = '/noimage.png';
          }
        } catch (error) {
          console.error(`Failed to load image URL for ${id}:`, error);
          // Use fallback image for failed loads
          nextEntries[id] = '/noimage.png';
        }
      }
      if (cancelled) return;
      setPreviews((current) => ({ ...current, ...nextEntries }));
    })();

    return () => {
      cancelled = true;
    };
  }, [imageIds, previews, token]);

  useEffect(() => {
    const removed = Object.keys(previews).filter((id) => !imageIds.includes(id));
    if (!removed.length) return;
    setPreviews((current) => {
      const next = { ...current };
      for (const id of removed) {
        revokeObjectUrl(next[id]);
        delete next[id];
      }
      return next;
    });
  }, [imageIds, previews]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach(revokeObjectUrl);
    };
  }, []);

  const readFiles = async (files: FileList) => {
    // Refresh token state to ensure we have the latest token from storage
    const currentToken = refreshToken();
    
    if (!currentToken) {
      console.error('No authentication token available for image upload');
      alert('Please log in again to upload images');
      return;
    }

    const selected = Array.from(files).slice(0, Math.max(0, 15 - imageIds.length));
    if (!selected.length) return;
    setBusy(true);
    try {
      const uploaded: ImageUploadResult[] = [];
      for (const file of selected) {
        try {
          const result = await uploadImageToServer(file, currentToken);
          uploaded.push(result);
        } catch (error) {
          console.error('Failed to upload image:', error);
          // Continue with other files
        }
      }

      const nextIds = [...imageIds, ...uploaded.map((u) => u.id)].slice(0, 15);
      const nextCoverId = coverImageId || nextIds[0];

      const nextPreviewEntries: Record<string, string> = {};
      uploaded.forEach(({ id, url }) => {
        nextPreviewEntries[id] = url;
      });
      setPreviews((current) => ({ ...current, ...nextPreviewEntries }));

      // Create thumbnail from the cover image
      let coverThumbnailDataUrl: string | undefined;
      const coverUpload = uploaded.find((u) => u.id === nextCoverId);
      if (coverUpload) {
        // Use the original file for thumbnail if it was just uploaded
        const coverFile = selected[uploaded.indexOf(coverUpload)];
        if (coverFile) {
          coverThumbnailDataUrl = await createImageThumbnailDataUrl(coverFile);
        }
      }

      onChange({ imageIds: nextIds, coverImageId: nextCoverId, coverThumbnailDataUrl });
    } finally {
      setBusy(false);
    }
  };

  const replaceAt = async (index: number, file: File) => {
    // Refresh token state to ensure we have the latest token from storage
    const currentToken = refreshToken();
    
    if (!currentToken) {
      console.error('No authentication token available for image upload');
      alert('Please log in again to upload images');
      return;
    }

    setBusy(true);
    try {
      const oldId = imageIds[index];
      
      // Upload new image
      const result = await uploadImageToServer(file, currentToken);
      
      // Delete old image from server
      try {
        await deleteImageFromServer(oldId, currentToken);
      } catch (error) {
        console.error('Failed to delete old image:', error);
        // Continue anyway as the upload succeeded
      }

      setPreviews((current) => {
        const next = { ...current };
        if (next[oldId]) delete next[oldId]; // Remove old preview
        next[result.id] = result.url;
        return next;
      });

      const nextIds = imageIds.map((id, i) => (i === index ? result.id : id));
      const nextCoverId = coverImageId === oldId ? result.id : coverImageId || nextIds[0];
      
      const coverThumbnailDataUrl = nextCoverId === result.id ? await createImageThumbnailDataUrl(file) : undefined;
      onChange({ imageIds: nextIds, coverImageId: nextCoverId, coverThumbnailDataUrl });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="owner-images">
      <div className="owner-images__head">
        <div>
          <p className="owner-options__title">{t('dashboard.form.images.title')}</p>
          <p className="muted">{t('dashboard.form.images.hint', { min: 3, max: 15 })}</p>
          {error && <p className="owner-field__error">{error}</p>}
        </div>
        <label className={`owner-primary owner-primary--upload ${busy ? 'is-busy' : ''}`}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) void readFiles(e.target.files);
              e.currentTarget.value = '';
            }}
            disabled={busy || imageIds.length >= 15}
          />
          {t('dashboard.form.images.add')}
        </label>
      </div>

      <div className="owner-images__grid">
        {imageIds.map((id, idx) => {
          const src = previews[id] || '';
          const isCover = coverImageId ? coverImageId === id : idx === 0;
          return (
            <div key={id} className={`owner-image ${isCover ? 'is-cover' : ''}`}>
              {isCover && <div className="owner-image__badge">{t('dashboard.form.images.coverBadge')}</div>}
              {src ? <img src={src} alt={`Upload ${idx + 1}`} loading="lazy" /> : <div className="owner-image__empty" />}
              <div className="owner-image__actions">
                {!isCover && (
                  <button
                    type="button"
                    className="owner-mini"
                    onClick={async () => {
                      // For server-stored images, we just set the cover ID
                      // The thumbnail will be created from the URL
                      let coverThumbnailDataUrl: string | undefined;
                      try {
                        // Try to fetch the image and create a thumbnail
                        const imageUrl = previews[id];
                        if (imageUrl) {
                          const response = await fetch(imageUrl);
                          const blob = await response.blob();
                          coverThumbnailDataUrl = await createImageThumbnailDataUrl(blob);
                        }
                      } catch (error) {
                        console.error('Failed to create thumbnail for cover image:', error);
                      }
                      
                      onChange({ imageIds, coverImageId: id, coverThumbnailDataUrl });
                    }}
                  >
                    {t('dashboard.form.images.setCover')}
                  </button>
                )}
                <label className="owner-mini owner-mini--link">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void replaceAt(idx, file);
                      e.currentTarget.value = '';
                    }}
                    disabled={busy}
                  />
                  {t('dashboard.form.images.replace')}
                </label>
                <button
                  type="button"
                  className="owner-mini owner-mini--danger"
                  onClick={async () => {
                    if (!token) {
                      console.error('No authentication token available for image deletion');
                      return;
                    }

                    const nextIds = imageIds.filter((_, i) => i !== idx);
                    
                    // Delete from server
                    try {
                      await deleteImageFromServer(id, token);
                    } catch (error) {
                      console.error('Failed to delete image from server:', error);
                      // Continue with local cleanup anyway
                    }
                    
                    setPreviews((current) => {
                      const next = { ...current };
                      delete next[id];
                      return next;
                    });

                    const nextCoverId = coverImageId === id ? nextIds[0] : coverImageId;
                    
                    // Create thumbnail for new cover if needed
                    let coverThumbnailDataUrl: string | undefined;
                    if (nextCoverId && nextCoverId !== coverImageId) {
                      try {
                        const imageUrl = previews[nextCoverId];
                        if (imageUrl) {
                          const response = await fetch(imageUrl);
                          const blob = await response.blob();
                          coverThumbnailDataUrl = await createImageThumbnailDataUrl(blob);
                        }
                      } catch (error) {
                        console.error('Failed to create thumbnail for new cover:', error);
                      }
                    }
                    
                    onChange({ imageIds: nextIds, coverImageId: nextCoverId, coverThumbnailDataUrl });
                  }}
                >
                  {t('dashboard.form.images.delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImagesField;
