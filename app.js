/**
 * Main Application Logic
 */

class CampusMapApp {
  constructor() {
    this.currentCategory = "all";
    this.searchQuery = "";
    this.transportMode = "walking";
    this.init();
  }

  init() {
    console.log("Initializing Campus Map Application...");
    this.setupUIListeners();
    this.populateDropdowns();
    this.populateBuildingList();
    this.checkURLParameters();
  }

  setupUIListeners() {
    // Search
    document.getElementById("search-input").addEventListener("input", (e) => {
      this.handleSearch(e.target.value);
    });

    // Category buttons
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.filterByCategory(e.target.dataset.category);
      });
    });

    // Transport modes
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTransportMode(e.target.dataset.mode);
      });
    });

    // Directions
    document
      .getElementById("get-directions-btn")
      .addEventListener("click", () => {
        this.calculateRoute();
      });

    document
      .getElementById("clear-directions-btn")
      .addEventListener("click", () => {
        this.clearRoute();
      });

    // GPS Tracking
    document
      .getElementById("track-location-btn")
      .addEventListener("click", () => {
        this.toggleTracking();
      });

    // Floating controls
    document.getElementById("toggle-3d-btn").addEventListener("click", () => {
      medicalCampusMap.toggle3DBuildings();
    });

    document
      .getElementById("center-campus-btn")
      .addEventListener("click", () => {
        medicalCampusMap.centerOnCampus();
      });

    document
      .getElementById("toggle-labels-btn")
      .addEventListener("click", () => {
        medicalCampusMap.toggleLabels();
      });

    document
      .getElementById("share-location-btn")
      .addEventListener("click", () => {
        this.shareCurrentLocation();
      });

    // Modal
    document.querySelector(".close-modal").addEventListener("click", () => {
      document.getElementById("share-modal").classList.add("hidden");
    });

    document.getElementById("copy-link-btn").addEventListener("click", () => {
      this.copyShareLink();
    });

    document.getElementById("share-modal").addEventListener("click", (e) => {
      if (e.target.id === "share-modal") {
        document.getElementById("share-modal").classList.add("hidden");
      }
    });
  }

  populateDropdowns() {
    const startSelect = document.getElementById("start-location");
    const endSelect = document.getElementById("end-location");

    // Add current location option
    const currentOption = document.createElement("option");
    currentOption.value = "current";
    currentOption.textContent = "📍 Current Location";
    startSelect.appendChild(currentOption);

    // Add all buildings
    CAMPUS_DATA.buildings.forEach((building) => {
      const option = document.createElement("option");
      option.value = building.id;
      option.textContent = `${building.number}. ${building.name}`;

      startSelect.appendChild(option.cloneNode(true));
      endSelect.appendChild(option);
    });
  }

  populateBuildingList(category = "all", searchTerm = "") {
    const container = document.getElementById("building-list");
    container.innerHTML = "";

    let buildings = CAMPUS_DATA.buildings;

    // Filter by category
    if (category !== "all") {
      buildings = buildings.filter((b) => b.category === category);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      buildings = buildings.filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          b.description.toLowerCase().includes(term) ||
          b.number.includes(term)
      );
    }

    buildings.forEach((building) => {
      const item = document.createElement("div");
      item.className = "building-item";
      item.innerHTML = `
                <div class="building-number">${building.number}</div>
                <div class="building-name">${building.icon} ${building.name}</div>
                <div class="building-floor">${building.floor}</div>
            `;
      item.onclick = () => this.goToBuilding(building.id);
      container.appendChild(item);
    });
  }

  handleSearch(query) {
    this.searchQuery = query;

    if (!query) {
      document.getElementById("search-results").innerHTML = "";
      this.populateBuildingList(this.currentCategory);
      return;
    }

    const results = CAMPUS_DATA.buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.description.toLowerCase().includes(query.toLowerCase()) ||
        b.number.includes(query)
    );

    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = "";

    results.slice(0, 5).forEach((building) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.textContent = `${building.number}. ${building.name}`;
      item.onclick = () => {
        this.goToBuilding(building.id);
        document.getElementById("search-input").value = "";
        resultsContainer.innerHTML = "";
      };
      resultsContainer.appendChild(item);
    });

    this.populateBuildingList(this.currentCategory, query);
  }

  filterByCategory(category) {
    this.currentCategory = category;

    // Update button states
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.category === category) {
        btn.classList.add("active");
      }
    });

    this.populateBuildingList(category, this.searchQuery);
  }

  goToBuilding(buildingId) {
    const building = CAMPUS_DATA.buildings.find((b) => b.id === buildingId);
    if (!building) return;

    medicalCampusMap.map.flyTo({
      center: building.coordinates,
      zoom: 19,
      pitch: 45,
      duration: 2000,
    });

    // Find and show popup
    const marker = medicalCampusMap.markers.find(
      (m) => m.buildingData && m.buildingData.id === buildingId
    );

    if (marker) {
      setTimeout(() => marker.togglePopup(), 2000);
    }
  }

  navigateToBuilding(buildingId) {
    const building = CAMPUS_DATA.buildings.find((b) => b.id === buildingId);
    if (!building) return;

    document.getElementById("end-location").value = buildingId;

    if (medicalCampusMap.userLocation) {
      document.getElementById("start-location").value = "current";
    }

    this.goToBuilding(buildingId);
  }

  switchTransportMode(mode) {
    this.transportMode = mode;

    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.mode === mode) {
        btn.classList.add("active");
      }
    });
  }

  async calculateRoute() {
    const startSelect = document.getElementById("start-location");
    const endSelect = document.getElementById("end-location");

    if (!startSelect.value || !endSelect.value) {
      alert("Please select both starting point and destination");
      return;
    }

    medicalCampusMap.showLoading();

    try {
      let startCoords, endCoords;

      // Get start coordinates
      if (startSelect.value === "current") {
        if (medicalCampusMap.userLocation) {
          startCoords = medicalCampusMap.userLocation;
        } else {
          alert("Current location not available. Please enable GPS tracking.");
          medicalCampusMap.hideLoading();
          return;
        }
      } else {
        const startBuilding = CAMPUS_DATA.buildings.find(
          (b) => b.id == startSelect.value
        );
        startCoords = startBuilding.coordinates;
      }

      // Get end coordinates
      const endBuilding = CAMPUS_DATA.buildings.find(
        (b) => b.id == endSelect.value
      );
      endCoords = endBuilding.coordinates;

      // Calculate route
      const route = await this.fetchRoute(startCoords, endCoords);

      if (route) {
        this.displayRoute(route, startCoords, endCoords);
        this.showRouteInfo(route);
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Failed to calculate route. Please try again.");
    } finally {
      medicalCampusMap.hideLoading();
    }
  }

  async fetchRoute(start, end) {
    const profiles = {
      walking: "mapbox/walking",
      cycling: "mapbox/cycling",
      driving: "mapbox/driving",
    };

    const profile = profiles[this.transportMode];
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?` +
        `alternatives=true&geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`,
      { method: "GET" }
    );

    const json = await query.json();
    return json.routes && json.routes.length > 0 ? json.routes[0] : null;
  }

  displayRoute(route, start, end) {
    this.clearRoute();

    if (!medicalCampusMap.map.getSource("route")) {
      medicalCampusMap.map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        },
      });

      medicalCampusMap.map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1a5490",
          "line-width": 6,
          "line-opacity": 0.8,
        },
      });
    } else {
      medicalCampusMap.map.getSource("route").setData({
        type: "Feature",
        properties: {},
        geometry: route.geometry,
      });
    }

    // Add markers
    const startEl = document.createElement("div");
    startEl.innerHTML = "🚩";
    startEl.style.fontSize = "30px";

    const startMarker = new mapboxgl.Marker(startEl)
      .setLngLat(start)
      .addTo(medicalCampusMap.map);

    const endEl = document.createElement("div");
    endEl.innerHTML = "🎯";
    endEl.style.fontSize = "30px";

    const endMarker = new mapboxgl.Marker(endEl)
      .setLngLat(end)
      .addTo(medicalCampusMap.map);

    this.routeMarkers = [startMarker, endMarker];

    // Fit map to route
    const coordinates = route.geometry.coordinates;
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    medicalCampusMap.map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 450, right: 50 },
      duration: 1500,
    });
  }

  showRouteInfo(route) {
    const routeInfo = document.getElementById("route-info");
    const distance = (route.distance / 1000).toFixed(2);
    const duration = Math.round(route.duration / 60);

    routeInfo.innerHTML = `
            <div class="route-stat">
                <span>📏 Distance:</span>
                <span>${distance} km</span>
            </div>
            <div class="route-stat">
                <span>⏱️ Duration:</span>
                <span>${duration} min</span>
            </div>
            <div class="route-stat">
                <span>🚶 Mode:</span>
                <span>${
                  this.transportMode.charAt(0).toUpperCase() +
                  this.transportMode.slice(1)
                }</span>
            </div>
        `;

    routeInfo.classList.remove("hidden");
  }

  clearRoute() {
    if (medicalCampusMap.map.getLayer("route")) {
      medicalCampusMap.map.removeLayer("route");
    }
    if (medicalCampusMap.map.getSource("route")) {
      medicalCampusMap.map.removeSource("route");
    }

    if (this.routeMarkers) {
      this.routeMarkers.forEach((marker) => marker.remove());
      this.routeMarkers = [];
    }

    document.getElementById("route-info").classList.add("hidden");
  }

  toggleTracking() {
    if (!medicalCampusMap.trackingEnabled) {
      this.startTracking();
    } else {
      this.stopTracking();
    }
  }

  startTracking() {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    medicalCampusMap.showLoading();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude, accuracy } = position.coords;
        medicalCampusMap.userLocation = [longitude, latitude];

        medicalCampusMap.map.flyTo({
          center: [longitude, latitude],
          zoom: 18,
          duration: 1500,
        });

        this.updateUserMarker(longitude, latitude, accuracy);
        this.updateTrackingInfo(position);

        medicalCampusMap.watchId = navigator.geolocation.watchPosition(
          (pos) => this.onLocationUpdate(pos),
          (error) => console.error("Location error:", error),
          { enableHighAccuracy: true }
        );

        medicalCampusMap.trackingEnabled = true;
        document.getElementById("track-location-btn").textContent =
          "⏸️ Disable GPS Tracking";
        medicalCampusMap.hideLoading();
      },
      (error) => {
        console.error("Location error:", error);
        alert("Unable to get your location");
        medicalCampusMap.hideLoading();
      }
    );
  }

  stopTracking() {
    if (medicalCampusMap.watchId) {
      navigator.geolocation.clearWatch(medicalCampusMap.watchId);
    }

    medicalCampusMap.trackingEnabled = false;
    document.getElementById("track-location-btn").textContent =
      "📍 Enable GPS Tracking";
    document.getElementById("tracking-info").classList.add("hidden");
  }

  onLocationUpdate(position) {
    const { longitude, latitude, accuracy } = position.coords;
    medicalCampusMap.userLocation = [longitude, latitude];
    this.updateUserMarker(longitude, latitude, accuracy);
    this.updateTrackingInfo(position);
  }

  updateUserMarker(lng, lat, accuracy) {
    if (medicalCampusMap.userMarker) {
      medicalCampusMap.userMarker.remove();
    }

    const el = document.createElement("div");
    el.innerHTML = "📍";
    el.style.fontSize = "32px";
    el.className = "pulse";

    medicalCampusMap.userMarker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(medicalCampusMap.map);
  }

  updateTrackingInfo(position) {
    const info = document.getElementById("tracking-info");
    const { latitude, longitude, accuracy } = position.coords;

    info.innerHTML = `
            <p>📍 Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
            <p>⚡ Accuracy: ${accuracy.toFixed(1)}m</p>
        `;
    info.classList.remove("hidden");
  }

  shareCurrentLocation() {
    if (!medicalCampusMap.userLocation) {
      alert("Please enable GPS tracking first");
      return;
    }

    const [lng, lat] = medicalCampusMap.userLocation;
    const shareUrl = `${window.location.origin}${window.location.pathname}?location=My%20Location&coords=${lng},${lat}`;

    document.getElementById("share-link").value = shareUrl;
    document.getElementById("share-modal").classList.remove("hidden");
  }

  shareBuilding(buildingId) {
    const building = CAMPUS_DATA.buildings.find((b) => b.id === buildingId);
    if (!building) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?building=${buildingId}`;

    document.getElementById("share-link").value = shareUrl;
    document.getElementById("share-modal").classList.remove("hidden");
  }

  copyShareLink() {
    const linkInput = document.getElementById("share-link");
    linkInput.select();
    document.execCommand("copy");

    const btn = document.getElementById("copy-link-btn");
    btn.textContent = "✓ Copied!";
    btn.style.background = "#27ae60";

    setTimeout(() => {
      btn.textContent = "Copy Link";
      btn.style.background = "";
    }, 2000);
  }

  checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const buildingId = urlParams.get("building");
    const coords = urlParams.get("coords");

    if (buildingId) {
      setTimeout(() => this.goToBuilding(parseInt(buildingId)), 2000);
    } else if (coords) {
      const [lng, lat] = coords.split(",").map(Number);
      setTimeout(() => {
        medicalCampusMap.map.flyTo({
          center: [lng, lat],
          zoom: 18,
          duration: 2000,
        });
      }, 2000);
    }
  }
}

// Initialize app
let campusMapApp;
window.addEventListener("load", () => {
  setTimeout(() => {
    campusMapApp = new CampusMapApp();
    window.campusMapApp = campusMapApp;
  }, 1000);
});
