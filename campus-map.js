/**
 * 3D Campus Map Navigator
 * Complete implementation with Google Maps-like functionality
 */

// Configuration
const CONFIG = {
  // Replace with your Mapbox access token
  mapboxToken:
    "pk.eyJ1IjoibWFsaXRoYWoiLCJhIjoiY21nNmRsYWFiMGJ5dTJtb2lyZDZ2dW1jbiJ9.1sWiIg5r94zvyCsCM36kxQ",

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
