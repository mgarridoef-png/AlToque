export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface GroundingSource {
  maps?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  role: Role;
  text: string;
  id: string;
  sources?: GroundingSource[];
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  mode: 'driving' | 'walking' | 'transit' | string;
  polyline: Coordinates[];
}

export interface MapData {
  destination: (Coordinates & { name: string }) | null;
  routes: RouteInfo[];
}

export interface TravelInfo {
  summary: string;
  destination: (Coordinates & { name: string });
  routes: RouteInfo[];
}