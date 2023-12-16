const wmsUrl = 'http://dev-pgrouting-ncl.nfra.io:8080/geoserver/ne/wms'
const getWMSLayer = ()=>{
    return L.tileLayer.wms(wmsUrl,{
        layers: ['ne:edges','ne:poi','ne:zone'],
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        crs: L.CRS.EPSG4326
    });
}