var geoserverUrl = 'http://dev-pgrouting-ncl.nfra.io:8080/geoserver/ne/ows';
var selectedPoint = null;

var source = null;
var target = null;
let marker;

var map = L.map("map", {
	center: [37.363429,127.1110492],
	zoom: 10, //set the zoom level
	crs: L.Proj.CRS.Daum,
    worldCopyJump: false,   
});

var cartRobotIcon = L.icon({
    iconUrl: 'resource/icon/d-robot-icon.png',
    iconSize: [38, 38],
    iconAnchor: [19, 37]
});

var baseLayers = L.tileLayer.koreaProvider('DaumMap.Street').addTo(map);
var wmsLayers = getWMSLayer().addTo(map);

L.control.scale().addTo(map); 

// empty geojson layer for the shortes path result
var pathLayer = L.geoJSON(null);

// draggable marker for starting point. Note the marker is initialized with an initial starting position
var sourceMarker = L.marker([37.3610588,127.1098818], {
	draggable: true
})
	.on("dragend", function(e) {
		selectedPoint = e.target.getLatLng();
		getVertex(selectedPoint);
		getRoute();
	})
	.addTo(map);

// draggbale marker for destination point.Note the marker is initialized with an initial destination positon
var targetMarker = L.marker([37.3656199,127.1098483], {
	draggable: true
})
	.on("dragend", function(e) {
		selectedPoint = e.target.getLatLng();
		getVertex(selectedPoint);
		getRoute();
	})
	.addTo(map);

// function to get nearest vertex to the passed point
function getVertex(selectedPoint) {
	var url = `${geoserverUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=dcrobot:NearestVertex&outputformat=application/json&viewparams=x:${
		selectedPoint.lng
	};y:${selectedPoint.lat};`;
	$.ajax({
		url: url,
		async: false,
		success: function(data) {
			loadVertex(
				data,
				selectedPoint.toString() === sourceMarker.getLatLng().toString()
			);
		}
	});
}

// function to update the source and target nodes as returned from geoserver for later querying
function loadVertex(response, isSource) {
	var features = response.features;
	map.removeLayer(pathLayer);
	if (isSource) {
		source = features[0].properties.id;
	} else {
		target = features[0].properties.id;
	}
}

// function to get the shortest path from the give source and target nodes
function getRoute() {
	var url = `${geoserverUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=dcrobot:ShortestPath-2&outputformat=application/json&viewparams=source:${source};target:${target};`;

	$.getJSON(url, function(data) {
		map.removeLayer(pathLayer);
		pathLayer = L.geoJSON(data);
		map.addLayer(pathLayer);
		const latlons = followRoute(data.features)
		const d1 = sourceMarker.getLatLng().distanceTo(latlons[0]);
		const d2 = sourceMarker.getLatLng().distanceTo(latlons[latlons.length -1]);
		if(d1 > d2) latlons.reverse();
		marker = L.Marker.movingMarker(latlons, 20000, {icon: cartRobotIcon, autostart:true}).addTo(map);	
		marker.start();
	});
}
//when we need sequence

	

getVertex(sourceMarker.getLatLng());
getVertex(targetMarker.getLatLng());
getRoute();

map.on('baselayerchange', function (e) {
	if (e.name === 'Naver Satellite Map') {
		if (map.hasLayer(physicalMap)) map.removeLayer(physicalMap);

		layerControl.addOverlay(hybridMap, 'Naver Hybrid Map');
		layerControl.removeLayer(physicalMap);
	} else {
		if (map.hasLayer(hybridMap)) map.removeLayer(hybridMap);

		layerControl.removeLayer(hybridMap);
		layerControl.addOverlay(physicalMap, 'Naver Physical Map');
	}
});