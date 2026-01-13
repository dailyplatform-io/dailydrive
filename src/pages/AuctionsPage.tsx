import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auction, AuctionBid } from '../models/Auction';
import { fetchAuctions, placeBid } from '../service/auctionService';
import { formatPrice } from '../utils/formatting';
import { useAuth } from '../context/AuthContext';
import './AuctionsPage.css';

const ISSUE_LIBRARY = [
  { key: 'front', label: 'Front damage' },
  { key: 'rear', label: 'Rear damage' },
  { key: 'left', label: 'Left side' },
  { key: 'right', label: 'Right side' },
  { key: 'engine', label: 'Engine' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'suspension', label: 'Suspension' },
  { key: 'manifold', label: 'Manifold' },
  { key: 'interior', label: 'Interior' },
];

const formatCountdown = (target: string, prefix: string) => {
  const targetDate = new Date(target).getTime();
  const now = Date.now();
  const diff = targetDate - now;
  if (Number.isNaN(targetDate)) return '';
  if (diff <= 0) return prefix === 'Starts' ? 'In progress' : 'Finished';
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${prefix} in ${days}d ${hours}h`;
  if (hours > 0) return `${prefix} in ${hours}h ${minutes}m`;
  return `${prefix} in ${minutes}m ${seconds}s`;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleString();
};

const calcMinBid = (auction: Auction) => {
  const baseline = Math.max(auction.currentPriceEur || 0, auction.startPriceEur || 0);
  return baseline + 300;
};

const renderIssue = (issue: { key: string; label: string }, active: boolean) => (
  <div key={issue.key} className={`auction-issues__item ${active ? 'is-active' : ''}`}>
    <span className="auction-issues__checkbox">{active ? '✓' : ''}</span>
    <span>{issue.label}</span>
  </div>
);

const sortBids = (bids: AuctionBid[]) =>
  [...bids].sort((a, b) => {
    if (a.amountEur === b.amountEur) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.amountEur - a.amountEur;
  });

export const AuctionsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [placingBid, setPlacingBid] = useState(false);
  const [timerText, setTimerText] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [didDrag, setDidDrag] = useState(false);
  const [dragEndX, setDragEndX] = useState<number | null>(null);
  const [modalDragStart, setModalDragStart] = useState<number | null>(null);
  const [modalDragOffset, setModalDragOffset] = useState(0);
  const [modalIsDragging, setModalIsDragging] = useState(false);
  const activePointerId = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const selectedAuction = useMemo(
    () => auctions.find((a) => a.id === selectedId) ?? auctions[0],
    [auctions, selectedId]
  );

  const galleryImages = useMemo(
    () =>
      (((selectedAuction?.imageUrls ?? []).length ? selectedAuction?.imageUrls : [selectedAuction?.car.imageUrl]) ?? [])
        .filter(Boolean),
    [selectedAuction]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAuctions();
        setAuctions(data);
        if (!selectedId && data.length) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedAuction) return;
    const nextMin = calcMinBid(selectedAuction);
    setBidAmount(Number(nextMin.toFixed(0)));
  }, [selectedAuction?.id]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!selectedAuction) {
      setTimerText('');
      return;
    }
    if (!selectedAuction.hasStarted) {
      setTimerText(formatCountdown(selectedAuction.startsAt, 'Starts'));
      } else if (!selectedAuction.hasEnded) {
        setTimerText(formatCountdown(selectedAuction.endsAt, 'Ends'));
      } else {
        setTimerText('Finished');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [selectedAuction]);

  const handleSelect = (auction: Auction) => {
    setSelectedId(auction.id);
    setSlideIndex(0);
    setLightboxIndex(null);
    setModalDragOffset(0);
  };

  const handlePrev = () => {
    if (!galleryImages.length) return;
    setSlideIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNext = () => {
    if (!galleryImages.length) return;
    setSlideIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const isDragIgnored = (target: EventTarget | null) => {
    return Boolean((target as HTMLElement | null)?.dataset?.ignoreDrag);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (galleryImages.length <= 1) return;
    if (isDragIgnored(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    activePointerId.current = e.pointerId;
    if (e.pointerType !== 'mouse') {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    suppressClickRef.current = false;
    setDragStartX(e.clientX);
    setDragEndX(null);
    setDragOffset(0);
    setIsDragging(true);
    setDidDrag(false);
    suppressClickRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || dragStartX === null) return;
    if (activePointerId.current && e.pointerId !== activePointerId.current) return;
    const delta = e.clientX - dragStartX;
    setDragOffset(delta);
    setDragEndX(e.clientX);
    if (Math.abs(delta) > 8) {
      setDidDrag(true);
      suppressClickRef.current = true;
    }
  };

  const finishDrag = () => {
    if (!isDragging || dragStartX === null) {
      setDragOffset(0);
      setDragStartX(null);
      setDragEndX(null);
      setIsDragging(false);
      setDidDrag(false);
      return;
    }
    activePointerId.current = null;
    const delta = (dragEndX ?? dragStartX) - dragStartX;
    if (delta > 50) handlePrev();
    if (delta < -50) handleNext();
    if (Math.abs(delta) <= 8) {
      suppressClickRef.current = false;
    }
    setDragOffset(0);
    setDragStartX(null);
    setDragEndX(null);
    setIsDragging(false);
    setDidDrag(false);
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuction) return;
    const nextMin = calcMinBid(selectedAuction);
    const amount = typeof bidAmount === 'string' ? Number(bidAmount) : bidAmount;
    if (!amount || amount < nextMin) {
      setError(`Minimum bid is €${nextMin.toFixed(0)}.`);
      return;
    }
    setError(null);
    try {
      setPlacingBid(true);
      const updated = await placeBid(selectedAuction.id, amount, user?.sellerName || user?.email);
      setAuctions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return (
      <main className="auctions">
        <p className="auctions__status">Loading auctions...</p>
      </main>
    );
  }

  if (error && !selectedAuction) {
    return (
      <main className="auctions">
        <p className="auctions__status">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="auctions">
      <header className="auctions__hero">
        <div>
          <p className="auctions__kicker">Live & upcoming</p>
          <h1 className="auctions__title">Auctions</h1>
          <p className="auctions__subtitle">
            Browse auction-ready cars with transparent damage notes, image & video galleries, and live bidding.
          </p>
        </div>
        <div className="auctions__hero-actions">
          <button className="auctions__guide" type="button" onClick={() => setShowGuide((v) => !v)}>
            {showGuide ? 'Hide how it works' : 'How to bid / buy'}
          </button>
        </div>
      </header>

      {showGuide && (
        <section className="auctions__guide-panel">
          <div className="guide-step">
            <div className="guide-step__badge">1</div>
            <div>
              <h4>Create / sign in</h4>
              <p>Log in with your owner account to unlock bidding and buy-now actions. Guests can view but can’t bid.</p>
            </div>
          </div>
          <div className="guide-step">
            <div className="guide-step__badge">2</div>
            <div>
              <h4>Review car & issues</h4>
              <p>Scan gallery and videos, then read the issues (front, rear, engine, manifold, interior, etc.) to know the condition.</p>
            </div>
          </div>
          <div className="guide-step">
            <div className="guide-step__badge">3</div>
            <div>
              <h4>Bid with +€300 steps</h4>
              <p>Use the default +€300 increment above the current bid (or higher). Highest valid bid when the timer ends wins.</p>
            </div>
          </div>
          <div className="guide-step">
            <div className="guide-step__badge">4</div>
            <div>
              <h4>Buy now (optional)</h4>
              <p>If a buy-now price appears, you can complete instantly without waiting for bids to close.</p>
            </div>
          </div>
          <div className="guide-step">
            <div className="guide-step__badge">5</div>
            <div>
              <h4>Finish & contact seller</h4>
              <p>When you win, you’ll get seller contact details to finalize payment and pickup. Keep proof of your winning bid.</p>
            </div>
          </div>
          <div className="guide-step">
            <div className="guide-step__badge">6</div>
            <div>
              <h4>Tip: track the timer</h4>
              <p>Watch the live countdown; place bids early to avoid missing the closing window.</p>
            </div>
          </div>
        </section>
      )}

      {error && <p className="auctions__error">Error: {error}</p>}

      <div className="auctions__grid">
        <div className="auctions__list">
          {auctions.map((auction) => {
            const cover = auction.imageUrls[0] || auction.car.imageUrl;
            const isActive = selectedAuction?.id === auction.id;
            return (
              <button
                key={auction.id}
                className={`auction-card ${isActive ? 'is-active' : ''}`}
                type="button"
                onClick={() => handleSelect(auction)}
              >
                <div className="auction-card__media">
                  {cover ? <img src={cover} alt={auction.car.model} /> : <div className="auction-card__placeholder">No image</div>}
                </div>
                <div className="auction-card__body">
                  <div className="auction-card__header">
                    <h3>
                      {auction.car.brand} {auction.car.model} {auction.car.year}
                    </h3>
                    <span className={`auction-card__pill ${auction.hasStarted ? 'pill-live' : 'pill-upcoming'}`}>
                      {auction.hasEnded ? 'Finished' : auction.hasStarted ? 'Live' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="auction-card__line">
                    Current bid <strong>{formatPrice(auction.currentPriceEur)}</strong>
                  </p>
                  <p className="auction-card__line">Mileage: {auction.car.mileageKm.toLocaleString()} km</p>
                  <p className="auction-card__line">
                    {auction.car.year} • {auction.car.bodyStyle} • {auction.car.transmission} • {auction.car.fuelType}
                  </p>
                  <p className="auction-card__line">Starts: {formatDateTime(auction.startsAt)}</p>
                  <p className="auction-card__line">Ends: {formatDateTime(auction.endsAt)}</p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedAuction && (
          <section className="auction-detail">
            <div className="auction-detail__media">
              <div
                className="auction-detail__gallery"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                style={{
                  cursor: galleryImages.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                }}
                >
                <button
                  className="auction-gallery__arrow left"
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous image"
                  data-ignore-drag="true"
                >
                  ‹
                </button>
                <button
                  className="auction-gallery__arrow right"
                  type="button"
                  onClick={handleNext}
                  aria-label="Next image"
                  data-ignore-drag="true"
                >
                  ›
                </button>
                <div className="auction-gallery__viewport">
                  <div
                    className="auction-gallery__track"
                    style={{
                      transform: `translateX(calc(-${slideIndex * 100}% + ${dragOffset}px))`,
                      transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                    }}
                  >
                    {galleryImages.map((url, idx) => (
                      <div className="auction-gallery__slide" key={url}>
                        <button
                          type="button"
                          className="auction-gallery__slide-btn"
                          data-ignore-drag="true"
                          onClick={() => {
                            if (suppressClickRef.current || didDrag) return;
                            suppressClickRef.current = false;
                            setLightboxIndex(idx);
                            setModalDragOffset(0);
                          }}
                          aria-label={`Open image ${idx + 1}`}
                        >
                          <img src={url} alt={`${selectedAuction.car.model} ${idx + 1}`} draggable={false} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="auction-gallery__dots">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      className={`auction-gallery__dot ${idx === slideIndex ? 'is-active' : ''}`}
                      onClick={() => setSlideIndex(idx)}
                      aria-label={`Go to image ${idx + 1}`}
                      data-ignore-drag="true"
                    />
                  ))}
                </div>
                {galleryImages.length > 1 && (
                  <div className="auction-gallery__counter">
                    {slideIndex + 1} / {galleryImages.length}
                  </div>
                )}
              </div>
              {(selectedAuction.videoUrls ?? []).length > 0 && (
                <div className="auction-detail__videos">
                  {(selectedAuction.videoUrls ?? []).map((url) => (
                    <video key={url} src={url} controls />
                  ))}
                </div>
              )}

            </div>

            <div className="auction-detail__content">
              <div className="auction-detail__heading">
                <div>
                  <p className="auction-detail__eyebrow">{selectedAuction.car.ownerName}</p>
                  <h2>
                    {selectedAuction.car.brand} {selectedAuction.car.model} {selectedAuction.car.year}
                  </h2>
                  <p className="auction-detail__subtitle">{selectedAuction.car.subtitle}</p>
                </div>
                <div className="auction-detail__time">
                  <span className="auction-detail__timer">{timerText}</span>
                  <small>
                    Starts {formatDateTime(selectedAuction.startsAt)} · Ends {formatDateTime(selectedAuction.endsAt)}
                  </small>
                </div>
              </div>

              <div className="auction-detail__stats">
                <div>
                  <p className="label">Start price</p>
                  <p className="value">{formatPrice(selectedAuction.startPriceEur)}</p>
                </div>
                <div>
                  <p className="label">Current bid</p>
                  <p className="value">{formatPrice(selectedAuction.currentPriceEur)}</p>
                </div>
                <div>
                  <p className="label">Buy now</p>
                  <p className="value">
                    {selectedAuction.buyNowPriceEur ? formatPrice(selectedAuction.buyNowPriceEur) : '—'}
                  </p>
                </div>
              </div>

              <div className="auction-detail__meta-grid">
                <div>
                  <p className="label">Mileage</p>
                  <p className="value">{selectedAuction.car.mileageKm.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="label">Fuel</p>
                  <p className="value">{selectedAuction.car.fuelType}</p>
                </div>
                <div>
                  <p className="label">Transmission</p>
                  <p className="value">{selectedAuction.car.transmission}</p>
                </div>
                <div>
                  <p className="label">Body</p>
                  <p className="value">{selectedAuction.car.bodyStyle}</p>
                </div>
                <div>
                  <p className="label">Seats</p>
                  <p className="value">{selectedAuction.car.seats}</p>
                </div>
                <div>
                  <p className="label">Engine</p>
                  <p className="value">
                    {selectedAuction.car.engineVolumeL ? `${selectedAuction.car.engineVolumeL}L` : '—'} ·{' '}
                    {selectedAuction.car.enginePowerHp ? `${selectedAuction.car.enginePowerHp}hp` : '—'}
                  </p>
                </div>
              </div>

              <div className="auction-detail__description">
                <h4>Vehicle overview</h4>
                <p>
                  {selectedAuction.car.bodyStyle} · {selectedAuction.car.transmission} · {selectedAuction.car.fuelType} ·{' '}
                  {selectedAuction.car.mileageKm.toLocaleString()} km
                </p>
                {selectedAuction.car.description && <p className="auction-detail__copy">{selectedAuction.car.description}</p>}
              </div>

              <div className="auction-issues">
                <h4>Issues & damage notes</h4>
                <div className="auction-issues__grid">
                  {ISSUE_LIBRARY.map((issue) => {
                    const active = selectedAuction.issues.some((i) => i.toLowerCase().includes(issue.key));
                    return renderIssue(issue, active);
                  })}
                </div>
                {selectedAuction.issues.length > 0 && (
                  <p className="auction-issues__other">
                    Other notes: {selectedAuction.issues.filter((i) => ISSUE_LIBRARY.every((lib) => !i.toLowerCase().includes(lib.key))).join(', ') || 'None'}
                  </p>
                )}
              </div>

              <div className="auction-bids">
                <div className="auction-bids__header">
                  <h4>Bids</h4>
                  <span>{selectedAuction.bids.length} bids</span>
                </div>
                <div className="auction-bids__list">
                  {sortBids(selectedAuction.bids).map((bid) => (
                    <div key={bid.id} className="auction-bid">
                      <div>
                        <p className="auction-bid__name">{bid.bidderName}</p>
                        <p className="auction-bid__time">{formatDateTime(bid.createdAt)}</p>
                      </div>
                      <p className="auction-bid__amount">{formatPrice(bid.amountEur)}</p>
                    </div>
                  ))}
                  {!selectedAuction.bids.length && <p className="auction-bids__empty">No bids yet. Be the first.</p>}
                </div>
              </div>

              <form className="auction-bidform" onSubmit={handlePlaceBid}>
                <div className="auction-bidform__inputs">
                  {selectedAuction && (
                    <input type="hidden" value={calcMinBid(selectedAuction)} readOnly />
                  )}
                  <label>
                    {(() => {
                      const min = calcMinBid(selectedAuction);
                      return <>Your bid (min {formatPrice(min)})</>;
                    })()}
                    <input
                      type="number"
                      min={calcMinBid(selectedAuction)}
                      step={100}
                      placeholder="Enter your bid"
                      value={bidAmount === '' ? '' : bidAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBidAmount(val === '' ? '' : Number(val));
                      }}
                      disabled={!selectedAuction.hasStarted || selectedAuction.hasEnded || placingBid}
                    />
                  </label>
                  {(() => {
                    const min = calcMinBid(selectedAuction);
                    const isBelow = bidAmount !== '' && Number(bidAmount) < min;
                    return (
                      <>
                        {isBelow && (
                          <p className="auction-bidform__error">
                            Minimum bid is {formatPrice(min)}. Increase your bid to continue.
                          </p>
                        )}
                        <p className="auction-bidform__hint">Default increments are +€300 above the current bid.</p>
                      </>
                    );
                  })()}
                </div>
                <button
                  type="submit"
                  className="auction-bidform__submit"
                  disabled={
                    !selectedAuction.hasStarted ||
                    selectedAuction.hasEnded ||
                    placingBid ||
                    !user ||
                    (bidAmount !== '' && Number(bidAmount) < calcMinBid(selectedAuction))
                  }
                  title={!user ? 'Log in to place a bid' : undefined}
                >
                  {placingBid ? 'Placing bid...' : 'Place bid'}
                </button>
                {!selectedAuction.hasStarted && (
                  <button
                    type="button"
                    className="auction-bidform__submit secondary"
                    onClick={() => navigate(`/auction/${selectedAuction.carId}`)}
                    aria-label="View car details"
                  >
                    View car details
                  </button>
                )}
                {!user && <p className="auction-bidform__auth">Log in as an owner to place bids.</p>}
              </form>
            </div>
          </section>
        )}
      </div>
      {lightboxIndex !== null && galleryImages[lightboxIndex] && (
        <div
          className="auction-lightbox"
          onClick={() => setLightboxIndex(null)}
          role="button"
          tabIndex={0}
          aria-label="Close image"
        >
          <button
            className="auction-lightbox__close"
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            ×
          </button>
          {galleryImages.length > 1 && (
            <>
              <button
                className="auction-lightbox__nav prev"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev === null ? null : (prev - 1 + galleryImages.length) % galleryImages.length
                  );
                }}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                className="auction-lightbox__nav next"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) =>
                    prev === null ? null : (prev + 1) % galleryImages.length
                  );
                }}
                aria-label="Next image"
              >
                ›
              </button>
              <div className="auction-lightbox__counter">
                {lightboxIndex + 1} / {galleryImages.length}
              </div>
            </>
          )}
          <div
            className="auction-lightbox__image-wrap"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              if (galleryImages.length <= 1) return;
              setModalDragStart(e.clientX);
              setModalDragOffset(0);
              setModalIsDragging(true);
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!modalIsDragging || modalDragStart === null) return;
              setModalDragOffset(e.clientX - modalDragStart);
            }}
            onPointerUp={(e) => {
              if (!modalIsDragging || modalDragStart === null) return;
              const delta = modalDragOffset;
              if (delta > 50) {
                setLightboxIndex((prev) =>
                  prev === null ? null : (prev - 1 + galleryImages.length) % galleryImages.length
                );
              } else if (delta < -50) {
                setLightboxIndex((prev) =>
                  prev === null ? null : (prev + 1) % galleryImages.length
                );
              }
              setModalDragStart(null);
              setModalIsDragging(false);
              setModalDragOffset(0);
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={(e) => {
              setModalDragStart(null);
              setModalIsDragging(false);
              setModalDragOffset(0);
              (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            }}
            style={{
              cursor: galleryImages.length > 1 ? (modalIsDragging ? 'grabbing' : 'grab') : 'default',
            }}
          >
            <img
              src={galleryImages[lightboxIndex]}
              alt="Full size"
              style={{
                transform: `translateX(${modalDragOffset}px)`,
                transition: modalIsDragging ? 'none' : 'transform 0.25s ease',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </main>
  );
};
