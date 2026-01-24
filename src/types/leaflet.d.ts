declare module 'leaflet' {
  export type LatLngExpression = [number, number];
  export type LeafletMouseEvent = { latlng: { lat: number; lng: number } };
  export type Map = any;
  export type Marker = any;
  export type TileLayer = any;

  export class Icon {
    constructor(options?: any);
  }

  const L: {
    Icon: typeof Icon;
  };

  export default L;
}
