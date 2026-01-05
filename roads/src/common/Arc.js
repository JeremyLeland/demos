import * as Intersections from '../../src/common/Intersections.js';
import { vec2 } from '../../lib/gl-matrix.js'

export function getArcBetweenLines( from, to ) {
  const A = vec2.subtract( [], from.end, from.start );
  const B = vec2.subtract( [], to.end, to.start );
  const C = vec2.subtract( [], to.start, from.start );

  const A_cross_B = A[ 0 ] * B[ 1 ] - A[ 1 ] * B[ 0 ];
  // const C_cross_A = C[ 0 ] * A[ 1 ] - C[ 1 ] * A[ 0 ];

  if ( A_cross_B == 0 ) {
    // if ( C_cross_A == 0 ) {
      
    // }
    // else {
    //   // Parallel
    // }
  }
  else {
    const u = ( C[ 0 ] * B[ 1 ] - C[ 1 ] * B[ 0 ] ) / A_cross_B;

    const intersection = vec2.scaleAndAdd( [], from.start, A, u );

    vec2.normalize( A, A );
    vec2.normalize( B, B );
    
    const angleBetween = vec2.angle( A, B );

    const dist = vec2.distance( from.end, intersection );
    const radius = dist / ( Math.tan( angleBetween / 2 ) );
    const centerDistance = radius / Math.sin( angleBetween / 2 );
    
    // Reverse A to give us the proper bisector between vectors
    const bisector = vec2.scaleAndAdd( [], B, A, -1 );
    vec2.normalize( bisector, bisector );

    const center = vec2.scaleAndAdd( [], intersection, bisector, centerDistance );

    // Compute start and end angles
    const tangentDist = radius / ( Math.tan( angleBetween / 2 ) );
    const start = vec2.scaleAndAdd( [], intersection, A, -tangentDist );  // reversing A again
    const end   = vec2.scaleAndAdd( [], intersection, B,  tangentDist );

    const startAngle = Math.atan2( start[ 1 ] - center[ 1 ], start[ 0 ] - center[ 0 ] );
    const endAngle = Math.atan2( end[ 1 ] - center[ 1 ], end[ 0 ] - center[ 0 ] );
    
    return {
      center: center,
      radius: radius,
      startAngle: startAngle,
      endAngle: endAngle,
      counterclockwise: A_cross_B < 0,
    };
  }
}

export function getArcBetweenLineArc( line, arc, radius, intersection ) {
  const lineStart = line.slice( 0, 2 );
  const lineEnd = line.slice( 2, 4 );

  const v1 = vec2.subtract( [], lineEnd, lineStart );
  vec2.normalize( v1, v1 );

  const lineAngle = Math.atan2( v1[ 1 ], v1[ 0 ] );

  
  const arcAngle = fixAngle( 
    Math.atan2( 
      intersection[ 1 ] - arc.center[ 1 ], 
      intersection[ 0 ] - arc.center[ 0 ],
    ) + ( arc.counterclockwise ? -1 : 1 ) * Math.PI / 2 
  );

  const turn = deltaAngle( lineAngle, arcAngle );
  // const dot = vec2.dot( v1, vec2.subtract( [], arc.center, intersection ) );

  const s0 = turn < 0 ? 1 : -1;   // left turn uses positive normal
  // const s1 =  dot > 0 ? 1 : -1;   // see if we are moving toward or away from center

  const s1 = ( turn > 0 ? 1 : -1 ) * ( arc.counterclockwise ? 1 : -1 );
  
  const closestToLine = {
    point: null,
    sign: null,
    dist: Infinity,
  };

  [ -1, 1 ].forEach( sign => {
    const offsetLine = [
      line[ 0 ] + v1[ 1 ] * sign * s0 * radius,
      line[ 1 ] - v1[ 0 ] * sign * s0 * radius,
      line[ 2 ] + v1[ 1 ] * sign * s0 * radius,
      line[ 3 ] - v1[ 0 ] * sign * s0 * radius,
    ];

    const offsetIntersections = Intersections.getArcLineIntersections(
      ...arc.center, arc.radius + sign * s1 * radius, arc.startAngle, arc.endAngle, arc.counterclockwise,
      ...offsetLine,
    );

    const closestToIntersection = {
      point: null,
      sign: null,
      dist: Infinity,
    };

    // We want the point closest to the start of the line that is near closestToPoint
    offsetIntersections.forEach( testIntersection => {
      const intersectionDist = vec2.distance( testIntersection, intersection );

      if ( intersectionDist < closestToIntersection.dist ) {
        closestToIntersection.point = testIntersection;
        closestToIntersection.sign = sign;
        closestToIntersection.dist = intersectionDist;
      }
    } );

    if ( closestToIntersection.point ) {
      const lineStartDist = vec2.distance( closestToIntersection.point, lineStart );
      
      if ( lineStartDist < closestToLine.dist ) {
        closestToLine.point = closestToIntersection.point;
        closestToLine.sign = closestToIntersection.sign;
        closestToLine.dist = lineStartDist;
      }
    }
  } );

  if ( closestToLine.point ) {
    const lineTangent = [
      closestToLine.point[ 0 ] - v1[ 1 ] * closestToLine.sign * s0 * radius,
      closestToLine.point[ 1 ] + v1[ 0 ] * closestToLine.sign * s0 * radius,
    ];
    
    const arcTangent = vec2.scaleAndAdd( [], 
      arc.center, 
      vec2.subtract( [], closestToLine.point, arc.center ), 
      arc.radius / ( arc.radius + closestToLine.sign * s1 * radius )
    );

    const tangentVectors = [
      vec2.subtract( [], lineTangent, closestToLine.point ),
      vec2.subtract( [], arcTangent, closestToLine.point ),
    ];

    return {
      center: closestToLine.point,
      radius: radius,
      startAngle: Math.atan2( tangentVectors[ 0 ][ 1 ], tangentVectors[ 0 ][ 0 ] ),
      endAngle: Math.atan2( tangentVectors[ 1 ][ 1 ], tangentVectors[ 1 ][ 0 ] ),
      counterclockwise: closestToLine.sign * turn < 0,
    }
  }
}

