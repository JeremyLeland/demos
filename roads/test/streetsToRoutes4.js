// Use this one to try arc roads with lanes

import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

import * as Roads from '../src/Roads.js';

const streets = {
  arc1: {
    center: [ 10, 10 ],
    radius: 5,
    startAngle: 0,
    endAngle: -Math.PI / 2,
    counterclockwise: true,

    lanes: { left: 1, right: 1 },
  },
  line: {
    start: [ 15, 10 ],
    end: [ 15, 15 ],
  },
};


const routes = Roads.makeRoutes( streets );

console.log( routes );

let hoverRouteName;

const nameDiv = document.createElement( 'div' );
for ( const name of Object.keys( routes ) ) {
  // const label = document.createTextNode( name );
  // nameDiv.appendChild( label );

  const div = document.createElement( 'div' );
  div.innerText = name;

  div.addEventListener( 'mouseover', _ => {
    hoverRouteName = name;
    canvas.redraw();
  } );

  nameDiv.appendChild( div );
}

document.body.appendChild( nameDiv );

Object.assign( nameDiv.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  overflow: 'scroll',
  fontSize: '10px'
} );


const players = Array.from( Array( 0 ), _ => { 
  const routeName = randomFrom( Object.keys( routes ) );

  return {
    color: randomColor(),
    speed: 0.005,
    routeName: routeName,
    routeDistance: Math.random() * Roads.getRoadLength( routes[ routeName ] ),
  };
} );


const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ -0.5, -0.5, 26.5, 26.5 ];

const grid = new Grid( 0, 0, 26, 26 );

canvas.update = ( dt ) => {
  // Draw at distance along path
  players.forEach( player => {
    player.routeDistance += player.speed * dt;
    
    for ( let i = 0; i < 10; i ++ ) {
      const route = routes[ player.routeName ];

      const length = Roads.getRoadLength( route );

      if ( player.routeDistance > length ) {
        player.routeDistance -= length;
        player.routeName = randomFrom( route.next );   // TODO: random? based on path?
      }
      else {
        break;
      }
    }
  } );
}

const DRAW_PLAYERS = true;

canvas.draw = ( ctx ) => {

  Roads.drawRoads( ctx, routes, hoverRouteName );

  if ( DRAW_PLAYERS ) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.02;
    
    players.forEach( player => {
      ctx.fillStyle = player.color;
      Roads.drawOnRoadAtDistance( ctx, routes[ player.routeName ], player.routeDistance, Roads.drawArrow );
    } );
    
    ctx.lineWidth = 0.01;
    grid.draw( ctx, '#fffa' );
  }
}

document.addEventListener( 'keydown', e => {
  if ( e.key == ' ' ) {
    canvas.toggle();
  }
} );

// canvas.start();



function randomFrom( array ) {
  return array[ Math.floor( Math.random() * array.length ) ];
}

function randomColor() {
  return `hsl( ${ Math.random() * 360 }deg, ${ Math.random() * 75 + 25 }%, ${ Math.random() * 40 + 40 }% )`;
}
