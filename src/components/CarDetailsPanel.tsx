import { useEffect, useMemo, useRef, useState } from 'react';
import { Car } from '../models/Car';
import { formatPrice } from '../utils/formatting';
import { useLanguage } from '../context/LanguageContext';
import { optionGroupTitleLookup, optionLabelLookup } from '../constants/optionCatalog';
import { getColorLabel, getFuelLabel, getTransmissionLabel } from '../utils/vehicleLabels';
import {
  MapPinIcon,
  NavigationIcon,
  SparklesIcon,
  PhoneIcon,
  WhatsAppIcon,
} from './Icons';
import './CarDetailsPanel.css';
import { DateRangePicker } from './DateRangePicker';
import { checkCarAvailability, createReservation } from '../service/reservationService';
import { useAuth } from '../context/AuthContext';
import { geocodeAddress, areValidCoordinates, ALBANIA_DEFAULT_COORDS } from '../service/geocodingService';
import { MapEmbed } from './MapEmbed';
import { getImageUrl } from '../service/imageService';

interface CarDetailsPanelProps {
  car?: Car;
  onOpenFull?: (id: string) => void;
  showTabs?: boolean;
  onClose?: () => void;
  compactCtas?: boolean;
}

type TabKey =
  | 'Rent details'
  | 'Vehicle info'
  | 'Specifications'
  | 'Info & Specifications'
  | 'Condition & options'
  | 'Pricing'
  | 'Location';

