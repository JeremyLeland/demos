// Goal: Click and drag to create streets. 
// Make routes, then make appropriate turning lanes between intersecting streets.


import * as Angle from '../../src/common/Angle.js';
import * as Arc from '../../src/common/Arc.js';
import * as Route from '../../src/Route.js';
import * as Streets from '../../src/Streets.js';

import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';
import { vec2 } from '../../lib/gl-matrix.js'


const DEBUG_ARROW_LENGTH = 0.1;
const DEBUG_ARROW_WIDTH = DEBUG_ARROW_LENGTH / 2;

let drawSteps = 100;

// Simple elbow
// const streets = {
//   Horiz: {
//     start: [ -3, 3 ],
//     end: [ 3, 3 ],
//     lanes: {
//       left: 1,
//       right: 1,
//     },
//   },
//   Vert: {
//     start: [ -3, -3 ],
//     end: [ -3, 3.5 ],
//     lanes: {
//       left: 1,
//       right: 1,
//     },
//   },
// };

const streets = {
  "Horiz": {
    "lanes": {
      "left": 1,
      "right": 1
    },
    "center": [
      -4.676435679631939,
      -4.484232402598129
    ],
    "radius": 7.669691730704907,
    "startAngle": 1.3504380219755818,
    "endAngle": 0.2016416654015348,
    "counterclockwise": true
  },
  "Vert": {
    "lanes": {
      "left": 1,
      "right": 1
    },
    "center": [
      -55.698987454324225,
      57.79509949013167
    ],
    "radius": 80.45636954726481,
    "startAngle": -0.8566126305602474,
    "endAngle": -0.7801716442364556,
    "counterclockwise": false
  }
};

// LATER: Outline messed up because we have no way off of the extra road
//   - Ideally, we would have closer turns that would allow this to work
//      - Do this work first, since we know we want it anyway
//        - Start with a slider for radius to help visualize the effect of different radii
//        - Big question is how to handle 4-way cases vs 2 or 1-way cases 
//          (should be able to use more space for 1-way, but does it really matter?)
//   - However, we shouldn't turn onto a lane if we can't turn off it
//      - what about one-way roads? How would that be handled?
//   - Can we make sure each join on has a matching join off?

// const streets = {
//   "C": {
//     "lanes": {
//       "left": 2,
//       "right": 2
//     },
//     "center": [ 6, -6 ],
//     "radius": 9,
//     "startAngle": 2.8428864574594708,
//     "endAngle": 1.86950252292522,
//     "counterclockwise": true
//   },
//   "D": {
//     "lanes": {
//       "left": 3,
//       "right": 3
//     },
//     "center": [ -2, -2 ],
//     "radius": 5,
//     "startAngle": -0.06627702810972162,
//     "endAngle": 1.63707335428374,
//     "counterclockwise": false
//   }
// };

// TODO: Make these part of some sort of level object separate from controlPoints?
//       Combine streetsFrom and routesFrom function to one function that returns level from control points?
let routes = {};

const GRID_SIZE = 20;
const VIEW_SIZE = 5;
const grid = new Grid( -GRID_SIZE, -GRID_SIZE, GRID_SIZE, GRID_SIZE );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ -VIEW_SIZE - 0.5, -VIEW_SIZE - 0.5, VIEW_SIZE + 0.5, VIEW_SIZE + 0.5 ];

