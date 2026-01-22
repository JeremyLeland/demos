import * as Angle from './Angle.js';
import * as Intersections from './Intersections.js';
import { vec2 } from '../../lib/gl-matrix.js'

//
// Create arc from three points
//

export function arcFromThreePoints( p1, p2, p3 ) {
  const [ x1, y1 ] = p1;
  const [ x2, y2 ] = p2;
  const [ x3, y3 ] = p3;

  // Check for duplicate points
  if ( ( x1 === x2 && y1 === y2 ) ||
       ( x2 === x3 && y2 === y3 ) ||
       ( x3 === x1 && y3 === y1 ) ) {
    throw new Error( "Duplicate points" );
  }

  const D = 2 * (
    x1 * ( y2 - y3 ) +
    x2 * ( y3 - y1 ) +
    x3 * ( y1 - y2 )
  );

  // Collinear (or nearly collinear)
  if ( Math.abs(D) < 1e-12 ) {
    throw new Error( "Points are collinear" );
  }

  const x1sq = x1 * x1 + y1 * y1;
  const x2sq = x2 * x2 + y2 * y2;
  const x3sq = x3 * x3 + y3 * y3;

  const cx = (
      x1sq * ( y2 - y3 ) +
      x2sq * ( y3 - y1 ) +
      x3sq * ( y1 - y2 )
  ) / D;

  const cy = (
      x1sq * ( x3 - x2 ) +
      x2sq * ( x1 - x3 ) +
      x3sq * ( x2 - x1 )
  ) / D;

  const r = Math.hypot( cx - x1, cy - y1 );

  const startAngle  = Math.atan2( y1 - cy, x1 - cx );
  const middleAngle = Math.atan2( y2 - cy, x2 - cx );
  const endAngle    = Math.atan2( y3 - cy, x3 - cx );

  return { 
    center: [ cx, cy ], 
    radius: r,
    startAngle: startAngle,
    endAngle: endAngle,
    counterclockwise: !Angle.isBetweenAngles( middleAngle, startAngle, endAngle ),
  };
}


//
// Helpers
//

// Angular position
export function getAngleAtDistance( arc, distance ) {
  return arc.startAngle + ( distance / arc.radius ) * ( arc.counterclockwise ? -1 : 1 );
}

export function getDistanceAtAngle( arc, angle ) {
  return Angle.sweepAngle( arc.startAngle, angle, arc.counterclockwise ) * arc.radius * ( arc.counterclockwise ? -1 : 1 );
}

export function getPointAtAngle( arc, angle ) {
  return [
    arc.center[ 0 ] + Math.cos( angle ) * arc.radius,
    arc.center[ 1 ] + Math.sin( angle ) * arc.radius,
  ];
}

export function getLength( arc ) {
  return arc.radius * Math.abs( Angle.sweepAngle( arc.startAngle, arc.endAngle, arc.counterclockwise ) );
}

export function getHeadingAtPoint( arc, point ) {
  return Angle.fixAngle( 
    Math.atan2( 
      point[ 1 ] - arc.center[ 1 ], 
      point[ 0 ] - arc.center[ 0 ],
    ) + ( arc.counterclockwise ? -1 : 1 ) * Math.PI / 2 
  );
}