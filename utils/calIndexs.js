/*******************Functions*******************/
var clipper = function(image){
    return image.clip(region);
}

var renameS2 = function(image){
    var visbands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12'];
    var newbands = ['B', 'G', 'R', 'edgeR1', 'edgeR2', 'edgeR3', 'NIR', 'nNIR', 'WATER', 'SWIR1', 'SWIR2'];
    return image.select(visbands).rename(newbands);
}

/**********Calculate VIs**********/
var calNDVI = function(image){
    var ndvi = image.normalizedDifference(['NIR', 'R']).rename('NDVI');
    return image.addBands(ndvi).float();
}

var calNDVIedge1 = function(image){
    var ndviedge1 = image.normalizedDifference(['edgeR1', 'R']).rename('NDVIedge1');
    return image.addBands(ndviedge1).float();
}

var calNDVIedge2 = function(image){
    var ndviedge2 = image.normalizedDifference(['edgeR2', 'R']).rename('NDVIedge2');
    return image.addBands(ndviedge2).float();
}

var calNDVIedge3 = function(image){
    var ndviedge3 = image.normalizedDifference(['edgeR3', 'R']).rename('NDVIedge3');
    return image.addBands(ndviedge3).float();
}

var calRVI = function(image){
    var rvi = image.expression('NIR / R',{
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(rvi.rename('RVI')).float();
}

var calGI = function(image){
    var gi = image.expression('G / R',{
        'R': image.select(['R']),
        'G': image.select(['G']),
        });
    return image.addBands(gi.rename('GI')).float();
}

var calVIgreen = function(image){
    var vig = image.normalizedDifference(['G', 'R']).rename('VIgreen');
    return image.addBands(vig).float();
}

var calGNDVI = function(image){
    var gndvi = image.normalizedDifference(['NIR', 'G']).rename('GNDVI');
    return image.addBands(gndvi).float();
}

var calEVI = function(image){
    var evi = image.expression('2.5 * ( (NIR-R) / (NIR+6*R-7.5*B+1) )',{
        'B': image.select(["B"]),
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(evi.rename('EVI')).float();
}

var calLSWI = function(image){
    var lswi = image.normalizedDifference(['NIR', 'SWIR1']);
    return image.addBands(lswi.rename('LSWI')).float();
}

var calNDBI = function(image){
    var ndbi = image.normalizedDifference(['SWIR1', 'NIR']);
    return image.addBands(ndbi.rename('NDBI'));
}

var calPGI = function(image){
    var pgi = image.expression('100 * ( B*(NIR-R) / (1-(B+G+NIR)/3) )',{
        'B': image.select(["B"]),
        'G': image.select(["G"]),
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(pgi.rename('PGI'));
}

var calRPGI = function(image){
    var rpgi = image.expression('( B / (1-(B+G+NIR)/3) )',{
        'B': image.select(["B"]),
        'G': image.select(["G"]),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(rpgi.rename('RPGI'));
}

var calGLCM = function(image){
    var grey = image.expression('(0.3 * NIR) + (0.59 * R) + (0.11 * G)',{
        'G': image.select(["G"]),
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    var glcm = gray.unitScale(0,0.30).multiply(100).toInt().glcmTexture({size: 1,kernel:null});
    return image.addBands(glcm.rename('GLCM'));
}


/******************Exports******************/
exports.clipper = clipper;
exports.renameS2 = renameS2;
exports.calNDVI = calNDVI;
exports.calNDVIedge1 = calNDVIedge1;
exports.calNDVIedge2 = calNDVIedge2;
exports.calNDVIedge3 = calNDVIedge3;
exports.calRVI = calRVI;
exports.calGI = calGI;
exports.calVIgreen = calVIgreen;
exports.calGNDVI = calGNDVI;
exports.calEVI = calEVI;
exports.calLSWI = calLSWI;
exports.calNDBI = calNDBI;
exports.calPGI = calPGI;
exports.calRPGI = calRPGI;
exports.calGLCM = calGLCM;
