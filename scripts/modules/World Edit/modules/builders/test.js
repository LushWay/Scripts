let DefaultModes = {
  // Variables ( x, y, z, xmin, xmax, ymin, ymax, zmin, zmax, xCenter, yCenter, zCenter, aRadius, bRadius, cRadius, minRadius )
  fill: "true",

  t: "Math.abs( Math.abs( x / aRadius )   +   ( y / bRadius ) )   +   Math.abs( x / aRadius) <= 1",
  tt: "Math.abs( Math.abs( Math.abs(x / aRadius) + (y / bRadius)) + Math.abs(x / aRadius) + z / cRadius ) + Math.abs( Math.abs( x / aRadius ) +   ( y / bRadius ) )   +   Math.abs( x / aRadius) <= 1",
  outline:
    "x + xCenter == xmin || x + xCenter == xmax || y + yCenter == ymin || y + yCenter == ymax || z + zCenter == zmin || z + zCenter == zmax",
  hollow:
    "x + xCenter != xmin && x + xCenter != xmax && y + yCenter != ymin && y + yCenter != ymax && z + zCenter != zmin && z + zCenter != zmax",
  border_line:
    "((x + xCenter == xmin || x + xCenter == xmax) && (y + yCenter == ymin || y + yCenter == ymax))    ||    ((y + yCenter == ymin || y + yCenter == ymax) && (z + zCenter == zmin || z + zCenter == zmax))    ||    ((z + zCenter == zmin || z + zCenter == zmax) && (x + xCenter == xmin || x + xCenter == xmax))",

  wall_x:
    "y + yCenter == ymin || y + yCenter == ymax || z + zCenter == zmin || z + zCenter == zmax",
  wall_y:
    "x + xCenter == xmin || x + xCenter == xmax || z + zCenter == zmin || z + zCenter == zmax",
  wall_z:
    "x + xCenter == xmin || x + xCenter == xmax || y + yCenter == ymin || y + yCenter == ymax",

  rounded_corner_1:
    "Math.pow(  Math.abs(  (x)/aRadius  ),  5) + Math.pow( Math.abs((y)/bRadius) ,5) + Math.pow( Math.abs((z)/cRadius) ,5) <= 1",
  rounded_corner_2:
    "Math.pow(  Math.abs(  (x)/aRadius  ),  3) + Math.pow( Math.abs((y)/bRadius) ,3) + Math.pow( Math.abs((z)/cRadius) ,3) <= 1",
  ellipse:
    "Math.pow((x)/(aRadius), 2) + Math.pow((y)/(bRadius), 2) + Math.pow((z)/(cRadius), 2) <= 1",
  octahedron:
    "Math.pow( Math.abs((x)/aRadius) ,1) + Math.pow( Math.abs((y)/bRadius) ,1) + Math.pow( Math.abs((z)/cRadius) ,1) <= 1",
  astroid_1:
    "Math.pow( Math.abs((x)/aRadius) ,0.7) + Math.pow( Math.abs((y)/bRadius) ,0.7) + Math.pow( Math.abs( (z)/cRadius) ,0.7) <= 1",
  astroid_1x:
    "Math.pow( x/aRadius ,0.7) + Math.pow( Math.abs(y/bRadius) ,0.7) + Math.pow( Math.abs(z/cRadius) ,0.7) <= 1",
  astroid_1y:
    "Math.pow( Math.abs(x/aRadius) ,0.7) + Math.pow( y/bRadius ,0.7) + Math.pow( Math.abs(z/cRadius) ,0.7) <= 1",
  astroid_1z:
    "Math.pow( Math.abs(x/aRadius) ,0.7) + Math.pow( Math.abs(y/bRadius) ,0.7) + Math.pow( z/cRadius ,0.7) <= 1",

  astroid_2:
    "Math.pow( Math.abs((x)/aRadius) ,0.5) + Math.pow( Math.abs((y)/bRadius) ,0.5) + Math.pow( Math.abs( (z)/cRadius) ,0.5) <= 1",
  astroid_2x:
    "Math.pow( x/aRadius ,0.5) + Math.pow( Math.abs(y/bRadius) ,0.5) + Math.pow( Math.abs(z/cRadius) ,0.5) <= 1",
  astroid_2y:
    "Math.pow( Math.abs(x/aRadius) ,0.5) + Math.pow( y/bRadius ,0.5) + Math.pow( Math.abs(z/cRadius) ,0.5) <= 1",
  astroid_2z:
    "Math.pow( Math.abs(x/aRadius) ,0.5) + Math.pow( Math.abs(y/bRadius) ,0.5) + Math.pow( z/cRadius ,0.5) <= 1",

  astroid_3:
    "Math.pow( Math.abs((x)/aRadius) ,0.3) + Math.pow( Math.abs((y)/bRadius) ,0.3) + Math.pow( Math.abs( (z)/cRadius) ,0.3) <= 1",
  astroid_3x:
    "Math.pow( x/aRadius ,0.3) + Math.pow( Math.abs(y/bRadius) ,0.3) + Math.pow( Math.abs(z/cRadius) ,0.3) <= 1",
  astroid_3y:
    "Math.pow( Math.abs(x/aRadius) ,0.3) + Math.pow( y/bRadius ,0.3) + Math.pow( Math.abs(z/cRadius) ,0.3) <= 1",
  astroid_3z:
    "Math.pow( Math.abs(x/aRadius) ,0.3) + Math.pow( Math.abs(y/bRadius) ,0.3) + Math.pow( z/cRadius ,0.3) <= 1",

  cylinder_x:
    "Math.pow(y, 2)/(bRadius*bRadius) + Math.pow((z), 2)/(cRadius*cRadius) <= 1",
  cylinder_y:
    "Math.pow(x, 2)/(aRadius*aRadius) + Math.pow((z), 2)/(cRadius*cRadius) <= 1",
  cylinder_z:
    "Math.pow(x, 2)/(aRadius*aRadius) + Math.pow((y), 2)/(bRadius*bRadius) <= 1",

  torus_x:
    "Math.pow((  Math.min(bRadius, cRadius) /1.35) - Math.sqrt( (y*y) + (z*z) ), 2) + (x*x) <= Math.pow(  Math.min(bRadius, aRadius)  -(  Math.min(bRadius, cRadius)  /1.35),2)",
  torus_y:
    "Math.pow((  Math.min(aRadius, cRadius) /1.35) - Math.sqrt( (x*x) + (z*z) ), 2) + (y*y) <= Math.pow(  Math.min(aRadius, cRadius)  -(  Math.min(aRadius, cRadius)  /1.35),2)",
  torus_z:
    "Math.pow((  Math.min(aRadius, bRadius) /1.35) - Math.sqrt( (x*x) + (y*y) ), 2) + (z*z) <= Math.pow(  Math.min(aRadius, bRadius)  -(  Math.min(aRadius, bRadius)  /1.35),2)",

  slope1: "(x)/aRadius + (y)/bRadius + (z)/cRadius <= 0",
  slope2: "(x)/aRadius + (y)/bRadius - (z)/cRadius <= 0",
  slope3: "- (x)/aRadius + (y)/bRadius + (z)/cRadius <= 0",
  slope4: "- (x)/aRadius + (y)/bRadius - (z)/cRadius <= 0",

  hour_glass_x:
    "Math.pow((y), 2)/(bRadius*bRadius) + Math.pow((z), 2)/(cRadius*cRadius) <= Math.pow((x), 2)/(aRadius*aRadius)",
  hour_glass_y:
    "Math.pow((x), 2)/(aRadius*aRadius) + Math.pow((z), 2)/(cRadius*cRadius) <= Math.pow((y), 2)/(bRadius*bRadius)",
  hour_glass_z:
    "Math.pow((x), 2)/(aRadius*aRadius) + Math.pow((y), 2)/(bRadius*bRadius) <= Math.pow((z), 2)/(cRadius*cRadius)",

  hour_glass_x_upper:
    "Math.sqrt((bRadius*bRadius)*(y*y) + (cRadius*cRadius)*(z*z)) <= x",
  hour_glass_x_lower:
    "Math.sqrt((bRadius*bRadius)*(y*y) + (cRadius*cRadius)*(z*z)) <= -x",
  hour_glass_y_upper:
    "Math.sqrt((aRadius*aRadius)*(x*x) + (cRadius*cRadius)*(z*z)) <= y",
  hour_glass_y_lower:
    "Math.sqrt((aRadius*aRadius)*(x*x) + (cRadius*cRadius)*(z*z)) <= -y",
  hour_glass_z_upper:
    "Math.sqrt((aRadius*aRadius)*(x*x) + (bRadius*bRadius)*(y*y)) <= z",
  hour_glass_z_lower:
    "Math.sqrt((aRadius*aRadius)*(x*x) + (bRadius*bRadius)*(y*y)) <= -z",

  hyperboloid_of_one_sheet_x:
    "Math.pow((y), 2)/(bRadius*bRadius) + Math.pow((z ), 2)/(cRadius*cRadius) - Math.pow((x ), 2)/(aRadius*aRadius) <= 1",
  hyperboloid_of_one_sheet_y:
    "Math.pow((x), 2)/(aRadius*aRadius) + Math.pow((z ), 2)/(cRadius*cRadius) - Math.pow((y ), 2)/(bRadius*bRadius) <= 1",
  hyperboloid_of_one_sheet_z:
    "Math.pow((x), 2)/(aRadius*aRadius) + Math.pow((y ), 2)/(bRadius*bRadius) - Math.pow((z ), 2)/(cRadius*cRadius) <= 1",

  elliptic_paraboloid_x:
    "Math.pow((y - yCenter), 2)/(bRadius*bRadius) + Math.pow((z - zCenter), 2)/(cRadius*cRadius) <= x/aRadius",
  elliptic_paraboloid_x_inverted:
    "Math.pow((y - yCenter), 2)/(bRadius*bRadius) + Math.pow((z - zCenter), 2)/(cRadius*cRadius) <= x/-aRadius",
  elliptic_paraboloid_y:
    "Math.pow((x - xCenter), 2)/(aRadius*aRadius) + Math.pow((z - zCenter), 2)/(cRadius*cRadius) <= y/bRadius",
  elliptic_paraboloid_y_inverted:
    "Math.pow((x - xCenter), 2)/(aRadius*aRadius) + Math.pow((z - zCenter), 2)/(cRadius*cRadius) <= y/-bRadius",
  elliptic_paraboloid_z:
    "Math.pow((x - xCenter), 2)/(aRadius*aRadius) + Math.pow((y - yCenter), 2)/(bRadius*bRadius) <= z/bRadius",
  elliptic_paraboloid_z_inverted:
    "Math.pow((x - xCenter), 2)/(aRadius*aRadius) + Math.pow((y - yCenter), 2)/(bRadius*bRadius) <= z/-bRadius",

  hyperbolic_paraboloid_x:
    "Math.pow((y) /(bRadius), 2) - Math.pow((z) /(cRadius), 2) <= x/aRadius",
  hyperbolic_paraboloid_y:
    "Math.pow((x) /(aRadius), 2) - Math.pow((z) /(cRadius), 2) <= y/bRadius",
  hyperbolic_paraboloid_z:
    "Math.pow((x) /(aRadius), 2) - Math.pow((y) /(bRadius), 2) <= z/cRadius",
};

