// Do the interpolation

// We now write a function that will be used to interpolate all images
// This function takes an image and replaces the masked pixels
// with the interpolated value from before and after images.

var interpolateImages = function(image) {
    image = ee.Image(image);
    // We get the list of before and after images from the image property
    // Mosaic the images so we a before and after image with the closest unmasked pixel
    var beforeImages = ee.List(image.get('before'));
    var beforeMosaic = ee.ImageCollection.fromImages(beforeImages).mosaic();
    var afterImages = ee.List(image.get('after'));
    var afterMosaic = ee.ImageCollection.fromImages(afterImages).mosaic();
  
    // Interpolation formula
    // y = y1 + (y2-y1)*((t – t1) / (t2 – t1))
    // y = interpolated image
    // y1 = before image
    // y2 = after image
    // t = interpolation timestamp
    // t1 = before image timestamp
    // t2 = after image timestamp
    
    // We first compute the ratio (t – t1) / (t2 – t1)
  
    // Get image with before and after times
    var t1 = beforeMosaic.select('timestamp').rename('t1');
    var t2 = afterMosaic.select('timestamp').rename('t2');
  
    var t = image.metadata('system:time_start').rename('t');
  
    var timeImage = ee.Image.cat([t1, t2, t]);
  
    var timeRatio = timeImage.expression('(t - t1) / (t2 - t1)', {
      't': timeImage.select('t'),
      't1': timeImage.select('t1'),
      't2': timeImage.select('t2'),
    });
    // You can replace timeRatio with a constant value 0.5
    // if you wanted a simple average
    
    // Compute an image with the interpolated image y
    var interpolated = beforeMosaic
      .add((afterMosaic.subtract(beforeMosaic).multiply(timeRatio)));
    // Replace the masked pixels in the current image with the average value
    var result = image.unmask(interpolated);
    return result.copyProperties(image, ['system:time_start']);
  };
  
exports.collection = function(originalCollection, n, days){
    // Prepare a regularly-spaced Time-Series
    
    // Generate an empty multi-band image matching the bands
    // in the original collection
    var bandNames = ee.Image(originalCollection.first()).bandNames();
    var numBands = bandNames.size();
    var initBands = ee.List.repeat(ee.Image(), numBands);
    var initImage = ee.ImageCollection(initBands).toBands().rename(bandNames);
    
    // Select the interval. We will have 1 image every n days
    var firstImage = ee.Image(originalCollection.sort('system:time_start').first());
    var lastImage = ee.Image(originalCollection.sort('system:time_start', false).first());
    var timeStart = ee.Date(firstImage.get('system:time_start'));
    var timeEnd = ee.Date(lastImage.get('system:time_start'));
    
    var totalDays = timeEnd.difference(timeStart, 'day');
    var daysToInterpolate = ee.List.sequence(0, totalDays, n);
    
    var initImages = daysToInterpolate.map(function(day) {
    var image = initImage.set({
        'system:index': ee.Number(day).format('%d'),
        'system:time_start': timeStart.advance(day, 'day').millis(),
        'system:id': timeStart.advance(day, 'day').format("YYYY-MM-dd"),
        // Set a property so we can identify interpolated images
        'type': 'interpolated'
    });
    return image;
    });
    
    var initCol = ee.ImageCollection.fromImages(initImages);
    //print('Empty Collection', initCol);
    
    // Merge original and empty collections
    originalCollection = originalCollection.merge(initCol);
    
    // Interpolation
    
    // Add a band containing timestamp to each image
    // This will be used to do pixel-wise interpolation later
    originalCollection = originalCollection.map(function(image) {
    var timeImage = image.metadata('system:time_start').rename('timestamp');
    // The time image doesn't have a mask. 
    // We set the mask of the time band to be the same as the first band of the image
    var timeImageMasked = timeImage.updateMask(image.mask().select(0));
    return image.addBands(timeImageMasked).toFloat();
    });
    
    // For each image in the collection, we need to find all images
    // before and after the specified time-window
    
    // This is accomplished using Joins
    // We need to do 2 joins
    // Join 1: Join the collection with itself to find all images before each image
    // Join 2: Join the collection with itself to find all images after each image
    
    // We first define the filters needed for the join
    
    // Define a maxDifference filter to find all images within the specified days
    // The filter needs the time difference in milliseconds
    // Convert days to milliseconds
    
    // Specify the time-window to look for unmasked pixel
    var millis = ee.Number(days).multiply(1000*60*60*24);
    
    var maxDiffFilter = ee.Filter.maxDifference({
    difference: millis,
    leftField: 'system:time_start',
    rightField: 'system:time_start'
    });
    
    // We need a lessThanOrEquals filter to find all images after a given image
    // This will compare the given image's timestamp against other images' timestamps
    var lessEqFilter = ee.Filter.lessThanOrEquals({
    leftField: 'system:time_start',
    rightField: 'system:time_start'
    });
    
    // We need a greaterThanOrEquals filter to find all images before a given image
    // This will compare the given image's timestamp against other images' timestamps
    var greaterEqFilter = ee.Filter.greaterThanOrEquals({
    leftField: 'system:time_start',
    rightField: 'system:time_start'
    });
    
    
    // Apply the joins
    
    // For the first join, we need to match all images that are after the given image.
    // To do this we need to match 2 conditions
    // 1. The resulting images must be within the specified time-window of target image
    // 2. The target image's timestamp must be lesser than the timestamp of resulting images
    // Combine two filters to match both these conditions
    var filter1 = ee.Filter.and(maxDiffFilter, lessEqFilter);
    // This join will find all images after, sorted in descending order
    // This will gives us images so that closest is last
    var join1 = ee.Join.saveAll({
    matchesKey: 'after',
    ordering: 'system:time_start',
    ascending: false});
    
    var join1Result = join1.apply({
    primary: originalCollection,
    secondary: originalCollection,
    condition: filter1
    });
    // Each image now as a property called 'after' containing
    // all images that come after it within the time-window
    //print(join1Result.first());
    
    // Do the second join now to match all images within the time-window
    // that come before each image
    var filter2 = ee.Filter.and(maxDiffFilter, greaterEqFilter);
    // This join will find all images before, sorted in ascending order
    // This will gives us images so that closest is last
    var join2 = ee.Join.saveAll({
    matchesKey: 'before',
    ordering: 'system:time_start',
    ascending: true});
    
    var join2Result = join2.apply({
    primary: join1Result,
    secondary: join1Result,
    condition: filter2
    });
    
    // Each image now as a property called 'before' containing
    // all images that come after it within the time-window
    //print(join2Result.first());
    
    var joinedCol = join2Result;
    

    
    // map() the function to interpolate all images in the collection
    var interpolatedCol = ee.ImageCollection(joinedCol.map(interpolateImages));
    
    // Once the interpolation are done, remove original images
    // We keep only the generated interpolated images
    var regularCol = interpolatedCol.filter(ee.Filter.eq('type', 'interpolated'));
    
    return regularCol;
};