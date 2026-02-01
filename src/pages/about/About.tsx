import { useLanguage } from '../../context/LanguageContext';
import { MapEmbed } from '../../components/MapEmbed';
import { Zap, Shield, Search, Mail, Phone, MapPin, CheckCircle, Car } from 'lucide-react';
import '../StaticPage.css';
import './About.css';

export const About: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-hero__badge">
            {t('about.title')}
          </span>
          <h1 className="about-hero__title">
            {t('about.lead')}
          </h1>
        </div>
      </section>

      {/* Welcome Banner */}
      <section className="about-banner">
        <div className="about-banner__content">
          <div className="about-banner__icon-wrapper">
            <Car className="about-banner__icon" size={32} />
          </div>
          <div className="about-banner__text">
            <div className="about-banner__header">
              <span className="about-banner__badge">🚀 Welcome to DailyDrive</span>
              <h3 className="about-banner__title">Your trusted car marketplace in Albania</h3>
            </div>
            <p className="about-banner__body">Revolutionizing how people buy and rent cars in Tirana. Fast, transparent, and reliable service for everyone.</p>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="about-section">
        <div className="about-section__header">
          <h2 className="about-section__title">{t('about.whatWeDo')}</h2>
          <p className="about-section__subtitle">{t('about.whatWeDo.lead')}</p>
        </div>

        <div className="about-stats-grid">
          <div className="about-stat-card">
            <div className="about-stat-card__icon about-stat-card__icon--blue">
              <Zap size={24} />
            </div>
            <h3 className="about-stat-card__title">{t('about.stat.fast')}</h3>
            <p className="about-stat-card__desc">{t('about.stat.fastLabel')}</p>
          </div>

          <div className="about-stat-card">
            <div className="about-stat-card__icon about-stat-card__icon--green">
              <Shield size={24} />
            </div>
            <h3 className="about-stat-card__title">{t('about.stat.safe')}</h3>
            <p className="about-stat-card__desc">{t('about.stat.safeLabel')}</p>
          </div>

          <div className="about-stat-card">
            <div className="about-stat-card__icon about-stat-card__icon--purple">
              <Search size={24} />
            </div>
            <h3 className="about-stat-card__title">{t('about.stat.clear')}</h3>
            <p className="about-stat-card__desc">{t('about.stat.clearLabel')}</p>
          </div>
        </div>

        <div className="about-features-list">
          <div className="about-feature-item">
            <CheckCircle size={20} className="about-feature-item__icon" />
            <span>{t('about.bullets.1')}</span>
          </div>
          <div className="about-feature-item">
            <CheckCircle size={20} className="about-feature-item__icon" />
            <span>{t('about.bullets.2')}</span>
          </div>
          <div className="about-feature-item">
            <CheckCircle size={20} className="about-feature-item__icon" />
            <span>{t('about.bullets.3')}</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="about-section about-section--alt">
        <div className="about-section__header">
          <h2 className="about-section__title">{t('about.how.title')}</h2>
        </div>

        <div className="about-steps-grid">
          <div className="about-step-card">
            <div className="about-step-card__number">01</div>
            <h3 className="about-step-card__title">{t('about.how.1.title')}</h3>
            <p className="about-step-card__desc">{t('about.how.1.body')}</p>
          </div>

          <div className="about-step-card">
            <div className="about-step-card__number">02</div>
            <h3 className="about-step-card__title">{t('about.how.2.title')}</h3>
            <p className="about-step-card__desc">{t('about.how.2.body')}</p>
          </div>
        </div>
      </section>

      {/* Location & Contact Section */}
      <section className="about-section">
        <div className="about-dual-grid">
          {/* Location Card */}
          <div className="about-location-card">
            <div className="about-location-card__header">
              <MapPin size={24} className="about-location-card__icon" />
              <div>
                <h2 className="about-location-card__title">{t('about.where.title')}</h2>
                <p className="about-location-card__subtitle">{t('about.where.kicker')}</p>
              </div>
            </div>

            <div className="about-location-card__map">
              <MapEmbed
                lat={41.3275}
                lng={19.8187}
                height={300}
                title="Tirana map"
                showOpenLink={false}
              />
            </div>

            <div className="about-location-card__address">
              <p className="about-location-card__address-line">{t('about.where.address')}</p>
              <p className="about-location-card__address-city">{t('about.where.city')}</p>
            </div>
          </div>

          {/* Contact Card */}
          <div className="about-contact-card">
            <div className="about-contact-card__header">
              <span className="about-contact-badge">{t('common.contact')}</span>
              <h2 className="about-contact-card__title">{t('contact.lead')}</h2>
            </div>

            <div className="about-contact-methods">
              <a className="about-contact-method" href="mailto:dailydrive.platform@gmail.com">
                <div className="about-contact-method__icon">
                  <Mail size={20} />
                </div>
                <div className="about-contact-method__content">
                  <span className="about-contact-method__label">{t('contact.support.email')}</span>
                  <span className="about-contact-method__value">dailydrive.platform@gmail.com</span>
                </div>
                <span className="about-contact-method__action">{t('common.sendMessage')}</span>
              </a>

              <a className="about-contact-method" href="tel:+355685555104">
                <div className="about-contact-method__icon">
                  <Phone size={20} />
                </div>
                <div className="about-contact-method__content">
                  <span className="about-contact-method__label">{t('contact.support.phone')}</span>
                  <span className="about-contact-method__value">+355685555104</span>
                </div>
                <span className="about-contact-method__action">{t('common.contact')}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
