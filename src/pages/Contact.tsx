import { useLanguage } from '../context/LanguageContext';
import './Contact.css';

export const Contact: React.FC = () => {
  const { t } = useLanguage();
  return (
    <main className="contact-page">
      <header className="contact-hero">
        <div>
          <h2>{t('contact.title')}</h2>
          <p>{t('contact.lead')}</p>
        </div>
      </header>

      <section className="contact-grid">
        <form className="contact-card" onSubmit={(e) => e.preventDefault()}>
          <div className="contact-card__head">
            <p className="contact-card__title">{t('contact.form.title')}</p>
            <p className="contact-card__subtitle">{t('contact.form.subtitle')}</p>
          </div>

          <div className="contact-form">
            <label className="contact-field">
              <span>{t('contact.form.fullName')}</span>
              <input type="text" placeholder={t('contact.form.fullName.placeholder')} autoComplete="name" required />
            </label>

            <div className="contact-row">
              <label className="contact-field">
                <span>{t('contact.form.email')}</span>
                <input type="email" placeholder="you@example.com" autoComplete="email" required />
              </label>
              <label className="contact-field">
                <span>{t('contact.form.phoneOptional')}</span>
                <input type="tel" placeholder="+355 ..." autoComplete="tel" />
              </label>
            </div>

            <label className="contact-field">
              <span>{t('contact.form.reason')}</span>
              <select defaultValue="car">
                <option value="car">{t('contact.form.reason.car')}</option>
                <option value="buy">{t('contact.form.reason.buy')}</option>
                <option value="rent">{t('contact.form.reason.rent')}</option>
                <option value="partner">{t('contact.form.reason.partner')}</option>
                <option value="other">{t('contact.form.reason.other')}</option>
              </select>
            </label>

            <label className="contact-field">
              <span>{t('contact.form.message')}</span>
              <textarea
                placeholder={t('contact.form.message.placeholder')}
                rows={6}
                required
              />
            </label>

            <button className="contact-submit" type="submit">
              {t('common.sendMessage')}
            </button>

            <p className="contact-footnote">
              {t('contact.form.footnote')}
            </p>
          </div>
        </form>

        <aside className="contact-side">
          <div className="contact-card contact-card--info">
            <p className="contact-card__title">{t('contact.support.title')}</p>
            <div className="contact-kv">
              <p className="contact-kv__k">{t('contact.support.email')}</p>
              <p className="contact-kv__v">support@dailydrive.al</p>
            </div>
            <div className="contact-kv">
              <p className="contact-kv__k">{t('contact.support.phone')}</p>
              <a className="contact-kv__v contact-link" href="tel:+355685555104">
                +355685555104
              </a>
            </div>
            <div className="contact-kv">
              <p className="contact-kv__k">{t('contact.support.hours')}</p>
              <p className="contact-kv__v">{t('contact.support.hoursValue')}</p>
            </div>
          </div>

          <div className="contact-card contact-card--info">
            <p className="contact-card__title">{t('contact.showroom.title')}</p>
            <div className="contact-kv">
              <p className="contact-kv__k">{t('contact.showroom.address')}</p>
              <p className="contact-kv__v">Rruga Dëshmorët e Kombit, Tiranë 1001</p>
            </div>
            <div className="contact-kv">
              <p className="contact-kv__k">{t('contact.showroom.city')}</p>
              <p className="contact-kv__v">Tiranë, Albania</p>
            </div>
            <div className="contact-kv">
              <p className="contact-kv__k">{t('contact.showroom.visits')}</p>
              <p className="contact-kv__v">{t('contact.showroom.visitsValue')}</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};
