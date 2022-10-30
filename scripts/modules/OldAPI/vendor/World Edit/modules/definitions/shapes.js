export const SHAPES = {
  // Variables ( x, y, z, xMin, xMax, yMin, yMax, zMin, zMax, xCenter, yCenter, zCenter, xRadius, yRadius, zRadius, minRadius )
  fill: "true",
  sphere: "x * x + y * y + z * z <= rad * rad",
  cube: "true",

  square_pyramid: "Math.abs(x) + Math.abs(y) + z - zMin = 0",
  cone: "Math.abs(Math.sqrt(x^2 + y^2)) + Math.abs(z) - zMin = 0",
  tetrahedron:
    "Math.abs(-x) + Math.abs(x) + Math.abs(y) + Math.abs(z) - yMin , zMin = 0",
  triangle_prism:
    "Math.abs(Math.abs(-x)/2 + Math.abs(x)/2 + Math.abs(y) - z) + Math.abs(Math.abs(-x)/2 + Math.abs(x)/2 + Math.abs(y) + z) - yMin = 0",

  t: "Math.abs( Math.abs( x / xRadius )   +   ( y / yRadius ) )   +   Math.abs( x / xRadius) <= 1",
  tt: "Math.abs( Math.abs( Math.abs(x / xRadius) + (y / yRadius)) + Math.abs(x / xRadius) + z / zRadius ) + Math.abs( Math.abs( x / xRadius ) +   ( y / yRadius ) )   +   Math.abs( x / xRadius) <= 1",
  outline:
    "x + xCenter == xMin || x + xCenter == xMax || y + yCenter == yMin || y + yCenter == yMax || z + zCenter == zMin || z + zCenter == zMax",
  hollow:
    "x + xCenter != xMin && x + xCenter != xMax && y + yCenter != yMin && y + yCenter != yMax && z + zCenter != zMin && z + zCenter != zMax",
  border_line:
    "((x + xCenter == xMin || x + xCenter == xMax) && (y + yCenter == yMin || y + yCenter == yMax))    ||    ((y + yCenter == yMin || y + yCenter == yMax) && (z + zCenter == zMin || z + zCenter == zMax))    ||    ((z + zCenter == zMin || z + zCenter == zMax) && (x + xCenter == xMin || x + xCenter == xMax))",

  wall_x:
    "y + yCenter == yMin || y + yCenter == yMax || z + zCenter == zMin || z + zCenter == zMax",
  wall_y:
    "x + xCenter == xMin || x + xCenter == xMax || z + zCenter == zMin || z + zCenter == zMax",
  wall_z:
    "x + xCenter == xMin || x + xCenter == xMax || y + yCenter == yMin || y + yCenter == yMax",

  rounded_corner_1:
    "Math.pow(  Math.abs(  (x)/xRadius  ),  5) + Math.pow( Math.abs((y)/yRadius) ,5) + Math.pow( Math.abs((z)/zRadius) ,5) <= 1",
  rounded_corner_2:
    "Math.pow(  Math.abs(  (x)/xRadius  ),  3) + Math.pow( Math.abs((y)/yRadius) ,3) + Math.pow( Math.abs((z)/zRadius) ,3) <= 1",
  ellipse:
    "Math.pow((x)/(xRadius), 2) + Math.pow((y)/(yRadius), 2) + Math.pow((z)/(zRadius), 2) <= 1",
  octahedron:
    "Math.pow( Math.abs((x)/xRadius) ,1) + Math.pow( Math.abs((y)/yRadius) ,1) + Math.pow( Math.abs((z)/zRadius) ,1) <= 1",
  astroid_1:
    "Math.pow( Math.abs((x)/xRadius) ,0.7) + Math.pow( Math.abs((y)/yRadius) ,0.7) + Math.pow( Math.abs( (z)/zRadius) ,0.7) <= 1",
  astroid_1x:
    "Math.pow( x/xRadius ,0.7) + Math.pow( Math.abs(y/yRadius) ,0.7) + Math.pow( Math.abs(z/zRadius) ,0.7) <= 1",
  astroid_1y:
    "Math.pow( Math.abs(x/xRadius) ,0.7) + Math.pow( y/yRadius ,0.7) + Math.pow( Math.abs(z/zRadius) ,0.7) <= 1",
  astroid_1z:
    "Math.pow( Math.abs(x/xRadius) ,0.7) + Math.pow( Math.abs(y/yRadius) ,0.7) + Math.pow( z/zRadius ,0.7) <= 1",

  astroid_2:
    "Math.pow( Math.abs((x)/xRadius) ,0.5) + Math.pow( Math.abs((y)/yRadius) ,0.5) + Math.pow( Math.abs( (z)/zRadius) ,0.5) <= 1",
  astroid_2x:
    "Math.pow( x/xRadius ,0.5) + Math.pow( Math.abs(y/yRadius) ,0.5) + Math.pow( Math.abs(z/zRadius) ,0.5) <= 1",
  astroid_2y:
    "Math.pow( Math.abs(x/xRadius) ,0.5) + Math.pow( y/yRadius ,0.5) + Math.pow( Math.abs(z/zRadius) ,0.5) <= 1",
  astroid_2z:
    "Math.pow( Math.abs(x/xRadius) ,0.5) + Math.pow( Math.abs(y/yRadius) ,0.5) + Math.pow( z/zRadius ,0.5) <= 1",

  astroid_3:
    "Math.pow( Math.abs((x)/xRadius) ,0.3) + Math.pow( Math.abs((y)/yRadius) ,0.3) + Math.pow( Math.abs( (z)/zRadius) ,0.3) <= 1",
  astroid_3x:
    "Math.pow( x/xRadius ,0.3) + Math.pow( Math.abs(y/yRadius) ,0.3) + Math.pow( Math.abs(z/zRadius) ,0.3) <= 1",
  astroid_3y:
    "Math.pow( Math.abs(x/xRadius) ,0.3) + Math.pow( y/yRadius ,0.3) + Math.pow( Math.abs(z/zRadius) ,0.3) <= 1",
  astroid_3z:
    "Math.pow( Math.abs(x/xRadius) ,0.3) + Math.pow( Math.abs(y/yRadius) ,0.3) + Math.pow( z/zRadius ,0.3) <= 1",

  cylinder_x:
    "Math.pow(y, 2)/(yRadius*yRadius) + Math.pow((z), 2)/(zRadius*zRadius) <= 1",
  cylinder_y:
    "Math.pow(x, 2)/(xRadius*xRadius) + Math.pow((z), 2)/(zRadius*zRadius) <= 1",
  cylinder_z:
    "Math.pow(x, 2)/(xRadius*xRadius) + Math.pow((y), 2)/(yRadius*yRadius) <= 1",

  torus_x:
    "Math.pow((  Math.min(yRadius, zRadius) /1.35) - Math.sqrt( (y*y) + (z*z) ), 2) + (x*x) <= Math.pow(  Math.min(yRadius, xRadius)  -(  Math.min(yRadius, zRadius)  /1.35),2)",
  torus_y:
    "Math.pow((  Math.min(xRadius, zRadius) /1.35) - Math.sqrt( (x*x) + (z*z) ), 2) + (y*y) <= Math.pow(  Math.min(xRadius, zRadius)  -(  Math.min(xRadius, zRadius)  /1.35),2)",
  torus_z:
    "Math.pow((  Math.min(xRadius, yRadius) /1.35) - Math.sqrt( (x*x) + (y*y) ), 2) + (z*z) <= Math.pow(  Math.min(xRadius, yRadius)  -(  Math.min(xRadius, yRadius)  /1.35),2)",

  slope1: "(x)/xRadius + (y)/yRadius + (z)/zRadius <= 0",
  slope2: "(x)/xRadius + (y)/yRadius - (z)/zRadius <= 0",
  slope3: "- (x)/xRadius + (y)/yRadius + (z)/zRadius <= 0",
  slope4: "- (x)/xRadius + (y)/yRadius - (z)/zRadius <= 0",

  hour_glass_x:
    "Math.pow((y), 2)/(yRadius*yRadius) + Math.pow((z), 2)/(zRadius*zRadius) <= Math.pow((x), 2)/(xRadius*xRadius)",
  hour_glass_y:
    "Math.pow((x), 2)/(xRadius*xRadius) + Math.pow((z), 2)/(zRadius*zRadius) <= Math.pow((y), 2)/(yRadius*yRadius)",
  hour_glass_z:
    "Math.pow((x), 2)/(xRadius*xRadius) + Math.pow((y), 2)/(yRadius*yRadius) <= Math.pow((z), 2)/(zRadius*zRadius)",

  hour_glass_x_upper:
    "Math.sqrt((yRadius*yRadius)*(y*y) + (zRadius*zRadius)*(z*z)) <= x",
  hour_glass_x_lower:
    "Math.sqrt((yRadius*yRadius)*(y*y) + (zRadius*zRadius)*(z*z)) <= -x",
  hour_glass_y_upper:
    "Math.sqrt((xRadius*xRadius)*(x*x) + (zRadius*zRadius)*(z*z)) <= y",
  hour_glass_y_lower:
    "Math.sqrt((xRadius*xRadius)*(x*x) + (zRadius*zRadius)*(z*z)) <= -y",
  hour_glass_z_upper:
    "Math.sqrt((xRadius*xRadius)*(x*x) + (yRadius*yRadius)*(y*y)) <= z",
  hour_glass_z_lower:
    "Math.sqrt((xRadius*xRadius)*(x*x) + (yRadius*yRadius)*(y*y)) <= -z",

  hyperboloid_of_one_sheet_x:
    "Math.pow((y), 2)/(yRadius*yRadius) + Math.pow((z ), 2)/(zRadius*zRadius) - Math.pow((x ), 2)/(xRadius*xRadius) <= 1",
  hyperboloid_of_one_sheet_y:
    "Math.pow((x), 2)/(xRadius*xRadius) + Math.pow((z ), 2)/(zRadius*zRadius) - Math.pow((y ), 2)/(yRadius*yRadius) <= 1",
  hyperboloid_of_one_sheet_z:
    "Math.pow((x), 2)/(xRadius*xRadius) + Math.pow((y ), 2)/(yRadius*yRadius) - Math.pow((z ), 2)/(zRadius*zRadius) <= 1",

  elliptic_paraboloid_x:
    "Math.pow((y - yCenter), 2)/(yRadius*yRadius) + Math.pow((z - zCenter), 2)/(zRadius*zRadius) <= x/xRadius",
  elliptic_paraboloid_x_inverted:
    "Math.pow((y - yCenter), 2)/(yRadius*yRadius) + Math.pow((z - zCenter), 2)/(zRadius*zRadius) <= x/-xRadius",
  elliptic_paraboloid_y:
    "Math.pow((x - xCenter), 2)/(xRadius*xRadius) + Math.pow((z - zCenter), 2)/(zRadius*zRadius) <= y/yRadius",
  elliptic_paraboloid_y_inverted:
    "Math.pow((x - xCenter), 2)/(xRadius*xRadius) + Math.pow((z - zCenter), 2)/(zRadius*zRadius) <= y/-yRadius",
  elliptic_paraboloid_z:
    "Math.pow((x - xCenter), 2)/(xRadius*xRadius) + Math.pow((y - yCenter), 2)/(yRadius*yRadius) <= z/yRadius",
  elliptic_paraboloid_z_inverted:
    "Math.pow((x - xCenter), 2)/(xRadius*xRadius) + Math.pow((y - yCenter), 2)/(yRadius*yRadius) <= z/-yRadius",

  hyperbolic_paraboloid_x:
    "Math.pow((y) /(yRadius), 2) - Math.pow((z) /(zRadius), 2) <= x/xRadius",
  hyperbolic_paraboloid_y:
    "Math.pow((x) /(xRadius), 2) - Math.pow((z) /(zRadius), 2) <= y/yRadius",
  hyperbolic_paraboloid_z:
    "Math.pow((x) /(xRadius), 2) - Math.pow((y) /(yRadius), 2) <= z/zRadius",
};
