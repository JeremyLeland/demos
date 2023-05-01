export function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

export function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

export function betweenAngles( angle, left, right, inclusive = true ) {
  const EPSILON = ( inclusive ? 1 : -1 ) * -0.1;
  const dLeft = EPSILON < deltaAngle( left, angle );
  const dRight = EPSILON < deltaAngle( angle, right );

  return left < right ? dLeft && dRight : dLeft || dRight;
}