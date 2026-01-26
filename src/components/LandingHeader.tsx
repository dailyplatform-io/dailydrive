import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import './LandingHeader.css';

export const LandingHeader: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const navLinks = [
    { label: t('header.nav.home'), href: '#home', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: t('header.nav.features'), href: '#features', onClick: () => {
      const element = document.querySelector('.landing-features');
      element?.scrollIntoView({ behavior: 'smooth' });
    }},
    { label: t('header.nav.howItWorks'), href: '#how-it-works', onClick: () => {
      const element = document.querySelector('.landing-how-it-works');
      element?.scrollIntoView({ behavior: 'smooth' });
    }},
    { label: t('header.nav.about'), href: '/about', onClick: () => navigate('/about') },
  ];

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as 'en' | 'it' | 'sq' | 'el');
    setIsLangMenuOpen(false);
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLinkClick = (link: typeof navLinks[0]) => {
    link.onClick();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}>
      <div className="landing-header__container">
        {/* Logo */}
        <div className="landing-header__logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="landing-header__logo-icon">DD</div>
          <span className="landing-header__logo-text">DailyDrive</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="landing-header__nav">
          {navLinks.map((link, index) => (
            <button
              key={index}
              onClick={link.onClick}
              className="landing-header__nav-link"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="landing-header__actions">
          {/* Language Switcher */}
          <div className="landing-header__lang-switcher">
            <button
              className="landing-header__lang-trigger"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            >
              <Globe size={18} />
              <span className="landing-header__lang-current">{currentLang.flag}</span>
              <ChevronDown size={16} className={`landing-header__lang-chevron ${isLangMenuOpen ? 'is-open' : ''}`} />
            </button>

            {isLangMenuOpen && (
              <div className="landing-header__lang-menu">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`landing-header__lang-option ${language === lang.code ? 'is-active' : ''}`}
                  >
                    <span className="landing-header__lang-flag">{lang.flag}</span>
                    <span className="landing-header__lang-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button className="landing-header__cta" onClick={handleGetStarted}>
            {t('header.cta')}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="landing-header__mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="landing-header__mobile-menu">
          <nav className="landing-header__mobile-nav">
            {navLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => handleLinkClick(link)}
                className="landing-header__mobile-link"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="landing-header__mobile-actions">
            <button className="landing-header__mobile-cta" onClick={handleGetStarted}>
              {t('header.cta')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
