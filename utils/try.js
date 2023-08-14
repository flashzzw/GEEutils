exports.collection = function(image){
    var ndvi = image.normalizedDifference(['NIR', 'R']).rename('NDVI');
    return image.addBands(ndvi).float();
};