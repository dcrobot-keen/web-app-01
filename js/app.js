const getServerPort ='8080'
var geoserverUrl = 'http://'+window.location.hostname + ':'+ getServerPort+ "/geoserver/dcrobot/ows";
var selectedPoint = null;

var source = null;
var target = null;

var map = L.map("map", {
	center: [37.363429,127.1110492],
	zoom: 10, //set the zoom level
	crs: L.Proj.CRS.Daum,
    worldCopyJump: false,   
});

var baseLayers = L.tileLayer.koreaProvider('DaumMap.Street').addTo(map);

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
	var url = `${geoserverUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=dcrobot:ShortestPath&outputformat=application/json&viewparams=source:${source};target:${target};`;

	$.getJSON(url, function(data) {
		console.log(data);
		map.removeLayer(pathLayer);
		pathLayer = L.geoJSON(data);
		map.addLayer(pathLayer);
		
		followRoute(data.features)
		
	});
}
//when we need sequence
function compareSeq(a, b) {
	return a.properties.seq - b.properties.seq;
}

function multilinestringConcat(arr1, arr2){
	if(arr1.length == 0) return arr2;
	const arr1EndIndex = arr1.length-1;
	const arr2EndIndex = arr2.length-1;
	// if(arr1[0][0]==arr2[0][0]&&arr1[0][1]==arr2[0][1]) 
	// 	return [...arr1].reverse().concat(arr2);
	// else if(arr1[0][0]==arr2[arr2EndIndex][0]&&arr1[0][1]==arr2[arr2EndIndex][1]) 
	// 	return arr2.concat(arr1);
	// else if(arr1[arr1EndIndex][0]==arr2[arr2EndIndex][0]&&arr1[arr1EndIndex][1]==arr2[arr2EndIndex][1]) 
	// 	return arr1.concat([...arr2].reverse());
	// else if(arr1[arr1EndIndex][0]==arr2[0][0]&&arr1[arr1EndIndex][1]==arr2[0][1]) 
	// 	return arr1.concat(arr2);
	// else return [];
	if(arr1[0][0]==arr2[0][0]&&arr1[0][1]==arr2[0][1]) 
		return [...arr1].reverse().slice(0,arr1EndIndex).concat(arr2);
	else if(arr1[0][0]==arr2[arr2EndIndex][0]&&arr1[0][1]==arr2[arr2EndIndex][1]) 
		return arr2.slice(0,arr2EndIndex).concat(arr1);
	else if(arr1[arr1EndIndex][0]==arr2[arr2EndIndex][0]&&arr1[arr1EndIndex][1]==arr2[arr2EndIndex][1]) 
		return arr1.slice(0,arr2EndIndex).concat([...arr2].reverse());
	else if(arr1[arr1EndIndex][0]==arr2[0][0]&&arr1[arr1EndIndex][1]==arr2[0][1]) 
		return arr1.slice(0,arr1EndIndex).concat(arr2);
	else return [];
}
function revsereLonLat(arr){
	const rra = [];
	arr.forEach(pos=>{
		rra.push([...pos].reverse());
	})
	return rra;
}
// const a1 = [[0,1],[0,2],[0,3]];
// const a2 = [[0,1],[0,4],[0,5]];
// const a3 = [[0,2],[0,4],[0,1]];
// const a4 = [[0,3],[0,4],[0,5]];//
// const a5 = [[0,7],[0,4],[0,3]];
// const a6 = [[0,3],[0,4]];
// console.log(multilinestringConcat(a1,a2));
// console.log(multilinestringConcat(a1,a3));
// console.log(multilinestringConcat(a1,a4));
// console.log(multilinestringConcat(a1,a5));
// console.log(multilinestringConcat(a1,a6));

function makeSingleString(coordinates,isSequence) {
	console.log('----------------makeSingleString Start----------------')
	console.log("input coordinates : ",coordinates);
	console.log("isSequence", isSequence);
	let feature_coord = [];
	if(isSequence) {
		coordinates.forEach(coordinate => {
			feature_coord = multilinestringConcat(feature_coord, coordinate);
		});
	} else {
		const comparing = [...coordinates];
		console.log(comparing);
		for (let i = 0; i < coordinates.length; i++) {
			for (let j = 0; j < coordinates.length; j++) {
				const compared = multilinestringConcat(coordinates[i],comparing[j]);
				console.log(compared);
				if(compared.length>0) {
					feature_coord = compared;
					comparing.splice(j-1,1);
				}
			}
		}
	}

	console.log('return single', feature_coord);
	return feature_coord;
}
function followRoute(features) {
	features.sort(compareSeq);
	console.log(features)
	const latlons = [];
	// latlons.push(features[0].geometry.coordinates[0].)
	features.forEach(feature=>{
		if(feature.geometry 
			&& feature.geometry 
			&& feature.geometry.coordinates) {
			const coordinates = makeSingleString(revsereLonLat(feature.geometry.coordinates),true);
			if(coordinates.length==1) 
				latlons.push(revsereLonLat(coordinates[0]));
			else latlons.push(coordinates);
		}
	});
	console.log("----------re-arrange----------");
	const concatted = makeSingleString(latlons);
	console.log('latlons,concatted',latlons,concatted);
	const marker = L.Marker.movingMarker(concatted, 20000, {autostart:true}).addTo(map);	
	marker.start();
}
	

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