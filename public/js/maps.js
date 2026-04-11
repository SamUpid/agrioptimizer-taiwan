/**
 * Google Maps JavaScript - AgriOptimizer Taiwan
 */

// ============================================================
// GLOBALS
// ============================================================

let map, marker, infoWindow, autocomplete;

const TAIWAN_CENTER = { lat: 23.6, lng: 121.0 };
const TAIWAN_BOUNDS = { north: 26.0, south: 21.5, east: 122.5, west: 119.0 };

let currentLocation = { lat: null, lng: null, address: null, elevation: null };
let locationConfirmed = false;

// ============================================================
// INITIALIZE MAP
// ============================================================

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: TAIWAN_CENTER,
    zoom: 8,
    mapTypeId: 'terrain',
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      mapTypeIds: ['roadmap', 'terrain', 'satellite']
    },
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true
  });

  infoWindow = new google.maps.InfoWindow();
  initAutocomplete();

  map.addListener('click', (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    if (isInTaiwan(lat, lng)) {
      placeMarker(lat, lng);
      fetchLocationDetails(lat, lng);
    } else {
      showAlert('danger', '⚠️ Location must be within Taiwan (台灣境內)');
    }
  });

  checkSavedLocation();
}

// ============================================================
// AUTOCOMPLETE
// ============================================================

function initAutocomplete() {
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('searchInput'),
    {
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(TAIWAN_BOUNDS.south, TAIWAN_BOUNDS.west),
        new google.maps.LatLng(TAIWAN_BOUNDS.north, TAIWAN_BOUNDS.east)
      ),
      componentRestrictions: { country: 'tw' },
      fields: ['formatted_address', 'geometry', 'name'],
      strictBounds: false
    }
  );

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry?.location) {
      showAlert('warning', 'No location found. Try a different search term.');
      return;
    }
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    if (isInTaiwan(lat, lng)) {
      map.panTo({ lat, lng });
      map.setZoom(14);
      placeMarker(lat, lng);
      fetchLocationDetails(lat, lng);
    } else {
      showAlert('danger', '⚠️ Location must be within Taiwan (台灣境內)');
    }
  });
}

// ============================================================
// MARKER
// ============================================================

function placeMarker(lat, lng) {
  if (marker) {
    marker.setPosition({ lat, lng });
  } else {
    marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      },
      title: 'Your Farm Location'
    });

    marker.addListener('dragend', (e) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      if (isInTaiwan(newLat, newLng)) {
        fetchLocationDetails(newLat, newLng);
      } else {
        showAlert('danger', '⚠️ Must be within Taiwan');
        marker.setPosition({ lat: currentLocation.lat, lng: currentLocation.lng });
      }
    });

    marker.addListener('click', () => {
      if (currentLocation.address) {
        infoWindow.setContent(buildInfoWindowContent());
        infoWindow.open(map, marker);
      }
    });
  }

  currentLocation.lat = lat;
  currentLocation.lng = lng;
  locationConfirmed = false;
  updateConfirmButton(false);
}

function buildInfoWindowContent() {
  const elev = currentLocation.elevation || 0;
  return `
    <div style="padding:8px;min-width:200px;font-family:sans-serif">
      <strong style="color:#198754">📍 Farm Location</strong><br>
      <small style="color:#666">${currentLocation.address}</small><br>
      <div style="margin-top:8px">
        <span style="background:#198754;color:white;padding:3px 10px;border-radius:12px;font-size:12px">
          🏔️ ${elev}m elevation
        </span>
        <span style="background:#0d6efd;color:white;padding:3px 10px;border-radius:12px;font-size:12px;margin-left:4px">
          ${getElevationZone(elev)}
        </span>
      </div>
    </div>
  `;
}

// ============================================================
// FETCH LOCATION DETAILS
// ============================================================

