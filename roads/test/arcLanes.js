import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

let distance = 0;

const roads = {
  A_EAST: {
    start: [ 4, 4 ],
    end: [ 6, 4 ],
  },
  A_WEST: {
    start: [ 6, 3 ],
    end: [ 4, 3 ],
  },
  first_NORTH: {
    start: [ 3, 7 ],
    end: [ 3, 5 ],
  },
  first_SOUTH: {
    start: [ 2, 5 ],
    end: [ 2, 7 ],
  },
  second_NORTH: {
    start: [ 8, 2 ],
    end: [ 8, 0 ],
  },
  second_SOUTH: {
    start: [ 7, 0 ],
    end: [ 7, 2 ],
  },
};

joinRoads( 'first_NORTH', 'A_EAST' );
joinRoads( 'A_EAST', 'second_NORTH' );

joinRoads( 'second_SOUTH', 'A_WEST' );
joinRoads( 'A_WEST', 'first_SOUTH' );

function joinRoads( A, B ) {
  const road1 = roads[ A ];
  const road2 = roads[ B ];

  const newName = `${ A }_to_${ B }`;

  roads[ newName ] = getArcBetweenLines( ...road1.start, ...road1.end, ...road2.start, ...road2.end );
}

const path = [ roads.first_NORTH, roads.first_NORTH_to_A_EAST, roads.A_EAST, roads.A_EAST_to_second_NORTH, roads.second_NORTH ];

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 14;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 12, 12 );

