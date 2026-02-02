import * as Angle from './common/Angle.js';
import * as Arc from './common/Arc.js';
import * as Intersections from './common/Intersections.js';
import { vec2 } from '../lib/gl-matrix.js';

export function getLength( route ) {
  if ( route.center ) {
    return Arc.getLength( route );
  }
  else {
    return vec2.distance( route.start, route.end );
  }
}

export function getPositionAtDistance( route, distance ) {
  if ( route.center ) {
    return Arc.getPointAtAngle( route, Arc.getAngleAtDistance( route, distance ) );
  }
  else {
    const lineVec = vec2.subtract( [], route.end, route.start );
    vec2.normalize( lineVec, lineVec );
    return vec2.scaleAndAdd( [], route.start, lineVec, distance );
  }
}

export function getDistanceAtPoint( route, point ) {
  // We'll use this to find out how much distance is left on either side of an intersection
  // Should always be called with a point that is on the route, not sure we need to handle when it isn't

  // something atan2-y for arcs, can we just use vec2.distance for lines?

  if ( route.center ) {
    const pointAngle = Math.atan2(
      point[ 1 ] - route.center[ 1 ],
      point[ 0 ] - route.center[ 0 ],
    );

    return Arc.getDistanceAtAngle( route, pointAngle );
  }
  else {
    return vec2.distance( point, route.start );
  }
}

export function getHeadingAtPoint( route, point ) {
  if ( route.center ) {
    return Arc.getHeadingAtPoint( route, point );
  }
  else {
    return Math.atan2(
      route.end[ 1 ] - route.start[ 1 ], 
      route.end[ 0 ] - route.start[ 0 ],
    );
  }
}

export function getArcBetween( A, B, radius, intersection ) {
  const angleA = getHeadingAtPoint( A, intersection );
  const angleB = getHeadingAtPoint( B, intersection );
  const turn = Angle.deltaAngle( angleA, angleB );
  
  
  // Special case for parallel lines 
  // (should +PI be any different than -PI? assuming same for now)
  if ( Angle.deltaAngle( Math.abs( turn ), Math.PI ) < 1e-6 ) {
    const startPos = getPositionAtDistance( A, getLength( A ) );
    const endPos = getPositionAtDistance( B, 0 );

    // In case the deltaAngle above confused between -PI/PI, figure out where we actually turned
    // TODO: Should we just do this above instead of the deltaAngle? Or is this only useful in parallel case?
    const angleToB = Math.atan2( endPos[ 1 ] - startPos[ 1 ], endPos[ 0 ] - startPos[ 0 ] );
    const turn2 = Angle.deltaAngle( angleA, angleToB );
    
    // console.log( `turn = ${ turn }, angleToB = ${ angleToB }, turn2 = ${ Angle.deltaAngle( angleA, angleToB ) }` );

    return {
      center: intersection,
      radius: radius,
      startAngle: Math.atan2( startPos[ 1 ] - intersection[ 1 ], startPos[ 0 ] - intersection[ 0 ] ),
      endAngle: Math.atan2( endPos[ 1 ] - intersection[ 1 ], endPos[ 0 ] - intersection[ 0 ] ),
      counterclockwise: turn2 < 0,
    };
  }

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
    const angleOffsetA = getHeadingAtPoint( offsetA, testIntersection );
    const angleOffsetB = getHeadingAtPoint( offsetB, testIntersection );
    const turnOffset = Angle.deltaAngle( angleOffsetA, angleOffsetB );

    if ( Math.sign( turn ) == Math.sign( turnOffset ) ) {
      const startDist = getDistanceAtPoint( A, testIntersection );
              
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

export function addRouteToPath( path, route, startDist, endDist, offset ) {
  if ( route.center ) {
    path.arc( 
      route.center[ 0 ], 
      route.center[ 1 ], 
      route.radius + offset * ( route.counterclockwise ? 1 : -1 ),
      startDist ? Arc.getAngleAtDistance( route, startDist ) : route.startAngle,
      endDist ? Arc.getAngleAtDistance( route, endDist ) : route.endAngle,
      route.counterclockwise );
  }
  else {
    const v1 = vec2.subtract( [], route.end, route.start );
    
    const tangent = vec2.normalize( [], v1 );
    const normal = [ -tangent[ 1 ], tangent[ 0 ] ];

    const start = vec2.scaleAndAdd( [], route.start, tangent, startDist ?? 0 );
    vec2.scaleAndAdd( start, start, normal, offset );

    const end = vec2.scaleAndAdd( [], route.start, tangent, endDist ?? vec2.length( v1 ) );
    vec2.scaleAndAdd( end, end, normal, offset );

    path.lineTo( ...start );
    path.lineTo( ...end );
  }
}

//
// Keep these functions private for now, can expose if useful elsewhere
//
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