// TODO: Get this working as a copy, then see if there's a way to make the function
//       more generic so I don't have to duplicate code
// TODO: Can we make this work for line vs line and arc vs arc as well? Hell, can we 
//       get everything with one function?

export function getArcBetweenArcLine( arc, line, radius, intersection ) {
  const lineStart = line.slice( 0, 2 );
  const lineEnd = line.slice( 2, 4 );

  const v1 = vec2.subtract( [], lineEnd, lineStart );
  vec2.normalize( v1, v1 );

  const lineAngle = Math.atan2( v1[ 1 ], v1[ 0 ] );

  
  const arcAngle = fixAngle( 
    Math.atan2( 
      intersection[ 1 ] - arc.center[ 1 ], 
      intersection[ 0 ] - arc.center[ 0 ],
    ) + ( arc.counterclockwise ? -1 : 1 ) * Math.PI / 2 
  );

  const turn = deltaAngle( arcAngle, lineAngle );

  const dot = vec2.dot( v1, vec2.subtract( [], arc.center, intersection ) );

  const s0 = turn < 0 ? 1 : -1;
  const s1 =  dot < 0 ? 1 : -1;   // TODO: Don't fully understand how I got these
  
  const closestToLine = {
    point: null,
    sign: null,
    dist: Infinity,
  };

  [ -1, 1 ].forEach( sign => {
    const offsetLine = [
      line[ 0 ] + v1[ 1 ] * sign * s1 * radius,
      line[ 1 ] - v1[ 0 ] * sign * s1 * radius,
      line[ 2 ] + v1[ 1 ] * sign * s1 * radius,
      line[ 3 ] - v1[ 0 ] * sign * s1 * radius,
    ];

    const offsetIntersections = Intersections.getArcLineIntersections(
      ...arc.center, arc.radius + sign * s0 * radius, arc.startAngle, arc.endAngle, arc.counterclockwise,
      ...offsetLine,
    );

    const closestToIntersection = {
      point: null,
      sign: null,
      dist: Infinity,
    };

    // We want the point closest to the start of the line that is near closestToPoint
    offsetIntersections.forEach( testIntersection => {
      const intersectionDist = vec2.distance( testIntersection, intersection );

      if ( intersectionDist < closestToIntersection.dist ) {
        closestToIntersection.point = testIntersection;
        closestToIntersection.sign = sign;
        closestToIntersection.dist = intersectionDist;
      }
    } );

    if ( closestToIntersection.point ) {

      const arcStart = [
        arc.center[ 0 ] + Math.cos( arc.startAngle ) * arc.radius,
        arc.center[ 1 ] + Math.sin( arc.startAngle ) * arc.radius,
      ];

      const arcStartDist = vec2.distance( closestToIntersection.point, arcStart );
      
      if ( arcStartDist < closestToLine.dist ) {
        closestToLine.point = closestToIntersection.point;
        closestToLine.sign = closestToIntersection.sign;
        closestToLine.dist = arcStartDist;
      }
    }
  } );

  if ( closestToLine.point ) {
    const lineTangent = [
      closestToLine.point[ 0 ] - v1[ 1 ] * closestToLine.sign * s1 * radius,
      closestToLine.point[ 1 ] + v1[ 0 ] * closestToLine.sign * s1 * radius,
    ];
    
    const arcTangent = vec2.scaleAndAdd( [], 
      arc.center, 
      vec2.subtract( [], closestToLine.point, arc.center ), 
      arc.radius / ( arc.radius + closestToLine.sign * s0 * radius )
    );

    const tangentVectors = [
      vec2.subtract( [], arcTangent, closestToLine.point ),
      vec2.subtract( [], lineTangent, closestToLine.point ),
    ];

    return {
      center: closestToLine.point,
      radius: radius,
      startAngle: Math.atan2( tangentVectors[ 0 ][ 1 ], tangentVectors[ 0 ][ 0 ] ),
      endAngle: Math.atan2( tangentVectors[ 1 ][ 1 ], tangentVectors[ 1 ][ 0 ] ),
      counterclockwise: closestToLine.sign * turn < 0,
    }
  }
}

