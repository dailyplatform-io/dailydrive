import React from 'react';
import './MapEmbed.css';

interface MapEmbedProps {
  /** Latitude coordinate */
  lat?: number;
  /** Longitude coordinate */  
  lng?: number;
  /** Map height in pixels */
  height?: number;
  /** Map type - 'google' for Google Maps embed, 'osm' for OpenStreetMap */
  type?: 'google' | 'osm';
  /** Zoom level (for Google Maps) */
  zoom?: number;
  /** Show marker on the map */
  showMarker?: boolean;
  /** Map title for accessibility */
  title?: string;
  /** Optional link to open in external maps app */
  showOpenLink?: boolean;
  /** Text for the open link */
  openLinkText?: string;
  /** Custom styling class */
  className?: string;
}

export const MapEmbed: React.FC<MapEmbedProps> = ({
  lat,
  lng,
  height = 260,
  type = 'google',
  zoom = 16,
  showMarker = true,
  title = 'Map location',
  showOpenLink = false,
  openLinkText = 'Open in Maps',
  className = '',
}) => {
  // Default to Tirana coordinates if no coordinates provided
  const mapLat = lat ?? 41.3275;
  const mapLng = lng ?? 19.8187;

  const getEmbedUrl = () => {
    if (type === 'google') {
      if (showMarker) {
        return `https://www.google.com/maps?q=${encodeURIComponent(`${mapLat},${mapLng}`)}&z=${zoom}&output=embed`;
      } else {
        return `https://www.google.com/maps?q=${encodeURIComponent(`${mapLat},${mapLng}`)}&z=${zoom}&output=embed&layer=roadmap`;
      }
    } else {
      // OpenStreetMap embed
      const bbox = 0.01;
      const marker = showMarker ? `&marker=${mapLat}%2C${mapLng}` : '';
      return `https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - bbox}%2C${mapLat - bbox}%2C${mapLng + bbox}%2C${mapLat + bbox}&layer=mapnik${marker}`;
    }
  };

  const getOpenUrl = () => {
    if (type === 'google') {
      return `https://www.google.com/maps?q=${mapLat},${mapLng}`;
    } else {
      return `https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLng}&zoom=${zoom}`;
    }
  };

  return (
    <div className={`map-embed ${className}`}>
      <iframe
        src={getEmbedUrl()}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        title={title}
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {showOpenLink && (
        <a
          className="map-embed__link"
          href={getOpenUrl()}
          target="_blank"
          rel="noreferrer"
        >
          {openLinkText}
        </a>
      )}
    </div>
  );
};