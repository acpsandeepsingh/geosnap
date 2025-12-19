export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface PhotoData {
  id: string;
  dataUrl: string;
  timestamp: number;
  location: LocationData;
  width: number;
  height: number;
}
