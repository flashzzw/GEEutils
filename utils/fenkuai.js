exports.collection = function(roi, n, m) {
  roi = roi.geometry();
  var coordinateList = roi.bounds().coordinates().flatten();
  
  var xmin = coordinateList.get(0).getInfo();
  
  var ymin = coordinateList.get(1).getInfo();
  
  var xmax = coordinateList.get(4).getInfo();
  
  var ymax = coordinateList.get(5).getInfo();
  
  // Get dx & dy.
  var dx = (xmax-xmin)/n;
  
  var dy = (ymax-ymin)/m;
  
  // Generate all the rects.
  var gridList=ee.List([]);
  
  var fid = 0;
  
  for(var i=0;i<n;i++)
  
  {
    
    for(var j=0;j<m;j++)
    
    {
      
      if(i==n-1)
      
      {
        
        if(j == m-1)
        
        { 
          
          var coords=[xmin+i*dx,ymin+j*dy,xmax,ymax];
          
        }
        
        else {
          
          var coords=[xmin+i*dx,ymin+j*dy,xmax,ymin+(j+1)*dy]
          
        }
        
      }
      
      else if (j==m-1)
      
      {
        
        var coords=[xmin+i*dx,ymin+j*dy,xmin+(i+1)*dx,ymax]
        
      }
      
      else
      
      {
        
        var coords=[xmin+i*dx,ymin+j*dy,xmin+(i+1)*dx,ymin+(j+1)*dy]
        
      }
      var rect = ee.Feature(ee.Algorithms.GeometryConstructors.Rectangle(ee.List(coords)));
      
      // Filter.
      if(rect.intersects(roi).getInfo()) {
        
        var intersect = rect.intersection(roi);
        
        intersect = intersect.set('grid_id', fid);
        
        fid++;
        
        gridList=gridList.add(intersect);
        
      }
      
    }
    
  }
  // Return.
  return ee.FeatureCollection(gridList);
  
};