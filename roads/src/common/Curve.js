export function getTimeFromTable( table, length ) {
  const afterIndex = table.findIndex( e => e.length >= length );

  if ( afterIndex == -1 ) {
    return null;
  }
  else if ( afterIndex == 0 ) {
    return table[ afterIndex ].t;
  }

  const after = table[ afterIndex ];
  const beforeIndex = afterIndex - 1;

  const before = table[ beforeIndex ];

  // console.log( `Before ${ length }: ${ JSON.stringify( before ) } (index ${ beforeIndex })` );
  // console.log( `After ${ length }: ${ JSON.stringify( after ) } (index ${ afterIndex })` );

  // Linear interpolate for now, see if this is accurate enough
  const ratio = ( length - before.length ) / ( after.length - before.length );
  const time = before.t + ratio * ( after.t - before.t );

  // console.log( `Time of ${ length } is approximately ${ time }` );

  return time;
}

export function getQuadraticBezierTable( P0, P1, P2, steps = 100 ) {
  return getBezierTable( t => quadraticBezier( t, P0, P1, P2, steps ) );
}

export function getCubicBezierTable( P0, P1, P2, P3, steps = 100 ) {
  return getBezierTable( t => cubicBezier( t, P0, P1, P2, P3, steps ) );
}

function getBezierTable( func, steps = 100 ) {
  const table = [ { t: 0, length: 0 } ];
  
  let prev = func( 0 );
  let totalLength = 0;

  for ( let i = 1; i <= steps; i ++ ) {
    const t = i / steps;

    const point = func( t );
    const dist = Math.hypot( point[ 0 ] - prev[ 0 ], point[ 1 ] - prev[ 1 ] );
    prev = point;

    totalLength += dist;
    table.push( { t: t, length: totalLength } );
  }

  return table;
}

export function quadraticBezier( t, P0, P1, P2 ) {
  return [ 0, 1 ].map( i => 
    P0[ i ] *     ( 1 - t ) ** 2          +
    P1[ i ] * 2 * ( 1 - t ) ** 1 * t ** 1 +
    P2[ i ]                      * t ** 2
  );
}

export function cubicBezier( t, P0, P1, P2, P3 ) {
  return [ 0, 1 ].map( i => 
    P0[ i ] *     ( 1 - t ) ** 3          +
    P1[ i ] * 3 * ( 1 - t ) ** 2 * t ** 1 +
    P2[ i ] * 3 * ( 1 - t ) ** 1 * t ** 2 +
    P3[ i ]                      * t ** 3
  );
}

export function quadraticTangent( t, P0, P1, P2 ) {
  return [ 0, 1 ].map( i => 
    ( P1[ i ] - P0[ i ] ) * 2 * ( 1 - t ) + 
    ( P2[ i ] - P1[ i ] ) * 2 * t
  );
}

export function cubicTangent( t, P0, P1, P2, P3 ) {
  return [ 0, 1 ].map( i => 
    ( P1[ i ] - P0[ i ] ) * 3 * ( 1 - t ) ** 2          + 
    ( P2[ i ] - P1[ i ] ) * 6 * ( 1 - t ) ** 1 * t ** 1 + 
    ( P3[ i ] - P2[ i ] ) * 3                  * t ** 2
  );
}