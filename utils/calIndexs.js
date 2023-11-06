/******************Bands Rename******************/
function renameS2(image){
    var visbands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12'];
    var newbands = ['B', 'G', 'R', 'edgeR1', 'edgeR2', 'edgeR3', 'NIR', 'nNIR', 'WATER', 'SWIR1', 'SWIR2'];
    return image.select(visbands).rename(newbands);
}

function renameMODIS(image){
    var visbands = ['sur_refl_b01', 'sur_refl_b02', 'sur_refl_b03', 'sur_refl_b04', 'sur_refl_b05', 'sur_refl_b06', 'sur_refl_b07'];
    var newbands = ['R', 'NIR', 'B', 'G', 'SWIR', 'SWIR1', 'SWIR2'];
    return image.select(visbands).rename(newbands);
}

function L57_rename(img){
    var visbands = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'];
    var newbands = ['B', 'G', 'R', 'NIR', 'SWIR1', 'SWIR2'];
    return img.select(visbands).rename(newbands);
}

function L89_rename(img){
    var visbands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
    var newbands = ['B', 'G', 'R', 'NIR', 'SWIR1', 'SWIR2'];
    return img.select(visbands).rename(newbands);
}

/*******************Functions*******************/
function bitwiseExtract(value, fromBit, toBit) {
  if (toBit === undefined) toBit = fromBit;
  var maskSize = ee.Number(1).add(toBit).subtract(fromBit);
  var mask = ee.Number(1).leftShift(maskSize).subtract(1);
  return value.rightShift(fromBit).bitwiseAnd(mask)}

function cloudfree_mod09a1(image){
  var qa = image.select('StateQA');
  var cloudState = bitwiseExtract(qa, 0, 1) ;
  var cloudShadowState = bitwiseExtract(qa, 2);
  var cirrusState = bitwiseExtract(qa, 8, 9);
  var mask = cloudState.eq(0) // Clear
  .and(cloudShadowState.eq(0)) // No cloud shadow
  .and(cirrusState.eq(0));// No cirrus
  return image.updateMask(mask).select('sur_refl.*').multiply(0.0001)
              .copyProperties(image, image.propertyNames())}

// A function to mask out MOD09GA cloudy pixels.
var maskModClouds = function(image) {
  // Select the QA band.
  var QA = image.select('state_1km');
  // Make a mask to get bit 10, the internal_cloud_algorithm_flag bit.
  var bitMask = 1 << 10;
  // Return an image masking out cloudy areas.
  image = image.updateMask(QA.bitwiseAnd(bitMask).eq(0));
  return image.select('sur_refl.*').multiply(0.0001)
              .copyProperties(image, image.propertyNames());
};

function getDOY(image){
  var date = ee.Date(image.get('system:time_start')).format('D');
  var doy =  ee.Number.parse(date);
  var banddate = ee.Image(doy).updateMask(image.mask().select(0));
  return image.addBands(banddate.rename('DOY'));
}

/**********Calculate VIs**********/
function calNDVI(image){
    var ndvi = image.normalizedDifference(['NIR', 'R']).rename('NDVI');
    return image.addBands(ndvi).float();
}

function calNDVIedge1(image){
    var ndviedge1 = image.normalizedDifference(['edgeR1', 'R']).rename('NDVIedge1');
    return image.addBands(ndviedge1).float();
}

function calNDVIedge2(image){
    var ndviedge2 = image.normalizedDifference(['edgeR2', 'R']).rename('NDVIedge2');
    return image.addBands(ndviedge2).float();
}

function calNDVIedge3(image){
    var ndviedge3 = image.normalizedDifference(['edgeR3', 'R']).rename('NDVIedge3');
    return image.addBands(ndviedge3).float();
}

