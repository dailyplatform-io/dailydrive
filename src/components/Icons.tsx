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
