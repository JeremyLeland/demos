import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';
import * as Arc from '../src/common/Arc.js';


const roads = {
  EAST_LEFT: {
    start: [ 3, 6 ],
    end: [ 4, 6 ],
  },
  EAST_RIGHT: {
    start: [ 7, 6 ],
    end: [ 8, 6 ],
  },
  WEST_RIGHT: {
    start: [ 8, 5 ],
    end: [ 7, 5 ],
  },
  WEST_LEFT: {
    start: [ 4, 5 ],
    end: [ 3, 5 ],
  },
  NORTH_BOTTOM: {
    start: [ 6, 8 ],
    end: [ 6, 7 ],
  },
  NORTH_TOP: {
    start: [ 6, 4 ],
    end: [ 6, 3 ],
  },
  SOUTH_TOP: {
    start: [ 5, 3 ],
    end: [ 5, 4 ],
  },
  SOUTH_BOTTOM: {
    start: [ 5, 7 ],
    end: [ 5, 8 ],
  },
};

// Clover loops
// console.log( 'Clover loops CW' );
joinRoads( 'WEST_LEFT', 'SOUTH_TOP' );
// joinRoads( 'SOUTH_BOTTOM', 'EAST_LEFT' );
// joinRoads( 'EAST_RIGHT', 'NORTH_BOTTOM' );
// joinRoads( 'NORTH_TOP', 'WEST_RIGHT' );

joinRoads( 'EAST_RIGHT', 'NORTH_BOTTOM' );
joinRoads( 'NORTH_TOP', 'EAST_LEFT' );
joinRoads( 'SOUTH_BOTTOM', 'WEST_RIGHT' );

// Straight
joinRoads( 'NORTH_BOTTOM', 'NORTH_TOP' );
joinRoads( 'SOUTH_TOP', 'SOUTH_BOTTOM' );
joinRoads( 'EAST_LEFT', 'EAST_RIGHT' );
joinRoads( 'WEST_RIGHT', 'WEST_LEFT' );

// Right-turns
// console.log( 'Right turns' );
joinRoads( 'NORTH_BOTTOM', 'EAST_RIGHT' );
joinRoads( 'WEST_RIGHT', 'NORTH_TOP' );
joinRoads( 'SOUTH_TOP', 'WEST_LEFT' );
joinRoads( 'EAST_LEFT', 'SOUTH_BOTTOM' );

// // Left-turns
// console.log( 'Left turns' );
joinRoads( 'NORTH_BOTTOM', 'WEST_LEFT' );
joinRoads( 'WEST_RIGHT', 'SOUTH_BOTTOM' );
joinRoads( 'SOUTH_TOP', 'EAST_RIGHT' );
joinRoads( 'EAST_LEFT', 'NORTH_TOP' );

console.log( roads );

const players = Array.from( Array( 10 ), _ => { 
  const roadName = randomFrom( Object.keys( roads ) );

  return {
    color: randomColor(),
    speed: 0.005,
    roadName: roadName,
    roadDistance: Math.random() * getLength( roads[ roadName ] ),
  };
} );

