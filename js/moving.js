
function compareSeq(a, b) {
	return a.properties.seq - b.properties.seq;
}

function multilinestringConcat(arr1, arr2){
	if(arr1.length == 0) return arr2;
	const arr1EndIndex = arr1.length-1;
	const arr2EndIndex = arr2.length-1;
	if(arr1[0][0]==arr2[0][0]&&arr1[0][1]==arr2[0][1]) 
		return [...arr1].reverse().slice(0,arr1EndIndex).concat(arr2);
	else if(arr1[0][0]==arr2[arr2EndIndex][0]&&arr1[0][1]==arr2[arr2EndIndex][1]) 
		return arr2.slice(0,arr2EndIndex).concat(arr1);
	else if(arr1[arr1EndIndex][0]==arr2[arr2EndIndex][0]&&arr1[arr1EndIndex][1]==arr2[arr2EndIndex][1]) 
		return arr1.slice(0,arr1EndIndex).concat([...arr2].reverse());
	else if(arr1[arr1EndIndex][0]==arr2[0][0]&&arr1[arr1EndIndex][1]==arr2[0][1]) 
		return arr1.slice(0,arr1EndIndex).concat(arr2);
	else return [];
}

function reverseCoord(arr){
	const rra = [];
	arr.forEach(coords=>{
		const innerCorrds = [];
		coords.forEach(pos=>{
			innerCorrds.push([pos[1],pos[0]]);
		})
		rra.push(innerCorrds);
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
	if(coordinates && coordinates.length == 1 ) return coordinates.flat();
	let feature_coord = [];
	if(isSequence) {
		coordinates.forEach(coordinate => {
			feature_coord = multilinestringConcat(feature_coord, coordinate);
		});
	} else {
		const comparing = [...coordinates];
		const checkedList = new Array(coordinates.length);
		checkedList.fill(false);

		for (let i = 0; i < comparing.length; i++) {
			for(let j = 0; j < comparing.length; j++) {
				if(!checkedList[j]){
					const compared = multilinestringConcat(feature_coord,comparing[j]);
					if(compared.length>0) {
						feature_coord = compared;
						checkedList[j] = true;
					}
				}
			}
		}
	}
	return feature_coord;
}

function followRoute(features) {
	features.sort(compareSeq);
	const latlons = [];
	features.forEach(feature=>{
		if(feature.geometry 
			&& feature.geometry 
			&& feature.geometry.coordinates) {
				console.log(feature.geometry.coordinates,reverseCoord(feature.geometry.coordinates))
			const coordinates = makeSingleString(reverseCoord(feature.geometry.coordinates));
			if(coordinates.length==1) 
				latlons.push(reverseCoord(coordinates[0]));
			else latlons.push(coordinates);
		}
	});	
    return makeSingleString(latlons);
}