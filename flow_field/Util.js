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

export function offsetPoints( points, offset ) {

  if ( offset == 0 ) {
    return points;
  }

  const scaled = [];

  const info = [];

  let soonestLimit = offset;

  for ( let i = 0; i < points.length; i ++ ) {
    const prev = points.at( i - 1 );
    const curr = points[ i ];
    const next = points[ ( i + 1 ) % points.length ];
    const next2 = points[ ( i + 2 ) % points.length ];

    const prevNormalAngle = Math.atan2( prev[ 0 ] - curr[ 0 ], curr[ 1 ] - prev[ 1 ] );
    const normalAngle     = Math.atan2( curr[ 0 ] - next[ 0 ], next[ 1 ] - curr[ 1 ] );
    const nextNormalAngle = Math.atan2( next[ 0 ] - next2[ 0 ], next2[ 1 ] - next[ 1 ] );

    const ang1 = prevNormalAngle + deltaAngle( prevNormalAngle, normalAngle ) / 2;
    const ang2 = normalAngle + deltaAngle( normalAngle, nextNormalAngle ) / 2;

    const dx1 = Math.cos( ang1 );
    const dy1 = Math.sin( ang1 );
    const dx2 = Math.cos( ang2 );
    const dy2 = Math.sin( ang2 );

    // Find intersection of normals from both points of line
    // The cosine part is same as below, accounting for point movement being greater than scale value
    const u = ( dx2 * ( curr[ 1 ] - next[ 1 ] ) - dy2 * ( curr[ 0 ] - next[ 0 ] ) ) / ( dy2 * dx1 - dx2 * dy1 ) * Math.cos( deltaAngle( ang1, normalAngle ) );
    
    if ( closerToZero( u, soonestLimit ) ) {
      soonestLimit = u;
    }

    info.push( {
      lineNormal: normalAngle,
      pointNormal: ang1,
      limit: u,
    } );
  }

  for ( let i = 0; i < points.length; i ++ ) {
    if ( Math.sign( offset ) != Math.sign( info[ i ].limit ) || closerToZero( soonestLimit, info[ i ].limit ) ) {
      const H = soonestLimit / Math.cos( deltaAngle( info[ i ].pointNormal, info[ i ].lineNormal ) );
      
      scaled.push( [
        points[ i ][ 0 ] + Math.cos( info[ i ].pointNormal ) * H,
        points[ i ][ 1 ] + Math.sin( info[ i ].pointNormal ) * H,
      ] );
    }
  }

  if ( closerToZero( soonestLimit, offset ) ) {
    return offsetPoints( scaled, offset - soonestLimit );
  }
  else {
    return scaled;
  }
}