// Goal: Move route generating code to common file


import * as Arc from '../../src/common/Arc.js';
import * as Route from '../../src/Route.js';
import * as Streets from '../../src/Streets.js';


const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

let drawSteps = 40;

const streets = {
  line: {
    start: [ -5, 0 ],
    end: [ 5, 0 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  // arc: {
  //   center: [ -2, 0 ],
  //   radius: 4,
  //   startAngle: -Math.PI / 2,
  //   endAngle: Math.PI / 2,
  //   counterclockwise: false,
  //   lanes: {
  //     left: 2,
  //     right: 2,
  //   },
  // },
  line2: {
    start: [ 0, -5 ],
    end: [ 0, 5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  // arc: {
  //   center: [ 3, 3 ],
  //   radius: 3,
  //   startAngle: -Math.PI / 2,
  //   endAngle: Math.PI,
  //   counterclockwise: false,
  //   lanes: {
  //     left: 2,
  //     right: 2,
  //   },
  // },
  // arc2: {
  //   center: [ -3, -3 ],
  //   radius: 3,
  //   startAngle: Math.PI / 2,
  //   endAngle: 0,
  //   counterclockwise: false,
  //   lanes: {
  //     left: 2,
  //     right: 2,
  //   },
  // },
  line3: {
    start: [ -5, -5 ],
    end: [ 5, -5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  line4: {
    start: [ -5, 5 ],
    end: [ 5, 5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  line5: {
    start: [ -5, -5 ],
    end: [ -5, 5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
  line6: {
    start: [ 5, -5 ],
    end: [ 5, 5 ],
    lanes: {
      left: 2,
      right: 2,
    },
  },
};

// TODO: Make these part of some sort of level object separate from controlPoints?
//       Combine streetsFrom and routesFrom function to one function that returns level from control points?
let routes = {};


import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

import { vec2 } from '../../lib/gl-matrix.js'

const grid = new Grid( -6, -6, 6, 6 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  routes = Streets.routesFromStreets( streets );


  ctx.lineWidth = 0.02;
  grid.draw( ctx );


  function getNextLink( route, distance ) {
    let closest, closestDist = Infinity;
    let furthest, furthestDist = 0;

    route.links?.forEach( link => {
      const dist = link.fromDistance - distance;
      
      if ( routes[ link.name ].counterclockwise != true && 0 <= dist && dist < closestDist ) {
        closest = link;
        closestDist = dist;
      }
      
      if ( dist > furthestDist ) {
        furthest = link;
        furthestDist = dist;
      }
    } );

    // console.log( 'closest: ' );
    // console.log( closest );

    // console.log( 'furthest: ' );
    // console.log( furthest );

    return closest ?? furthest;
  }


  // The links created from when we made intersections should be enough starting points
  // to seed all the paths we need for the street outline. (We only care about the 
  // outer-most ones)
  const unvisited = new Set();

  const outerLanes = [];

  Object.values( streets ).forEach( street => {
    outerLanes.push(
      street.routes.left[ street.routes.left.length - 1 ],
      street.routes.right[ street.routes.right.length - 1 ],
    );
  } );

  console.log( 'outerLanes = ' );
  console.log( outerLanes );

  Object.entries( routes ).forEach( ( [ name, route ] ) => {
    if ( outerLanes.includes( name ) ) {
      let furthest, furthestDist = 0;

      let addedAny = false;

      route.links?.forEach( link => {
        if ( link.fromDistance > furthestDist ) {
          furthest = link;
          furthestDist = link.fromDistance;
        }

        if ( routes[ link.name ].counterclockwise == false ) {
          unvisited.add( link );
          addedAny = true;
        }
      } );

      // Avoid adding left turns at end of route if we already added right turns
      if ( !addedAny ) {
        unvisited.add( furthest );
      }
    }
    else {
      route.links?.forEach( link => {
        if ( outerLanes.includes( link.name ) && route.counterclockwise == false ) {
          unvisited.add( link );
        }
      } );
    }
  } );

  console.log( 'unvisited = ' );
  console.log( unvisited );


  const outline = new Path2D();
  let subpath = new Path2D();

  const visited = new Set();

  let thisLink, nextLink;

  for ( let tries = 0; tries < drawSteps; tries ++ ) {
    thisLink = nextLink ?? unvisited.values().next().value;
    nextLink = getNextLink( routes[ thisLink.name ], thisLink.toDistance );

    unvisited.delete( thisLink );
    visited.add( thisLink );

    // console.log( `addRouteToPath( subpath, routes[ ${ thisLink.name } ], ${ thisLink?.toDistance }, ${ nextLink?.fromDistance }, 1 )` );

    Route.addRouteToPath( subpath, routes[ thisLink.name ], thisLink?.toDistance, nextLink?.fromDistance, 1 * LANE_WIDTH / 2 );

    if ( visited.has( nextLink ) ) {
      console.log( 'making new path' );
      outline.addPath( subpath );
      subpath = new Path2D();

      nextLink = null;  // pull a new link from unvisited

      if ( unvisited.size == 0 ) {
        break;
      }
    }
  }

  outline.addPath( subpath ); // TEMP: add partial path for debugging

  console.log( 'visited =' );
  console.log( visited );

  
  ctx.fillStyle = '#555';
  ctx.fill( outline );

  ctx.strokeStyle = 'cyan';
  ctx.stroke( outline );





  // Maybe:
  //  - Pick pair of intersections
  //  - Find path between them
  //  - Draw dotted lines with all offsets along this path 
  //    (for both lane directions, but start from same intersection and end at same intersection for all of them)

  drawLinks( ctx, routes );
}

function drawLinks( ctx, routes ) {
  ctx.globalAlpha = 0.25;
  Object.values( routes ).forEach( route => {
    const routeLength = Route.getLength( route );
    
    ctx.fillStyle = route.arrowColor;

    for ( let length = 0; length < routeLength; length += DEBUG_ARROW_LENGTH ) {
      drawAtDistance( ctx, route, length, drawArrow );
    }

    // Linked routes
    ctx.setLineDash( [] );
    ctx.lineWidth = 0.1;
    ctx.strokeStyle = 'cyan';
  
    route.links?.forEach( link => {
      const toRoute = routes[ link.name ];
  
      // Draw last piece of our route, then first piece of next route
      ctx.beginPath();
      if ( route.center ) {
        ctx.arc( 
          ...route.center, 
          route.radius, 
          Arc.getAngleAtDistance( route, link.fromDistance - 0.5 ),
          Arc.getAngleAtDistance( route, link.fromDistance ),
          route.counterclockwise,
        );
      }
      else {
        ctx.lineTo( ...Route.getPositionAtDistance( route, link.fromDistance - 0.5 ) );
        ctx.lineTo( ...Route.getPositionAtDistance( route, link.fromDistance ) );
      }

      if ( toRoute.center ) {
        ctx.arc(
          ...toRoute.center,
          toRoute.radius,
          Arc.getAngleAtDistance( toRoute, link.toDistance ),
          Arc.getAngleAtDistance( toRoute, link.toDistance + 0.5 ),
          toRoute.counterclockwise,
        );
      }
      else {
        ctx.lineTo( ...Route.getPositionAtDistance( toRoute, link.toDistance ) );
        ctx.lineTo( ...Route.getPositionAtDistance( toRoute, link.toDistance + 0.5 ) );
      }
      ctx.stroke();
    } )

  } );
  ctx.globalAlpha = 1;
}


function drawArrow( ctx, pos, angle, width = DEBUG_ARROW_WIDTH, length = DEBUG_ARROW_LENGTH ) {
  const cos = Math.cos( angle );
  const sin = Math.sin( angle );
  
  ctx.beginPath();
  ctx.moveTo( pos[ 0 ] +  width * sin, pos[ 1 ] -  width * cos );
  ctx.lineTo( pos[ 0 ] + length * cos, pos[ 1 ] + length * sin );
  ctx.lineTo( pos[ 0 ] -  width * sin, pos[ 1 ] +  width * cos );
  ctx.closePath();
  ctx.fill();
  // ctx.stroke();
}


//
// Route utils
//

function drawAtDistance( ctx, route, distance, drawFunc ) {
  let pos, angle;
 
  if ( route.center ) {
    const angleAtD = Arc.getAngleAtDistance( route, distance );

    pos = vec2.scaleAndAdd( [], route.center, [ Math.cos( angleAtD ), Math.sin( angleAtD ) ], route.radius );
    angle = angleAtD + ( route.counterclockwise ? -1 : 1 ) * Math.PI / 2;
  }
  else {
    const lineVec = vec2.subtract( [], route.end, route.start );
    vec2.normalize( lineVec, lineVec );

    pos = vec2.scaleAndAdd( [], route.start, lineVec, distance );
    angle = Math.atan2( lineVec[ 1 ], lineVec[ 0 ] );
  }

  drawFunc( ctx, pos, angle );
}


//
// Slider
//
const drawStepsSlider = document.createElement( 'input' );

Object.assign( drawStepsSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( drawStepsSlider, {
  type: 'range',
  min: 0,
  max: 100,
  step: 0.01,
  value: drawSteps,
} );

document.body.appendChild( drawStepsSlider );

drawStepsSlider.addEventListener( 'input', _ => {
  drawSteps = +drawStepsSlider.value;

  canvas.redraw();
} );
