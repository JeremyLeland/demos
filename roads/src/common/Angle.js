const TWO_PI = Math.PI * 2;

// Normalize to [ -π, π ]
export function fixAngle( a ) {
  return ( ( a + Math.PI ) % ( 2 * Math.PI ) ) - Math.PI;
}

// Normalize to [ 0, 2π )
// export function fixAngle( a ) {
//   return ( a % TWO_PI + TWO_PI ) % TWO_PI;
// }

export function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

export function sweepAngle( a, b, counterclockwise ) { 
  const delta = deltaAngle( a, b );

  if ( delta < 0 && !counterclockwise ) {
    return delta + TWO_PI;
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