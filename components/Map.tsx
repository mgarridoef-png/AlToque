import React, { useEffect, useRef } from 'react';
import type { Location, MapData, Coordinates } from '../types';

declare const L: any;

interface MapProps {
  userLocation: Location | null;
  mapData: MapData;
}

const ROUTE_COLORS = {
    driving: '#3b82f6', // blue-500
    walking: '#22c55e', // green-500
    transit: '#f97316', // orange-500
};

const translateMode = (mode: string): string => {
    switch (mode) {
        case 'driving': return 'Coche';
        case 'walking': return 'A pie';
        case 'transit': return 'Transporte Público';
        default: return mode;
    }
}

export const Map: React.FC<MapProps> = ({ userLocation, mapData }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const featureGroup = useRef<any>(null);

    useEffect(() => {
        if (mapRef.current && !mapInstance.current && userLocation) {
            mapInstance.current = L.map(mapRef.current).setView([userLocation.latitude, userLocation.longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
            featureGroup.current = L.layerGroup().addTo(mapInstance.current);
        }
    }, [userLocation]);

    useEffect(() => {
        if (!mapInstance.current || !featureGroup.current) return;
        
        featureGroup.current.clearLayers();
        
        const bounds: Coordinates[] = [];

        if (userLocation) {
            const userLatLng = { lat: userLocation.latitude, lng: userLocation.longitude };
            L.marker(userLatLng)
                .bindPopup('Tu Ubicación')
                .addTo(featureGroup.current);
            bounds.push(userLatLng);
        }

        if (mapData.destination) {
            L.marker([mapData.destination.lat, mapData.destination.lng])
                .bindPopup(`Destino: ${mapData.destination.name}`)
                .addTo(featureGroup.current);
            bounds.push(mapData.destination);
        }

        mapData.routes.forEach(route => {
            if (route.polyline && route.polyline.length > 0) {
                const latLngs = route.polyline.map(p => [p.lat, p.lng]);
                L.polyline(latLngs, { 
                    color: ROUTE_COLORS[route.mode as keyof typeof ROUTE_COLORS] || '#ffffff',
                    weight: 5,
                    opacity: 0.8
                })
                .bindPopup(`Ruta: ${translateMode(route.mode)}`)
                .addTo(featureGroup.current);
            }
        });

        if (bounds.length > 1) {
            mapInstance.current.fitBounds(L.latLngBounds(bounds.map(p => [p.lat, p.lng])), { padding: [50, 50] });
        } else if (userLocation) {
            mapInstance.current.setView([userLocation.latitude, userLocation.longitude], 13);
        }

    }, [userLocation, mapData]);

    return (
        <div className="h-full w-full bg-gray-800 relative">
            <div ref={mapRef} className="h-full w-full" />
            <div className="absolute bottom-2 right-2 bg-gray-900/70 backdrop-blur-sm text-white text-xs p-2 rounded-lg shadow-lg z-[1000]">
                <h3 className="font-bold mb-1">Leyenda</h3>
                <ul>
                    <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: ROUTE_COLORS.driving}}></div> Coche</li>
                    <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: ROUTE_COLORS.walking}}></div> A pie</li>
                    <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: ROUTE_COLORS.transit}}></div> T. Público</li>
                </ul>
            </div>
        </div>
    );
};