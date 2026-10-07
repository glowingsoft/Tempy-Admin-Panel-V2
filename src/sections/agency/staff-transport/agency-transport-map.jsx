import { AgencyGoogleShuttleMap, isGoogleMapsConfigured } from './agency-google-shuttle-map';
import { AgencyLeafletShuttleMap } from './agency-leaflet-shuttle-map';

// ----------------------------------------------------------------------

/**
 * Real Google Maps when `VITE_GOOGLE_MAPS_API_KEY` is set.
 * Otherwise Leaflet street tiles (Google Maps–style roads/buildings, zoom/pan).
 * Never uses the old schematic/SVG fallback.
 */
export function AgencyTransportMap(props) {
  if (isGoogleMapsConfigured()) {
    return <AgencyGoogleShuttleMap {...props} />;
  }

  return <AgencyLeafletShuttleMap {...props} />;
}
