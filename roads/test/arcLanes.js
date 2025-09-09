import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Arc from '../src/common/Arc.js';

let distance = 0;

const players = [
  {
    color: 'red',
    roadName: 'first_NORTH',
    roadDistance: 1,
  },
  {
    color: 'orange',
    roadName: 'first_SOUTH',
    roadDistance: 0.5,
  },
  {
    color: 'lime',
    roadName: 'third_NORTH_to_second_SOUTH',
    roadDistance: 0,
  },
  {
    color: 'cyan',
    roadName: 'second_NORTH_to_third_SOUTH',
    roadDistance: 0.5,
  },
  {
    color: 'purple',
    roadName: 'third_NORTH',
    roadDistance: 4,
  },
  {
    color: 'brown',
    roadName: 'third_SOUTH',
    roadDistance: 2,
  },
  {
    color: 'white',
    roadName: 'B_EAST',
    roadDistance: 1,
  },
  {
    color: 'black',
    roadName: 'B_WEST',
    roadDistance: 2.5,
  },
];

const roads = {
  A_EAST: {
    start: [ 3, 6 ],
    end: [ 5, 6 ],
  },
  A_WEST: {
    start: [ 5, 5 ],
    end: [ 3, 5 ],
  },
  B_EAST: {
    start: [ 3, 11 ],
    end: [ 9, 11 ],
  },
  B_WEST: {
    start: [ 9, 10 ],
    end: [ 3, 10 ],
  },
  first_NORTH: {
    start: [ 2, 9 ],
    end: [ 2, 7 ],
  },
  first_SOUTH: {
    start: [ 1, 7 ],
    end: [ 1, 9 ],
  },
  second_NORTH: {
    start: [ 7, 4 ],
    end: [ 7, 2 ],
  },
  second_SOUTH: {
    start: [ 6, 2 ],
    end: [ 6, 4 ],
  },
  third_NORTH: {
    start: [ 11, 9 ],
    end: [ 11, 2 ],
  },
  third_SOUTH: {
    start: [ 10, 2 ],
    end: [ 10, 9 ],
  },

  diag_test: {
    start: [ 4, 7 ],
    end: [ 5, 7 ],
  },
  diag_test2: {
    start: [ 7, 8 ],
    end: [ 7.5, 9 ],
  },
};

joinRoads( 'B_WEST', 'first_NORTH' );
joinRoads( 'first_NORTH', 'A_EAST' );
joinRoads( 'A_EAST', 'second_NORTH' );
joinRoads( 'second_NORTH', 'third_SOUTH' );
joinRoads( 'third_SOUTH', 'B_WEST' );

joinRoads( 'B_EAST', 'third_NORTH' );
joinRoads( 'third_NORTH', 'second_SOUTH' );
joinRoads( 'second_SOUTH', 'A_WEST' );
joinRoads( 'A_WEST', 'first_SOUTH' );
joinRoads( 'first_SOUTH', 'B_EAST' );

joinRoads( 'diag_test', 'diag_test2' );

console.log( roads );

function joinRoads( A, B ) {
  const road1 = roads[ A ];
  const road2 = roads[ B ];

  const arc = Arc.getArcBetweenLines( ...road1.start, ...road1.end, ...road2.start, ...road2.end );

  const newName = `${ A }_to_${ B }`;
  roads[ newName ] = arc;

  // Set nexts
  road1.next ??= [];
  road1.next.push( newName );
  arc.next = [ B ];
  
  // Adjust roads to properly attach to arc
  road1.end = [
    arc.center[ 0 ] + arc.radius * Math.cos( arc.startAngle ),
    arc.center[ 1 ] + arc.radius * Math.sin( arc.startAngle ),
  ];

  road2.start = [
    arc.center[ 0 ] + arc.radius * Math.cos( arc.endAngle ),
    arc.center[ 1 ] + arc.radius * Math.sin( arc.endAngle ),
  ];
}

// const path = [ roads.first_NORTH, roads.first_NORTH_to_A_EAST, roads.A_EAST, roads.A_EAST_to_second_NORTH, roads.second_NORTH ];

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

  // Draw at distance along path
  players.forEach( player => {
    let partialDistance = player.roadDistance + distance;
    let partialRoadName = player.roadName;

    for ( let i = 0; i < 100; i ++ ) {
      const road = roads[ partialRoadName ];

      const length = getLength( road );

      if ( partialDistance > length ) {
        partialDistance -= length;
        partialRoadName = road.next[ 0 ];
      }
      else {
        ctx.fillStyle = player.color;
        drawOnRoadAtDistance( ctx, road, partialDistance, drawArrow );
        break;
      }
    }
  } );
  

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
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
  max: 100,
  step: 0.01,
} );

document.body.appendChild( distSlider );

distSlider.addEventListener( 'input', _ => {
  distance = +distSlider.value;

  canvas.redraw();
} );
