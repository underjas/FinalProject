// Add all scripts to the JS folder
var map;
var geojson;
var info = L.control();

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

    // Call data function
    getAda();
    getZones();
    //info.addTo(map);
    createLegend(map);
    
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
        'ADA': '#005E8E',
        'NonPublic': '#FF000020'
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
    var popupContent = `<b>Zone:</b> ${layer.feature.properties.ZoneGroup} <br> 
                        <b>Lot:</b> ${layer.feature.properties.AiM_Desc}`;

    layer.bindPopup(popupContent).openPopup();
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
                onEachFeature: onEachFeature
            }).addTo(map);
        })
        .catch(error => console.error('Error loading Parking data:', error));
}
//fetch ada parking points
function getAda() {
    fetch("data/ADA_Parking.geojson")
        .then(response => response.json())
        .then(data => {
            geojson = L.geoJSON(data, {
                pointToLayer: function(feature, latlng) {
                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'ada-icon',
                            html: '<div class="ada-circle"><span class="wheelchair">♿</span></div>',
                            iconSize: [10, 10],
                            iconAnchor: [15, 15]
                        })
                    });
                    /*return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: "#003399",
                        color: "#ffffff",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8*/
                
                }

            }).addTo(map);
        });
}

/*//create legend
var legend = L.Control({position: 'bottomleft'});
legend.onAdd = function (map) {
        
    };*/

    function createLegend(map) {
        const legend = L.control({ position: 'bottomleft' });
        
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'info legend');
            const categories = {
                'A Zone': '#F26221',
                'B Zone': '#F68F58',
                'C Zone': '#FABC95',
                'Residential': '#000000',
                'Hourly (metered)': '#DCB326',
                'ADA': '#005E8E',
                'Official Use Only': '#FF000020'
                
            };
    
            let legendHtml = '';
            for (const [label, color] of Object.entries(categories)) {
                legendHtml += `<i style="background:${color}"></i> ${label}<br>`;
            }
            
            div.innerHTML = legendHtml;
            return div;
        };
    
        legend.addTo(map);
    }
    

// Initialize map
document.addEventListener('DOMContentLoaded', createMap);
