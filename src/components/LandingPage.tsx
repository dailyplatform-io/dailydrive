import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { features } from '../config/features';
import { Car, Shield, Zap, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { LandingHeader } from './LandingHeader';
import { Footer } from './Footer';
import './LandingPage.css';

interface LandingPageProps {
  totalCars: number;
  rentCars: number;
  buyCars: number;
  onNavigateToRent: () => void;
  onNavigateToBuy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  totalCars,
  rentCars,
  buyCars,
  onNavigateToRent,
  onNavigateToBuy,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const rentEnabled = features.rent;
  const buyEnabled = features.buy;

  const featuresList = [
    {
      icon: Shield,
      title: t('landing.features.verified.title'),
      description: t('landing.features.verified.desc'),
    },
    {
      icon: Zap,
      title: t('landing.features.instant.title'),
      description: t('landing.features.instant.desc'),
    },
    {
      icon: Users,
      title: t('landing.features.support.title'),
      description: t('landing.features.support.desc'),
    },
  ];

  const howItWorksSteps = [
    {
      number: '01',
      title: t('landing.howItWorks.step1.title'),
      description: t('landing.howItWorks.step1.desc'),
    },
    {
      number: '02',
      title: t('landing.howItWorks.step2.title'),
      description: t('landing.howItWorks.step2.desc'),
    },
    {
      number: '03',
      title: t('landing.howItWorks.step3.title'),
      description: t('landing.howItWorks.step3.desc'),
    },
  ];

  const stats = [
    {
      value: `${totalCars}+`,
      label: t('landing.stats.cars'),
    },
    {
      value: '100%',
      label: t('landing.stats.verified'),
    },
    {
      value: '24/7',
      label: t('landing.stats.support'),
    },
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <TrendingUp size={16} />
            <span>{t('landing.hero.badge')}</span>
          </div>

          <h1 className="landing-hero__title">
            {t(rentEnabled && buyEnabled ? 'landing.hero.title' : 'landing.hero.title.general')}
          </h1>

          <p className="landing-hero__subtitle">
            {t(rentEnabled && buyEnabled ? 'landing.hero.subtitle' : 'landing.hero.subtitle.general')}
          </p>

          <div className="landing-hero__actions">
            {rentEnabled && (
              <button
                className="landing-button landing-button--primary"
                onClick={onNavigateToRent}
              >
                {t('landing.hero.browseRentals')}
              </button>
            )}
            {buyEnabled && (
              <button
                className="landing-button landing-button--secondary"
                onClick={onNavigateToBuy}
              >
                {t('landing.hero.shopToOwn')}
              </button>
            )}
          </div>

          {/* Stats Row */}
          <div className="landing-hero__stats">
            {stats.map((stat, index) => (
              <div key={index} className="landing-stat">
                <div className="landing-stat__value">{stat.value}</div>
                <div className="landing-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero__visual">
          <div className="landing-hero__card landing-hero__card--1">
            <Car size={32} className="landing-hero__card-icon" />
            <div>
              <div className="landing-hero__card-label">{t('landing.hero.card1.label')}</div>
              <div className="landing-hero__card-value">{totalCars}+</div>
            </div>
          </div>
          <div className="landing-hero__card landing-hero__card--2">
            <CheckCircle size={28} className="landing-hero__card-icon" />
            <div>
              <div className="landing-hero__card-label">{t('landing.hero.card2.label')}</div>
              <div className="landing-hero__card-value">{t('landing.hero.card2.value')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-section-header">
          <span className="landing-section-badge">{t('landing.features.badge')}</span>
          <h2 className="landing-section-title">{t('landing.features.title')}</h2>
          <p className="landing-section-subtitle">{t('landing.features.subtitle')}</p>
        </div>

        <div className="landing-features__grid">
          {featuresList.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="landing-feature-card">
                <div className="landing-feature-card__icon">
                  <Icon size={24} />
                </div>
                <h3 className="landing-feature-card__title">{feature.title}</h3>
                <p className="landing-feature-card__desc">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-how-it-works">
        <div className="landing-section-header">
          <span className="landing-section-badge">{t('landing.howItWorks.badge')}</span>
          <h2 className="landing-section-title">{t('landing.howItWorks.title')}</h2>
          <p className="landing-section-subtitle">{t('landing.howItWorks.subtitle')}</p>
        </div>

        <div className="landing-steps">
          {howItWorksSteps.map((step, index) => (
            <div key={index} className="landing-step">
              <div className="landing-step__number">{step.number}</div>
              <h3 className="landing-step__title">{step.title}</h3>
              <p className="landing-step__desc">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Service Cards Section */}
      {(rentEnabled || buyEnabled) && (
        <section className="landing-services">
          {rentEnabled && (
            <div className="landing-service-card landing-service-card--blue" onClick={onNavigateToRent}>
              <div className="landing-service-card__header">
                <span className="landing-service-card__badge">{t('landing.services.rent.badge')}</span>
                <h3 className="landing-service-card__title">{t('landing.services.rent.title')}</h3>
                <p className="landing-service-card__desc">{t('landing.services.rent.desc')}</p>
              </div>
              <div className="landing-service-card__footer">
                <span className="landing-service-card__count">{rentCars}+ {t('landing.services.cars')}</span>
                <span className="landing-service-card__arrow">→</span>
              </div>
            </div>
          )}

          {buyEnabled && (
            <div className="landing-service-card landing-service-card--green" onClick={onNavigateToBuy}>
              <div className="landing-service-card__header">
                <span className="landing-service-card__badge">{t('landing.services.buy.badge')}</span>
                <h3 className="landing-service-card__title">{t('landing.services.buy.title')}</h3>
                <p className="landing-service-card__desc">{t('landing.services.buy.desc')}</p>
              </div>
              <div className="landing-service-card__footer">
                <span className="landing-service-card__count">{buyCars}+ {t('landing.services.cars')}</span>
                <span className="landing-service-card__arrow">→</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta__content">
          <h2 className="landing-cta__title">{t('landing.cta.title')}</h2>
          <p className="landing-cta__subtitle">{t('landing.cta.subtitle')}</p>
          <div className="landing-cta__actions">
            {buyEnabled && (
              <button
                className="landing-button landing-button--primary landing-button--large"
                onClick={onNavigateToBuy}
              >
                {t('landing.cta.primary')}
              </button>
            )}
            <button
              className="landing-button landing-button--ghost landing-button--large"
              onClick={() => navigate('/about')}
            >
              {t('landing.cta.secondary')}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
