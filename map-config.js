/**
 * Map Configuration and Initialization
 */

// Replace with your Mapbox token
const MAPBOX_TOKEN =
  "pk.eyJ1IjoibWFsaXRoYWoiLCJhIjoiY21nNmRsYWFiMGJ5dTJtb2lyZDZ2dW1jbiJ9.1sWiIg5r94zvyCsCM36kxQ";

class MedicalCampusMap {
  constructor() {
    this.map = null;
    this.markers = [];
    this.currentRoute = null;
    this.userLocation = null;
    this.trackingEnabled = false;
    this.labelsVisible = true;
    this.is3DEnabled = true;

    this.init();
  }

  init() {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialize map
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: CAMPUS_DATA.center,
      zoom: CAMPUS_DATA.zoom,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    // Add controls
    this.addControls();

    // Setup event listeners
    this.setupEventListeners();

    // Load campus data when map is loaded
    this.map.on("load", () => {
      this.onMapLoad();
    });
  }

  addControls() {
    // Navigation controls
    this.map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    // Fullscreen control
    this.map.addControl(new mapboxgl.FullscreenControl(), "bottom-right");

    // Scale control
    this.map.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
      }),
      "bottom-left"
    );

    // Geolocate control
    this.geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });
    this.map.addControl(this.geolocateControl, "bottom-right");
  }

  setupEventListeners() {
    this.map.on("idle", () => {
      this.hideLoading();
    });

    this.map.on("error", (e) => {
      console.error("Map error:", e);
    });
  }

  onMapLoad() {
    console.log("Map loaded successfully");

    // Add 3D buildings
    this.add3DBuildings();

    // Load all campus buildings
    this.loadAllBuildings();

    // Load landmarks
    this.loadLandmarks();

    // Draw campus boundary
    this.drawCampusBoundary();
  }

  add3DBuildings() {
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
        minzoom: 14,
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

  loadAllBuildings() {
    CAMPUS_DATA.buildings.forEach((building) => {
      this.addBuildingMarker(building);
    });
  }

  addBuildingMarker(building) {
    // Create marker element
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.innerHTML = `
            <div style="
                background: ${building.color};
                color: white;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
                ${building.number}
            </div>
        `;

    // Create popup
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div class="popup-content">
                    <div class="popup-header">${building.icon} ${building.name}</div>
                    <div class="popup-description">${building.description}</div>
                    <div class="popup-floor">${building.floor}</div>
                    <div class="popup-actions">
                        <button class="popup-btn" onclick="window.campusMapApp.navigateToBuilding(${building.id})">
                            Navigate
                        </button>
                        <button class="popup-btn" onclick="window.campusMapApp.shareBuilding(${building.id})">
                            Share
                        </button>
                    </div>
                </div>
            `);

    // Create and add marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat(building.coordinates)
      .setPopup(popup)
      .addTo(this.map);

    this.markers.push(marker);
    marker.buildingData = building;
  }

  loadLandmarks() {
    CAMPUS_DATA.landmarks.forEach((landmark) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.innerHTML = landmark.icon;
      el.style.fontSize = "28px";
      el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <div class="popup-content">
                        <div class="popup-header">${landmark.icon} ${landmark.name}</div>
                        <div class="popup-description">${landmark.description}</div>
                    </div>
                `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(landmark.coordinates)
        .setPopup(popup)
        .addTo(this.map);

      this.markers.push(marker);
    });
  }

  drawCampusBoundary() {
    // Approximate campus boundary
    const boundary = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.5718, 6.1175],
            [80.5745, 6.1175],
            [80.5745, 6.114],
            [80.5718, 6.114],
            [80.5718, 6.1175],
          ],
        ],
      },
    };

    this.map.addSource("campus-boundary", {
      type: "geojson",
      data: boundary,
    });

    this.map.addLayer({
      id: "campus-boundary-line",
      type: "line",
      source: "campus-boundary",
      paint: {
        "line-color": "#1a5490",
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });

    this.map.addLayer({
      id: "campus-boundary-fill",
      type: "fill",
      source: "campus-boundary",
      paint: {
        "fill-color": "#1a5490",
        "fill-opacity": 0.05,
      },
    });
  }

  toggle3DBuildings() {
    this.is3DEnabled = !this.is3DEnabled;

    if (this.is3DEnabled) {
      this.map.setPitch(45);
      if (this.map.getLayer("3d-buildings")) {
        this.map.setLayoutProperty("3d-buildings", "visibility", "visible");
      }
    } else {
      this.map.setPitch(0);
      if (this.map.getLayer("3d-buildings")) {
        this.map.setLayoutProperty("3d-buildings", "visibility", "none");
      }
    }
  }

  toggleLabels() {
    this.labelsVisible = !this.labelsVisible;
    this.markers.forEach((marker) => {
      marker.getElement().style.display = this.labelsVisible ? "block" : "none";
    });
  }

  centerOnCampus() {
    this.map.flyTo({
      center: CAMPUS_DATA.center,
      zoom: CAMPUS_DATA.zoom,
      pitch: 45,
      bearing: 0,
      duration: 2000,
    });
  }

  showLoading() {
    document.getElementById("loading-indicator").classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("loading-indicator").classList.add("hidden");
  }
}

// Initialize map
let medicalCampusMap;
document.addEventListener("DOMContentLoaded", () => {
  medicalCampusMap = new MedicalCampusMap();
});
