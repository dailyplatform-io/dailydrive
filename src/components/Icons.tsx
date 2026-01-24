import React from 'react';

type IconProps = { size?: number; className?: string; stroke?: string };

export const CarFrontIcon: React.FC<IconProps> = ({ size = 18, className, stroke = '#2f80ed' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 17v-5l2-5h12l2 5v5" />
    <path d="M16 17h2" />
    <path d="M6 17h2" />
    <path d="M6.5 12h11" />
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 21s-6.5-4.35-9-8a5.25 5.25 0 0 1 9-5.5A5.25 5.25 0 0 1 21 13c-2.5 3.65-9 8-9 8Z" />
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 16, className, stroke = '#f5a524' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ size = 14, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 21s-6-4.35-6-10a6 6 0 0 1 12 0c0 5.65-6 10-6 10Z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 16, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 16, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const NavigationIcon: React.FC<IconProps> = ({ size = 18, className, stroke = '#2f80ed' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 19 21 12 17 5 21 12 2" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 22, className, stroke = '#2f80ed' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3 9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5L12 3z" />
    <path d="m5 3-1 2-2 1 2 1 1 2 1-2 2-1-2-1-1-2z" />
    <path d="m19 14-1 2-2 1 2 1 1 2 1-2 2-1-2-1-1-2z" />
  </svg>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M20.52 3.49A11.91 11.91 0 0 0 12 0h-.01C5.37 0 .03 5.34 0 11.93a11.8 11.8 0 0 0 1.57 5.9L0 24l6.36-1.66a11.96 11.96 0 0 0 5.64 1.44h.01c6.6 0 11.95-5.34 12-11.93A11.9 11.9 0 0 0 20.52 3.49ZM12 21.8h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.77.98 1-3.67-.23-.38a9.83 9.83 0 0 1-1.49-5.22C2.12 6.43 6.45 2.1 11.99 2.1h.01a9.83 9.83 0 0 1 9.84 9.82c-.05 5.55-4.38 9.88-9.84 9.88Zm5.6-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.43 0 1.42 1.06 2.8 1.2 3 .15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.61.7.22 1.33.19 1.83.12.56-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35Z" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 16, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 20, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2c3.5 3 5.5 6.5 5.5 10S15.5 19 12 22c-3.5-3-5.5-6.5-5.5-10S8.5 5 12 2Z" />
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r="1" />
  </svg>
);

export const FacebookIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.06 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.2 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.31 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.26 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const LogInIcon: React.FC<IconProps> = ({ size = 18, className, stroke = 'currentColor' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);