export const CarDetailsPanel: React.FC<CarDetailsPanelProps> = ({
  car,
  onOpenFull,
  showTabs = true,
  onClose,
  compactCtas = false,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('Info & Specifications');
  const [loanRateInput, setLoanRateInput] = useState('4.5');
  const [loanYearsInput, setLoanYearsInput] = useState('5');
  const [loanTermTooltipOpen, setLoanTermTooltipOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<{ startDate: string; endDate: string }[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [navbarOffset, setNavbarOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [modalIsDragging, setModalIsDragging] = useState(false);
  const [modalDragOffset, setModalDragOffset] = useState(0);
  const [modalStartX, setModalStartX] = useState(0);
  const modalPointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef(0);
  const dragAxisRef = useRef<'x' | 'y' | null>(null);
  const isPointerDownRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerTypeRef = useRef<React.PointerEvent['pointerType']>('mouse');

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.navbar');
    if (!nav) return;

    const updateOffset = () => {
      const height = nav.getBoundingClientRect().height;
      setNavbarOffset(Math.max(0, Math.round(height)));
    };

    updateOffset();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateOffset);
      window.addEventListener('scroll', updateOffset, { passive: true });
      return () => {
        window.removeEventListener('resize', updateOffset);
        window.removeEventListener('scroll', updateOffset);
      };
    }

    const observer = new ResizeObserver(updateOffset);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  
  const hasCoords = useMemo(
    () => areValidCoordinates(car?.location.lat, car?.location.lng),
    [car?.location.lat, car?.location.lng]
  );
  const contactHref = useMemo(() => {
    if (!car?.ownerPhone) return '';
    const normalized = car.ownerPhone.replace(/[^+\d]/g, '');
    return normalized ? `tel:${normalized}` : '';
  }, [car?.ownerPhone]);
  const whatsappHref = useMemo(() => {
    if (!car?.ownerPhone || !car?.id) return '';
    const digitsOnly = car.ownerPhone.replace(/\D/g, '');
    if (!digitsOnly) return '';
    const path = window.location.pathname.startsWith('/auction/') ? `/auction/${car.id}` : `/cars/${car.id}`;
    const carLink = `${window.location.origin}${path}`;
    const message = t('details.whatsappMessage', { link: carLink });
    return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
  }, [car?.id, car?.ownerPhone, t]);

  const textOrDash = (value?: string | null) => {
    if (!value) return '—';
    return value.trim() ? value : '—';
  };
  const hasText = (value?: string | null) => Boolean(value && value.trim());
  const hasPositiveNumber = (value?: number | null) => typeof value === 'number' && value > 0;

  const fuelLabel = getFuelLabel(t, car?.fuelType);
  const transmissionLabel = getTransmissionLabel(t, car?.transmission);
  const exteriorLabel = getColorLabel(t, car?.exteriorColor ?? car?.color);
  const interiorLabel = getColorLabel(t, car?.interiorColor ?? '');
  const colorLabel = getColorLabel(t, car?.color ?? '');
  const exteriorValue = exteriorLabel || car?.exteriorColor || car?.color || '';
  const interiorValue = interiorLabel || car?.interiorColor || '';
  const colorValue = colorLabel || car?.color || '';
  const optionGroupOrder = useMemo(
    () =>
      new Map<string, number>([
        ['options.group.registration', 0],
        ['options.group.drivetrain', 1],
        ['options.group.climate', 2],
        ['options.group.interior', 3],
      ]),
    []
  );

  useEffect(() => {
    if (!car) return;
    setActiveTab(car.isForSale ? 'Info & Specifications' : 'Rent details');
    setLoanRateInput('4.5');
    setLoanYearsInput('5');
    setStartDate(null);
    setEndDate(null);
    setUnavailableDates([]);
    setBookingMessage(null);
    // Only re-run when car ID or showTabs changes, not when other car properties change
    // This prevents unnecessary resets when car data is updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car?.id, showTabs]);

  useEffect(() => {
    if (!car) return;
    if (!car.isForRent && activeTab === 'Rent details') {
      setActiveTab(car.isForSale ? 'Info & Specifications' : 'Vehicle info');
    }
  }, [activeTab, car]);

  // Determine map coordinates: use valid car coordinates or geocode address
  useEffect(() => {
    if (!car) {
      setMapCoordinates(null);
      return;
    }

    // If we have valid coordinates that seem reasonable, use them
    if (hasCoords && car.location.lat !== undefined && car.location.lng !== undefined) {
      const { lat, lng } = car.location;
      // Basic validation to ensure coordinates are not obviously wrong
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && 
          !(lat === 0 && lng === 0)) { // Avoid null island
        setMapCoordinates({ lat, lng });
        return;
      } else {
        console.warn(`[CarDetailsPanel] Invalid coordinates detected (${lat}, ${lng}), trying geocoding`);
      }
    }

    // Try to geocode the address to get accurate coordinates
    const geocodeCarAddress = async () => {
      if (!car.location.fullAddress || car.location.fullAddress.trim().length === 0) {
        // No address available, don't show map
        console.warn('[CarDetailsPanel] No address provided, hiding map');
        setMapCoordinates(null);
        return;
      }

      setIsGeocodingAddress(true);
      try {
        // Try to geocode the full address with city
        const geocodedCoords = await geocodeAddress(
          car.location.fullAddress, 
          car.location.city
        );
        if (geocodedCoords) {
          console.info(`[CarDetailsPanel] Successfully geocoded address: ${car.location.fullAddress} -> (${geocodedCoords.lat}, ${geocodedCoords.lng})`);
          setMapCoordinates(geocodedCoords);
        } else {
          // Geocoding failed, try just the city
          if (car.location.city && car.location.city.trim().length > 0) {
            const cityCoords = await geocodeAddress(car.location.city);
            if (cityCoords) {
              console.info(`[CarDetailsPanel] Geocoded city fallback: ${car.location.city} -> (${cityCoords.lat}, ${cityCoords.lng})`);
              setMapCoordinates(cityCoords);
            } else {
              console.warn('[CarDetailsPanel] Geocoding failed for both address and city, hiding map');
              setMapCoordinates(null);
            }
          } else {
            console.warn('[CarDetailsPanel] Geocoding failed and no city available, hiding map');
            setMapCoordinates(null);
          }
        }
      } catch (error) {
        console.error('[CarDetailsPanel] Error geocoding address:', error);
        setMapCoordinates(null);
      } finally {
        setIsGeocodingAddress(false);
      }
    };

    void geocodeCarAddress();
  }, [car, hasCoords]);

  // Load all image URLs when car changes
  useEffect(() => {
    if (!car || !car.imageIds || car.imageIds.length === 0) {
      setImageUrls(car?.imageUrl ? [car.imageUrl] : []);
      setCurrentImageIndex(0);
      return;
    }

    const loadImageUrls = async () => {
      setIsLoadingImages(true);
      try {
        const urls: string[] = [];
        for (const imageId of car.imageIds!) {
          try {
            const url = await getImageUrl(imageId);
            if (url && url.trim()) {
              urls.push(url);
            }
          } catch (error) {
            console.error(`Failed to load image URL for ${imageId}:`, error);
          }
        }
        setImageUrls(urls.length > 0 ? urls : (car.imageUrl ? [car.imageUrl] : []));
        setCurrentImageIndex(0);
      } catch (error) {
        console.error('Error loading image URLs:', error);
        setImageUrls(car.imageUrl ? [car.imageUrl] : []);
        setCurrentImageIndex(0);
      } finally {
        setIsLoadingImages(false);
      }
    };

    void loadImageUrls();
  }, [car?.id, car?.imageIds, car?.imageUrl]);

  const nextImage = () => {
    if (imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
    }
  };

  const previousImage = () => {
    if (imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < imageUrls.length) {
      setCurrentImageIndex(index);
    }
  };

  const openImageModal = (index: number = currentImageIndex) => {
    setModalImageIndex(index);
    setModalDragOffset(0); // Reset modal drag state
    setModalIsDragging(false);
    setIsImageModalOpen(true);
    
    // Add history state for back button support
    window.history.pushState({ imageModal: true }, '', window.location.href);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setModalDragOffset(0); // Reset modal drag state
    setModalIsDragging(false);
    
    // Remove history state if it was added by modal
    if (window.history.state?.imageModal) {
      window.history.back();
    }
  };

  const closeImageModalDirectly = () => {
    setIsImageModalOpen(false);
    setModalDragOffset(0);
    setModalIsDragging(false);
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isImageModalOpen) {
        closeImageModal();
      }
      if (isImageModalOpen && imageUrls.length > 1) {
        if (event.key === 'ArrowLeft') {
          previousModalImage();
        }
        if (event.key === 'ArrowRight') {
          nextModalImage();
        }
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isImageModalOpen, imageUrls.length]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isImageModalOpen) {
        closeImageModal();
      }
      if (isImageModalOpen && imageUrls.length > 1) {
        if (event.key === 'ArrowLeft') {
          previousModalImage();
        }
        if (event.key === 'ArrowRight') {
          nextModalImage();
        }
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isImageModalOpen, imageUrls.length]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isImageModalOpen) {
        closeImageModal();
      }
      if (isImageModalOpen && imageUrls.length > 1) {
        if (event.key === 'ArrowLeft') {
          previousModalImage();
        }
        if (event.key === 'ArrowRight') {
          nextModalImage();
        }
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (isImageModalOpen && !event.state?.imageModal) {
        // Back button was pressed while modal was open
        closeImageModalDirectly();
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handlePopState);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = 'unset';
    };
  }, [isImageModalOpen, imageUrls.length]);

  const nextModalImage = () => {
    if (imageUrls.length > 1) {
      setModalImageIndex((prev) => (prev + 1) % imageUrls.length);
      // Reset modal drag state
      setModalDragOffset(0);
      setModalIsDragging(false);
    }
  };

  const previousModalImage = () => {
    if (imageUrls.length > 1) {
      setModalImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
      // Reset modal drag state
      setModalDragOffset(0);
      setModalIsDragging(false);
    }
  };

  // Modal swipe handlers
  const handleModalPointerDown = (e: React.PointerEvent) => {
    if (imageUrls.length <= 1) return; // Don't swipe if single image
    e.stopPropagation();
    modalPointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setModalIsDragging(true);
    setModalStartX(e.clientX);
    setModalDragOffset(0);
  };

  const handleModalPointerMove = (e: React.PointerEvent) => {
    if (!modalIsDragging || imageUrls.length <= 1) return;
    if (modalPointerIdRef.current && e.pointerId !== modalPointerIdRef.current) return;
    e.stopPropagation();
    const deltaX = e.clientX - modalStartX;
    setModalDragOffset(deltaX);
  };

  const finishModalDrag = (applySwipe: boolean) => {
    const threshold = 50;
    if (applySwipe && Math.abs(modalDragOffset) > threshold) {
      if (modalDragOffset > 0) {
        setModalImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
      } else if (modalDragOffset < 0) {
        setModalImageIndex((prev) => (prev + 1) % imageUrls.length);
      }
    }
    setModalDragOffset(0);
    setModalIsDragging(false);
    modalPointerIdRef.current = null;
  };

  const handleModalPointerUp = (e: React.PointerEvent) => {
    if (!modalIsDragging || imageUrls.length <= 1) return;
    e.stopPropagation();
    finishModalDrag(true);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleModalPointerCancel = (e: React.PointerEvent) => {
    if (!modalIsDragging) return;
    finishModalDrag(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const dragThreshold = 8;
  const swipeThreshold = 50;

  const suppressNextClick = () => {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleGalleryImageClick = (index: number) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    suppressClickRef.current = false;
    openImageModal(index);
  };

  // Handle drag/swipe for image navigation
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false;
    const canSwipeNow = imageUrls.length > 1;
    if (!canSwipeNow) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if ((event.target as HTMLElement).closest('[data-ignore-drag="true"]')) return;

    pointerTypeRef.current = event.pointerType || 'mouse';
    if (pointerTypeRef.current !== 'mouse') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    isPointerDownRef.current = true;
    dragAxisRef.current = null;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    const activeThreshold = pointerTypeRef.current === 'mouse' ? dragThreshold * 1.5 : dragThreshold;

    if (!dragAxisRef.current) {
      if (Math.abs(dx) < activeThreshold && Math.abs(dy) < activeThreshold) return;
      dragAxisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (dragAxisRef.current !== 'x') return;

    if (!isDragging) {
      setIsDragging(true);
    }
    dragOffsetRef.current = dx;
    setDragOffset(dx);
  };

  const finishPointerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isPointerDownRef.current = false;

    if (dragAxisRef.current === 'x') {
      const offset = dragOffsetRef.current;
      const absOffset = Math.abs(offset);

      if (absOffset > swipeThreshold) {
        if (offset > 0) {
          previousImage();
        } else {
          nextImage();
        }
        suppressNextClick();
      } else if (absOffset > dragThreshold) {
        suppressNextClick();
      }
    } else if (dragAxisRef.current === 'y') {
      suppressNextClick();
    }

    dragAxisRef.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  const tabs: TabKey[] = (() => {
    if (!car) return ['Info & Specifications', 'Location'];
    if (car.isForSale) return ['Info & Specifications', 'Condition & options', 'Pricing', 'Location'];
    return ['Rent details', 'Vehicle info', 'Specifications', 'Location'];
  })();

  const loan = useLoanEstimate({
    price: car?.salePrice ?? 0,
    ratePercent: Number(loanRateInput),
    years: Number(loanYearsInput),
  });
  const loanTermYears = clampNumber(Number(loanYearsInput) || 5, 2, 10);
  const loanTermLeft = ((loanTermYears - 2) / (10 - 2)) * 100;

  const handleDatesChange = async (newStartDate: Date | null, newEndDate: Date | null) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setBookingMessage(null);

    if (car && newStartDate && newEndDate) {
      setIsCheckingAvailability(true);
      try {
        const result = await checkCarAvailability(car.id, newStartDate, newEndDate);
        setUnavailableDates(result.unavailableDates);
      } catch (error) {
        console.error('Failed to check availability:', error);
      } finally {
        setIsCheckingAvailability(false);
      }
    }
  };

  const handleBookReservation = async () => {
    if (!car || !startDate || !endDate || !user) {
      setBookingMessage({ type: 'error', text: 'Please log in to make a reservation' });
      return;
    }

    setIsBooking(true);
    setBookingMessage(null);

    try {
      await createReservation({
        carId: car.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setBookingMessage({ type: 'success', text: 'Reservation created successfully!' });
      setStartDate(null);
      setEndDate(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reservation';
      setBookingMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsBooking(false);
    }
  };

  if (!car) {
    return (
      <aside className={`details-panel ${compactCtas ? 'details-panel--compact-cta' : ''}`}>
        <div className="details-panel__placeholder">
          <SparklesIcon size={22} />
          <p>{t('details.placeholder')}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`details-panel ${compactCtas ? 'details-panel--compact-cta' : ''}`}>
      {onClose && (
        <button className="details-panel__close" type="button" aria-label="Close details" onClick={onClose}>
          <span aria-hidden>×</span>
        </button>
      )}
      <div className="details-panel__image-gallery">
        {isLoadingImages ? (
          <div className="image-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading images...</p>
          </div>
        ) : imageUrls.length > 0 ? (
          <>
              <div 
                className="image-gallery-container"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishPointerDrag}
                onPointerCancel={finishPointerDrag}
                style={{
                cursor: imageUrls.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
              }}
            >
              <div
                className="image-gallery-track"
                style={{
                  transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                }}
              >
                {imageUrls.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    className="image-gallery-slide"
                    type="button"
                    onClick={() => handleGalleryImageClick(index)}
                    aria-label={`Open image ${index + 1}`}
                  >
                    <img
                      src={url}
                      alt={`${car.model} - Image ${index + 1}`}
                      draggable={false}
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
                  </button>
                ))}
              </div>
              
              {/* Navigation arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button 
                    className="image-nav-btn image-nav-prev"
                    type="button"
                    data-ignore-drag="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      previousImage();
                    }}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button 
                    className="image-nav-btn image-nav-next"
                    type="button"
                    data-ignore-drag="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
              
              {/* Image counter */}
              {imageUrls.length > 1 && (
                <div className="image-counter">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              )}
            </div>
            
            {/* Thumbnail dots */}
            {imageUrls.length > 1 && (
              <div className="image-dots">
                {imageUrls.map((_, index) => (
                  <button
                    key={index}
                    className={`image-dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => goToImage(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <img 
            src="/noimage.png" 
            alt="No image available"
            style={{ backgroundColor: '#f0f0f0' }}
          />
        )}
      </div>
      <div className="details-panel__header">
        <div className="details-panel__header-row">
          <div className="details-panel__title">
            <p className="eyebrow">{car.brand.toUpperCase()}</p>
            <div className="details-panel__title-row">
              <h2>{car.subtitle || `${car.brand} ${car.model}`}</h2>
              <div className="cta-row top-cta cta-row--compact cta-row--mobile">
                {contactHref ? (
                  <a className="primary-btn secondary contact-btn" href={contactHref}>
                    <PhoneIcon size={16} className="contact-btn__icon" />
                    <span className="cta-label">{t('common.contact')}</span>
                  </a>
                ) : (
                  <button className="primary-btn secondary contact-btn" type="button" disabled>
                    <PhoneIcon size={16} className="contact-btn__icon" />
                    <span className="cta-label">{t('common.contact')}</span>
                  </button>
                )}
                {whatsappHref ? (
                  <a className="primary-btn whatsapp whatsapp-btn" href={whatsappHref} target="_blank" rel="noreferrer">
                    <WhatsAppIcon size={16} className="whatsapp-btn__icon" />
                    <span className="cta-label">{t('common.whatsapp')}</span>
                  </a>
                ) : (
                  <button className="primary-btn whatsapp whatsapp-btn" type="button" disabled>
                    <WhatsAppIcon size={16} className="whatsapp-btn__icon" />
                    <span className="cta-label">{t('common.whatsapp')}</span>
                  </button>
                )}
              </div>
            </div>
            <p className="muted">{car.model} — {car.year}</p>
          </div>
          <div className="cta-row top-cta cta-row--compact cta-row--desktop">
            {onOpenFull && car && (
              <button className="ghost-btn" type="button" onClick={() => onOpenFull(car.id)}>
                {t('common.viewFullDetails')}
              </button>
            )}
            {contactHref ? (
              <a className="primary-btn secondary contact-btn" href={contactHref}>
                <PhoneIcon size={16} className="contact-btn__icon" />
                <span className="cta-label">{t('common.contact')}</span>
              </a>
            ) : (
              <button className="primary-btn secondary contact-btn" type="button" disabled>
                <PhoneIcon size={16} className="contact-btn__icon" />
                <span className="cta-label">{t('common.contact')}</span>
              </button>
            )}
            {whatsappHref ? (
              <a className="primary-btn whatsapp whatsapp-btn" href={whatsappHref} target="_blank" rel="noreferrer">
                <WhatsAppIcon size={16} className="whatsapp-btn__icon" />
                <span className="cta-label">{t('common.whatsapp')}</span>
              </a>
            ) : (
              <button className="primary-btn whatsapp whatsapp-btn" type="button" disabled>
                <WhatsAppIcon size={16} className="whatsapp-btn__icon" />
                <span className="cta-label">{t('common.whatsapp')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showTabs && (
        <>
          <div className="tab-row">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab === 'Info & Specifications'
                  ? t('details.tabs.infoSpecs')
                  : tab === 'Condition & options'
                    ? t('details.tabs.conditionOptions')
                    : tab === 'Pricing'
                      ? t('details.tabs.pricing')
                      : tab === 'Location'
                        ? t('details.tabs.location')
                        : tab === 'Rent details'
                          ? t('details.tabs.rentDetails')
                          : tab === 'Vehicle info'
                            ? t('details.tabs.vehicleInfo')
                            : t('details.tabs.specs')}
              </button>
            ))}
          </div>

          {activeTab === 'Rent details' && car.isForRent && !car.isForSale && (
            <div className="rent-section">
              <div className="map-preview">
                <div className="map-preview__marker">
                  <NavigationIcon size={18} />
                </div>
                <div className="map-preview__info">
                  <p className="muted">{t('details.rent.pickup')}</p>
                  <strong>{car.location.mapLabel}</strong>
                  <span>
                    <MapPinIcon size={14} /> {car.location.fullAddress}
                  </span>
                </div>
              </div>
              
              <DateRangePicker
                startDate={startDate || undefined}
                endDate={endDate || undefined}
                onDatesChange={handleDatesChange}
                unavailableDates={unavailableDates}
                pricePerDay={car.rentPricePerDay || undefined}
                minDate={new Date()}
              />

              {bookingMessage && (
                <div className={`booking-message ${bookingMessage.type}`}>
                  {bookingMessage.text}
                </div>
              )}

              {car.isForRent && (
                <button 
                  className="primary-btn" 
                  type="button"
                  onClick={handleBookReservation}
                  disabled={!startDate || !endDate || isBooking || isCheckingAvailability || !user}
                >
                  {isBooking ? 'Booking...' : user ? 'Book Reservation' : 'Login to Book'}
                </button>
              )}
            </div>
          )}

          {activeTab === 'Vehicle info' && (
            <div className="info-grid">
              <InfoItem label={t('details.info.brand')} value={car.brand} />
              <InfoItem label={t('details.info.model')} value={car.model} />
              <InfoItem label={t('details.info.year')} value={car.year} />
              {hasText(exteriorValue) && <InfoItem label={t('details.info.exterior')} value={exteriorValue} />}
              {hasPositiveNumber(car.doors) && <InfoItem label={t('details.info.doors')} value={`${car.doors}`} />}
              {hasPositiveNumber(car.seats) && <InfoItem label={t('details.info.seats')} value={`${car.seats}`} />}
            </div>
          )}

          {activeTab === 'Specifications' && (
            <div className="info-grid">
              <InfoItem label={t('details.info.fuel')} value={fuelLabel || textOrDash(car.fuelType)} />
              <InfoItem label={t('details.info.transmission')} value={transmissionLabel || textOrDash(car.transmission)} />
              {hasPositiveNumber(car.mileageKm) && (
                <InfoItem label={t('details.info.mileage')} value={`${car.mileageKm.toLocaleString()} km`} />
              )}
              <InfoItem label={t('details.info.body')} value={car.bodyStyle} />
              <InfoItem label={t('details.specs.rental')} value={car.isForRent ? t('details.specs.availableForRent') : '—'} />
              <InfoItem label={t('details.specs.sale')} value={car.isForSale ? t('details.specs.availableForSale') : '—'} />
            </div>
          )}

          {activeTab === 'Info & Specifications' && (
            <div className="info-grid">
              <InfoItem label={t('details.info.brand')} value={car.brand} />
              <InfoItem label={t('details.info.model')} value={car.model} />
              <InfoItem label={t('details.info.year')} value={car.year} />
              <InfoItem label={t('details.info.body')} value={car.bodyStyle} />
              <InfoItem label={t('details.info.fuel')} value={fuelLabel || textOrDash(car.fuelType)} />
              <InfoItem label={t('details.info.transmission')} value={transmissionLabel || textOrDash(car.transmission)} />
              {hasPositiveNumber(car.enginePowerHp) && (
                <InfoItem label={t('details.info.enginePower')} value={`${car.enginePowerHp} hp`} />
              )}
              <InfoItem
                label={t('details.info.engineVolume')}
                value={typeof car.engineVolumeL === 'number' ? `${car.engineVolumeL.toFixed(1)} L` : '—'}
              />
              {hasPositiveNumber(car.mileageKm) && (
                <InfoItem label={t('details.info.mileage')} value={`${car.mileageKm.toLocaleString()} km`} />
              )}
              {hasPositiveNumber(car.seats) && hasPositiveNumber(car.doors) && (
                <InfoItem label={t('details.info.seatsDoors')} value={`${car.seats} / ${car.doors}`} />
              )}
              {hasText(exteriorValue) && <InfoItem label={t('details.info.exterior')} value={exteriorValue} />}
              {hasText(interiorValue) && <InfoItem label={t('details.info.interior')} value={interiorValue} />}
            </div>
          )}

          {activeTab === 'Condition & options' && (
            <div className="rent-section">
              {hasText(car.description) && (
                <div className="condition-description">
                  <p className="muted">{t('details.condition.description')}</p>
                  <p className="condition-description__text">{car.description}</p>
                </div>
              )}

              <div className="condition-metrics">
                <InfoItem
                  label={t('details.condition.owners')}
                  value={typeof car.ownersCount === 'number' ? `${car.ownersCount}` : '—'}
                />
                <InfoItem
                  label={t('details.condition.accidents')}
                  value={typeof car.accidentsCount === 'number' ? `${car.accidentsCount}` : '—'}
                />
                {hasText(car.serviceHistory) && (
                  <InfoItem label={t('details.condition.serviceHistory')} value={car.serviceHistory} />
                )}
              </div>

              <div className="details-separator" role="separator" aria-hidden="true" />

              <div className="options-section">
                <p className="options-title">{t('details.options.title')}</p>
                {car.optionsGroups && car.optionsGroups.some((g) => g.items.length > 0) ? (
                  (() => {
                    const groups = car.optionsGroups.filter((group) => group.items.length > 0);
                    const normalizedGroups = groups.map((group) => {
                      const titleKey = optionGroupTitleLookup.get(group.title) ?? group.title;
                      const titleLabel = t(titleKey);
                      const resolvedTitle = titleLabel === titleKey ? group.title : titleLabel;
                      return { ...group, titleKey, resolvedTitle };
                    });
                    const selectGroups = normalizedGroups
                      .filter((group) => optionGroupOrder.has(group.titleKey))
                      .slice()
                      .sort((a, b) => {
                        const aOrder = optionGroupOrder.get(a.titleKey) ?? Number.POSITIVE_INFINITY;
                        const bOrder = optionGroupOrder.get(b.titleKey) ?? Number.POSITIVE_INFINITY;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        return a.titleKey.localeCompare(b.titleKey);
                      });
                    const featureGroups = normalizedGroups.filter((group) => group.titleKey === 'options.group.features');
                    const otherGroups = normalizedGroups.filter(
                      (group) => !optionGroupOrder.has(group.titleKey) && group.titleKey !== 'options.group.features'
                    );
                    const renderGroups = (list: typeof normalizedGroups) =>
                      list.map((group) => (
                        <div key={group.title} className="option-group">
                          <p className="option-group__title">{group.resolvedTitle}</p>
                          <div className="option-chip-grid">
                            {group.items.map((item) => {
                              const labelKey = optionLabelLookup.get(item) ?? item;
                              const label = t(labelKey);
                              const resolved = label === labelKey ? item : label;
                              return (
                                <span key={item} className="option-chip">
                                  {resolved}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    return (
                      <>
                        {selectGroups.length > 0 && (
                          <div className="options-groups options-groups--select">{renderGroups(selectGroups)}</div>
                        )}
                        {otherGroups.length > 0 && <div className="options-groups">{renderGroups(otherGroups)}</div>}
                        {featureGroups.length > 0 && (
                          <div className="options-groups options-groups--features">{renderGroups(featureGroups)}</div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <p className="muted">{t('details.options.empty')}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Pricing' && (
            <div className="rent-section">
              <div className="info-grid">
                <InfoItem label={t('details.pricing.salePrice')} value={car.salePrice ? formatPrice(car.salePrice) : '—'} />
                {hasPositiveNumber(car.fees) && (
                  <InfoItem label={t('details.pricing.yearlyInsurance')} value={formatPrice(car.fees)} />
                )}
                {hasPositiveNumber(car.taxes) && (
                  <InfoItem label={t('details.pricing.yearlyTaxes')} value={formatPrice(car.taxes)} />
                )}
                {(hasPositiveNumber(car.fees) || hasPositiveNumber(car.taxes)) && (
                  <InfoItem
                    label={t('details.pricing.yearlyTotal')}
                    value={formatPrice((car.fees ?? 0) + (car.taxes ?? 0))}
                  />
                )}
              </div>

              <div className="loan-box">
                <div className="loan-head">
                  <div>
                    <p className="loan-title">{t('details.loan.title')}</p>
                    <p className="loan-subtitle">{t('details.loan.subtitle')}</p>
                  </div>
                  <div className="loan-kpi">
                    <p className="loan-kpi__label">{t('details.loan.estimatedMonthly')}</p>
                    <p className="loan-kpi__value">{loan.monthlyPayment ? formatPrice(loan.monthlyPayment) : '—'}</p>
                  </div>
                </div>

                <div className="loan-grid">
                  <label className="input-block">
                    <span>{t('details.loan.interestRate')}</span>
                    <div className="loan-input">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.1}
                        value={loanRateInput}
                        onChange={(e) => setLoanRateInput(e.target.value)}
                      />
                      <span className="loan-input__suffix">%</span>
                    </div>
                  </label>
                  <label className="input-block loan-term">
                    <span>{t('details.loan.term')}</span>
                    <div className="loan-range">
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={1}
                        value={loanTermYears}
                        onChange={(e) => setLoanYearsInput(e.target.value)}
                        onMouseEnter={() => setLoanTermTooltipOpen(true)}
                        onMouseLeave={() => setLoanTermTooltipOpen(false)}
                        onFocus={() => setLoanTermTooltipOpen(true)}
                        onBlur={() => setLoanTermTooltipOpen(false)}
                        onPointerDown={() => setLoanTermTooltipOpen(true)}
                        onPointerUp={() => setLoanTermTooltipOpen(false)}
                        aria-label={t('details.loan.term')}
                      />
                      <span
                        className={`loan-range__tooltip ${loanTermTooltipOpen ? 'is-visible' : ''}`}
                        style={{ left: `${loanTermLeft}%` }}
                        aria-hidden="true"
                      >
                        {t('details.loan.years', { count: loanTermYears })}
                      </span>
                      <span className="loan-range__value">{t('details.loan.years', { count: loanTermYears })}</span>
                    </div>
                  </label>
                </div>

                <div className="loan-breakdown">
                  <div className="loan-metric">
                    <p className="loan-metric__label">{t('details.loan.amount')}</p>
                    <p className="loan-metric__value">{car.salePrice ? formatPrice(car.salePrice) : '—'}</p>
                  </div>
                  <div className="loan-metric">
                    <p className="loan-metric__label">{t('details.loan.totalInterest')}</p>
                    <p className="loan-metric__value">{loan.totalInterest ? formatPrice(loan.totalInterest) : '—'}</p>
                  </div>
                  <div className="loan-metric">
                    <p className="loan-metric__label">{t('details.loan.totalPaid')}</p>
                    <p className="loan-metric__value">{loan.totalPaid ? formatPrice(loan.totalPaid) : '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Location' && (
            <div className="rent-section">
              <div className="info-grid">
                <InfoItem label={t('details.location.city')} value={car.location.city} />
                <InfoItem label={t('details.location.address')} value={car.location.fullAddress} />
              </div>
              {isGeocodingAddress && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                  {t('details.location.loadingMap')}
                </div>
              )}
              {!isGeocodingAddress && mapCoordinates && (
                <MapEmbed
                  lat={mapCoordinates.lat}
                  lng={mapCoordinates.lng}
                  height={240}
                  type="osm"
                  title="Car location map"
                  showOpenLink={true}
                  openLinkText="Open in Maps"
                />
              )}
              {!isGeocodingAddress && !mapCoordinates && car.location.fullAddress && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.9em' }}>
                  {t('details.location.mapUnavailable')}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!showTabs && (
        <div className="rent-section">
          <div className="map-preview">
            <div className="map-preview__marker">
              <NavigationIcon size={18} />
            </div>
            <div className="map-preview__info">
              <p className="muted">
                {compactCtas ? t('details.location.selected') : t('details.rent.pickup')}
              </p>
              <span>
                <MapPinIcon size={14} /> {car.location.fullAddress}
              </span>
            </div>
          </div>
          <div className="info-grid">
            <InfoItem label={t('details.info.brand')} value={car.brand} />
            <InfoItem label={t('details.info.model')} value={car.model} />
            <InfoItem label={t('details.info.year')} value={car.year} />
            <InfoItem label={t('details.info.body')} value={car.bodyStyle} />
            <InfoItem label={t('details.info.fuel')} value={fuelLabel || textOrDash(car.fuelType)} />
            <InfoItem label={t('details.info.transmission')} value={transmissionLabel || textOrDash(car.transmission)} />
            {hasPositiveNumber(car.mileageKm) && (
              <InfoItem label={t('details.info.mileage')} value={`${car.mileageKm.toLocaleString()} km`} />
            )}
            {hasPositiveNumber(car.seats) && hasPositiveNumber(car.doors) && (
              <InfoItem label={t('details.info.seatsDoors')} value={`${car.seats} / ${car.doors}`} />
            )}
            {hasText(colorValue) && <InfoItem label={t('details.info.exterior')} value={colorValue} />}
            <InfoItem
              label={t('details.location.availability')}
              value={
                car.availableNow
                  ? t('carCard.availableNow')
                  : car.isForSale
                    ? t('carCard.comingSoon')
                    : t('carCard.booked')
              }
            />
            <InfoItem
              label={t('details.location.pricing')}
              value={
                car.isForRent
                  ? car.rentPricePerDay
                    ? t('carCard.priceDay', { price: formatPrice(car.rentPricePerDay) })
                    : car.rentPricePerHour
                      ? t('carCard.priceDay', { price: formatPrice(car.rentPricePerHour) })
                      : t('carCard.contact')
                  : '—'
              }
            />
            {car.isForSale && (
              <InfoItem label={t('details.pricing.salePrice')} value={car.salePrice ? formatPrice(car.salePrice) : '—'} />
            )}
          </div>
        </div>
      )}
      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="image-modal-overlay" 
          style={navbarOffset ? { top: navbarOffset } : undefined}
          onClick={(e) => {
            // Only close if clicking the overlay itself, not its children
            if (e.target === e.currentTarget) {
              closeImageModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery modal"
        >
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={closeImageModal}
              aria-label="Close modal"
            >
              ×
            </button>
            <div 
              className="image-modal-img-container"
              style={{
                cursor: imageUrls.length > 1 ? (modalIsDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onPointerDown={handleModalPointerDown}
              onPointerMove={handleModalPointerMove}
              onPointerUp={handleModalPointerUp}
              onPointerCancel={handleModalPointerCancel} 
            >
              <img 
                src={imageUrls[modalImageIndex]} 
                alt={`${car.model} - Image ${modalImageIndex + 1}`}
                className="image-modal-img"
                style={{
                  transform: `translateX(${modalDragOffset}px)`,
                  transition: modalIsDragging ? 'none' : 'transform 0.3s ease',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
                draggable={false}
              />
            </div>
            
            {imageUrls.length > 1 && (
              <>
                <button 
                  className="image-modal-nav image-modal-prev" 
                  onClick={(e) => {
                    e.stopPropagation();
                    previousModalImage();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    previousModalImage();
                  }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button 
                  className="image-modal-nav image-modal-next" 
                  onClick={(e) => {
                    e.stopPropagation();
                    nextModalImage();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    nextModalImage();
                  }}
                  aria-label="Next image"
                >
                  ›
                </button>
                
                <div className="image-modal-counter">
                  {modalImageIndex + 1} / {imageUrls.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

const InfoItem: React.FC<{ label: string; value: string | number | React.ReactNode }> = ({ label, value }) => (
  <div className="info-item">
    <p className="muted">{label}</p>
    <strong>{value}</strong>
  </div>
);

function useLoanEstimate({
  price,
  ratePercent,
  years,
}: {
  price: number;
  ratePercent: number;
  years: number;
}): { monthlyPayment: number | null; totalPaid: number | null; totalInterest: number | null } {
  if (!price || price <= 0) return { monthlyPayment: null, totalPaid: null, totalInterest: null };
  if (!Number.isFinite(ratePercent) || ratePercent < 0) return { monthlyPayment: null, totalPaid: null, totalInterest: null };
  if (!Number.isFinite(years) || years <= 0) return { monthlyPayment: null, totalPaid: null, totalInterest: null };

  const monthlyRate = ratePercent / 100 / 12;
  const numberOfPayments = Math.round(years * 12);
  if (numberOfPayments <= 0) return { monthlyPayment: null, totalPaid: null, totalInterest: null };

  if (monthlyRate === 0) {
    const monthlyPayment = price / numberOfPayments;
    return { monthlyPayment, totalPaid: price, totalInterest: 0 };
  }

  const monthlyPayment = (price * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numberOfPayments));
  const totalPaid = monthlyPayment * numberOfPayments;
  const totalInterest = totalPaid - price;
  return { monthlyPayment, totalPaid, totalInterest };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