canvas.draw = ( ctx ) => {

  for ( const road of Object.values( roads ) ) {
    // Road itself
    ctx.lineWidth = 0.9;// 0.8;
    // ctx.lineCap = 'square';
    ctx.strokeStyle = 'gray';

    ctx.beginPath();
    if ( road.center ) {
      ctx.arc( ...road.center, road.radius, road.startAngle, road.endAngle, road.counterclockwise );
    }
    else {
      ctx.lineTo( ...road.start );
      ctx.lineTo( ...road.end );
    }
    ctx.stroke();

    // Direction arrows
    ctx.fillStyle = 'yellow';
    
    for ( let length = 0; length < 8; length += 0.5 ) {
      drawOnRoadAtDistance( ctx, road, length, drawArrow );
    }
  }

  // TODO: Draw at distance along path
  ctx.fillStyle = 'cyan';
  
  let partialDistance = distance;

  for ( let i = 0; i < path.length; i ++ ) { 
    const length = getLength( path[ i ] );

    if ( partialDistance > length ) {
      partialDistance -= length;
    }
    else {
      drawOnRoadAtDistance( ctx, path[ i ], partialDistance, drawArrow );
      break;
    }
  }

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

function normalize( v ) {
  const len = Math.hypot( ...v );
  return v.map( e => e / len );
}

function drawOnRoadAtDistance( ctx, road, distance, drawFunc ) {
  if ( road.center ) {
    // Compute angle at distance
    const sweepAngle = deltaAngle( road.startAngle, road.endAngle );
    const arcLength = Math.abs( sweepAngle * road.radius );

    // Don't draw if outside arc length
    if ( 0 <= distance && distance <= arcLength ) {
      const angleOffset = ( distance / road.radius ) * ( road.counterclockwise ? -1 : 1 );
      const angleAtD = road.startAngle + angleOffset;

      // Final point
      const pos = [
        road.center[ 0 ] + road.radius * Math.cos( angleAtD ),
        road.center[ 1 ] + road.radius * Math.sin( angleAtD ),
      ];

      drawFunc( ctx, pos, angleAtD + ( road.counterclockwise ? -1 : 1 ) * Math.PI / 2 );
    }
  }
  else {
    const total_dist = Math.hypot( road.end[ 0 ] - road.start[ 0 ], road.end[ 1 ] - road.start[ 1 ] );

    if ( 0 <= distance && distance <= total_dist ) {
      const pos = [ 0, 1 ].map( 
        i => road.start[ i ] + ( road.end[ i ] - road.start[ i ] ) * ( distance / total_dist )
      );
      
      const angle = Math.atan2( road.end[ 1 ] - road.start[ 1 ], road.end[ 0 ] - road.start[ 0 ] );
      
      drawFunc( ctx, pos, angle );
    }
  }
}

// TODO: Use this code instead to generate arcs between two lines
function getArcBetweenLines( x1, y1, x2, y2, x3, y3, x4, y4 ) {

  // Find intersection between lines, use this as control point
  const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );

  if ( D == 0 ) {
    console.log( `Lines ${ x1 },${ y1 } -> ${ x2 },${ y2 } and ${ x3 },${ y3 } -> ${ x4 },${ y4 } are parallel, no arc possible` );
    return;
  }

  const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
  // const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;

  const intersection = [
    x1 + ( x2 - x1 ) * uA,
    y1 + ( y2 - y1 ) * uA,
  ];

  const v0 = normalize( [ x2 - intersection[ 0 ], y2 - intersection[ 1 ] ] );
  const v1 = normalize( [ x3 - intersection[ 0 ], y3 - intersection[ 1 ] ] );

  // const radius = Math.hypot( ...[ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );

  const dot = v0[ 0 ] * v1[ 0 ] + v0[ 1 ] * v1[ 1 ];
  const angleBetween = Math.acos( dot )

  // Ensure angle is not 0 or PI (no arc possible)
  if ( angleBetween <= 0.0001 || Math.abs( Math.PI - angleBetween ) <= 0.0001 ) {
    console.log( `Lines parallel, no arc possible (a different way than above?)` );
    return;
  }

  const dist = Math.hypot( x2 - intersection[ 0 ], y2 - intersection[ 1 ] );  // NOTE: not normalized version above
  const radius = dist / ( Math.tan( angleBetween / 2 ) );

  const start = [ 0, 1 ].map( i => intersection[ i ] + v0[ i ] * radius );
  const end = [ 0, 1 ].map( i => intersection[ i ] + v1[ i ] * radius );

  const bisector = normalize( [ v0[ 0 ] + v1[ 0 ], v0[ 1 ] + v1[ 1 ] ] );

  // FIXME: What is orientation supposed to do here? It's causing problems so far
  //        Seems to be the opposite of whether it is clockwise, but that doesn't
  //        seem to effect where the center is
  // Rotate bisector 90 degrees to find center direction
  const cross = v0[ 0 ] * v1[ 1 ] - v0[ 1 ] * v1[ 0 ];
  // const orientation = cross < 0 ? -1 : 1;

  const centerDistance = radius / Math.sin( angleBetween / 2 );


  const center = [
    intersection[ 0 ] + bisector[ 0 ] * centerDistance,// * orientation,
    intersection[ 1 ] + bisector[ 1 ] * centerDistance,// * orientation,
  ];

  // Compute start and end angles
  const startAngle = Math.atan2( start[ 1 ] - center[ 1 ], start[ 0 ] - center[ 0 ] );
  const endAngle = Math.atan2( end[ 1 ] - center[ 1 ], end[ 0 ] - center[ 0 ] );

  return {
    center: center,
    radius: radius,
    startAngle: startAngle,
    endAngle: endAngle,
    counterclockwise: cross > 0,
  };
}

function getLength( road ) {
  if ( road.center ) {
    const sweepAngle = deltaAngle( road.startAngle, road.endAngle );
    return Math.abs( sweepAngle * road.radius );
  }
  else {
    return Math.hypot( road.end[ 0 ] - road.start[ 0 ], road.end[ 1 ] - road.start[ 1 ] );
  }
}

function drawArrow( ctx, pos, angle, width = 0.15, length = 0.3 ) {
  const cos = Math.cos( angle );
  const sin = Math.sin( angle );
  
  ctx.beginPath();
  ctx.moveTo( pos[ 0 ] + width * sin, pos[ 1 ] - width * cos );
  ctx.lineTo( pos[ 0 ] - width * sin, pos[ 1 ] + width * cos );
  ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
  ctx.closePath();
  ctx.fill();
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a < -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}


//
// Slider
//
const distSlider = document.createElement( 'input' );

Object.assign( distSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( distSlider, {
  type: 'range',
  value: 0,
  min: 0,
  max: 10,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  distance = +distSlider.value;

  canvas.redraw();
} );
