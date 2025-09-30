# Comprehensive 3D Interactive Campus Map Implementation Guide

## 1. Technical Architecture Overview

### System Design

The 3D campus map will be built using a multi-layered architecture:

```
┌─────────────────────────────────────────┐
│         Frontend (Client Side)          │
│  - HTML5/CSS3/JavaScript               │
│  - Mapbox GL JS (3D Rendering)         │
│  - Turf.js (Geospatial Operations)     │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Core Services Layer             │
│  - Mapbox Services (Maps, Directions)   │
│  - Geolocation API                      │
│  - WebSocket (Real-time tracking)       │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Data Layer                      │
│  - GeoJSON (Buildings, Routes)          │
│  - Campus Database (MongoDB/PostgreSQL) │
│  - Real-time Data (Firebase/Socket.io)  │
└─────────────────────────────────────────┘
```

### Required Technologies & APIs:

- **Mapbox GL JS**: 3D map rendering and visualization
- **Mapbox Directions API**: Route calculation and navigation
- **Mapbox Geocoding API**: Search functionality
- **Browser Geolocation API**: GPS tracking
- **Turf.js**: Advanced geospatial calculations
- **WebSocket/Socket.io**: Real-time location sharing
- **IndexedDB**: Offline data caching

## 2. Step-by-Step Implementation Plan

### Phase 1: Environment Setup

1. Create project structure
2. Set up Mapbox account and obtain API keys
3. Initialize npm project and install dependencies
4. Create basic HTML structure

### Phase 2: Basic 3D Map

1. Implement base map with 3D terrain
2. Add navigation controls
3. Set up initial camera positioning
4. Implement basic building extrusions

### Phase 3: Core Features

1. GPS tracking and live position
2. Search functionality
3. Direction services
4. Route visualization

### Phase 4: Advanced Features

1. Real-time location sharing
2. Campus-specific overlays
3. Accessibility routes
4. Performance optimization

### Phase 5: Testing & Deployment

1. Unit testing
2. Integration testing
3. Performance testing
4. Deployment setup

## 3. Core Code Implementation

### Complete HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>3D Campus Navigator - University of Ruhuna</title>

    <!-- Mapbox GL JS -->
    <link
      href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
      rel="stylesheet"
    />
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>

    <!-- Mapbox GL Directions -->
    <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.1/mapbox-gl-directions.js"></script>
    <link
      rel="stylesheet"
      href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.1/mapbox-gl-directions.css"
      type="text/css"
    />

    <!-- Mapbox GL Geocoder -->
    <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
    <link
      rel="stylesheet"
      href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css"
      type="text/css"
    />

    <!-- Turf.js for geospatial operations -->
    <script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>

    <!-- Custom Styles -->
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <!-- Map Container -->
    <div id="map"></div>

    <!-- Control Panel -->
    <div class="control-panel">
      <div class="panel-header">
        <h2>Campus Navigator</h2>
        <button id="toggle-3d" class="btn-3d">Toggle 3D</button>
      </div>

      <!-- Search Box -->
      <div id="search-container"></div>

      <!-- Quick Access Locations -->
      <div class="quick-locations">
        <h3>Quick Access</h3>
        <div id="location-buttons"></div>
      </div>

      <!-- Current Location Info -->
      <div class="location-info">
        <h3>Current Status</h3>
        <div id="current-location">Getting location...</div>
        <div id="travel-info"></div>
      </div>

      <!-- Feature Toggles -->
      <div class="feature-toggles">
        <label>
          <input type="checkbox" id="toggle-tracking" checked />
          <span>Live Tracking</span>
        </label>
        <label>
          <input type="checkbox" id="toggle-buildings" checked />
          <span>Show Buildings</span>
        </label>
        <label>
          <input type="checkbox" id="toggle-accessibility" />
          <span>Accessibility Routes</span>
        </label>
        <label>
          <input type="checkbox" id="toggle-parking" />
          <span>Show Parking</span>
        </label>
      </div>

      <!-- Share Location -->
      <div class="share-section">
        <button id="share-location" class="btn-primary">
          Share My Location
        </button>
        <div id="share-code"></div>
      </div>
    </div>

    <!-- Building Info Modal -->
    <div id="building-modal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2 id="building-name"></h2>
        <div id="building-details"></div>
        <button id="navigate-to-building" class="btn-primary">
          Navigate Here
        </button>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div id="loading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Loading map data...</p>
    </div>

    <script src="campus-map.js"></script>
  </body>
