import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: t('footer.company.about'), href: '/about', enabled: true },
      { label: t('footer.company.contact'), href: '/contact', enabled: false },
      { label: t('footer.company.careers'), href: '/careers', enabled: false },
      { label: t('footer.company.blog'), href: '/blog', enabled: false },
    ],
    resources: [
      { label: t('footer.resources.faq'), href: '/faq', enabled: false },
      { label: t('footer.resources.help'), href: '/help', enabled: false },
      { label: t('footer.resources.support'), href: '/support', enabled: false },
      { label: t('footer.resources.guide'), href: '/guide', enabled: false },
    ],
    legal: [
      { label: t('footer.legal.terms'), href: '/terms', enabled: false },
      { label: t('footer.legal.privacy'), href: '/privacy', enabled: false },
      { label: t('footer.legal.cookies'), href: '/cookies', enabled: false },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: '#', label: 'Facebook' },
    { name: 'Twitter', href: '#', label: 'Twitter' },
    { name: 'Instagram', href: '#', label: 'Instagram' },
    { name: 'LinkedIn', href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__grid">
          {/* Brand Section */}
          <div className="footer__brand">
            <h3 className="footer__brand-name">DailyDrive</h3>
            <p className="footer__brand-tagline">{t('footer.tagline')}</p>
            <div className="footer__social">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="footer__social-link footer__social-link--disabled"
                  aria-label={social.label}
                  onClick={(e) => e.preventDefault()}
                >
                  {social.name[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div className="footer__section">
            <h4 className="footer__section-title">{t('footer.company.title')}</h4>
            <ul className="footer__links">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  {link.enabled ? (
                    <a href={link.href} className="footer__link">
                      {link.label}
                    </a>
                  ) : (
                    <span className="footer__link footer__link--disabled">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="footer__section">
            <h4 className="footer__section-title">{t('footer.resources.title')}</h4>
            <ul className="footer__links">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  {link.enabled ? (
                    <a href={link.href} className="footer__link">
                      {link.label}
                    </a>
                  ) : (
                    <span className="footer__link footer__link--disabled">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="footer__section">
            <h4 className="footer__section-title">{t('footer.legal.title')}</h4>
            <ul className="footer__links">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  {link.enabled ? (
                    <a href={link.href} className="footer__link">
                      {link.label}
                    </a>
                  ) : (
                    <span className="footer__link footer__link--disabled">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © DailyPlatform {currentYear}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};
