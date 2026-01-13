import './StaticPage.css';
import './About.css';
import { useLanguage } from '../context/LanguageContext';
import { MapEmbed } from '../components/MapEmbed';

export const About: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="static-page about-page">
      <h2>{t('about.title')}</h2>
      <p>{t('about.lead')}</p>

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

        <section className="about-card about-card--map" aria-label="Map of Tirana, Albania">
          <MapEmbed
            lat={41.3275}
            lng={19.8187}
            height={340}
            title="Tirana map"
            showOpenLink={true}
            openLinkText={t('common.openInMap')}
            className="map-embed--about"
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
            <li>
              <strong>{t('about.how.3.title')}</strong>
              <span className="about-muted">{t('about.how.3.body')}</span>
            </li>
          </ol>
        </section>

        <section className="about-card">
          <h3>{t('about.where.title')}</h3>
          <p className="about-muted">{t('about.where.kicker')}</p>
          <p className="about-strong">{t('about.where.address')}</p>
          <p className="about-muted">{t('about.where.city')}</p>
          <a
            className="about-link"
            href="https://www.google.com/maps?q=41.3275,19.8187&z=16"
            target="_blank"
            rel="noreferrer"
          >
            {t('common.openInMap')}
          </a>
        </section>
      </div>
    </div>
  );
};
