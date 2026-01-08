import * as Angle from './Angle.js';

export function getCircleCircleIntersections( cx1, cy1, radius1, cx2, cy2, radius2 ) {
  // Find circle intersections
  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const d = Math.hypot( dx, dy );

  if ( d > radius1 + radius2 || d < Math.abs( radius1 - radius2 ) || d < 1e-6 ) {
    return []; // No intersection
  }

  const a = ( radius1 ** 2 - radius2 ** 2 + d ** 2 ) / ( 2 * d );
  const h = Math.sqrt( radius1 ** 2 - a ** 2 );

  const xm = cx1 + ( a * dx ) / d;
  const ym = cy1 + ( a * dy ) / d;

  const rx = -( dy * h ) / d;
  const ry =  ( dx * h ) / d;

  return [
    [ xm + rx, ym + ry ],
    [ xm - rx, ym - ry ],
  ];
}

export function getArcArcIntersections(
  cx1, cy1, radius1, startAngle1, endAngle1, counterclockwise1,
  cx2, cy2, radius2, startAngle2, endAngle2, counterclockwise2,
) {
  const circleIntersections = getCircleCircleIntersections( cx1, cy1, radius1, cx2, cy2, radius2 );

  // Check if circle intersections are between arc angles
  const results = [];

  // TODO: use filter for below?
  circleIntersections.forEach( pt => {
    const angle1 = Math.atan2( pt[ 1 ] - cy1, pt[ 0 ] - cx1 );
    const angle2 = Math.atan2( pt[ 1 ] - cy2, pt[ 0 ] - cx2 );
    if (
      Angle.isBetweenAngles( angle1, startAngle1, endAngle1, counterclockwise1 ) &&
      Angle.isBetweenAngles( angle2, startAngle2, endAngle2, counterclockwise2 )
    ) {
      results.push( pt );
    }
  } );

  return results;
}

export function getArcLineIntersections( 
  cx, cy, radius, startAngle, endAngle, counterclockwise, 
  x1, y1, x2, y2 
) {
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
      let angle = Math.atan2( iy - cy, ix - cx );

      // TODO: Do we also need to make sure it's between x1,y1 and x2,y2?

      if ( Angle.isBetweenAngles( angle, startAngle, endAngle, counterclockwise ) ) {
        results.push( [ ix, iy ] );
      }
    }
  } );

  return results; // May be 0, 1, or 2 points
}

export function getLineLineIntersections( x1, y1, x2, y2, x3, y3, x4, y4 ) {
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
        [
          x1 + uA * ( x2 - x1 ),
          y1 + uA * ( y2 - y1 ),
        ]
      ];
    }
  }

  return [];
}

export function getIntersections( A, B ) {
  if ( A.center && B.center ) {
    return getArcArcIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
    );
  }
  else if ( A.center ) {
    return getArcLineIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
  else if ( B.center ) {
    return getArcLineIntersections(
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
    );
  }
  else {
    return getLineLineIntersections(
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
}
