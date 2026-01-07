const TWO_PI = Math.PI * 2;

export function deltaAngle( a, b ) {
  return ( ( b - a + Math.PI ) % ( 2 * Math.PI ) ) - Math.PI;
}

// Normalize to [ 0, 2π )
function fixAngle( a ) {
  return ( a % TWO_PI + TWO_PI ) % TWO_PI;
}

export function sweepAngle( a, b, counterclockwise ) { 
  const diff = fixAngle( b - a );

  if ( counterclockwise && diff !== 0 ) {
    return diff - TWO_PI;
  }
  else {
    return diff;
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