canvas.draw = ( ctx ) => {

  console.log( JSON.stringify( streets ) );

  routes = Streets.routesFromStreets( streets );

  console.log( routes );

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

  // console.log( 'outerLanes = ' );
  // console.log( outerLanes );

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

  // console.log( 'unvisited = ' );
  // console.log( unvisited );


  const outline = new Path2D();
  let subpath = new Path2D();

  const visited = new Set();

  let thisLink, nextLink;

  for ( let tries = 0; tries < drawSteps; tries ++ ) {
    thisLink = nextLink ?? unvisited.values().next().value;

    if ( thisLink == null ) {
      console.log( 'thisLink == null' );
      break;
    }

    nextLink = getNextLink( routes[ thisLink.name ], thisLink.toDistance );

    unvisited.delete( thisLink );
    visited.add( thisLink );

    // console.log( `addRouteToPath( subpath, routes[ ${ thisLink.name } ], ${ thisLink?.toDistance }, ${ nextLink?.fromDistance }, 1 )` );

    Route.addRouteToPath( subpath, routes[ thisLink.name ], thisLink?.toDistance, nextLink?.fromDistance, 1 * Streets.LANE_WIDTH / 2 );

    if ( visited.has( nextLink ) ) {
      // console.log( 'making new path' );
      outline.addPath( subpath );
      subpath = new Path2D();

      nextLink = null;  // pull a new link from unvisited

      if ( unvisited.size == 0 ) {
        break;
      }
    }
  }

  outline.addPath( subpath ); // TEMP: add partial path for debugging

  // console.log( 'visited =' );
  // console.log( visited );

  
  ctx.fillStyle = '#555';
  ctx.fill( outline );

  ctx.strokeStyle = 'cyan';
  ctx.stroke( outline );


  // Streets
  // Object.entries( streets ).forEach( ( [ name, street ] ) => {
  //   ctx.lineWidth = 0.5;
  //   ctx.strokeStyle = name == hover?.name ? 'darkgray' : 'gray';

  //   if ( street.center ) {
  //     drawArc( ctx, street );
  //   }
  //   else {
  //     drawLine( ctx, street.start, street.end );
  //   }
  // } );

  // Routes
  

  Object.values( routes ).forEach( route => {
    const routeLength = Route.getLength( route );
    
    ctx.fillStyle = route.arrowColor;

    for ( let length = 0; length < routeLength; length += DEBUG_ARROW_LENGTH ) {
      drawAtDistance( ctx, route, length, drawArrow );
    }
  } );

  // TODO: Draw outline of streets based on the routes (and connections between them)
  // TODO: Ignore parts of street with no more connections? (this might make joins nicer)

  // Control points
  const controlColors = {
    start: 'lime',
    middle: 'yellow',
    end: 'red',
  };

  if ( hover ) {
    ctx.fillStyle = controlColors[ hover.action ];
    drawPoint( ctx, hover.point, 0.1 );
  }
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
// Draw utils
//

function drawArc( ctx, arc ) {
  ctx.beginPath();
  ctx.arc( arc.center[ 0 ], arc.center[ 1 ], arc.radius, arc.startAngle, arc.endAngle, arc.counterclockwise );
  ctx.stroke();
}

function drawLine( ctx, start, end ) {
  ctx.beginPath();
  ctx.moveTo( ...start );
  ctx.lineTo( ...end );
  ctx.stroke();
}

function drawPoint( ctx, p, radius = 0.05 ) {
  ctx.beginPath();
  ctx.arc( p[ 0 ], p[ 1 ], radius, 0, Math.PI * 2 );
  ctx.fill();
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
// Input
//

// TODO:
//  - Hover streets
//    - Delete streets (right click)
//    - Move streets (w/left click? vs insert)
//  - Key to snap to grid/whole numbers (maybe shift?)

let hover;
let nameIndex = 0;

canvas.pointerDown = ( m ) => {
  if ( m.buttons == 1 ) {
    if ( !hover ) {
      const newStreet = {
        start: [ m.x, m.y ],
        end: [ m.x, m.y ],
        lanes: { left: 1, right: 1 },
      };

      const newName = `street_${ nameIndex ++ }`;

      streets[ newName ] = newStreet;

      hover = {
        name: newName,
        action: 'end',
        point: [ m.x, m.y ],
      };
    }
  }
  else if ( m.buttons == 2 ) {
    if ( hover ) {
      delete streets[ hover.name ];
      hover = null;
    }
  }

  canvas.redraw();
}

canvas.pointerUp = ( m ) => {
  // selected = null;
}

canvas.pointerMove = ( m ) => {
  // Hover if no buttons pressed
  if ( m.buttons == 0 ) {
    hover = hoverUnderCursor( m.x, m.y );
  }

  // Drag selected point if left button pressed
  else if ( m.buttons == 1 ) {
    if ( hover ) {
      const street = streets[ hover.name ];
      const moveVector = [ m.dx, m.dy ];

      if ( street.center ) {
        const points = {
          start:  hover.action == 'start'  ? hover.point : Arc.getPointAtAngle( street, street.startAngle ),
          middle: hover.action == 'middle' ? hover.point : Arc.getPointAtAngle( street, street.startAngle + Angle.sweepAngle( street.startAngle, street.endAngle, street.counterclockwise ) / 2 ),
          end:    hover.action == 'end'    ? hover.point : Arc.getPointAtAngle( street, street.endAngle ),
        };

        // NOTE: Via side effect, this is also moving the hover point
        vec2.add( points[ hover.action ], points[ hover.action ], moveVector );

        Object.assign( street, Arc.arcFromThreePoints( points.start, points.middle, points.end ) );
      }
      else {
        vec2.add( hover.point, hover.point, moveVector );

        // If dragging a middle point, turn street into arc
        if ( hover.action == 'middle' ) {
          Object.assign( street, Arc.arcFromThreePoints( street.start, hover.point, street.end ) );
          delete street.start;
          delete street.end;
        }
        else {
          vec2.add( street[ hover.action ], street[ hover.action ], moveVector );
        }
      } 
    }
  }

  // Pan if middle button pressed
  else if ( m.buttons == 4 ) {
    canvas.translate( -m.dx, -m.dy );
  }

  canvas.redraw();
}

canvas.wheelInput = ( m ) => {
  canvas.zoom( m.x, m.y, 0.1 * Math.sign( m.wheel ) );
  canvas.redraw();
}


function hoverUnderCursor( x, y ) {
  // TODO: what if multiple streets overlap here? This isn't actually closest at moment, it's just latest.

  let closestHover;

  Object.entries( streets ).forEach( ( [ name, street ] ) => {

    // TODO: Here's a trade-off of defining lanes as being to one side or other of center point
    //       Since the point defining the street may not be the actual center, determining whether we are overlapping is harder
    // Should we look at routes instead of streets? Each route could say which street it is part of...

    const HOVER_DIST = Streets.LANE_WIDTH * ( street.lanes.left + street.lanes.right ) / 2;   // wrong, but close-ish for now
    const ENDPOINT_DIST = 0.4;

    if ( street.center ) {
      const dist = vec2.distance( [ x, y ], street.center );
      const angle = Math.atan2( y - street.center[ 1 ], x - street.center[ 0 ] );

      if ( ( Math.abs( dist - street.radius ) < HOVER_DIST ) && Angle.isBetweenAngles( angle, street.startAngle, street.endAngle, street.counterclockwise ) ) {
        const nearStart = Math.abs( Angle.deltaAngle( angle, street.startAngle ) * street.radius ) < ENDPOINT_DIST;
        const nearEnd   = Math.abs( Angle.deltaAngle( angle, street.endAngle   ) * street.radius ) < ENDPOINT_DIST;

        closestHover = {
          name: name,
          action: nearStart ? 'start' : nearEnd ? 'end' : 'middle',
          point: Arc.getPointAtAngle( street, angle ),
        };
      }
    }
    else {
      const AB = vec2.subtract( [], street.end, street.start );
      const AP = vec2.subtract( [], [ x, y ], street.start );
      const u = vec2.dot( AP, AB ) / vec2.sqrLen( AB );
      const t = Math.max( 0, Math.min( 1, u ) );

      const closest = vec2.scaleAndAdd( [], street.start, AB, t );
      const dist = vec2.distance( [ x, y ], closest );

      if ( dist < HOVER_DIST ) {
        const nearStart = vec2.distance( street.start, [ x, y ] ) < ENDPOINT_DIST;
        const nearEnd   = vec2.distance( street.end,   [ x, y ] ) < ENDPOINT_DIST;

        closestHover = {
          name: name,
          action: nearStart ? 'start' : nearEnd ? 'end' : 'middle',
          point: closest,
        };
      }
    }
  } );

  return closestHover;
}

//
// Slider
//
const radiusSlider = document.createElement( 'input' );

Object.assign( radiusSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( radiusSlider, {
  type: 'range',
  min: 0,
  max: 10,
  step: 0.01,
  value: Streets.Constants.StartRadius,
} );

document.body.appendChild( radiusSlider );

radiusSlider.addEventListener( 'input', _ => {
  Streets.Constants.StartRadius = +radiusSlider.value;

  canvas.redraw();
} );