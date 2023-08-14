/*******************Functions*******************/
function clipper(image){
    return image.clip(region);
  }
  
  function renameS2(image){
      var visbands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B11', 'B12'];
      var newbands = ['B', 'G', 'R', 'edgeR1', 'edgeR2', 'edgeR3', 'NIR', 'nNIR', 'WATER', 'SWIR1', 'SWIR2'];
      return image.select(visbands).rename(newbands);
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
      var grey = image.expression('(0.3 * NIR) + (0.59 * R) + (0.11 * G)',{
          'G': image.select(["G"]),
          'R': image.select(['R']),
          'NIR': image.select(['NIR']),
          });
      var glcm = gray.unitScale(0,0.30).multiply(100).toInt().glcmTexture({size: 1,kernel:null});
      return image.addBands(glcm.rename('GLCM'));
  }
  
  
  /******************Exports******************/
  exports = {
      clipper   :  clipper, 
      renameS2  :  renameS2,  
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
  };