function calRVI(image){
    var rvi = image.expression('NIR / R',{
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(rvi.rename('RVI')).float();
}

function calGI(image){
    var gi = image.expression('G / R',{
        'R': image.select(['R']),
        'G': image.select(['G']),
        });
    return image.addBands(gi.rename('GI')).float();
}

function calVIgreen(image){
    var vig = image.normalizedDifference(['G', 'R']).rename('VIgreen');
    return image.addBands(vig).float();
}

function calGNDVI(image){
    var gndvi = image.normalizedDifference(['NIR', 'G']).rename('GNDVI');
    return image.addBands(gndvi).float();
}

function calEVI(image){
    var evi = image.expression('2.5 * ( (NIR-R) / (NIR+6*R-7.5*B+1) )',{
        'B': image.select(["B"]),
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(evi.rename('EVI')).float();
}

function calLSWI(image){
    var lswi = image.normalizedDifference(['NIR', 'SWIR1']);
    return image.addBands(lswi.rename('LSWI')).float();
}

function calNDBI(image){
    var ndbi = image.normalizedDifference(['SWIR1', 'NIR']);
    return image.addBands(ndbi.rename('NDBI'));
}

function calPGI(image){
    var pgi = image.expression('100 * ( B*(NIR-R) / (1-(B+G+NIR)/3) )',{
        'B': image.select(["B"]),
        'G': image.select(["G"]),
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(pgi.rename('PGI'));
}

function calRPGI(image){
    var rpgi = image.expression('( B / (1-(B+G+NIR)/3) )',{
        'B': image.select(["B"]),
        'G': image.select(["G"]),
        'NIR': image.select(['NIR']),
        });
    return image.addBands(rpgi.rename('RPGI'));
}

function calGLCM(image){
    var gray = image.expression('(0.3 * NIR) + (0.59 * R) + (0.11 * G)',{
        'G': image.select(["G"]),
        'R': image.select(['R']),
        'NIR': image.select(['NIR']),
        });
    var glcm = gray.unitScale(0,0.30).multiply(100).toInt().glcmTexture({size: 1,kernel:null});
    var constant_svar = glcm.select('constant_svar');
    var constant_corr = glcm.select('constant_corr');
    return image.addBands(glcm).float();
}

function calNDVI_GRAD(image){
    var ndvi = image.normalizedDifference(['NIR', 'R']).rename('NDVI');
    var ndviGradient = ndvi.gradient().pow(2).reduce('sum').sqrt().rename('NDVI_GRAD');
    return image.addBands(ndviGradient).float();
}
// Compute entropy
function calEnt_GLCM(image){
    var square = ee.Kernel.square({radius: 4});
    var entropy = image.select('NDVI').toByte().entropy(square).rename('NDVI_entropy');
    var glcm = image.select('NDVI').toByte().glcmTexture({size: 1});
    var contrast = glcm.select('NDVI_contrast').rename('NDVI_contrast');
    var asm = glcm.select('NDVI_asm').rename('NDVI_asm');
    var corr = glcm.select('NDVI_corr').rename('NDVI_corr');
    return image.addBands(entropy).addBands(contrast).addBands(asm).addBands(corr).float();
}
/******************Exports******************/
exports = {
    getDOY    :  getDOY, 
    renameS2  :  renameS2,  
    L57_rename:  L57_rename,
    L89_rename:  L89_rename,
    renameMODIS : renameMODIS,
    maskModClouds : maskModClouds,
    cloudfree_mod09a1: cloudfree_mod09a1,
    calNDVI   :  calNDVI,
    calNDVIedge1  :  calNDVIedge1, 
    calNDVIedge2  :  calNDVIedge2,
    calNDVIedge3  :  calNDVIedge3,
    calRVI    :  calRVI,
    calGI     :  calGI,
    calVIgreen  :  calVIgreen,
    calGNDVI  :  calGNDVI,
    calEVI    :  calEVI,
    calLSWI   :  calLSWI,
    calNDBI   :  calNDBI,
    calPGI    :  calPGI,
    calRPGI   :  calRPGI,
    calNDVI_GRAD:   calNDVI_GRAD,
    calEnt_GLCM:    calEnt_GLCM,
    calGLCM   :   calGLCM,
};