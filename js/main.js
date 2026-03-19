// Add all scripts to the JS folder
let map;
let geojson;
var info = L.control();
//var esri = L.esri;

// Function to instantiate the Leaflet map
function createMap() {
    map = L.map('map', {
        center: [44.563, -123.284], // Center the map on Oregon State University
        zoom: 15
    });

    // Add the bespoke base tile layer
    L.tileLayer('https://api.mapbox.com/styles/v1/underjas/cm6zlihch00ef01sle41zhier/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
        minZoom: 14,
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoidW5kZXJqYXMiLCJhIjoiY202eWpqa3AwMHcyZTJucHM2cDBwcnd0NCJ9.RNRXLOp7rDrsdW0qiOHUFw'
    }).addTo(map);

     // Calculate the bounds (in degree lat/lng from the center) to constrain the map
     const southWest = [44.563 - 0.02, -123.284 - 0.03];
     const northEast = [44.563 + 0.02, -123.284 + 0.03];
     const bounds = L.latLngBounds(southWest, northEast);
 
     // Set the max bounds to limit panning
     map.setMaxBounds(bounds);
 
     // Prevent moving outside bounds
     map.on('drag', function() {
         map.panInsideBounds(bounds, { animate: false });
     });

    // call data functions
        //getStripes();
        getZones();
        createRadioControl();
        getADA();
        addLegend();
        getEV();
        getMoto();
        getGarage();
        getBlue();
}

// Define the style for the Parking Zones
function style(feature) {
    return {
        fillColor: getColor(feature.properties.ZoneGroup),
        weight: 0,
        opacity: 1,
        fillOpacity: 1
    };
}

function getColor(ZoneGroup) {
    const colors = {
        'A1': '#F26221', 'A2': '#F26221', 'A3': '#F26221',
        'B1': '#F68F58', 'B2': '#F68F58', 'B3': '#F68F58',
        'C': '#FABC95',
        'R': '#000000', 'RA': '#000000',
        'ShortTerm': '#FFB500',
        'ADA': '#00A6ED',
        'NonPublic': '#feedde'
        //'NonOSU': '#feedde'
    };
    return colors[ZoneGroup] || '#ffffff00';
}
// Add event listeners to each feature
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: showPopup,
        mouseout: closePopup,
        click: zoomToFeature
    });
}
// Show popup on hover
let hoverTimeout;
function showPopup(e) {
    clearTimeout(hoverTimeout); // Prevent closing if quickly moving between borders
    var layer = e.target;
    layer.openPopup();
    layer.setStyle({
        weight: 3,
        color: '#d73f09',
        fillOpacity: 0.7
    });
    layer.bringToFront();
}

// Close popup on mouseout (with delay)
function closePopup(e) {
    var layer = e.target;
    hoverTimeout = setTimeout(() => {
        layer.closePopup();
        geojson.resetStyle(layer); // Reset style after closing popup
    }, 100); // Adjust the delay time if needed
}

// Bind popups during layer initialization
function onEachFeature(feature, layer) {
    var popupContent = `<b>Zone:</b> ${feature.properties.ZoneGroup} <br> 
                        <b>Lot Name:</b> ${feature.properties.AiM_Desc} <br>
                        <b>Lot ID:</b> ${feature.properties.uPrkgID}`;
    layer.bindPopup(popupContent);

    // Add mouse events to show and close popup
    layer.on({
        mouseover: showPopup,
        mouseout: closePopup
    });
}

// Zoom to feature on mouse click
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