</html>
```

### CSS Styles (styles.css)

```css
/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

/* Map Container */
#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100vh;
}

/* Control Panel */
.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 20px;
  width: 320px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.panel-header h2 {
  color: #1a73e8;
  font-size: 1.5rem;
}

/* Buttons */
.btn-3d,
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-3d:hover,
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Search Container */
#search-container {
  margin-bottom: 20px;
}

.mapboxgl-ctrl-geocoder {
  max-width: none !important;
  width: 100% !important;
  box-shadow: none !important;
  border: 2px solid #e0e0e0 !important;
  border-radius: 8px !important;
}

/* Quick Locations */
.quick-locations {
  margin-bottom: 20px;
}

.quick-locations h3 {
  color: #333;
  font-size: 1rem;
  margin-bottom: 10px;
}

#location-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.location-btn {
  padding: 8px 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.location-btn:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

/* Location Info */
.location-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.location-info h3 {
  color: #333;
  font-size: 1rem;
  margin-bottom: 10px;
}

#current-location,
#travel-info {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Feature Toggles */
.feature-toggles {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.feature-toggles label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.feature-toggles input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Share Section */
.share-section {
  padding-top: 15px;
  border-top: 2px solid #e0e0e0;
}

#share-code {
  margin-top: 10px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 6px;
  font-family: monospace;
  display: none;
}

/* Modal */
.modal {
  display: none;
  position: fixed;
  z-index: 2000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s;
}

.modal-content {
  background-color: white;
  margin: 10% auto;
  padding: 30px;
  border-radius: 12px;
  width: 80%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover {
  color: #000;
}

#building-name {
  color: #1a73e8;
  margin-bottom: 15px;
}

#building-details {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* Loading Indicator */
.loading-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 3000;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1a73e8;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Custom Marker Styles */
.custom-marker {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #1a73e8;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.user-location-marker {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4285f4;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(66, 133, 244, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .control-panel {
    width: calc(100% - 40px);
    max-height: 40vh;
    bottom: 20px;
    top: auto;
  }

  .panel-header h2 {
    font-size: 1.2rem;
  }

  #location-buttons {
    grid-template-columns: 1fr;
  }
}
```

### JavaScript Implementation (campus-map.js)

```javascript
/**
 * 3D Campus Map Navigator
 * Complete implementation with Google Maps-like functionality
 */

// Configuration
const CONFIG = {
  // Replace with your Mapbox access token
  mapboxToken: "YOUR_MAPBOX_ACCESS_TOKEN",

  // Default map settings (using a sample location - San Francisco)
  defaultCenter: [-122.4194, 37.7749],
  defaultZoom: 15,
  defaultPitch: 45,
  defaultBearing: -17.6,

  // Campus boundaries (will be updated for actual campus)
  campusBounds: [
    [-122.43, 37.77], // Southwest
    [-122.41, 37.78], // Northeast
  ],

  // API endpoints (for production)
  apiEndpoints: {
    buildings: "/api/buildings",
    routes: "/api/routes",
    parking: "/api/parking",
    shuttle: "/api/shuttle",
  },
};

// Sample campus data (for testing)
const SAMPLE_CAMPUS_DATA = {
  buildings: [
    {
      id: "eng-main",
      name: "Engineering Main Building",
      coordinates: [-122.4194, 37.7749],
      height: 50,
      type: "academic",
      departments: ["Computer Science", "Electrical Engineering"],
      facilities: ["Labs", "Lecture Halls", "Library"],
      hours: "7:00 AM - 10:00 PM",
    },
    {
      id: "eng-lab",
      name: "Engineering Laboratory Complex",
      coordinates: [-122.418, 37.7745],
      height: 30,
      type: "academic",
      departments: ["Research Labs"],
      facilities: ["Computer Lab", "Electronics Lab"],
      hours: "8:00 AM - 8:00 PM",
    },
    {
      id: "library",
      name: "University Library",
      coordinates: [-122.42, 37.7755],
      height: 40,
      type: "library",
      facilities: ["Study Rooms", "Computer Center"],
      hours: "7:00 AM - 11:00 PM",
    },
    {
      id: "admin",
      name: "Administration Building",
      coordinates: [-122.421, 37.774],
      height: 35,
      type: "administrative",
      departments: ["Registrar", "Finance", "Student Affairs"],
      hours: "8:00 AM - 5:00 PM",
    },
    {
      id: "cafeteria",
      name: "Student Cafeteria",
      coordinates: [-122.4185, 37.7752],
      height: 20,
      type: "amenity",
      facilities: ["Food Court", "Seating Area"],
      hours: "7:00 AM - 9:00 PM",
    },
  ],

  parkingLots: [
    {
      id: "parking-a",
      name: "Parking Lot A",
      coordinates: [-122.417, 37.775],
      capacity: 200,
      available: 45,
      type: "student",
    },
    {
      id: "parking-b",
      name: "Parking Lot B",
      coordinates: [-122.422, 37.7745],
      capacity: 150,
      available: 30,
      type: "faculty",
    },
  ],

  shuttleStops: [
    {
      id: "stop-1",
      name: "Main Gate",
      coordinates: [-122.419, 37.774],
    },
    {
      id: "stop-2",
      name: "Engineering Building",
      coordinates: [-122.4194, 37.7749],
    },
    {
      id: "stop-3",
      name: "Library",
      coordinates: [-122.42, 37.7755],
    },
  ],
};

