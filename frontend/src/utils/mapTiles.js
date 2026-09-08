/**
 * Watermark-Free Map Tile Providers for Leaflet
 * Replaces legacy CARTO basemaps which started enforcing API keys in August 2026.
 * All providers here require NO API key and have ZERO watermarks.
 */

export const MAP_TILE_PROVIDERS = {
  satellite: {
    id: "satellite",
    name: "Satellite (Space / Remote Sensing)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics, Maxar'
  },
  dark: {
    id: "dark",
    name: "Dark Tactical Canvas",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
  },
  osm: {
    id: "osm",
    name: "OpenStreetMap Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};
