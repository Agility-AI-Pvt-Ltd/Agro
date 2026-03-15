import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LocationButton = ({ onLocationFound, onError }) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      onError?.("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        onLocationFound({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setLoading(false);
        let errorMsg = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out";
            break;
        }
        onError?.(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleGetLocation}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-[#2D5A3D]/20 text-[#2D5A3D] font-semibold hover:bg-[#2D5A3D]/5 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <MapPin className="w-5 h-5" />
      )}
      {t("Use My Current Location")}
    </button>
  );
};

export default LocationButton;