//let labelLayer = L.layerGroup().addTo(map);
//fetch parking zones
function getZones() {
    fetch("data/ParkingZones.geojson")
        .then(response => response.json())
        .then(data => {
            let labelPositions = [];
            let hoverTimeout;
            let lastHoveredLayer = null; // Track the last highlighted polygon

            geojson = L.geoJSON(data, {
                style: style,
                onEachFeature: function (feature, layer) {
                    onEachFeature(feature, layer);

                    // Add hover effect
                    layer.on({
                        mouseover: function (e) {
                            var layer = e.target;
                            clearTimeout(hoverTimeout); // Prevent unintended un-highlighting

                            // Reset the previous highlighted polygon
                            if (lastHoveredLayer && lastHoveredLayer !== layer) {
                                geojson.resetStyle(lastHoveredLayer);
                            }

                            // Highlight the current polygon
                            layer.setStyle({
                                weight: 3,
                                color: "#666",
                                fillOpacity: 0.7
                            });
                            lastHoveredLayer = layer; // Update the last hovered polygon
                        },
                        mouseout: function (e) {
                            hoverTimeout = setTimeout(() => {
                                if (lastHoveredLayer) {
                                    geojson.resetStyle(lastHoveredLayer);
                                    lastHoveredLayer = null;
                                }
                            }, 100); // Adjust delay if needed
                        }
                    });

                    // Label placement logic
                    if (/^(A1|A2|A3|B1|B2|B3|C|R|RA)$/.test(feature.properties.ZoneGroup)) {
                        let centroid = layer.getBounds().getCenter();
                        let offset = 0;
                        let maxOffset = 0.0003;
                        let labelPosition = centroid;
                        let attempts = 0;

                        while (isOverlapping(labelPosition, labelPositions) && attempts < 5) {
                            labelPosition = L.latLng(
                                centroid.lat + Math.random() * maxOffset - maxOffset / 2,
                                centroid.lng + Math.random() * maxOffset - maxOffset / 2
                            );
                            attempts++;
                        }

                        labelPositions.push(labelPosition);

                        let labelIcon = L.divIcon({
                            className: 'zone-label',
                            html: feature.properties.ZoneGroup,
                            iconSize: [100, 40],
                            iconAnchor: [50, 20],
                            popupAnchor: [0, -20]
                        });

                        let labelMarker = L.marker(labelPosition, {
                            icon: labelIcon,
                            interactive: false
                        }).addTo(map);

                        // Store the label in the layer for later use in visibility control
                        layer.label = labelMarker;
                    }
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading Parking data:', error));
}


// Function to check if a new label overlaps with any existing labels
function isOverlapping(newLabelPos, existingLabels) {
    for (let i = 0; i < existingLabels.length; i++) {
        if (newLabelPos.distanceTo(existingLabels[i]) < 30) {  // 30 meters threshold for overlap
            return true;
        }
    }
    return false;
}

// Fetch parking stripe data
function getStripes(){
    fetch("data/ParkingStripes.geojson")
        .then(response => response.json())
        .then(data => {
            stripesLayer = L.geoJSON(data, {
                style: {
                    color: 'white',
                    weight: 0.5
                }
            }).addTo(map);
        })
}
// Create a cluster icon style for ADA parking
function createBlueClusterIcon(cluster) {
    var markersCount = cluster.getChildCount();
    var size = '15px';  // Size of the cluster icon
    var fontSize = '9px';  // Font size for the count text
    var backgroundColor = '#00A6ED';  // Set the background color of the cluster
    return new L.DivIcon({
        html: '<div style="background-color:' + backgroundColor + '; border-radius: 50%; color: white; width: ' + size + '; height: ' + size + '; line-height: ' + size + '; text-align: center; font-size: ' + fontSize + '">' + markersCount + '</div>',
        className: 'leaflet-cluster-icon',  
        // Optional: add a class for further styling
        iconSize: new L.Point(size, size),
        interactive: false
    });
}
// Create a cluster icon style for EV charging
function createEVClusterIcon(cluster) {
    var markersCount = cluster.getChildCount();
    var size = '15px';  // Size of the cluster icon
    var fontSize = '9px';  // Font size for the count text
    var backgroundColor = '#f5945c';  // Set the background color of the cluster
    return new L.DivIcon({
        html: '<div style="background-color:' + backgroundColor + '; border-radius: 50%; color: white; width: ' + size + '; height: ' + size + '; line-height: ' + size + '; text-align: center; font-size: ' + fontSize + '">' + markersCount + '</div>',
        className: 'leaflet-cluster-icon',  
        // Optional: add a class for further styling
        iconSize: new L.Point(size, size),
        interactive: false
    });
}

// fetch point data for ADA parking
function getADA() { 
    fetch("data/ADA_Parking.geojson")
        .then(response => response.json())
        .then(data => {
            // Create a marker cluster group for ADA Parking
            var markers = L.markerClusterGroup({
                iconCreateFunction: createBlueClusterIcon,
                spiderfyOnMaxZoom: false,
                showCoverageOnHover: false,
                disableClusteringAtZoom: 19
            });

            // Create a custom icon with a wheelchair emoji
            var wheelchairIcon = L.divIcon({
                className: 'ada-marker', // Custom class for styling
                html: '<span style="font-size: 16px;">♿</span>', // Wheelchair emoji
                iconSize: [30, 30], // Size of the icon
                iconAnchor: [15, 15], // Center the icon
                popupAnchor: [0, -15] // Popup position
            });

            // Add ADA parking markers to the cluster group
            data.features.forEach(function(feature){
                var lat = feature.geometry.coordinates[1];
                var lng = feature.geometry.coordinates[0];
                var marker = L.marker([lat, lng], { icon: wheelchairIcon });
                markers.addLayer(marker);
            });

            // Restrict zoom beyond level 19
            map.setMaxZoom(19);

            // Create the Always Visible Checkbox Control
            var checkboxControl = L.Control.extend({
                options: { position: 'topright' },  // Position on the map (top-right corner)
                onAdd: function(map) {
                    var container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
                    container.innerHTML = `
                        <label><input type="checkbox" id="adaCheckbox" />♿ ADA Parking &nbsp &nbsp;</label>
                    `;
                    // Handle the checkbox change event to toggle the layer visibility
                    container.querySelector('input').addEventListener('change', function(event) {
                        if (event.target.checked) {
                            map.addLayer(markers);
                        } else {
                            map.removeLayer(markers);
                        }
                    });
                    return container;
                }
            });

            // Add the checkbox control to the map
            map.addControl(new checkboxControl());
        });      
}

// fetch point data for EV charging stations
function getEV() { 
    fetch("data/EV_Station.geojson")
        .then(response => response.json())
        .then(data => {
            // Create a marker cluster group for EV Parking
            var markers = L.markerClusterGroup({
                iconCreateFunction: createEVClusterIcon,
                spiderfyOnMaxZoom: false,
                showCoverageOnHover: false,
                disableClusteringAtZoom: 19
            });

            // Create a custom icon with a charge emoji
            var evIcon = L.divIcon({
                className: 'ada-marker', // Custom class for styling
                html: '<span style="font-size: 16px;">⚡</span>', // EV emoji
                iconSize: [30, 30], // Size of the icon
                iconAnchor: [15, 15], // Center the icon
                popupAnchor: [0, -15] // Popup position
            });

            // Add AEV parking markers to the cluster group
            data.features.forEach(function(feature){
                var lat = feature.geometry.coordinates[1];
                var lng = feature.geometry.coordinates[0];

                var marker = L.marker([lat, lng], { icon: evIcon });

                markers.addLayer(marker);
            });

            // restrict zoom beyond level 19
            map.setMaxZoom(19);

            // Create the Always Visible Checkbox Control
            var checkboxControl = L.Control.extend({
                options: { position: 'topright' },  // Position on the map (top-right corner)
                onAdd: function(map) {
                    var container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
                    container.innerHTML = `
                        <label><input type="checkbox" id="evCheckbox" />⚡ EV Parking &nbsp &nbsp; &nbsp;</label>
                    `;
                    // Handle the checkbox change event to toggle the layer visibility
                    container.querySelector('input').addEventListener('change', function(event) {
                        if (event.target.checked) {
                            map.addLayer(markers);
                        } else {
                            map.removeLayer(markers);
                        }
                    });
                    return container;
                }
            });

            // Add the checkbox control to the map
            map.addControl(new checkboxControl());
        });      
}

// Get the Parking Garage from Esri REST endpoint
function getGarage() {
    const garageLayer = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/dePSdaG71BplHMCO/arcgis/rest/services/ParkingStructure/FeatureServer/0',
    });

    garageLayer.addTo(map);

    
        
    // Configure click event to open the link immediately
    garageLayer.on('click', function(event) {
        // Get the parent window's size and position
        const parentWidth = window.innerWidth;
        const parentHeight = window.innerHeight;
        
        // Set the size for the new popup window
        const popupWidth = 600;
        const popupHeight = 400;
        
        // Calculate the position of the popup to center it
        const left = (parentWidth / 2) - (popupWidth / 2);
        const top = (parentHeight / 2) - (popupHeight / 2);
        
        // Open the window in the center of the parent window
        window.open('https://underjas.github.io/ParkingGarage', 'popup', `width=${popupWidth},height=${popupHeight},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`);
    });
}

function openLink(url) {
    window.open(url, 'popup', 'width=600,height=400,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes');
}


// Call the function to add the button to the page
//addParkingGarageButton();


// Bind the function to the button click event
//document.getElementById('parkingGarageButton').addEventListener('click', openParkingGaragePopup);

   
// Initialize motorcycle parking cluster group
function getMoto() {
    // Create the motorcycle parking feature layer 
    var motoLayer = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/dePSdaG71BplHMCO/arcgis/rest/services/Motorcycle/FeatureServer/1',
        });

    // Create the Always Visible Checkbox Control for toggling motorcycle parking layer
    var checkboxControl = L.Control.extend({
        options: { position: 'topright' },  // Position on the map (top-right corner)
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
            container.innerHTML = `
                <label><input type="checkbox" id="motoCheckbox" />Motorcycle Parking</label>
            `;
            // Handle the checkbox change event to toggle the layer visibility
            container.querySelector('input').addEventListener('change', function(event) {
                if (event.target.checked) {
                    map.addLayer(motoLayer);  // Add the layer if checked
                } else {
                    map.removeLayer(motoLayer);  // Remove the layer if unchecked
                }
            });
            return container;
        }
    });

    // Add the checkbox control to the map
    map.addControl(new checkboxControl());
    map.removeLayer(motoLayer);  // Hide the layer initially
}

