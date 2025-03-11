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

// Combine both onEachFeature implementations
function onEachFeature(feature, layer) {
    var popupContent = `<b>Zone:</b> ${feature.properties.ZoneGroup} <br> 
                        <b>Lot Name:</b> ${feature.properties.AiM_Desc} <br>
                        <b>Lot ID:</b> ${feature.properties.uPrkgID}`;
    layer.bindPopup(popupContent);

    layer.on({
        mouseover: showPopup,
        mouseout: closePopup,
        click: zoomToFeature
    });
}

// Initialize motorcycle parking layer correctly
function getMoto() {
    // Create the motorcycle parking feature layer but don't add it to the map initially
    var motoLayer = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/dePSdaG71BplHMCO/arcgis/rest/services/Motorcycle/FeatureServer/1',
        style: function (feature) {
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
        options: { position: 'topright' },
        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-bar');
            container.innerHTML = `
                <label><input type="checkbox" id="motoCheckbox" />Motorcycle Prkg &nbsp &nbsp;</label>
            `;
            container.querySelector('input').addEventListener('change', function (event) {
                if (event.target.checked) {
                    map.addLayer(motoLayer);
                } else {
                    map.removeLayer(motoLayer);
                }
            });
            return container;
        }
    });

    map.addControl(new checkboxControl());
}

// Initialize the map when the document is ready
document.addEventListener('DOMContentLoaded', function () {
    createMap();
});
