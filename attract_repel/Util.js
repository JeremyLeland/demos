export function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

export function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

export function betweenAngles( angle, left, right, inclusive = true ) {
  const fAngle = fixAngle( angle );
  const fLeft = fixAngle( left );
  const fRight = fixAngle( right );

  const EPSILON = ( inclusive ? 1 : -1 ) * -0.0000001;
  const dLeft = EPSILON < fAngle - fLeft;
  const dRight = EPSILON < fRight - fAngle;

  return fLeft < fRight ? dLeft && dRight : dLeft || dRight;
}

export function closestAngle( angle, left, right ) {
  const dLeft = Math.abs( deltaAngle( left, angle ) );
  const dRight = Math.abs( deltaAngle( angle, right ) );
  return dLeft < dRight ? left : right;
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