
import { useState, useEffect } from 'react';
import type { Location } from '../types';

export const useGeolocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('La geolocalización no es compatible con tu navegador.');
      setIsLoading(false);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setIsLoading(false);
    };

    const onError = (error: GeolocationPositionError) => {
      setError(`No se pudo obtener la ubicación: ${error.message}`);
      setIsLoading(false);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, isLoading, error };
};