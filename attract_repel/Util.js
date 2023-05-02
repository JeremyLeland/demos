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

  const EPSILON = ( inclusive ? 1 : -1 ) * -0.1;
  const dLeft = EPSILON < fAngle - fLeft;
  const dRight = EPSILON < fRight - fAngle;

  return fLeft < fRight ? dLeft && dRight : dLeft || dRight;
}