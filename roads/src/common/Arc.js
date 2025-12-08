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

export function getArcsBetweenArcs( from, to, radius ) {
  const intersections = Intersections.getArcArcIntersections(
    ...from.center, from.radius, from.startAngle, from.endAngle, from.counterclockwise,
    ...to.center, to.radius, to.startAngle, to.endAngle, to.counterclockwise,
  );

  return intersections.map( intersection => {
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

      // TODO: Do we want to save this as well? Useful or redundant?
      start: tangents[ 0 ],
      end: tangents[ 1 ],
    }
  } );
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