function placeBlock(p0, p1, mode, Callback) {
  let values = {
    xmin: Math.min(p0.x, p1.x),
    xmax: Math.max(p0.x, p1.x),
    ymin: Math.min(p0.y, p1.y),
    ymax: Math.max(p0.y, p1.y),
    zmin: Math.min(p0.z, p1.z),
    zmax: Math.max(p0.z, p1.z),
    get rada() {
      return (this.xmax - this.xmin) / 2;
    },
    get radb() {
      return (this.ymax - this.ymin) / 2;
    },
    get radc() {
      return (this.zmax - this.zmin) / 2;
    },
    get cx() {
      return (this.xmax + this.xmin) / 2;
    },
    get cy() {
      return (this.ymax + this.ymin) / 2;
    },
    get cz() {
      return (this.zmax + this.zmin) / 2;
    },
  };

  let condition = mode;

  let fill_mode = new Function( 
    "x",
    "y",
    "z",
    "values",
    "return " +
      condition.replace(
        new RegExp(Object.keys(values), "gi"),
        (match) => "values." + match
      )
  );
  for (let x = Position.xmin - values.cx; x <= Position.xmax - values.cx; x++) {
    for (
      let y = Position.ymin - values.cy;
      y <= Position.ymax - values.cy;
      y++
    ) {
      for (
        let z = Position.zmin - values.cz;
        z <= Position.zmax - values.cz;
        z++
      ) {
        if (!fill_mode(x, y, z, Position)) continue;

        let X = x + values.cx;
        let Y = y + values.cy;
        let Z = z + values.cz;
        // setblock at XYZ
      }
    }
  }
}
