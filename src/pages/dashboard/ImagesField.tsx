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
  const [orderedIds, setOrderedIds] = useState<string[]>(imageIds);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const orderedIdsRef = useRef<string[]>(imageIds);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const tempCounterRef = useRef(0);

  const isTempId = (id: string) => id.startsWith('temp:');
  const nextTempId = () => {
    tempCounterRef.current += 1;
    return `temp:${Date.now()}-${tempCounterRef.current}`;
  };

  useEffect(() => {
    previewUrlsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    orderedIdsRef.current = orderedIds;
  }, [orderedIds]);

  useEffect(() => {
    setOrderedIds((current) => {
      const tempIds = current.filter((id) => isTempId(id));
      const next = [...imageIds, ...tempIds.filter((id) => !imageIds.includes(id))];
      orderedIdsRef.current = next;
      return next;
    });
  }, [imageIds]);

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
    const removed = Object.keys(previews).filter((id) => !imageIds.includes(id) && !isTempId(id));
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
      const tempIds = selected.map(() => nextTempId());
      setOrderedIds((current) => {
        const next = [...current, ...tempIds];
        orderedIdsRef.current = next;
        return next;
      });
      setUploadingIds((current) => new Set([...current, ...tempIds]));

      const localPreviews: Record<string, string> = {};
      tempIds.forEach((id, index) => {
        const previewUrl = URL.createObjectURL(selected[index]);
        localPreviews[id] = previewUrl;
      });
      setPreviews((current) => ({ ...current, ...localPreviews }));

      for (let i = 0; i < selected.length; i += 1) {
        const file = selected[i];
        const tempId = tempIds[i];
        try {
          const result = await uploadImageToServer(file, currentToken);
          setPreviews((current) => {
            const next = { ...current };
            if (next[tempId]) {
              revokeObjectUrl(next[tempId]);
              delete next[tempId];
            }
            next[result.id] = result.url;
            return next;
          });

          const nextOrdered = orderedIdsRef.current.map((id) => (id === tempId ? result.id : id));
          orderedIdsRef.current = nextOrdered;
          setOrderedIds(nextOrdered);

          setUploadingIds((current) => {
            const next = new Set(current);
            next.delete(tempId);
            return next;
          });

          const nextIds = nextOrdered.filter((id) => !isTempId(id)).slice(0, 15);
          const nextCoverId = coverImageId || nextIds[0];

          let coverThumbnailDataUrl: string | undefined;
          if (nextCoverId === result.id) {
            coverThumbnailDataUrl = await createImageThumbnailDataUrl(file);
          }

          onChange({ imageIds: nextIds, coverImageId: nextCoverId, coverThumbnailDataUrl });
        } catch (error) {
          console.error('Failed to upload image:', error);
          setUploadingIds((current) => {
            const next = new Set(current);
            next.delete(tempId);
            return next;
          });
          setOrderedIds((current) => {
            const next = current.filter((id) => id !== tempId);
            orderedIdsRef.current = next;
            return next;
          });
          setPreviews((current) => {
            const next = { ...current };
            if (next[tempId]) {
              revokeObjectUrl(next[tempId]);
              delete next[tempId];
            }
            return next;
          });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const replaceAt = async (index: number, file: File, oldId: string) => {
    // Refresh token state to ensure we have the latest token from storage
    const currentToken = refreshToken();
    
    if (!currentToken) {
      console.error('No authentication token available for image upload');
      alert('Please log in again to upload images');
      return;
    }

    setBusy(true);
    setUploadingIds((current) => new Set([...current, oldId]));
    try {
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

      const nextOrdered = orderedIdsRef.current.map((id) => (id === oldId ? result.id : id));
      orderedIdsRef.current = nextOrdered;
      setOrderedIds(nextOrdered);
      const nextIds = nextOrdered.filter((id) => !isTempId(id));
      const nextCoverId = coverImageId === oldId ? result.id : coverImageId || nextIds[0];
      
      const coverThumbnailDataUrl = nextCoverId === result.id ? await createImageThumbnailDataUrl(file) : undefined;
      onChange({ imageIds: nextIds, coverImageId: nextCoverId, coverThumbnailDataUrl });
    } finally {
      setUploadingIds((current) => {
        const next = new Set(current);
        next.delete(oldId);
        return next;
      });
      setBusy(false);
    }
  };

  const displayIds = orderedIds;
  const effectiveCoverId = coverImageId || imageIds[0];

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
        {displayIds.map((id, idx) => {
          const src = previews[id] || '';
          const isCover = effectiveCoverId === id;
          const isUploading = uploadingIds.has(id);
          const isTemp = isTempId(id);
          return (
            <div key={id} className={`owner-image ${isCover ? 'is-cover' : ''} ${isUploading ? 'is-uploading' : ''}`}>
              {isCover && <div className="owner-image__badge">{t('dashboard.form.images.coverBadge')}</div>}
              {src ? <img src={src} alt={`Upload ${idx + 1}`} loading="lazy" /> : <div className="owner-image__empty" />}
              <div className="owner-image__actions">
                {!isCover && !isTemp && (
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
                    disabled={isUploading}
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
                      if (file && !isTemp) {
                        const realIndex = imageIds.indexOf(id);
                        if (realIndex !== -1) void replaceAt(realIndex, file, id);
                      }
                      e.currentTarget.value = '';
                    }}
                    disabled={busy || isTemp}
                  />
                  {t('dashboard.form.images.replace')}
                </label>
                <button
                  type="button"
                  className="owner-mini owner-mini--danger"
                  onClick={async () => {
                    if (isTemp) return;
                    if (!token) {
                      console.error('No authentication token available for image deletion');
                      return;
                    }

                    const nextOrdered = orderedIdsRef.current.filter((currentId) => currentId !== id);
                    orderedIdsRef.current = nextOrdered;
                    setOrderedIds(nextOrdered);
                    const nextIds = nextOrdered.filter((currentId) => !isTempId(currentId));
                    
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
                  disabled={isUploading}
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
