import { Cell } from "./Cell.js";

export function getVoronoiCells( seeds ) {
  const infoMap = new Map();
  
  seeds.forEach( seed => {
    const info = getVoronoiInfo( seed, seeds.filter( s => s != seed ) );
    if ( info ) {
      infoMap.set( seed, { 
        cell: new Cell( info.points ), 
        neighbors: info.neighbors 
      } );
    }
  } );

  const cells = [];

  seeds.forEach( seed => {
    const info = infoMap.get( seed );
    if ( info ) {
      info.cell.edges.forEach( ( edge, index ) => 
        edge.neighbor = infoMap.get( info.neighbors[ index ] )?.cell
      );
      cells.push( info.cell );
    }
  } );

  return cells;
}

function getVoronoiInfo( seed, others ) {
  let lines = others.map( other => {  
    const halfDist = Math.hypot( other.x - seed.x, other.y - seed.y ) / 2;
    const ang = Math.atan2( other.y - seed.y, other.x - seed.x );
    
    return {
      seed: other,
      dist: halfDist,
      point: {
        x: seed.x + Math.cos( ang ) * halfDist,
        y: seed.y + Math.sin( ang ) * halfDist,
      },
      slope: {
        x: -Math.sin( ang ),
        y:  Math.cos( ang ) 
      }
    };
  } );
  
  const start = lines.reduce( ( a, b ) => { return a.dist < b.dist ? a : b } );
  let currentLine = start, previousLine = start;
  let currentPoint = currentLine.point;
  
  const points = [], neighbors = [];
  do {
    const intersections = [];
    lines.forEach( line => {
      if ( line != currentLine && line != previousLine ) {
        const dets = getDeterminants( { point: currentPoint, slope: currentLine.slope }, line );
        
        if ( dets.a < 0 ) {
          intersections.push( { line: line, det: dets.a } );
        }
      }
    } );

    if ( intersections.length == 0 ) {
      return null;
    }

    // Going counter-clockwise, so find closest to 0
    const closest = intersections.reduce( ( a, b ) => { return a.det > b.det ? a : b } );

    currentPoint = {
      x: currentPoint.x + currentLine.slope.x * closest.det,
      y: currentPoint.y + currentLine.slope.y * closest.det,
    };

    // // Ignore points out of bounds for now
    // if ( currentPoint.x < 0 || currentPoint.y < 0 || width < currentPoint.x || height < currentPoint.y ) {
    //   return null;
    // }

    previousLine = currentLine;
    currentLine = closest.line;

    points.push( currentPoint );
    neighbors.push( currentLine.seed );
  }
  while ( currentLine != start );

  return { points: points, neighbors: neighbors };
}

// Based on: https://www.jeffreythompson.org/collision-detection/line-line.php
function getDeterminants( a, b ) {
  // const D = ( ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 ) );

  // return {
  //   x: ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D,
  //   y: ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D,
  // }

  const D = b.slope.y * a.slope.x - b.slope.x * a.slope.y;

  return {
    a: ( b.slope.x * ( a.point.y - b.point.y ) - b.slope.y * ( a.point.x - b.point.x ) ) / D,
    b: ( a.slope.x * ( a.point.y - b.point.y ) - a.slope.y * ( a.point.x - b.point.x ) ) / D,
  }
}