function getBlue() {
    // Create the emergency blue light feature layer 
    var blueLayer = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/dePSdaG71BplHMCO/arcgis/rest/services/Emergency_Blue_Light/FeatureServer/9',
        });

    // Create the Always Visible Checkbox Control for toggling emergency blue light layer
    var checkboxControl = L.Control.extend({
        options: { position: 'topright' },  // Position on the map (top-right corner)
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
            container.innerHTML = `
                <label><input type="checkbox" id="blueCheckbox" />Emergency &nbsp;Phone </label>
            `;
            // Handle the checkbox change event to toggle the layer visibility
            container.querySelector('input').addEventListener('change', function(event) {
                if (event.target.checked) {
                    map.addLayer(blueLayer);  // Add the layer if checked
                } else {
                    map.removeLayer(blueLayer);  // Remove the layer if unchecked
                }
            });
            return container;
        }
    });

       // Add the checkbox control to the map
       map.addControl(new checkboxControl());
       map.removeLayer(blueLayer);  // Hide the layer initially
   }

// Create legend
function addLegend() {
    var legend = L.control({ position: 'topright' });

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var categories = {
            'Zone A': '#F26221',
            'Zone B': '#F68F58',
            'Zone C': '#FABC95',
            'Residential': '#000000',
            'Hourly (metered)': '#FFB500',
            'ADA': '#00A6ED',
            'Official Use Only': '#feedde'
        };

        div.innerHTML = '<strong>Parking Zones</strong><br>';
        for (var category in categories) {
            div.innerHTML += `<div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <i style="background:${categories[category]}; width: 20px; height: 20px; display: inline-block; margin-right: 5px;"></i>
                                <span>${category}</span>
                              </div>`;
        }
        return div;
    };
    legend.addTo(map);
}

