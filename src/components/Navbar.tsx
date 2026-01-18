import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CarFrontIcon, CloseIcon, GlobeIcon, LogOutIcon, MenuIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import { features } from '../config/features';
import type { Language } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import './Navbar.css';

type OwnerNavItem =
  | { type: 'link'; to: string; label: string; tab: string }
  | { type: 'action'; id: 'logout'; label: string };

type PublicNavItem = { to: string; key?: string; label?: string };

export const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const { language, setLanguage, t, languageLabels } = useLanguage();
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { brandName } = useBrand();
  const pathParts = useMemo(() => location.pathname.split('/').filter(Boolean), [location.pathname]);
  const isSellerSlug = useMemo(() => {
    if (pathParts[0] !== 'cars' || !pathParts[1]) return false;
    const slug = pathParts[1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return !uuidRegex.test(slug);
  }, [pathParts]);
  const isAuctionPage = location.pathname.startsWith('/auctions') || location.pathname.startsWith('/auction/');

  const isOwnerDashboard = location.pathname.startsWith('/dashboard');
  const ownerLinks = useMemo<OwnerNavItem[]>(() => {
    if (!isOwnerDashboard) return [];
    const base: OwnerNavItem[] = [
      { type: 'link', to: '/dashboard/cars', tab: 'cars', label: t('dashboard.tabs.cars') },
      { type: 'link', to: '/dashboard/profile', tab: 'profile', label: t('dashboard.tabs.profile') },
    ];
    if (user?.profileType === 'rent') {
      base.splice(1, 0, {
        type: 'link',
        to: '/dashboard/reservations',
        tab: 'reservations',
        label: t('dashboard.tabs.reservations'),
      });
    } else if (user?.profileType === 'buy' && features.auctions) {
      base.splice(1, 0, {
        type: 'link',
        to: '/dashboard/auctions',
        tab: 'auctions',
        label: 'Auctions',
      });
    }
    base.push({ type: 'action', id: 'logout', label: t('dashboard.tabs.logout') });
    return base;
  }, [isOwnerDashboard, t, user?.profileType]);

  const publicLinks = useMemo<PublicNavItem[]>(() => {
    if (isSellerSlug) {
      return [{ to: '/', key: 'nav.home' }];
    }
    const links: PublicNavItem[] = [
      { to: '/', key: 'nav.home' },
      ...(features.rent ? [{ to: '/rent', key: 'nav.rent' as const }] : []),
      ...(features.buy ? [{ to: '/buy', key: 'nav.buy' as const }] : []),
      ...(features.auctions ? [{ to: '/auctions', label: 'Auctions' }] : []),
      { to: '/favorites', key: 'nav.favorites' },
      { to: '/about', key: 'nav.about' },
      { to: '/contact', key: 'nav.contact' },
    ];
    return links;
  }, [isSellerSlug]);

  const linksToRender = isOwnerDashboard ? ownerLinks : publicLinks;
  const logoTo = isSellerSlug
    ? `${location.pathname}${location.search ?? ''}`
    : isOwnerDashboard
      ? '/dashboard/cars'
      : '/';

  const languageNames = useMemo<Record<Language, string>>(
    () => ({
      en: 'English',
      it: 'Italiano',
      sq: 'Shqip',
      el: 'Ελληνικά',
    }),
    []
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!langMenuRef.current || !target) return;
      if (!langMenuRef.current.contains(target)) setLangOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLangOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const next = window.scrollY > 10;
      setIsCompact(next);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const brandParts = useMemo(() => {
    const raw = brandName?.trim();
    if (!raw) return null;
    const words = raw.replace(/[-_]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    if (words.length === 1) {
      return { base: words[0].toLowerCase(), accent: '' };
    }
    const accent = words[words.length - 1].toLowerCase();
    const base = words.slice(0, -1).join('').toLowerCase();
    return { base, accent };
  }, [brandName]);

  return (
    <header className={`navbar ${isCompact ? 'navbar--compact' : ''} ${isAuctionPage ? 'navbar--auction' : ''}`}>
      <NavLink
        to={logoTo}
        className="navbar__logo"
        onClick={(e) => {
          if (isSellerSlug) {
            e.preventDefault();
            return;
          }
          setOpen(false);
        }}
      >
        <span className="navbar__icon">
          <CarFrontIcon size={22} />
        </span>
        <span className="navbar__text">
          {brandParts ? (
            <>
              {brandParts.base}
              {brandParts.accent ? <span className="navbar__dot">{brandParts.accent}</span> : null}
            </>
          ) : (
            <>
              daily<span className="navbar__dot">drive</span>
            </>
          )}
        </span>
      </NavLink>
      <nav className={`navbar__links ${open ? 'is-open' : ''}`}>
        {linksToRender.map((link) => {
          if (isOwnerDashboard) {
            const ownerItem = link as OwnerNavItem;
            if (ownerItem.type === 'action') {
              return (
                <button
                  key={`action-${ownerItem.id}`}
                  type="button"
                  className="navbar__link navbar__link--button navbar__link--logout"
                  onClick={() => {
                    setOpen(false);
                    setLangOpen(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                >
                  <LogOutIcon size={16} stroke="currentColor" />
                  <span>{ownerItem.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={ownerItem.to}
                to={ownerItem.to}
                className={({ isActive }) => `navbar__link ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  setOpen(false);
                  setLangOpen(false);
                }}
              >
                {ownerItem.label}
              </NavLink>
            );
          }

          const item = link as PublicNavItem;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `navbar__link ${isActive ? 'is-active' : ''}`}
              end={item.to === '/'}
              onClick={() => {
                setOpen(false);
                setLangOpen(false);
              }}
            >
              {item.label ?? (item.key ? t(item.key) : '')}
            </NavLink>
          );
        })}

        <div className="navbar__lang-dropdown" ref={langMenuRef}>
          <button
            className="navbar__lang-button"
            type="button"
            aria-label={t('language.label')}
            aria-haspopup="menu"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((v) => !v)}
          >
            <GlobeIcon size={18} />
            <span className="navbar__lang-code">{languageLabels[language]}</span>
          </button>
          {langOpen && (
            <div className="navbar__lang-popover" role="menu" aria-label={t('language.label')}>
              {(Object.keys(languageLabels) as Language[]).map((code) => (
                <button
                  key={code}
                  className={`navbar__lang-item ${code === language ? 'is-active' : ''}`}
                  type="button"
                  role="menuitemradio"
                  aria-checked={code === language}
                  onClick={() => {
                    setLanguage(code);
                    setLangOpen(false);
                    setOpen(false);
                  }}
                >
                  <span className="navbar__lang-item-code">{languageLabels[code]}</span>
                  <span className="navbar__lang-item-name">{languageNames[code]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="navbar__actions">
        <button
          className="navbar__toggle"
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon size={18} /> : <MenuIcon size={20} />}
        </button>
      </div>
    </header>
  );
};
