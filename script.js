let map;
let marker;
let currentPosition = { lat: 0, lng: 0 };
let customMarkers = [];
let markerIdCounter = 1;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.5431, lng: -58.4897 },
        zoom: 14,
        styles: [
            {
                featureType: "all",
                elementType: "geometry",
                stylers: [{ color: "#242f3e" }]
            },
            {
                featureType: "all",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#242f3e" }]
            },
            {
                featureType: "all",
                elementType: "labels.text.fill",
                stylers: [{ color: "#746855" }]
            },
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }]
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }]
            }
        ]
    });

    // Cargar marcadores guardados
    loadSavedMarkers();
    
    // Inicializar ubicación
    getRealLocation();
    
    // Agregar listener para crear marcadores al hacer clic en el mapa
    map.addListener('click', (event) => {
        createMarkerAtPosition(event.latLng);
    });
}

function getRealLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setCenter(currentPosition);
                addCustomMarker(currentPosition);
                updateLocationInfo(currentPosition);
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                document.getElementById('location-coords').textContent = 
                    'No se pudo obtener la ubicación. Usando ubicación predeterminada.';
                
                currentPosition = { lat: -34.5431, lng: -58.4897 };
                addCustomMarker(currentPosition);
            }
        );
    } else {
        document.getElementById('location-coords').textContent = 
            'Geolocalización no soportada por este navegador.';
    }
}

function addCustomMarker(position) {
    if (marker) {
        marker.setMap(null);
    }

    marker = new google.maps.Marker({
        position: position,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#bb86fc",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3
        },
        title: "Tu ubicación actual"
    });

    new google.maps.Circle({
        map: map,
        center: position,
        radius: 200,
        fillColor: "#bb86fc",
        fillOpacity: 0.15,
        strokeColor: "#bb86fc",
        strokeOpacity: 0.4,
        strokeWeight: 2
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; color: #333;">
                <h4 style="margin: 0 0 5px 0; color: #bb86fc;">📍 Ubicación Actual</h4>
                <p style="margin: 0; font-size: 0.9rem;">Lat: ${position.lat.toFixed(4)}</p>
                <p style="margin: 0; font-size: 0.9rem;">Lng: ${position.lng.toFixed(4)}</p>
            </div>
        `
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
}

function updateLocationInfo(position) {
    const coordsElement = document.getElementById('location-coords');
    coordsElement.innerHTML = `
        <strong>Latitud:</strong> ${position.lat.toFixed(6)}<br>
        <strong>Longitud:</strong> ${position.lng.toFixed(6)}<br>
        <span style="color: #03dac6; font-size: 0.9rem;">✓ Ubicación obtenida exitosamente</span>
    `;
}

// Funciones para gestionar marcadores personalizados
function createMarkerAtPosition(latLng, markerData = null) {
    const id = markerData ? markerData.id : markerIdCounter++;
    const title = markerData ? markerData.title : `Marcador ${id}`;
    const description = markerData ? markerData.description : '';
    const color = markerData ? markerData.color : '#FF5252';
    
    const customMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: title,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
        },
        draggable: true
    });
    
    // Crear ventana de información
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; color: #333; max-width: 200px;">
                <h4 style="margin: 0 0 5px 0; color: ${color};">${title}</h4>
                <p style="margin: 0; font-size: 0.9rem;">${description}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #666;">
                    Lat: ${latLng.lat().toFixed(4)}, Lng: ${latLng.lng().toFixed(4)}
                </p>
                <button onclick="editMarker(${id})" style="margin-top: 8px; padding: 5px 10px; background: ${color}; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Editar
                </button>
            </div>
        `
    });
    
    customMarker.addListener('click', () => {
        infoWindow.open(map, customMarker);
    });
    
    customMarker.addListener('dragend', () => {
        saveMarkers();
    });
    
    // Guardar datos del marcador
    const markerObj = {
        id: id,
        title: title,
        description: description,
        color: color,
        lat: latLng.lat(),
        lng: latLng.lng(),
        marker: customMarker,
        infoWindow: infoWindow
    };
    
    customMarkers.push(markerObj);
    
    // Si es un nuevo marcador, abrir modal para editarlo
    if (!markerData) {
        openMarkerModal(markerObj);
    }
    
    // Actualizar lista y guardar
    updateMarkersList();
    saveMarkers();
    
    return markerObj;
}

function openMarkerModal(markerData) {
    const modal = document.getElementById('marker-modal');
    const form = document.getElementById('marker-form');
    const deleteBtn = document.getElementById('delete-marker');
    
    // Llenar formulario con datos del marcador
    document.getElementById('marker-id').value = markerData.id;
    document.getElementById('marker-title').value = markerData.title;
    document.getElementById('marker-description').value = markerData.description;
    document.getElementById('marker-color').value = markerData.color;
    
    // Mostrar u ocultar botón de eliminar
    deleteBtn.style.display = 'block';
    
    // Mostrar modal
    modal.style.display = 'block';
    
    // Configurar evento de envío del formulario
    form.onsubmit = (e) => {
        e.preventDefault();
        saveMarkerChanges(markerData);
    };
    
    // Configurar evento de eliminación
    deleteBtn.onclick = () => {
        deleteMarker(markerData.id);
        modal.style.display = 'none';
    };
}

