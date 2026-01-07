const TWO_PI = Math.PI * 2;

// Clamp to [ -Math.PI, Math.PI ]
export function fixAngle( a ) {  
  if ( a > Math.PI ) {
    return a % TWO_PI - TWO_PI;
  }
  else if ( a < -Math.PI ) {
    return a % TWO_PI + TWO_PI;
  }
  else {
    return a;
  }
}

export function deltaAngle( a, b, counterclockwise = false ) {

  // console.log( `deltaAngle( ${ a }, ${ b }, ${ counterclockwise } )` );

  const delta = fixAngle( b ) - fixAngle( a );

  // console.log( `  delta = ${ delta }` );

  if ( delta < 0 && !counterclockwise ) {
    return TWO_PI + delta;
  }
  else if ( delta > 0 && counterclockwise ) {
    return delta - TWO_PI;
  }
  else {
    return delta;
  }
}

export function isBetweenAngles( testAngle, startAngle, endAngle, counterclockwise = false ) {

  // console.log( `isBetweenAngles( ${ testAngle }, ${ startAngle }, ${ endAngle } )` );

  // Normalize angles
  const test = fixAngle( testAngle );
  const start = fixAngle( counterclockwise ? endAngle : startAngle );
  const end = fixAngle( counterclockwise ? startAngle : endAngle );

  // Handle wrap-around
  if ( start < end ) {
    // return test >= start && test <= end;
    return test > start && test < end;
  }
  else {
    // return test >= start || test <= end;
    return test > start || test < end;
  }
}