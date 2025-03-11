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

    // Add the base tile layer
    L.tileLayer('https://api.mapbox.com/styles/v1/underjas/cm6zlihch00ef01sle41zhier/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
        minZoom: 14,
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoidW5kZXJqYXMiLCJhIjoiY202eWpqa3AwMHcyZTJucHM2cDBwcnd0NCJ9.RNRXLOp7rDrsdW0qiOHUFw'
    }).addTo(map);

    // call data functions
        getStripes();
        getZones();
        createRadioControl();
        getADA();
        addLegend();
        getEV();
        //getStripes();
        getMoto();
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
        'ShortTerm': '#DCB326',
        'ADA': '#00A6ED',
        'NonPublic': '#feedde'
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
function showPopup(e) {
    var layer = e.target;
    layer.openPopup();
    layer.setStyle({
        weight: 3,
        color: '#d73f09',
        fillOpacity: 0.7
    });
    layer.bringToFront();
}

// Close popup on mouseout
function closePopup(e) {
    var layer = e.target;
    layer.closePopup();
    geojson.resetStyle(layer);
}

// Bind popups during layer initialization
function onEachFeature(feature, layer) {
    var popupContent = `<b>Zone:</b> ${feature.properties.ZoneGroup} <br> 
                        <b>Lot:</b> ${feature.properties.AiM_Desc}`;
    layer.bindPopup(popupContent);

    layer.on({
        mouseover: showPopup,
        mouseout: closePopup
    });
}
let hoverTimeout;

// Show popup on hover
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
        geojson.resetStyle(layer);
    }, 100); // Adjust the delay time if needed
}

// Bind popups during layer initialization
function onEachFeature(feature, layer) {
    var popupContent = `<b>Zone:</b> ${feature.properties.ZoneGroup} <br> 
                        <b>Lot:</b> ${feature.properties.AiM_Desc}`;
    layer.bindPopup(popupContent);

    layer.on({
        mouseover: showPopup,
        mouseout: closePopup
    });
}

// Zoom to feature on mouse click
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

// Fetch parking zone data
function getZones() {
    fetch("data/ParkingZones.geojson")
        .then(response => response.json())
        .then(data => {
            geojson = L.geoJSON(data, {
                style: style,
                onEachFeature: function (feature, layer) {
                    onEachFeature(feature, layer);
                    if (/^(A1|A2|A3|B1|B2|B3|C|R|RA)$/.test(feature.properties.ZoneGroup)) {
                        layer.bindTooltip(feature.properties.ZoneGroup, {
                            permanent: true,
                            direction: 'center',
                            className: 'zone-label'
                    }).openTooltip();
                }
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading Parking data:', error));
}
//fetch parking stripe data
function getStripes(){
    fetch("data/ParkingStripes.geojson")
        .then(response => response.json())
        .then(data => {
            geojson = L.geoJSON(data, {
                style: {
                    color: 'white',
                    weight: 0.5
                }
            }).addTo(map);
        })
}
// Create a blue cluster icon style
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
// Create EV cluster icon style
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

// Create Moto cluster icon style
function createMotoClusterIcon(cluster) {
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
// fetch ada point data
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

            // Optionally: restrict zoom beyond level 19
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
//********************************************************************************************** */
// fetch ev point data
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
// Initialize motorcycle parking cluster group
function getMoto() {
    // Create the motorcycle parking feature layer but don't add it to the map initially
    var motoLayer = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/dePSdaG71BplHMCO/arcgis/rest/services/Motorcycle/FeatureServer/1',
        style: function (feature){
            return {
                radius: 5,
                color: 'F5945C',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.6
            };  
        }
        });
    
    // Create the Always Visible Checkbox Control for toggling motorcycle parking layer
    var checkboxControl = L.Control.extend({
        options: { position: 'topright' },  // Position on the map (top-right corner)
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
            container.innerHTML = `
                <label><input type="checkbox" id="motoCheckbox" />Motorcycle Prkg &nbsp &nbsp;</label>
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

    // Add the motoLayer to the map but keep it hidden initially
    motoLayer.addTo(map);
    map.removeLayer(motoLayer);  // Hide the layer initially
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
            'Hourly (metered)': '#DCB326',
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

// Function to create radio button control for filtering Parking Zones by ZoneGroup
function createRadioControl() {
    const groups = ['All', 'A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C', 'R', 'RA', 'ShortTerm', 'ADA', 'NonPublic'];
    const control = L.control({ position: 'topleft' });

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
                filterZonesByGroup(event.target.value);
            });
        });

        return container;
    };

    map.addControl(control);
}

// Function to filter zones based on selected ZoneGroup
function filterZonesByGroup(zoneGroup) {
    // Check each feature layer in the geojson and toggle visibility
    geojson.eachLayer(function(layer) {
        const layerGroup = layer.feature.properties.ZoneGroup;
        if (zoneGroup === 'All' || layerGroup === zoneGroup) {
            map.addLayer(layer);
        } else {
            map.removeLayer(layer);
        }
    });
}


// Initialize map
document.addEventListener('DOMContentLoaded', function() {
    createMap();
    
    //createZoneGroupRadioButton();
});


