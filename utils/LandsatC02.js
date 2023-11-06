var COLLECTION = ee.Dictionary({
  'L4': {
    'TOA': ee.ImageCollection('LANDSAT/LT04/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LT04/C02/T1_L2'),
    'TIR': ['B6',],
    'VISW': ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7','QA_PIXEL']
  },
  'L5': {
    'TOA': ee.ImageCollection('LANDSAT/LT05/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LT05/C02/T1_L2'),
    'TIR': ['B6',],
    'VISW': ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7','QA_PIXEL']
  },
  'L7': {
    'TOA': ee.ImageCollection('LANDSAT/LE07/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LE07/C02/T1_L2'),
    'TIR': ['B6_VCID_1','B6_VCID_2'],
    'VISW': ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7','QA_PIXEL']
  },
  'L8': {
    'TOA': ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA'),
    'SR': ee.ImageCollection('LANDSAT/LC08/C02/T1_L2'),
    'TIR': ['B10','B11'],
    'VISW': ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7','QA_PIXEL']
  },
  'L9': {
    'TOA': ee.ImageCollection('LANDSAT/LC09/C02/T1_TOA'),
    'SR': ee.ImageCollection("LANDSAT/LC09/C02/T1_L2"),
    'TIR': ['B10','B11'],
    'VISW': ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7','QA_PIXEL']
  }
});

// Applies scaling factors, remove cloud
function applyScaleFactors(image) {
  var qaMask = image.select('QA_PIXEL').bitwiseAnd(parseInt('11111', 2)).eq(0);
  var saturationMask = image.select('QA_RADSAT').eq(0);
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0).subtract(273.15);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true)
              .updateMask(qaMask).updateMask(saturationMask);
}

// Rename bands
var L57_rename = require('users/zzwDoiT/RSEI:Indexs.js').L57_rename;
var L89_rename = require('users/zzwDoiT/RSEI:Indexs.js').L89_rename;

exports.collection = function(landsat) {
  // load Surface Reflectance collection
  var collection_dict = ee.Dictionary(COLLECTION.get(landsat));
  var landsatSR = ee.ImageCollection(collection_dict.get('SR'));
  var ImgC = ee.Algorithms.If({
          condition: landsat == 'L8',
          trueCase: landsatSR.map(applyScaleFactors).map(L89_rename),
          falseCase: ee.Algorithms.If({
              condition: landsat == 'L9',
              trueCase: landsatSR.map(applyScaleFactors).map(L89_rename),
              falseCase: landsatSR.map(applyScaleFactors).map(L57_rename)
              })
  });
  
  return ImgC;
};