async function fetchLocationDetails(lat, lng) {
  setLoading(true);
  hideLocationCard();

  try {
    const [geoRes, elevRes] = await Promise.all([
      fetch('/location/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      }),
      fetch('/location/fetch-elevation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      })
    ]);

    const [geoData, elevData] = await Promise.all([geoRes.json(), elevRes.json()]);

    currentLocation.address = geoData.success ? geoData.data.address : 'Unknown address';
    currentLocation.elevation = elevData.success ? elevData.data.elevation : 0;

    displayLocationCard();

  } catch (err) {
    console.error('Error:', err);
    currentLocation.address = 'Unknown address';
    currentLocation.elevation = 0;
    displayLocationCard();
  } finally {
    setLoading(false);
  }
}

// ============================================================
// DISPLAY LOCATION CARD
// ============================================================

function displayLocationCard() {
  document.getElementById('locationCard').style.display = 'block';
  document.getElementById('selectedAddress').textContent = currentLocation.address;
  document.getElementById('selectedCoordinates').textContent =
    `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;

  const elev = currentLocation.elevation || 0;
  const zone = getElevationZone(elev);
  const color = getElevationColor(elev);

  document.getElementById('selectedElevation').innerHTML = `
    <span class="badge fs-6" style="background:${color}">🏔️ ${elev}m</span>
    <small class="text-muted ms-2">${zone}</small>
  `;

  // Show farming suitability hint
  document.getElementById('elevationHint').innerHTML = getElevationHint(elev);

  if (window.innerWidth < 992) {
    document.getElementById('locationCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function hideLocationCard() {
  document.getElementById('locationCard').style.display = 'none';
}

// ============================================================
// ELEVATION HELPERS
// ============================================================

function getElevationZone(elev) {
  if (elev >= 1000) return 'High Mountain';
  if (elev >= 500)  return 'Mountain';
  if (elev >= 100)  return 'Foothill';
  return 'Lowland';
}

function getElevationColor(elev) {
  if (elev >= 1000) return '#0d6efd'; // blue - high mountain
  if (elev >= 500)  return '#198754'; // green - mountain
  if (elev >= 100)  return '#fd7e14'; // orange - foothill
  return '#6c757d';                   // grey - lowland
}

function getElevationHint(elev) {
  if (elev >= 1200) return '<small class="text-primary">☕ Excellent for specialty coffee & high-mountain tea</small>';
  if (elev >= 800)  return '<small class="text-success">🌱 Great for coffee, plums, persimmons & mountain vegetables</small>';
  if (elev >= 500)  return '<small class="text-warning">🍊 Good for fruits, ginger, bamboo shoots</small>';
  if (elev >= 100)  return '<small class="text-secondary">🥬 Suitable for tropical fruits & vegetables</small>';
  return '<small class="text-secondary">🌾 Lowland crops: rice, tropical fruits</small>';
}

// ============================================================
// USE MY LOCATION
// ============================================================

document.getElementById('useMyLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    showAlert('warning', 'Geolocation is not supported by your browser.');
    return;
  }
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const { latitude: lat, longitude: lng } = coords;
      if (isInTaiwan(lat, lng)) {
        map.panTo({ lat, lng });
        map.setZoom(14);
        placeMarker(lat, lng);
        fetchLocationDetails(lat, lng);
      } else {
        showAlert('warning', 'Your current location is outside Taiwan.');
        setLoading(false);
      }
    },
    () => {
      showAlert('warning', 'Could not get your location. Please allow location access.');
      setLoading(false);
    },
    { timeout: 10000 }
  );
});

// ============================================================
// MANUAL ENTRY
// ============================================================

document.getElementById('manualFetchBtn').addEventListener('click', () => {
  const lat = parseFloat(document.getElementById('manualLat').value);
  const lng = parseFloat(document.getElementById('manualLng').value);

  if (isNaN(lat) || isNaN(lng)) {
    showAlert('warning', 'Please enter valid latitude and longitude values.');
    return;
  }
  if (!isInTaiwan(lat, lng)) {
    showAlert('danger', '⚠️ Coordinates must be within Taiwan (lat: 21.5-26, lng: 119-122.5)');
    return;
  }

  map.panTo({ lat, lng });
  map.setZoom(14);
  placeMarker(lat, lng);
  fetchLocationDetails(lat, lng);
});

// ============================================================
// CONFIRM LOCATION
// ============================================================

document.getElementById('confirmLocationBtn').addEventListener('click', async () => {
  if (!currentLocation.lat || !currentLocation.lng) {
    showAlert('warning', 'Please select a location first.');
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('/location/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentLocation)
    });
    const data = await res.json();

    if (data.success) {
      locationConfirmed = true;
      updateConfirmButton(true);
      showAlert('success', '✅ Location confirmed! Click "Next" to view climate data.');
      const next = document.getElementById('nextStepSection');
      next.style.display = 'block';
      next.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      showAlert('danger', data.message || 'Failed to save location.');
    }
  } catch (err) {
    showAlert('danger', 'Failed to save location. Please try again.');
  } finally {
    setLoading(false);
  }
});

// ============================================================
// CLEAR LOCATION
// ============================================================

document.getElementById('clearLocationBtn').addEventListener('click', async () => {
  try {
    await fetch('/location/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  } catch (e) { /* ignore */ }

  if (marker) { marker.setMap(null); marker = null; }
  if (infoWindow) infoWindow.close();

  currentLocation = { lat: null, lng: null, address: null, elevation: null };
  locationConfirmed = false;

  hideLocationCard();
  document.getElementById('nextStepSection').style.display = 'none';
  document.getElementById('manualLat').value = '';
  document.getElementById('manualLng').value = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('elevationHint').innerHTML = '';
  map.panTo(TAIWAN_CENTER);
  map.setZoom(8);
  showAlert('info', '🗑️ Location cleared.');
});

// ============================================================
// RESTORE SAVED LOCATION
// ============================================================

async function checkSavedLocation() {
  try {
    const res = await fetch('/location/current');
    const data = await res.json();
    if (data.success && data.hasLocation) {
      const loc = data.data;
      currentLocation = { lat: loc.lat, lng: loc.lng, address: loc.address, elevation: loc.elevation };
      map.panTo({ lat: loc.lat, lng: loc.lng });
      map.setZoom(14);
      placeMarker(loc.lat, loc.lng);
      displayLocationCard();
      document.getElementById('nextStepSection').style.display = 'block';
      locationConfirmed = true;
      updateConfirmButton(true);
      showAlert('info', '📍 Previous location restored.');
    }
  } catch (e) { /* no saved location */ }
}

// ============================================================
// UI HELPERS
// ============================================================

function isInTaiwan(lat, lng) {
  return lat >= TAIWAN_BOUNDS.south && lat <= TAIWAN_BOUNDS.north &&
         lng >= TAIWAN_BOUNDS.west  && lng <= TAIWAN_BOUNDS.east;
}

function setLoading(show) {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function updateConfirmButton(confirmed) {
  const btn = document.getElementById('confirmLocationBtn');
  if (confirmed) {
    btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Confirmed ✓';
    btn.className = 'btn btn-outline-success btn-lg';
    btn.disabled = true;
  } else {
    btn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Confirm Location';
    btn.className = 'btn btn-success btn-lg';
    btn.disabled = false;
  }
}

function showAlert(type, message) {
  const container = document.getElementById('alertContainer');
  const id = 'alert-' + Date.now();
  container.innerHTML = `
    <div id="${id}" class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { const el = document.getElementById(id); if (el) el.remove(); }, 5000);
}