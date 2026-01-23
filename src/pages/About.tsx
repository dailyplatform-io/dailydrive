import './StaticPage.css';
import './About.css';
import { useLanguage } from '../context/LanguageContext';
import { features } from '../config/features';
import { MapEmbed } from '../components/MapEmbed';

export const About: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="static-page about-page">
      <h2>{t('about.title')}</h2>
      <p>{t('about.lead')}</p>

      {!features.rent && (
        <section className="about-banner">
          <div className="about-banner__content">
            <span className="about-banner__badge">New</span>
            <div>
              <p className="about-banner__title">Renting is coming soon</p>
              <p className="about-banner__body">DailyDrive rentals are launching soon. Stay tuned.</p>
            </div>
          </div>
        </section>
      )}

      <div className="about-grid">
        <section className="about-card">
          <h3>{t('about.whatWeDo')}</h3>
          <p className="about-muted">{t('about.whatWeDo.lead')}</p>

          <div className="about-stats">
            <div className="about-stat">
              <p className="about-stat__value">{t('about.stat.fast')}</p>
              <p className="about-stat__label">{t('about.stat.fastLabel')}</p>
            </div>
            <div className="about-stat">
              <p className="about-stat__value">{t('about.stat.clear')}</p>
              <p className="about-stat__label">{t('about.stat.clearLabel')}</p>
            </div>
            <div className="about-stat">
              <p className="about-stat__value">{t('about.stat.safe')}</p>
              <p className="about-stat__label">{t('about.stat.safeLabel')}</p>
            </div>
          </div>

          <ul className="about-list">
            <li>{t('about.bullets.1')}</li>
            <li>{t('about.bullets.2')}</li>
            <li>{t('about.bullets.3')}</li>
          </ul>
        </section>

        <section className="about-card about-card--map" aria-label={t('about.where.title')}>
          <MapEmbed
            lat={41.3275}
            lng={19.8187}
            height={340}
            title="Tirana map"
            showOpenLink={false}
          />
        </section>
      </div>

      <div className="about-grid about-grid--secondary">
        <section className="about-card">
          <h3>{t('about.how.title')}</h3>
          <ol className="about-steps">
            <li>
              <strong>{t('about.how.1.title')}</strong>
              <span className="about-muted">{t('about.how.1.body')}</span>
            </li>
            <li>
              <strong>{t('about.how.2.title')}</strong>
              <span className="about-muted">{t('about.how.2.body')}</span>
            </li>
          </ol>
        </section>

        <section className="about-card about-card--contact">
          <div className="about-contact-head">
            <span className="about-contact-tag about-contact-tag--left">{t('common.contact')}</span>
            <p className="about-muted">{t('contact.lead')}</p>
          </div>
          <div className="about-contact-grid">
            <a className="about-contact-card" href="mailto:dailydrive.platform@gmail.com">
              <span className="about-contact-label">{t('contact.support.email')}</span>
              <span className="about-contact-value">dailydrive.platform@gmail.com</span>
              <span className="about-contact-action">{t('common.sendMessage')}</span>
            </a>
            <a className="about-contact-card" href="tel:+355685555104">
              <span className="about-contact-label">{t('contact.support.phone')}</span>
              <span className="about-contact-value">+355685555104</span>
              <span className="about-contact-action">{t('common.contact')}</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