function createRadioControl() {
    const groups = ['All', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C', 'R', 'Daily A', 'Daily B/C', 'Hourly'];
    const control = L.control({ position: 'topleft' });

    const displayGroups ={
        'All': ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C', 'R', 'Daily A', 'Daily B/C', 'ShortTerm'],
        'A1': ['A1', 'B1', 'B2', 'B3', 'C'],
        'A2': ['A2', 'B1', 'B2', 'B3', 'C'],
        'A3': ['A3', 'B1', 'B2', 'B3', 'C'],
        'B1': ['B1', 'C'],
        'B2': ['B2', 'C'],
        'B3': ['B3', 'C'],
        'C': ['C'],
        'R': ['R'],
        'Daily A': ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C'],
         'Daily B/C': ['B1', 'B2', 'B3', 'C'],
        'Hourly': ['ShortTerm'],
    };

    control.onAdd = function(map) {
        var container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
        container.innerHTML = '<strong>Filter by Permit Type:</strong><br>';

        groups.forEach(group => {
            container.innerHTML += `
                <label style="display: inline-block; margin: 0;">
                    <input type="radio" name="zoneGroup" value="${group}" /> ${group}
                </label><br>
            `;
        });

        // Add event listener to filter based on selected ZoneGroup
        container.querySelectorAll('input[name="zoneGroup"]').forEach(input => {
            input.addEventListener('change', function(event) {
                const selectedGroup = event.target.value;
                if (displayGroups[selectedGroup]) {
                    filterZonesByGroup(displayGroups[selectedGroup]);
                }
            });
        });

        return container;
    };

    map.addControl(control);
}

// Function to filter Parking Zones by ZoneGroup and update label visibility
function filterZonesByGroup(selectedGroups) {
    geojson.eachLayer(function(layer) {
        const zoneGroup = layer.feature.properties.ZoneGroup;
        if (selectedGroups.includes(zoneGroup)) {
            layer.addTo(map); // Show the polygon
            if (layer.label) layer.label.addTo(map); // Show the label
        } else {
            map.removeLayer(layer); // Hide the polygon
            if (layer.label) map.removeLayer(layer.label); // Hide the label
        }
    });
}

// Initialize map
document.addEventListener('DOMContentLoaded', function() {
    createMap();
});