/**
 * Main Campus Map Class
 */
class CampusMap3D {
  constructor() {
    this.map = null;
    this.userLocation = null;
    this.userMarker = null;
    this.selectedBuilding = null;
    this.directions = null;
    this.trackingInterval = null;
    this.is3D = true;
    this.markers = [];
    this.buildingLayers = [];
    this.shareCode = null;
    this.sharedLocations = new Map();

    this.init();
  }

  /**
   * Initialize the map
   */
  async init() {
    try {
      // Show loading indicator
      this.showLoading(true);

      // Set Mapbox token
      mapboxgl.accessToken = CONFIG.mapboxToken;

      // Create map instance
      this.map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: CONFIG.defaultCenter,
        zoom: CONFIG.defaultZoom,
        pitch: CONFIG.defaultPitch,
        bearing: CONFIG.defaultBearing,
        antialias: true,
      });

      // Add navigation controls
      this.map.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add scale control
      this.map.addControl(new mapboxgl.ScaleControl(), "bottom-right");

      // Add fullscreen control
      this.map.addControl(new mapboxgl.FullscreenControl(), "top-right");

      // Initialize directions
      this.initDirections();

      // Initialize geocoder (search)
      this.initGeocoder();

      // Wait for map to load
      this.map.on("load", () => {
        this.onMapLoad();
        this.showLoading(false);
      });

      // Set up event listeners
      this.setupEventListeners();