export function getArcsBetweenArcs( from, to, radius, closestToPoint ) {
  const intersections = Intersections.getArcArcIntersections(
    ...from.center, from.radius, from.startAngle, from.endAngle, from.counterclockwise,
    ...to.center, to.radius, to.startAngle, to.endAngle, to.counterclockwise,
  );

  const arcs = intersections.map( intersection => {
    const angles = [ from, to ].map( a =>
      fixAngle( Math.atan2( intersection[ 1 ] - a.center[ 1 ], intersection[ 0 ] - a.center[ 0 ] ) + ( a.counterclockwise ? -1 : 1 ) * Math.PI / 2 )
    );

    const turn = deltaAngle( ...angles );

    // console.log( 'turn = ' + turn );

    const signs = [ from, to ].map( a => turn < 0 == !a.counterclockwise ? 1 : -1 ); 

    const offsetIntersections = Intersections.getArcArcIntersections(
      ...from.center, from.radius + signs[ 0 ] * radius, from.startAngle, from.endAngle, from.counterclockwise,
      ...to.center, to.radius + signs[ 1 ] * radius, to.startAngle, to.endAngle, to.counterclockwise,
    );

    if ( offsetIntersections.length == 0 ) {
      console.error( 'No intersections found!' );
      return;
    }

    // Handle multiple intersections here (take the closest)
    let closest, closestDist = Infinity;

    offsetIntersections.forEach( offInt => {
      const dist = Math.hypot( offInt[ 0 ] - intersection[ 0 ], offInt[ 1 ] - intersection[ 1 ] );
      if ( dist < closestDist ) {
        closest = offInt;
        closestDist = dist;
      }
    } );

    const tangents = [ from, to ].map( ( arc, index ) =>
      vec2.scaleAndAdd( [],
        arc.center,
        vec2.subtract( [], closest, arc.center ), 
        arc.radius / ( arc.radius + signs[ index ] * radius )
      )
    );

    const tangles = tangents.map( t => Math.atan2( t[ 1 ] - closest[ 1 ], t[ 0 ] - closest[ 0 ] ) );

    return {
      center: closest,
      radius: radius,
      startAngle: tangles[ 0 ],
      endAngle: tangles[ 1 ],
      counterclockwise: turn < 0,
    }
  } );

  // TODO: Move this check further up so we avoid unnecessary work?
  if ( closestToPoint ) {
    let closest, closestDist = Infinity;

    arcs.forEach( arc => {
      const dist = Math.hypot( arc.center[ 0 ] - closestToPoint[ 0 ], arc.center[ 1 ] - closestToPoint[ 1 ] );
      if ( dist < closestDist ) {
        closest = arc;
        closestDist = dist;
      }
    } );

    // TODO: Should return types match? (array for both?)
    return closest;
  }
  else {
    return arcs;
  }
}

export function getIntersections( A, B ) {
  if ( A.center && B.center ) {
    return Intersections.getArcArcIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
    );
  }
  else if ( A.center ) {
    return Intersections.getArcLineIntersections(
      A.center[ 0 ], A.center[ 1 ], A.radius, A.startAngle, A.endAngle, A.counterclockwise,
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
  else if ( B.center ) {
    return Intersections.getArcLineIntersections(
      B.center[ 0 ], B.center[ 1 ], B.radius, B.startAngle, B.endAngle, B.counterclockwise,
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
    );
  }
  else {
    return Intersections.getLineLineIntersections(
      A.start[ 0 ], A.start[ 1 ], A.end[ 0 ], A.end[ 1 ],
      B.start[ 0 ], B.start[ 1 ], B.end[ 0 ], B.end[ 1 ],
    );
  }
}


const TWO_PI = Math.PI * 2;

function fixAngle( a ) {
  if ( a > Math.PI ) {
    return a % TWO_PI - TWO_PI;
  }
  else if ( a < -Math.PI ) {
    return a % TWO_PI + TWO_PI;
  }
  else {
    return a;
  }
}

function deltaAngle( a, b ) {

  // console.log( 'deltaAngle( ' + a + ', ' + b + ')' );

  return fixAngle( b - a );
}
