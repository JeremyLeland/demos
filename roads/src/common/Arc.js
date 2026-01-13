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
// Get arc between any two line/arc's
//

// NOTE: Since this requires knowing about Lines and Arcs, it potentially brings in more dependencies
//       Should this live somewhere else?

export function getArcBetween( A, B, radius, intersection ) {
  const angleA = getAngle( A, intersection );
  const angleB = getAngle( B, intersection );
  

  // NOW TODO: Figure out why this is fucked up with the delta/sweepAngle changes
  //      Should this be delta or sweep?

  // TODO: Should we pass some combination of A/B.counterclockwise into deltaAngle to simplify below?
  const turn = Angle.deltaAngle( angleA, angleB );

  const s0 = ( turn < 0 ? 1 : -1 ) * ( A.counterclockwise ? -1 : 1 );

  // If turn is left and we're counter clockwise, then must be coming from inside
  // If turn is left and we're clockwise, then must be coming from outside
  // If turn is right and we're counter clockwise, then must be coming from outside
  // If turn is right and we're clockwise, then must be coming from inside

  const s1 = ( turn > 0 ? 1 : -1 ) * ( B.counterclockwise ? 1 : -1 );
  
  const closestToLine = {
    point: null,
    dist: Infinity,
  };

  const offsetA = getOffset( A, s0 * radius );
  const offsetB = getOffset( B, s1 * radius );

  const offsetIntersections = Intersections.getIntersections( offsetA, offsetB );

  offsetIntersections.forEach( testIntersection => {
    const angleOffsetA = getAngle( offsetA, testIntersection );
    const angleOffsetB = getAngle( offsetB, testIntersection );
    const turnOffset = Angle.deltaAngle( angleOffsetA, angleOffsetB );

    if ( Math.sign( turn ) == Math.sign( turnOffset ) ) {
      const startDist = A.center ?
        Angle.sweepAngle(
          A.startAngle,
          Math.atan2( 
            testIntersection[ 1 ] - A.center[ 1 ],
            testIntersection[ 0 ] - A.center[ 0 ], 
          ),
          A.counterclockwise,
        ) :
        vec2.distance( testIntersection, A.start );
              
      if ( startDist < closestToLine.dist ) {
        closestToLine.point = testIntersection;
        closestToLine.dist = startDist;
      }
    }
  } );

  if ( closestToLine.point ) {
    const tangentA = getTangent( A, closestToLine.point, s0 * radius );
    const tangentB = getTangent( B, closestToLine.point, s1 * radius );

    const tangentVectorA = vec2.subtract( [], tangentA, closestToLine.point );
    const tangentVectorB = vec2.subtract( [], tangentB, closestToLine.point );

    return {
      center: closestToLine.point,
      radius: radius,
      startAngle: Math.atan2( tangentVectorA[ 1 ], tangentVectorA[ 0 ] ),
      endAngle: Math.atan2( tangentVectorB[ 1 ], tangentVectorB[ 0 ] ),
      counterclockwise: turn < 0,
    }
  }
}

function getAngle( A, intersection ) {
  if ( A.center ) {
    return Angle.fixAngle( 
      Math.atan2( 
        intersection[ 1 ] - A.center[ 1 ], 
        intersection[ 0 ] - A.center[ 0 ],
      ) + ( A.counterclockwise ? -1 : 1 ) * Math.PI / 2 
    );
  }
  else {
    return Math.atan2( 
      A.end[ 1 ] - A.start[ 1 ], 
      A.end[ 0 ] - A.start[ 0 ],
    );
  }
}

function getOffset( A, offsetDist ) {
  if ( A.center ) {
    const offset = structuredClone( A );
    offset.radius += offsetDist;
    return offset;
  }
  else {
    const v1 = vec2.subtract( [], A.end, A.start );
    vec2.normalize( v1, v1 );
    
    return {
      start: [
        A.start[ 0 ] + v1[ 1 ] * offsetDist,
        A.start[ 1 ] - v1[ 0 ] * offsetDist,
      ],
      end: [
        A.end[ 0 ] + v1[ 1 ] * offsetDist,
        A.end[ 1 ] - v1[ 0 ] * offsetDist,
      ],
    };
  }
}

function getTangent( A, point, radius ) {
  if ( A.center ) {
    return vec2.scaleAndAdd( [],
      A.center, 
      vec2.subtract( [], point, A.center ),
      A.radius / ( A.radius + radius )
    );
  }
  else {
    const v1 = vec2.subtract( [], A.end, A.start );
    vec2.normalize( v1, v1 );

    return [
      point[ 0 ] - v1[ 1 ] * radius,
      point[ 1 ] + v1[ 0 ] * radius,
    ];
  }    
}

//
// Helpers
//

// Angular position
export function getAngleAtDistance( arc, distance ) {
  return arc.startAngle + ( distance / arc.radius ) * ( arc.counterclockwise ? -1 : 1 );
}

export function getDistanceAtAngle( arc, angle ) {
  return ( angle - arc.startAngle ) * arc.radius * ( arc.counterclockwise ? -1 : 1 );
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