      // Start location tracking
      this.startLocationTracking();
    } catch (error) {
      console.error("Error initializing map:", error);
      this.showError("Failed to initialize map. Please check your API key.");
    }
  }

  /**
   * Handle map load event
   */
  onMapLoad() {
    // Add 3D terrain
    this.add3DTerrain();

    // Add buildings
    this.addBuildings();

    // Add campus buildings
    this.addCampusBuildings();

    // Add parking lots
    this.addParkingLots();

    // Add shuttle stops
    this.addShuttleStops();

    // Set up building click handler
    this.setupBuildingInteraction();

    // Initialize quick access buttons
    this.initQuickAccessButtons();

    // Add custom layers
    this.addCustomLayers();
  }

  /**
   * Add 3D terrain
   */
  add3DTerrain() {
    this.map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });

    this.map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

    // Add sky layer for better 3D effect
    this.map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0.0, 90.0],
        "sky-atmosphere-sun-intensity": 15,
      },
    });
  }

  /**
   * Add 3D buildings
   */
  addBuildings() {
    // Add 3D building layer
    const layers = this.map.getStyle().layers;

    let labelLayerId;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === "symbol" && layers[i].layout["text-field"]) {
        labelLayerId = layers[i].id;
        break;
      }
    }

    this.map.addLayer(
      {
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 0.6,
        },
      },
      labelLayerId
    );
  }

  /**
   * Add campus buildings
   */
  addCampusBuildings() {
    // Create GeoJSON from campus data
    const buildingsGeoJSON = {
      type: "FeatureCollection",
      features: SAMPLE_CAMPUS_DATA.buildings.map((building) => ({
        type: "Feature",
        properties: {
          ...building,
        },
        geometry: {
          type: "Point",
          coordinates: building.coordinates,
        },
      })),
    };

    // Add source
    this.map.addSource("campus-buildings", {
      type: "geojson",
      data: buildingsGeoJSON,
    });

    // Add building markers
    SAMPLE_CAMPUS_DATA.buildings.forEach((building) => {
      // Create custom marker element
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.backgroundColor = this.getBuildingColor(building.type);

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(building.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
                            <h3>${building.name}</h3>
                            <p>${building.type}</p>
                            <button onclick="campusMap.navigateToBuilding('${building.id}')">
                                Navigate Here
                            </button>
                        `)
        )
        .addTo(this.map);

      this.markers.push(marker);

      // Add click event
      el.addEventListener("click", () => {
        this.selectBuilding(building);
      });
    });

    // Add 3D extrusions for buildings
    this.map.addLayer({
      id: "campus-buildings-3d",
      type: "fill-extrusion",
      source: "campus-buildings",
      paint: {
        "fill-extrusion-color": [
          "case",
          ["==", ["get", "type"], "academic"],
          "#4285f4",
          ["==", ["get", "type"], "library"],
          "#34a853",
          ["==", ["get", "type"], "administrative"],
          "#fbbc04",
          ["==", ["get", "type"], "amenity"],
          "#ea4335",
          "#999999",
        ],
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": 0,
        "fill-extrusion-opacity": 0.8,
      },
    });
  }

  /**
   * Add parking lots
   */
  addParkingLots() {
    SAMPLE_CAMPUS_DATA.parkingLots.forEach((lot) => {
      const el = document.createElement("div");
      el.innerHTML = "🅿️";
      el.style.fontSize = "24px";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat(lot.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
                            <h3>${lot.name}</h3>
                            <p>Capacity: ${lot.capacity}</p>
                            <p>Available: ${lot.available}</p>
                            <p>Type: ${lot.type}</p>
                        `)
        )
        .addTo(this.map);

      this.markers.push(marker);
    });
  }

  /**
   * Add shuttle stops
   */
  addShuttleStops() {
    SAMPLE_CAMPUS_DATA.shuttleStops.forEach((stop) => {
      const el = document.createElement("div");
      el.innerHTML = "🚌";
      el.style.fontSize = "20px";
      el.style.cursor = "pointer";

      const marker = new mapboxgl.Marker(el)
        .setLngLat(stop.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
                            <h3>${stop.name}</h3>
                            <p>Shuttle Stop</p>
                        `)
        )
        .addTo(this.map);

      this.markers.push(marker);
    });
  }

  /**
   * Initialize directions control
   */
  initDirections() {
    this.directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: "metric",
      profile: "mapbox/walking",
      alternatives: true,
      controls: {
        inputs: false,
        instructions: true,
        profileSwitcher: true,
      },
    });

    this.map.addControl(this.directions, "top-left");

    // Listen for route events
    this.directions.on("route", (e) => {
      const routes = e.route;
      if (routes && routes.length > 0) {
        const route = routes[0];
        this.displayRouteInfo(route);
      }
    });
  }

  /**
   * Initialize geocoder (search)
   */
  initGeocoder() {
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: "Search campus locations...",
      bbox: CONFIG.campusBounds.flat(),
      proximity: {
        longitude: CONFIG.defaultCenter[0],
        latitude: CONFIG.defaultCenter[1],
      },
    });

    document
      .getElementById("search-container")
      .appendChild(geocoder.onAdd(this.map));

    // Handle search results
    geocoder.on("result", (e) => {
      // Check if result matches campus building
      const buildingMatch = this.findBuildingByName(e.result.text);
      if (buildingMatch) {
        this.selectBuilding(buildingMatch);
      }
    });
  }

  /**
   * Setup building interaction
   */
  setupBuildingInteraction() {
    // Change cursor on hover
    this.map.on("mouseenter", "campus-buildings-3d", () => {
      this.map.getCanvas().style.cursor = "pointer";
    });

    this.map.on("mouseleave", "campus-buildings-3d", () => {
      this.map.getCanvas().style.cursor = "";
    });

    // Handle click on buildings
    this.map.on("click", "campus-buildings-3d", (e) => {
      const properties = e.features[0].properties;
      this.selectBuilding(properties);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle 3D button
    document.getElementById("toggle-3d").addEventListener("click", () => {
      this.toggle3D();
    });

    // Toggle tracking
    document
      .getElementById("toggle-tracking")
      .addEventListener("change", (e) => {
        if (e.target.checked) {
          this.startLocationTracking();
        } else {
          this.stopLocationTracking();
        }
      });

    // Toggle buildings
    document
      .getElementById("toggle-buildings")
      .addEventListener("change", (e) => {
        const visibility = e.target.checked ? "visible" : "none";
        this.map.setLayoutProperty("3d-buildings", "visibility", visibility);
        this.map.setLayoutProperty(
          "campus-buildings-3d",
          "visibility",
          visibility
        );
      });

    // Toggle accessibility
    document
      .getElementById("toggle-accessibility")
      .addEventListener("change", (e) => {
        if (e.target.checked) {
          this.showAccessibilityRoutes();
        } else {
          this.hideAccessibilityRoutes();
        }
      });

    // Toggle parking
    document
      .getElementById("toggle-parking")
      .addEventListener("change", (e) => {
        this.toggleParkingVisibility(e.target.checked);
      });

    // Share location
    document.getElementById("share-location").addEventListener("click", () => {
      this.shareLocation();
    });

    // Modal close button
    document.querySelector(".close").addEventListener("click", () => {
      this.closeModal();
    });

    // Navigate to building button
    document
      .getElementById("navigate-to-building")
      .addEventListener("click", () => {
        this.navigateToSelectedBuilding();
      });
  }

  /**
   * Initialize quick access buttons
   */
  initQuickAccessButtons() {
    const container = document.getElementById("location-buttons");

    SAMPLE_CAMPUS_DATA.buildings.forEach((building) => {
      const button = document.createElement("button");
      button.className = "location-btn";
      button.textContent = building.name.split(" ")[0]; // Short name
      button.title = building.name;
      button.addEventListener("click", () => {
        this.selectBuilding(building);
        this.flyToLocation(building.coordinates);
      });
      container.appendChild(button);
    });
  }

  /**
   * Start location tracking
   */
  startLocationTracking() {
    if (!navigator.geolocation) {
      this.showError("Geolocation is not supported by your browser");
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.updateUserLocation(position);
      },
      (error) => {
        console.error("Error getting location:", error);
        // Use default location for demo
        this.updateUserLocation({
          coords: {
            latitude: CONFIG.defaultCenter[1],
            longitude: CONFIG.defaultCenter[0],
          },
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // Watch position
    this.trackingInterval = navigator.geolocation.watchPosition(
      (position) => {
        this.updateUserLocation(position);
      },
      (error) => {
        console.error("Error tracking location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking() {
    if (this.trackingInterval) {
      navigator.geolocation.clearWatch(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.userMarker) {
      this.userMarker.remove();
      this.userMarker = null;
    }
  }

  /**
   * Update user location
   */
  updateUserLocation(position) {
    const { latitude, longitude } = position.coords;
    this.userLocation = [longitude, latitude];

    // Update location display
    document.getElementById("current-location").innerHTML = `
            <strong>Your Location:</strong><br>
            Lat: ${latitude.toFixed(6)}<br>
            Lng: ${longitude.toFixed(6)}
        `;

    // Update or create user marker
    if (this.userMarker) {
      this.userMarker.setLngLat(this.userLocation);
    } else {
      const el = document.createElement("div");
      el.className = "user-location-marker";

      this.userMarker = new mapboxgl.Marker(el)
        .setLngLat(this.userLocation)
        .addTo(this.map);
    }

    // Check proximity to buildings
    this.checkProximity();
  }

  /**
   * Check proximity to buildings
   */
  checkProximity() {
    if (!this.userLocation) return;

    const nearbyBuildings = SAMPLE_CAMPUS_DATA.buildings.filter((building) => {
      const distance = turf.distance(
        turf.point(this.userLocation),
        turf.point(building.coordinates),
        { units: "meters" }
      );
      return distance < 50; // Within 50 meters
    });

    if (nearbyBuildings.length > 0) {
      const nearest = nearbyBuildings[0];
      document.getElementById("travel-info").innerHTML = `
                <strong>Nearby:</strong> ${nearest.name}
            `;
    }
  }

  /**
   * Toggle 3D view
   */
  toggle3D() {
    this.is3D = !this.is3D;

    if (this.is3D) {
      this.map.easeTo({
        pitch: CONFIG.defaultPitch,
        bearing: CONFIG.defaultBearing,
        duration: 1000,
      });
    } else {
      this.map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000,
      });
    }

    document.getElementById("toggle-3d").textContent = this.is3D
      ? "2D View"
      : "3D View";
  }

  /**
   * Select a building
   */
  selectBuilding(building) {
    this.selectedBuilding = building;

    // Update modal
    document.getElementById("building-name").textContent = building.name;
    document.getElementById("building-details").innerHTML = `
            <p><strong>Type:</strong> ${building.type}</p>
            ${
              building.departments
                ? `<p><strong>Departments:</strong> ${building.departments.join(
                    ", "
                  )}</p>`
                : ""
            }
            ${
              building.facilities
                ? `<p><strong>Facilities:</strong> ${building.facilities.join(
                    ", "
                  )}</p>`
                : ""
            }
            ${
              building.hours
                ? `<p><strong>Hours:</strong> ${building.hours}</p>`
                : ""
            }
        `;

    // Show modal
    document.getElementById("building-modal").style.display = "block";
  }

  /**
   * Navigate to selected building
   */
  navigateToSelectedBuilding() {
    if (!this.selectedBuilding) return;

    this.closeModal();
    this.navigateToBuilding(this.selectedBuilding.id);
  }

  /**
   * Navigate to a building
   */
  navigateToBuilding(buildingId) {
    const building = SAMPLE_CAMPUS_DATA.buildings.find(
      (b) => b.id === buildingId
    );
    if (!building) return;

    // Fly to building
    this.flyToLocation(building.coordinates);

    // Set directions if user location is available
    if (this.userLocation) {
      this.directions.setOrigin(this.userLocation);
      this.directions.setDestination(building.coordinates);
    }
  }

  /**
   * Fly to location
   */
  flyToLocation(coordinates, zoom = 18) {
    this.map.flyTo({
      center: coordinates,
      zoom: zoom,
      pitch: this.is3D ? CONFIG.defaultPitch : 0,
      bearing: this.is3D ? CONFIG.defaultBearing : 0,
      duration: 2000,
      essential: true,
    });
  }

  /**
   * Display route information
   */
  displayRouteInfo(route) {
    const distance = (route.distance / 1000).toFixed(2); // Convert to km
    const duration = Math.round(route.duration / 60); // Convert to minutes

    document.getElementById("travel-info").innerHTML = `
            <strong>Route Info:</strong><br>
            Distance: ${distance} km<br>
            Duration: ${duration} min<br>
            Mode: ${route.mode || "Walking"}
        `;
  }

  /**
   * Share location
   */
  shareLocation() {
    if (!this.userLocation) {
      this.showError("Location not available");
      return;
    }

    // Generate share code
    this.shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Display share code
    const shareCodeDiv = document.getElementById("share-code");
    shareCodeDiv.innerHTML = `
            <strong>Share Code:</strong> ${this.shareCode}<br>
            <small>Share this code with others to see your location</small>
        `;
    shareCodeDiv.style.display = "block";

    // In production, send to WebSocket server
    this.broadcastLocation();
  }

  /**
   * Broadcast location (WebSocket implementation)
   */
  broadcastLocation() {
    // This would connect to a WebSocket server in production
    console.log("Broadcasting location:", {
      code: this.shareCode,
      location: this.userLocation,
      timestamp: Date.now(),
    });

    // Simulate receiving shared location
    setTimeout(() => {
      this.receiveSharedLocation({
        code: "DEMO123",
        location: [-122.42, 37.776],
        user: "Demo User",
      });
    }, 2000);
  }

  /**
   * Receive shared location
   */
  receiveSharedLocation(data) {
    const { code, location, user } = data;

    // Create marker for shared location
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.backgroundColor = "#ff6b6b";

    const marker = new mapboxgl.Marker(el)
      .setLngLat(location)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h3>${user}</h3><p>Shared Location</p>`
        )
      )
      .addTo(this.map);

    this.sharedLocations.set(code, marker);
  }

  /**
   * Show accessibility routes
   */
  showAccessibilityRoutes() {
    // Add accessible routes layer
    const accessibleRoutes = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              CONFIG.defaultCenter,
              [-122.418, 37.7745],
              [-122.42, 37.7755],
            ],
          },
          properties: {
            accessible: true,
          },
        },
      ],
    };

    if (!this.map.getSource("accessible-routes")) {
      this.map.addSource("accessible-routes", {
        type: "geojson",
        data: accessibleRoutes,
      });

      this.map.addLayer({
        id: "accessible-routes-layer",
        type: "line",
        source: "accessible-routes",
        paint: {
          "line-color": "#00ff00",
          "line-width": 4,
          "line-opacity": 0.7,
          "line-dasharray": [2, 2],
        },
      });
    }
  }

  /**
   * Hide accessibility routes
   */
  hideAccessibilityRoutes() {
    if (this.map.getLayer("accessible-routes-layer")) {
      this.map.removeLayer("accessible-routes-layer");
      this.map.removeSource("accessible-routes");
    }
  }

  /**
   * Toggle parking visibility
   */
  toggleParkingVisibility(visible) {
    this.markers.forEach((marker) => {
      const el = marker.getElement();
      if (el && el.innerHTML.includes("🅿️")) {
        el.style.display = visible ? "block" : "none";
      }
    });
  }

  /**
   * Add custom layers
   */
  addCustomLayers() {
    // Add heat map for busy areas (example)
    const busyAreas = {
      type: "FeatureCollection",
      features: SAMPLE_CAMPUS_DATA.buildings.map((building) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: building.coordinates,
        },
        properties: {
          intensity: Math.random(), // Random intensity for demo
        },
      })),
    };

    this.map.addSource("busy-areas", {
      type: "geojson",
      data: busyAreas,
    });

    // Add paths/walkways
    this.addCampusPaths();
  }

  /**
   * Add campus paths
   */
  addCampusPaths() {
    const paths = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [-122.4194, 37.7749],
              [-122.4185, 37.7752],
              [-122.42, 37.7755],
            ],
          },
        },
      ],
    };

    this.map.addSource("campus-paths", {
      type: "geojson",
      data: paths,
    });

    this.map.addLayer({
      id: "campus-paths-layer",
      type: "line",
      source: "campus-paths",
      paint: {
        "line-color": "#666",
        "line-width": 2,
        "line-opacity": 0.5,
      },
    });
  }

  /**
   * Find building by name
   */
  findBuildingByName(name) {
    return SAMPLE_CAMPUS_DATA.buildings.find((building) =>
      building.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  /**
   * Get building color by type
   */
  getBuildingColor(type) {
    const colors = {
      academic: "#4285f4",
      library: "#34a853",
      administrative: "#fbbc04",
      amenity: "#ea4335",
    };
    return colors[type] || "#999999";
  }

  /**
   * Close modal
   */
  closeModal() {
    document.getElementById("building-modal").style.display = "none";
  }

  /**
   * Show loading indicator
   */
  showLoading(show) {
    document.getElementById("loading").style.display = show ? "block" : "none";
  }

  /**
   * Show error message
   */
  showError(message) {
    alert(message); // In production, use a better notification system
  }
}

// Initialize the campus map when DOM is ready
let campusMap;
document.addEventListener("DOMContentLoaded", () => {
  campusMap = new CampusMap3D();
});

// Export for global access
window.campusMap = campusMap;
```

## 4. Testing Strategy

### Local Testing with Sample Data

1. **Setup Testing Environment:**

```bash
# Create project directory
mkdir campus-map-3d
cd campus-map-3d

# Initialize npm project
npm init -y

# Install development dependencies
npm install --save-dev http-server

# Add to package.json scripts
"scripts": {
    "start": "http-server -p 8080"
}
```

2. **Test Features Checklist:**

- [ ] Map loads with 3D buildings
- [ ] GPS tracking activates
- [ ] Search functionality works
- [ ] Directions calculate properly
- [ ] Building selection shows information
- [ ] Quick access buttons navigate correctly
- [ ] Share location generates code
- [ ] Accessibility routes display
- [ ] Parking toggles visibility
- [ ] 3D/2D toggle works smoothly

3. **Performance Testing:**

```javascript
// Add performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      mapLoadTime: 0,
      buildingRenderTime: 0,
      routeCalculationTime: 0,
    };
  }

  measureMapLoad() {
    const startTime = performance.now();
    // Map load logic
    this.metrics.mapLoadTime = performance.now() - startTime;
    console.log(`Map loaded in ${this.metrics.mapLoadTime}ms`);
  }
}
```

## 5. University Customization Guide

### Data Collection Requirements

1. **Building Data Collection Template:**

```json
{
    "buildings": [
        {
            "id": "unique-building-id",
            "name": "Building Name",
            "coordinates": [longitude, latitude],
            "height": 50, // in meters
            "type": "academic|library|administrative|amenity",
            "departments": ["dept1", "dept2"],
            "facilities": ["facility1", "facility2"],
            "hours": "Opening hours",
            "entrances": [
                {
                    "type": "main|side|accessible",
                    "coordinates": [lng, lat]
                }
            ],
            "floors": [
                {
                    "level": 1,
                    "rooms": ["101", "102"],
                    "facilities": ["Lab", "Classroom"]
                }
            ]
        }
    ]
}
```

2. **Coordinate Collection Methods:**

- Use Google Maps to get precise coordinates
- GPS survey using mobile devices
- Drone mapping for accurate building footprints
- OpenStreetMap data extraction

3. **University of Ruhuna Specific Setup:**

```javascript
// Replace sample data with actual university data
const RUHUNA_CAMPUS_DATA = {
  // Actual coordinates for University of Ruhuna Faculty of Engineering
  center: [80.5767, 5.9381], // Approximate coordinates
  bounds: [
    [80.57, 5.935], // Southwest
    [80.583, 5.941], // Northeast
  ],

  buildings: [
    {
      id: "eng-main",
      name: "Faculty of Engineering Main Building",
      coordinates: [80.5767, 5.9381],
      height: 45,
      type: "academic",
      departments: [
        "Civil and Environmental Engineering",
        "Electrical and Information Engineering",
        "Mechanical and Manufacturing Engineering",
      ],
    },
    // Add more buildings...
  ],
};
```

## 6. Deployment Considerations

### Production Setup

1. **Environment Configuration:**

```javascript
// config/production.js
const PRODUCTION_CONFIG = {
  mapboxToken: process.env.MAPBOX_TOKEN,
  apiUrl: process.env.API_URL,
  wsUrl: process.env.WEBSOCKET_URL,

  security: {
    enableHTTPS: true,
    corsOrigins: ["https://eng.ruh.ac.lk"],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests
    },
  },
};
```

2. **API Key Security:**

```javascript
// Implement token rotation
class TokenManager {
  constructor() {
    this.tokens = [];
    this.currentIndex = 0;
  }