function saveMarkerChanges(markerData) {
    const id = parseInt(document.getElementById('marker-id').value);
    const title = document.getElementById('marker-title').value;
    const description = document.getElementById('marker-description').value;
    const color = document.getElementById('marker-color').value;
    
    // Actualizar marcador en el array
    const markerIndex = customMarkers.findIndex(m => m.id === id);
    if (markerIndex !== -1) {
        customMarkers[markerIndex].title = title;
        customMarkers[markerIndex].description = description;
        customMarkers[markerIndex].color = color;
        
        // Actualizar marcador en el mapa
        customMarkers[markerIndex].marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
        });
        
        // Actualizar ventana de información
        const position = customMarkers[markerIndex].marker.getPosition();
        customMarkers[markerIndex].infoWindow.setContent(`
            <div style="padding: 10px; color: #333; max-width: 200px;">
                <h4 style="margin: 0 0 5px 0; color: ${color};">${title}</h4>
                <p style="margin: 0; font-size: 0.9rem;">${description}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #666;">
                    Lat: ${position.lat().toFixed(4)}, Lng: ${position.lng().toFixed(4)}
                </p>
                <button onclick="editMarker(${id})" style="margin-top: 8px; padding: 5px 10px; background: ${color}; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Editar
                </button>
            </div>
        `);
    }
    
    // Cerrar modal y actualizar lista
    document.getElementById('marker-modal').style.display = 'none';
    updateMarkersList();
    saveMarkers();
}

function editMarker(id) {
    const markerData = customMarkers.find(m => m.id === id);
    if (markerData) {
        openMarkerModal(markerData);
    }
}

function deleteMarker(id) {
    const markerIndex = customMarkers.findIndex(m => m.id === id);
    if (markerIndex !== -1) {
        // Eliminar marcador del mapa
        customMarkers[markerIndex].marker.setMap(null);
        customMarkers[markerIndex].infoWindow.close();
        
        // Eliminar del array
        customMarkers.splice(markerIndex, 1);
        
        // Actualizar lista y guardar
        updateMarkersList();
        saveMarkers();
    }
}

function clearAllMarkers() {
    // Eliminar todos los marcadores del mapa
    customMarkers.forEach(marker => {
        marker.marker.setMap(null);
        marker.infoWindow.close();
    });
    
    // Limpiar array
    customMarkers = [];
    
    // Actualizar lista y guardar
    updateMarkersList();
    saveMarkers();
}

function updateMarkersList() {
    const markersList = document.getElementById('markers-list');
    
    if (customMarkers.length === 0) {
        markersList.innerHTML = '<p class="no-markers">No hay marcadores guardados</p>';
        return;
    }
    
    markersList.innerHTML = '';
    
    customMarkers.forEach(marker => {
        const markerItem = document.createElement('div');
        markerItem.className = 'marker-item';
        markerItem.style.borderLeftColor = marker.color;
        
        markerItem.innerHTML = `
            <div class="marker-info">
                <h4>${marker.title}</h4>
                <p>${marker.description || 'Sin descripción'}</p>
                <p>${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}</p>
            </div>
            <div class="marker-actions">
                <button class="marker-btn" onclick="editMarker(${marker.id})"></button>
                <button class="marker-btn" onclick="deleteMarker(${marker.id})"></button>
            </div>
        `;
        
        markersList.appendChild(markerItem);
    });
}

function saveMarkers() {
    const markersData = customMarkers.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        color: m.color,
        lat: m.lat,
        lng: m.lng
    }));
    
    localStorage.setItem('savedMarkers', JSON.stringify(markersData));
    
    // Actualizar contador de ID si es necesario
    if (markersData.length > 0) {
        const maxId = Math.max(...markersData.map(m => m.id));
        markerIdCounter = maxId + 1;
    }
}

function loadSavedMarkers() {
    const savedMarkers = localStorage.getItem('savedMarkers');
    
    if (savedMarkers) {
        const markersData = JSON.parse(savedMarkers);
        
        markersData.forEach(markerData => {
            const latLng = new google.maps.LatLng(markerData.lat, markerData.lng);
            createMarkerAtPosition(latLng, markerData);
        });
        
        updateMarkersList();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botón para agregar marcador en ubicación actual
    const addMarkerBtn = document.getElementById('add-marker');
    if (addMarkerBtn) {
        addMarkerBtn.addEventListener('click', () => {
            const latLng = new google.maps.LatLng(currentPosition.lat, currentPosition.lng);
            createMarkerAtPosition(latLng);
        });
    }
    
    // Botón para limpiar todos los marcadores
    const clearMarkersBtn = document.getElementById('clear-markers');
    if (clearMarkersBtn) {
        clearMarkersBtn.addEventListener('click', clearAllMarkers);
    }
    
    // Cerrar modal al hacer clic en la X
    const closeModal = document.querySelector('.close');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('marker-modal').style.display = 'none';
        });
    }
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('marker-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});