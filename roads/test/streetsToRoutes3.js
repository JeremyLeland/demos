import { Canvas } from '../src/common/Canvas.js';
import { Grid } from '../src/common/Grid.js';

import * as Roads from '../src/Roads.js';

const streets = {
  up_right: {
    start: [ 10, 20 ],
    end: [ 20, 10 ],
    lanes: { left: 2, right: 2 },
  },
  down_right: {
    start: [ 10, 10 ],
    end: [ 20, 20 ],
    lanes: { left: 2, right: 2 },
  },
  neigh: {
    start: [ 20, 10 ],
    end: [ 22, 5 ],
    lanes: { left: 2, right: 2 },
  },
  moo: {
    start: [ 10, 10 ],
    end: [ 8, 5 ],
    lanes: { left: 2, right: 2 },
  },

  squid: {
    start: [ 22, 5 ],
    end: [ 15, 2 ],
    lanes: { left: 2, right: 2 },
  },
  horse: {
    start: [ 8, 5 ],
    end: [ 15, 2 ],
    lanes: { left: 2, right: 2 },
  },

  quack: {
    start: [ 10, 20 ],
    end: [ 15, 25 ],
    lanes: { left: 2, right: 2 },
  },
  ribbit: {
    start: [ 20, 20 ],
    end: [ 15, 25 ],
    lanes: { left: 2, right: 2 },
  },
  // first: {
  //   start: [ 22, 3 ],
  //   end: [ 2, 3 ],
  //   lanes: { left: 1, right: 1 },
  // },
  // second: {
  //   start: [ 22, 12 ],
  //   end: [ 2, 12 ],
  //   lanes: { left: 2, right: 2 },
  // },
  // third: {
  //   start: [ 22, 22 ],
  //   end: [ 2, 22 ],
  //   lanes: { left: 1, right: 1 },
  // },
  // A: {
  //   start: [ 2, 3 ],
  //   end: [ 2, 22 ],
  //   lanes: { left: 1, right: 1 },
  // },
  // B: {
  //   start: [ 13, 3 ],
  //   end: [ 13, 22 ],
  //   lanes: { left: 2, right: 2 },
  // },
  // C: {
  //   start: [ 22, 3 ],
  //   end: [ 22, 22 ],
  //   lanes: { left: 1, right: 1 },
  // },
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


const players = Array.from( Array( 10 ), _ => { 
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
