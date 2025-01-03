import { Cell } from './Cell.js';
import '../lib/poly2tri.js';

export function fromPoints( pointArrays ) {
  const contour = pointArrays[ 0 ].map( p => new poly2tri.Point( ...p ) );
  const swctx = new poly2tri.SweepContext( contour );

  for ( let i = 1; i < pointArrays.length; i ++ ) { 
    const hole = pointArrays[ i ].map( p => new poly2tri.Point( ...p ) );
    swctx.addHole( hole );
  }

  swctx.triangulate();
  const triangles = swctx.getTriangles();

  let cells = [];

  triangles.forEach( triangle => {
    const [ a, b, c ] = triangle.getPoints();

    // Altering order so normals point inward
    const cell = new Cell( [ [ b.x, b.y ], [ a.x, a.y ], [ c.x, c.y ] ] );

    triangle.cell = cell;

    cells.push( cell );
  } );

  triangles.forEach( triangle => {
    triangle.cell.edges.forEach( ( edge, index ) => {
      // Account for reverse edge order due to above
      const neighbor = triangle.getNeighbor( 2 - index );
      if ( neighbor?.cell ) {
        for ( let i = 0; i < 3; i ++ ) {
          const neighborNeighbor = neighbor.getNeighbor( 2 - i );
          if ( neighborNeighbor == triangle ) {
            edge.neighbor = neighbor.cell.edges[ i ];
          }
        }
      }
    } );
  } );

  cells.forEach( cell => cell.linkAll() );

  //
  // Merge triangles into convex shapes
  //
  // console.log( `${ cells.length } cells before merge` );

  cells.forEach( cell => {
    for ( let i = 0; i < cell.edges?.length; i ++ ) {
      if ( cell.isConvexEdge( i ) ) {
        cell.merge( i );
        i = -1;   // start this cell over
      }
    }
  } );

  cells = cells.filter( c => c.edges );   // remove edge-less cells

  // console.log( `${ cells.length } cells after merge` );

  return cells;
}

export function linkMaze( cell ) {
  const edges = cell.edges.filter( e => e.neighbor ).sort( ( a, b ) => Math.random() > 0.5 ? 1 : -1 );
  edges.forEach( edge => doEdge( edge ) );
}

function doEdge( edge ) {
  const nextCell = edge.neighbor.parent;
  if ( nextCell.edges.find( e => e.linked ) ) {
    return;
  }
  else {
    edge.linked = true;
    edge.neighbor.linked = true;

    linkMaze( nextCell );
  }
}

export function getFlowMap( cells ) {
  const flowMap = new Map();
  cells.forEach( cell => flowMap.set( cell, getFlowField( cell ) ) );
  return flowMap;
}

// See: http://leifnode.com/2013/12/flow-field-pathfinding/
function getFlowField( target ) {
  const bestCost = new Map();
  const bestEdge = new Map();

  bestCost.set( target, 0 );
  bestEdge.set( target, null );

  const open = new Set( [ target ] );

  while ( open.size > 0 ) {
    const [ cell ] = open;
    open.delete( cell );

    cell.edges.filter( e => e.linked ).forEach( edge => {
      const neighborCell = edge.neighbor.parent;

      if ( !bestCost.has( neighborCell ) ) {
        bestCost.set( neighborCell, Infinity );
        // bestEdge.set( neighborCell, null );
      }

      const endNodeCost = bestCost.get( cell ) + Math.hypot( cell.x - neighborCell.x, cell.y - neighborCell.y );

      if ( endNodeCost < bestCost.get( neighborCell ) ) {
        open.add( neighborCell );
        bestCost.set( neighborCell, endNodeCost );
        bestEdge.set( neighborCell, edge.neighbor );
      }
    } );
  }

  return bestEdge;
}

export function getLoops( cells ) {
  const loops = [];

  const unvisited = new Set();

  cells.forEach( cell => 
    cell.edges.filter( e => !e.linked ).forEach( edge => unvisited.add( edge ) ) 
  );

  const visited = new Set();

  while ( unvisited.size > 0 ) {
    const lines = [];

    let [ edge ] = unvisited;
    let cell = edge.parent;
    let index = cell.edges.findIndex( e => e == edge );
    
    while( !visited.has( edge ) ) {
      unvisited.delete( edge );
      visited.add( edge );
      
      lines.push( [ edge.x1, edge.y1 ] );

      index = ( index + 1 ) % cell.edges.length;
      edge = cell.edges[ index ];

      if ( edge.linked ) {
        edge = edge.neighbor;
        cell = edge.parent;
        index = cell.edges.findIndex( e => e == edge );

        index = ( index + 1 ) % cell.edges.length;
        edge = cell.edges[ index ];
      }
    }

    loops.push( lines );
  }

  // TODO: Put counter-clockwise loop first
  // TODO: How to represent multiple discrete regions?
  // [
  //   {
  //     outer:
  //     holes:
  //   },
  //   {
  //     outer:
  //     holes:
  //   },
  // ]
 
  // TODO: Assumes one outer loop for now
  
  // https://en.wikipedia.org/wiki/Curve_orientation#Practical_considerations
  const outerIndex = loops.findIndex( points => {
    let hullPoint, hullPointIndex;
    points.forEach( ( p, index ) => {
      if ( !hullPoint || p[ 0 ] < hullPoint[ 0 ] || p[ 0 ] == hullPoint[ 0 ] && p[ 1 ] < hullPoint[ 1 ] ) {
        hullPoint = p;
        hullPointIndex = index;
      }
    } );
    
    const a = points.at( hullPointIndex - 1 );
    const b = hullPoint;
    const c = points.at( ( hullPointIndex + 1 ) % points.length );
    
    const det = ( b[ 0 ] - a[ 0 ] ) * ( c[ 1 ] - a[ 1 ] ) - ( c[ 0 ] - a[ 0 ] ) * ( b[ 1 ] - a[ 1 ] );
    return det < 0;
  } );

  // Put out loop first
  loops.splice( 0, 0, loops.splice( outerIndex, 1 )[ 0 ] );

  return loops;
}