function joinRoads( A, B ) {
  const road1 = roads[ A ];
  const road2 = roads[ B ];

  const newName = `${ A }_to_${ B }`;
  road1.next ??= [];
  road1.next.push( newName );
  
  // Check if roads are on same line
  const [ x1, y1 ] = road1.start;
  const [ x2, y2 ] = road1.end;
  const [ x3, y3 ] = road2.start;
  const [ x4, y4 ] = road2.end;

  if ( ( y3 - y1 ) * ( x2 - x1 ) == ( y2 - y1 ) * ( x3 - x1 ) ) {
    const line = {
      start: road1.end,
      end: road2.start,
    };
    roads[ newName ] = line;
    line.next = [ B ];
  }
  else {
    const arc = Arc.getArcBetweenLines( x1, y1, x2, y2, x3, y3, x4, y4 );
    roads[ newName ] = arc;
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
}


const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.zoom = 1 / 14;
canvas.scrollX = -1;
canvas.scrollY = -1;

const grid = new Grid( 0, 0, 12, 12 );

canvas.update = ( dt ) => {
  // Draw at distance along path
  players.forEach( player => {
    player.roadDistance += player.speed * dt;
    
    for ( let i = 0; i < 10; i ++ ) {
      const road = roads[ player.roadName ];

      const length = getLength( road );

      if ( player.roadDistance > length ) {
        player.roadDistance -= length;
        player.roadName = randomFrom( road.next );   // TODO: random? based on path?
      }
      else {
        break;
      }
    }
  } );
}

canvas.draw = ( ctx ) => {

  for ( const road of Object.values( roads ) ) {
    // Road itself
    ctx.lineWidth = 0.9;// 0.8;
    // ctx.lineCap = 'square';
    ctx.strokeStyle = '#555';

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
    // ctx.fillStyle = ctx.strokeStyle = 'yellow';
    // ctx.lineWidth = 0.05;
    
    // const roadLength = getLength( road );

    // for ( let length = 0; length < roadLength; length += 0.5 ) {
    //   drawOnRoadAtDistance( ctx, road, length, drawArrow );
    // }
  }

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.02;

  players.forEach( player => {
    ctx.fillStyle = player.color;
    drawOnRoadAtDistance( ctx, roads[ player.roadName ], player.roadDistance, drawArrow );
  } );

  ctx.lineWidth = 0.01;
  grid.draw( ctx, '#fffa' );
}

canvas.start();

function drawOnRoadAtDistance( ctx, road, distance, drawFunc ) {
  if ( road.center ) {
    // Compute angle at distance
    // const sweepAngle = deltaAngle( road.startAngle, road.endAngle );
    // const arcLength = Math.abs( sweepAngle * road.radius );

    // console.log( road );
    // console.log( 'sweepAngle: ' + sweepAngle );

    // We're already calling getLength() before this, just make caller responsible for keeping in bounds

    // // Don't draw if outside arc length
    // if ( 0 <= distance && distance <= arcLength ) {
      const angleOffset = ( distance / road.radius ) * ( road.counterclockwise ? -1 : 1 );
      const angleAtD = road.startAngle + angleOffset;

      // Final point
      const pos = [
        road.center[ 0 ] + road.radius * Math.cos( angleAtD ),
        road.center[ 1 ] + road.radius * Math.sin( angleAtD ),
      ];

      drawFunc( ctx, pos, angleAtD + ( road.counterclockwise ? -1 : 1 ) * Math.PI / 2 );
    // }
  }
  else {
    const total_dist = Math.hypot( road.end[ 0 ] - road.start[ 0 ], road.end[ 1 ] - road.start[ 1 ] );

    // if ( 0 <= distance && distance <= total_dist ) {
      const pos = [ 0, 1 ].map( 
        i => road.start[ i ] + ( road.end[ i ] - road.start[ i ] ) * ( distance / total_dist )
      );
      
      const angle = Math.atan2( road.end[ 1 ] - road.start[ 1 ], road.end[ 0 ] - road.start[ 0 ] );
      
      drawFunc( ctx, pos, angle );
    // }
  }
}

function getLength( road ) {
  if ( road.center ) {
    let sweepAngle = road.endAngle - road.startAngle;

    if ( !road.counterclockwise && sweepAngle < 0 ) {
      sweepAngle += 2 * Math.PI;
    }
    else if ( road.counterclockwise && sweepAngle > 0 ) {
      sweepAngle -= 2 * Math.PI;
    }

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
  ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
  ctx.lineTo( pos[ 0 ] - width * sin, pos[ 1 ] + width * cos );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function randomFrom( array ) {
  return array[ Math.floor( Math.random() * array.length ) ];
}

function randomColor() {
  return `hsl( ${ Math.random() * 360 }deg, ${ Math.random() * 75 + 25 }%, ${ Math.random() * 40 + 40 }% )`;
}