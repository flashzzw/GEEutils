var S2sr = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED");
/*******************Functions*******************/
var getLandst = require('users/zzwDoiT/diwufenlei:utils/LandsatC02.js');
var calIndexs = require('users/zzwDoiT/diwufenlei:utils/calIndexs.js');
var interPo = require('users/zzwDoiT/diwufenlei:utils/interPo.js');
var interPoMODIS = require('users/zzwDoiT/diwufenlei:utils/interPowithMODIS.js');
var MAX_CLOUD_PROBABILITY = 50;

/*******************Basic Parameters*******************/
exports.collection = function(region, landsat, year, scale, n, days) {
    /*******************Functions*******************/
    function clipper(image){
      return image.clip(region);
    }
    function reconProperty(image){
      var timeStart = ee.Date(image.get('system:time_start'));
      return ee.Image([]).addBands(image)
            .copyProperties(image, ["system:time_start"])
            .set({
             'date': timeStart.format("YYYY-MM-dd")
            });
    }
    function removeband(image) {
      return image.select(
        image.bandNames().filter(
          ee.Filter.stringContains('item', 'timestamp').not()));
    }
    function getDOY(image){
      var doy =  ee.Date(image.get('system:time_start')).getRelative('day', 'year');
      var banddate = ee.Image(doy).toFloat().updateMask(image.mask().select(0));
      return image.addBands(banddate.rename('DOY'));
    }
    function getMOY(image){
      var doy =  ee.Date(image.get('system:time_start')).getRelative('month', 'year');
      var banddate = ee.Image(doy).toFloat().updateMask(image.mask().select(0));
      return image.addBands(banddate.rename('MOY'));
    }
    var START_DATE = ee.Date(year+'-01-01');
    var END_DATE = ee.Date((year+1)+'-01-01');
    /*******************Data Preprocessing*******************/
    var oeel=require('users/OEEL/lib:loadAll');
    var S2Cloudfree=oeel.Algorithms.Sentinel2.cloudfree(MAX_CLOUD_PROBABILITY,S2sr).map(calIndexs.renameS2);
    var landsatCloudfree = ee.ImageCollection(getLandst.collection(landsat));
    // Filter input collections by desired data range and region.
    var originalCollection = landsatCloudfree.filterBounds(region)//.filter(ee.Filter.contains('.geo', region))
                  .filterDate(START_DATE, END_DATE)
                  .map(reconProperty).map(clipper)
                  .map(calIndexs.calNDVI)
                  //.map(calIndexs.calNDVIedge1)
                  .map(calIndexs.calRVI)
                  .map(calIndexs.calEVI)
                  .map(calIndexs.calGI)
                  .map(calIndexs.calVIgreen)
                  .map(calIndexs.calGNDVI)
                  .map(calIndexs.calNDVI_GRAD)
                  .map(calIndexs.calGLCM);
    var MOD09A1_CF = ee.ImageCollection('MODIS/061/MOD09A1').filterBounds(region)//.filter(ee.Filter.contains('.geo', region))
                   .filterDate(START_DATE, END_DATE)
                   .map(calIndexs.cloudfree_mod09a1)
                   .map(calIndexs.renameMODIS)
                   .map(reconProperty).map(clipper)
                   .map(calIndexs.calNDVI)
                   .map(calIndexs.calRVI)
                   .map(calIndexs.calEVI)
                   .map(calIndexs.calGI)
                   .map(calIndexs.calVIgreen)
                   .map(calIndexs.calGNDVI)
                   .map(calIndexs.calNDVI_GRAD)
                   .map(calIndexs.calGLCM);
    //print(originalCollection);
    
    /*******************Regular*******************/
    //var regularCol = interPo.collection(originalCollection, n, days);
    var regularCol = interPoMODIS.collection(originalCollection, MOD09A1_CF, n, days);
    //print(regularCol.first());
    /*******************SavatskyGolayFilter*******************/
    // https://www.open-geocomputing.org/OpenEarthEngineLibrary/#.ImageCollection.SavatskyGolayFilter
    var millis = ee.Number(days).multiply(1000*60*60*24);
    var maxDiffFilter = ee.Filter.maxDifference({
          difference: millis,
          leftField: 'system:time_start',
          rightField: 'system:time_start'
        });
    // Use the default distanceFunction
    var distanceFunction = function(infromedImage, estimationImage) {
      return ee.Image.constant(
          ee.Number(infromedImage.get('system:time_start'))
          .subtract(
            ee.Number(estimationImage.get('system:time_start')))
            );
      };
    
    // Apply smoothing
    var order = 3;
    
    var sgFilteredCol = oeel.ImageCollection.SavatskyGolayFilter(
      regularCol, 
      maxDiffFilter,
      distanceFunction,
      order);
    
    //print(sgFilteredCol.first());
    // Define a function to remove the prefix from band names
    var removePrefix = function(image) {
      // Get the list of band names
      var bandNames = image.bandNames();
      // Create a new list of band names without the prefix
      var newBandNames = bandNames.map(function(bandName) {
        return ee.String(bandName).replace('d_0_', '');
      });
      // Rename the bands
      return image.select(bandNames, newBandNames);
    };
    
    
    var updateSG = function(image) {
      // Get the list of band names
      var id = image.get('system:index');
      var bandNames = image.bandNames();
      
      // Filter the collection based on the image's ID and select the first image
      var replaceimg = ee.Image(sgFilteredCol.filter(ee.Filter.eq('system:index', id)).first());
      
      // Select the corresponding bands from the selected image
      var selectedBands = replaceimg.select(bandNames);
      
      // Update the mask of the original image using the unmasked pixels from the selected image
      return image.unmask(selectedBands);
    };

    // Map the function over the image collection to remove the prefix
    var updateSGCol = sgFilteredCol.select(['d_0_.*']).map(removePrefix);
    updateSGCol = updateSGCol.map(updateSG);
    
    /*******************Export*******************/
    var outCol = updateSGCol.filterDate(START_DATE, END_DATE)
                .map(removeband).map(getDOY).map(getMOY);
    //print(outCol.first());
    
    return outCol;
    /*
              .select(['G', 'R', 'NIR', 'SWIR1', 'SWIR2',
                      'NDVI', 'RVI', 'EVI', 'GI', 'VIgreen',
                      'GNDVI', 'NDVI_GRAD', 'constant_svar']);
                      */
};
