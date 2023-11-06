/**
 * Generates a hex grid with a unique ID in each grid cell.
 * 
 * Args:
 *    proj: Projection to use
 *    diameter: diameter of each hexagon from edge to edge in projection units.
 *    strict: when true, masks off every other grid cell.
 *
 * Returns an image containing unqiue IDs in a hexagonal grid pattern.
 * 
 * Based on http://playtechs.blogspot.com/2007/04/hex-grids.html
 */
var hexGrid = function(proj, diameter, strict) {
  var size = ee.Number(diameter).divide(Math.sqrt(3)); // Distance from center to vertex
  
  var coords = ee.Image.pixelCoordinates(proj);
  var vals = {
    // Switch x and y here to get flat top instead of pointy top hexagons.
    x: coords.select("x"),
    u: coords.select("x").divide(diameter),  // term 1
    v: coords.select("y").divide(size),      // term 2
    r: ee.Number(diameter).divide(2),
  };
  var i = ee.Image().expression("floor((floor(u - v) + floor(x / r))/3)", vals);
  var j = ee.Image().expression("floor((floor(u + v) + floor(v - u))/3)", vals);
  
  // Turn the hex coordinates into a single "ID" number.
  var cells = i.long().leftShift(32).add(j.long()).rename("hexgrid");
  
  // Mask off every other cell when 'strict' is true.
  var mask = i.mod(2).and(j.mod(2));
  return ee.Image(ee.Algorithms.If(strict, cells.updateMask(mask), cells));
};

/**
 * Generates a random image and selects the point with the maximum value in each
 * homogenous region in the 'cells' image.
 */
var pointsWithBuffer = function(cells, region, seed) {
  // Generate another random image and select the maximum random value 
  // in each grid cell as the sample point.
  var random = ee.Image.random(seed).multiply(1000000).int();
  var maximum = cells.addBands(random).reduceConnectedComponents(ee.Reducer.max());
  
  // Find all the points that are local maximums and convert to a FeatureCollection.
  var points = random.eq(maximum).selfMask();
  var samples = points.reduceToVectors({
    reducer: ee.Reducer.countEvery(),
    geometry: region,
    crs: cells.projection().scale(1/16, 1/16),
    geometryType: 'centroid',
    maxPixels: 1e9,
  }).filterBounds(region);

  return samples;
};

// Translates a projection by a random amount between 0 and 1 in projection units.
var randomOffset = function(projection, seed) {
  var values = ee.FeatureCollection([ee.Feature(null, null)])
    .randomColumn('x', seed)
    .randomColumn('y', seed)
    .first();
  return projection.translate(values.get("x"), values.get("y"));
};
exports = {
  hexGrid:  hexGrid,
  pointsWithBuffer: pointsWithBuffer,
  randomOffset: randomOffset,
};