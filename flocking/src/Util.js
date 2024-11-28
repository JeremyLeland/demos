//
// Angles
//

export function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

export function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

export function clampAngle( angle, left, right ) {
  if ( left < right ) {
    if ( left < angle && angle < right ) {
      return angle;
    }
  }
  else {
    if ( angle < right || left < angle ) {
      return angle;
    }
  }

  const dLeft = Math.abs( deltaAngle( left, angle ) );
  const dRight = Math.abs( deltaAngle( angle, right ) );

  return dLeft < dRight ? left : right;
}

export function closerToZero( a, b ) {
  return b < 0 ? ( b < a && a < 0 ) : ( 0 < a && a < b );
}

//
// Math
//

const EPSILON = 1e-6;

export function solveQuadratic( A, B, C ) {
  if ( Math.abs( A ) < EPSILON ) {
    return -C / B;
  }
  else {
    const disc = B * B - 4 * A * C;

    if ( disc < 0 ) {
      return Infinity;
    }
    else {
      const t0 = ( -B - Math.sqrt( disc ) ) / ( 2 * A );
      const t1 = ( -B + Math.sqrt( disc ) ) / ( 2 * A );
      
      return t0 < 0 ? t1 : t0;
    }
  }
}