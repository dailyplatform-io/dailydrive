import { useEffect, useState, useRef, useCallback } from 'react';
import { Car } from '../models/Car';
import { formatPrice } from '../utils/formatting';
import { useLanguage } from '../context/LanguageContext';
import { HeartIcon } from './Icons';
import { getImageUrl } from '../service/imageService';
import './CarCard.css';

interface CarCardProps {
  car: Car;
  selected?: boolean;
  onSelect: (car: Car) => void;
  onToggleFavorite: (car: Car) => void;
  isFavorite: boolean;
}

export const CarCard: React.FC<CarCardProps> = ({ car, selected, onSelect, onToggleFavorite, isFavorite }) => {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Load up to 3 image URLs when car changes
  useEffect(() => {
    if (!car || (!car.imageIds || car.imageIds.length === 0)) {
      setImageUrls(car?.imageUrl ? [car.imageUrl] : ['/noimage.png']);
      setCurrentImageIndex(0);
      return;
    }

    const loadImageUrls = async () => {
      setIsLoadingImages(true);
      try {
        const urls: string[] = [];
        // Only take first 3 images
        const imageIdsToLoad = car.imageIds!.slice(0, 3);
        
        for (const imageId of imageIdsToLoad) {
          try {
            const url = await getImageUrl(imageId);
            if (url && url.trim()) {
              urls.push(url);
            }
          } catch (error) {
            console.error(`Failed to load image URL for ${imageId}:`, error);
          }
        }
        
        setImageUrls(urls.length > 0 ? urls : (car.imageUrl ? [car.imageUrl] : ['/noimage.png']));
        setCurrentImageIndex(0);
      } catch (error) {
        console.error('Error loading image URLs:', error);
        setImageUrls(car.imageUrl ? [car.imageUrl] : ['/noimage.png']);
        setCurrentImageIndex(0);
      } finally {
        setIsLoadingImages(false);
      }
    };

    void loadImageUrls();
  }, [car?.id, car?.imageIds, car?.imageUrl]);


  const goToImage = (index: number) => {
    if (index >= 0 && index < imageUrls.length) {
      setCurrentImageIndex(index);
      setTranslateX(0);
    }
  };

  // Handle drag/swipe functionality
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (imageUrls.length <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setStartX(e.clientX);
    if (galleryRef.current) {
      galleryRef.current.style.cursor = 'grabbing';
    }
  }, [imageUrls.length]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || imageUrls.length <= 1) return;
    e.preventDefault();
    e.stopPropagation();

    const currentX = e.clientX;
    const deltaX = currentX - startX;
    setTranslateX(deltaX);
  }, [isDragging, startX, imageUrls.length]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging || imageUrls.length <= 1) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    if (galleryRef.current) {
      galleryRef.current.style.cursor = 'grab';
    }

    const threshold = 50; // Minimum distance to trigger swipe
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentImageIndex > 0) {
        // Swipe right - go to previous image
        setCurrentImageIndex(prev => prev - 1);
      } else if (translateX < 0 && currentImageIndex < imageUrls.length - 1) {
        // Swipe left - go to next image
        setCurrentImageIndex(prev => prev + 1);
      }
    }
    setTranslateX(0);
  }, [isDragging, translateX, currentImageIndex, imageUrls.length]);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      handlePointerUp(e);
    }
  }, [isDragging, handlePointerUp]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (imageUrls.length <= 1) return;
    e.stopPropagation();
    
    const touch = e.touches[0];
    setIsDragging(true);
    setStartX(touch.clientX);
  }, [imageUrls.length]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || imageUrls.length <= 1) return;
    e.stopPropagation();

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    setTranslateX(deltaX);
  }, [isDragging, startX, imageUrls.length]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging || imageUrls.length <= 1) return;
    e.stopPropagation();

    setIsDragging(false);

    const threshold = 50;
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1);
      } else if (translateX < 0 && currentImageIndex < imageUrls.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
      }
    }
    setTranslateX(0);
  }, [isDragging, translateX, currentImageIndex, imageUrls.length]);

  const priceLabel = (() => {
    if (car.isForRent && car.rentPricePerDay) return t('carCard.priceDay', { price: formatPrice(car.rentPricePerDay) });
    if (car.isForRent && car.rentPricePerHour) return t('carCard.priceDay', { price: formatPrice(car.rentPricePerHour) });
    if (car.isForSale && car.salePrice) return formatPrice(car.salePrice);
    return t('carCard.contact');
  })();

  const imageAlt = `${car.brand} ${car.model}`;

  const mileageLabel = (() => {
    if (typeof car.mileageKm === 'number' && !Number.isNaN(car.mileageKm)) {
      return `${car.mileageKm.toLocaleString()} km`;
    }
    return '— km';
  })();

  return (
    <article className={`car-card ${selected ? 'is-selected' : ''}`} onClick={() => onSelect(car)}>
      <div className="car-card__image">
        {isLoadingImages ? (
          <div className="car-card__image-loading">
            <div className="loading-spinner-small"></div>
          </div>
        ) : (
          <>
            <div 
              className={`car-card__image-gallery ${isDragging ? 'dragging' : ''}`}
              ref={galleryRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                cursor: imageUrls.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                touchAction: imageUrls.length > 1 ? 'pan-y' : 'auto'
              }}
            >
              <div 
                className="car-card__image-track"
                ref={trackRef}
                style={{
                  transform: `translateX(${-currentImageIndex * 100 + (translateX / (galleryRef.current?.offsetWidth || 1)) * 100}%)`,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)'
                }}
              >
                {imageUrls.map((url, index) => (
                  <img
                    key={`${url}-${index}`}
                    src={url}
                    alt={`${imageAlt} - Image ${index + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('/noimage.png')) {
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = '#f0f0f0';
                        return;
                      }
                      target.src = '/noimage.png';
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Image dots - only show if more than 1 image */}
            {imageUrls.length > 1 && (
              <div className="car-card__image-dots" onClick={(e) => e.stopPropagation()}>
                {imageUrls.slice(0, 3).map((_, index) => (
                  <button
                    key={index}
                    className={`car-card__image-dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToImage(index);
                    }}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        <button
          className={`heart ${isFavorite ? 'is-favorite' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(car);
          }}
          aria-label={t('carCard.toggleFavorite')}
          type="button"
        >
          <HeartIcon size={18} />
        </button>
      </div>
      <div className="car-card__body">
        <h3 className="car-card__title">
          {car.brand} {car.model} {car.year ? `(${car.year})` : ''} {car.subtitle ? ` ${car.subtitle}` : ''}
        </h3>
        <div className="car-card__badges">
          <span className="badge">{car.bodyStyle}</span>
          <span className="badge">{car.transmission}</span>
          <span className="badge">{car.fuelType}</span>
          <span className="badge">{`${car.seats} vende`}</span>
          {car.engineVolumeL ? <span className="badge">Vëllimi i motorit: {car.engineVolumeL}L</span> : null}
        </div>
        <div className="car-card__meta">
          <div className="meta-left">
            <span className="tag">
              {mileageLabel}
            </span>
            <span className={`tag ${car.availableNow ? 'tag--success' : 'tag--muted'}`}>
              {car.availableNow
                ? t('carCard.availableNow')
                : car.isForSale
                  ? t('carCard.comingSoon')
                  : t('carCard.booked')}
            </span>
          </div>
          <div className="meta-price">{priceLabel}</div>
        </div>
      </div>
    </article>
  );
};
