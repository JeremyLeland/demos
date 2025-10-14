export function getArcLineIntersections( cx, cy, radius, startAngle, endAngle, counterclockwise, x1, y1, x2, y2 ) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * ( fx * dx + fy * dy );
  const c = fx * fx + fy * fy - radius * radius;

  const discriminant = b * b - 4 * a * c;
  const results = [];

  if ( discriminant < 0 ) {
    return results; // No intersection
  }

  const sqrtD = Math.sqrt( discriminant );
  const t1 = ( -b - sqrtD ) / ( 2 * a );
  const t2 = ( -b + sqrtD ) / ( 2 * a );

  [ t1, t2 ].forEach( t => {
    if ( 0 <= t && t <= 1 ) {
      const ix = x1 + t * dx;
      const iy = y1 + t * dy;

      // Angle from center to point
      let angle = Math.atan2(iy - cy, ix - cx);

      if ( isBetweenAngles( angle, startAngle, endAngle, counterclockwise ) ) {
        results.push( [ ix, iy ] );
      }
    }
  } );

  return results; // May be 0, 1, or 2 points
}

function isBetweenAngles( testAngle, startAngle, endAngle, counterclockwise = false ) {
  // Normalize angles
  const test = normalizeAngle( testAngle );
  const start = normalizeAngle( counterclockwise ? endAngle : startAngle );
  const end = normalizeAngle( counterclockwise ? startAngle : endAngle );

  // Handle wrap-around
  if ( start < end ) {
    return test >= start && test <= end;
  }
  else {
    return test >= start || test <= end;
  }
}

function normalizeAngle( angle ) {
  return angle + ( 2 * Math.PI ) % ( 2 * Math.PI );
}

export function getLineLineIntersection( x1, y1, x2, y2, x3, y3, x4, y4 ) {
  const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );
  
  // Is there a meaningful parallel/collinear case to account for here?
  // TODO: You could have two collinear segments that touch each other.
  //       It might happen while editing, maybe when removing lines from a grid
  //       Should handle it at some point
  if ( D != 0 ) {
    const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
    const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;
    
    if ( 0 <= uA && uA <= 1 && 0 <= uB && uB <= 1 ) {
      return [
        x1 + uA * ( x2 - x1 ),
        y1 + uA * ( y2 - y1 ),
      ];
    }
  }
}