  rotateToken() {
    this.currentIndex = (this.currentIndex + 1) % this.tokens.length;
    return this.tokens[this.currentIndex];
  }
}
```

3. **Hosting Options:**

- **Static Hosting:** Netlify, Vercel, GitHub Pages
- **Full-Stack:** AWS EC2, Google Cloud Platform, Azure
- **CDN:** CloudFlare for asset delivery

4. **Database Setup (for dynamic data):**

```sql
-- PostgreSQL schema with PostGIS
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    building_id VARCHAR(50) UNIQUE,
    name VARCHAR(200),
    location GEOGRAPHY(POINT, 4326),
    height FLOAT,
    type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buildings_location ON buildings USING GIST(location);
```

5. **Real-time Features Backend:**

```javascript
// server.js for WebSocket implementation
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("shareLocation", (data) => {
    // Broadcast to all other clients
    socket.broadcast.emit("locationUpdate", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### Optimization Strategies

1. **Performance Optimization:**

```javascript
// Implement tile caching
const tileCache = new Map();

function loadTile(tileId) {
  if (tileCache.has(tileId)) {
    return tileCache.get(tileId);
  }

  const tile = fetchTile(tileId);
  tileCache.set(tileId, tile);

  // Limit cache size
  if (tileCache.size > 100) {
    const firstKey = tileCache.keys().next().value;
    tileCache.delete(firstKey);
  }

  return tile;
}
```

2. **Mobile Optimization:**

```css
/* Responsive design for mobile devices */
@media (max-width: 768px) {
  .control-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 20px 20px 0 0;
    max-height: 50vh;
  }

  .mapboxgl-ctrl-top-left {
    top: 10px;
    left: 10px;
  }
}
```

### Monitoring and Analytics

```javascript
// Add analytics tracking
class Analytics {
  trackEvent(category, action, label) {
    // Google Analytics
    gtag("event", action, {
      event_category: category,
      event_label: label,
    });

    // Custom analytics
    fetch("/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        category,
        action,
        label,
        timestamp: Date.now(),
      }),
    });
  }
}
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **Map Not Loading:**

- Check Mapbox token validity
- Verify internet connection
- Check browser console for errors

2. **GPS Not Working:**

- Ensure HTTPS is enabled (required for geolocation)
- Check browser permissions
- Provide fallback coordinates

3. **3D Buildings Not Showing:**

- Verify WebGL support in browser
- Check zoom level (minimum 15)
- Ensure building data is loaded

4. **Performance Issues:**

- Reduce number of markers
- Implement clustering for dense areas
- Use simplified geometries
- Enable hardware acceleration

This comprehensive implementation provides a fully functional 3D campus map with Google Maps-like features. The code is modular, scalable, and can be easily customized for the University of Ruhuna Faculty of Engineering by replacing the sample data with actual campus information.
