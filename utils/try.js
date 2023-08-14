exports.collection = function(image){
    var ndvi = image.normalizedDifference(['NIR', 'R']).rename('NDVI');
    return image.addBands(ndvi).float();
};
exports.calNDVIedge1 = function(image){
    var ndviedge1 = image.normalizedDifference(['edgeR1', 'R']).rename('NDVIedge1');
    return image.addBands(ndviedge1).float();
};