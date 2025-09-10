export function getArcBetweenLines( x1, y1, x2, y2, x3, y3, x4, y4, ctx ) {

  // Find intersection between lines, use this as control point
  const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );

  console.log( D );

  if ( D == 0 ) {
    // console.log( `Lines ${ x1 },${ y1 } -> ${ x2 },${ y2 } and ${ x3 },${ y3 } -> ${ x4 },${ y4 } are parallel, no arc possible` );
    // return;

    const center = [
      ( x2 + x3 ) / 2,
      ( y2 + y3 ) / 2,
    ];

    const radius = Math.hypot( x2 - center[ 0 ], y2 - center[ 1 ] );

    const startAngle = Math.atan2( y2 - center[ 1 ], x2 - center[ 0 ] );
    const endAngle = Math.atan2( y3 - center[ 1 ], x3 - center[ 0 ] );

    // TODO: Not sure about this at all...
    const v0 = normalize( [ x1 - center[ 0 ], y1 - center[ 1 ] ] );
    const v1 = normalize( [ x4 - center[ 0 ], y4 - center[ 1 ] ] );
    const cross = v0[ 0 ] * v1[ 1 ] - v0[ 1 ] * v1[ 0 ];

    console.log( 'v0 = ' + v0 );
    console.log( 'v1 = ' + v1 );
    console.log( 'cross = ' + cross );


    return {
      center: center,
      radius: radius,
      startAngle: startAngle,
      endAngle: endAngle,
      counterclockwise: cross > 0,
    };
  }
  else {
    const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
    // const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;

    const intersection = [
      x1 + ( x2 - x1 ) * uA,
      y1 + ( y2 - y1 ) * uA,
    ];

    if ( ctx ) {
      ctx.beginPath();
      ctx.arc( ...intersection, 0.1, 0, Math.PI * 2 );
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo( x1, y1 );
      ctx.lineTo( ...intersection );
      ctx.moveTo( x4, y4 );
      ctx.lineTo( ...intersection );
      ctx.stroke();
    }

    // TODO: Need to take into account if intersection is behind us. If so, do parallel case there too

    const v0 = normalize( [ x2 - intersection[ 0 ], y2 - intersection[ 1 ] ] );
    const v1 = normalize( [ x3 - intersection[ 0 ], y3 - intersection[ 1 ] ] );

    // const radius = Math.hypot( ...[ 0, 1 ].map( i => road.start[ i ] - road.control[ i ] ) );

    const dot = v0[ 0 ] * v1[ 0 ] + v0[ 1 ] * v1[ 1 ];
    const angleBetween = Math.acos( dot )

    // // Ensure angle is not 0 or PI (no arc possible)
    // if ( angleBetween <= 0.0001 || Math.abs( Math.PI - angleBetween ) <= 0.0001 ) {
    //   console.log( `Lines parallel, no arc possible (a different way than above?)` );
    //   return;
    // }

    const dist = Math.hypot( x2 - intersection[ 0 ], y2 - intersection[ 1 ] );  // NOTE: not normalized version above
    const radius = dist / ( Math.tan( angleBetween / 2 ) );

    
    const bisector = normalize( [ v0[ 0 ] + v1[ 0 ], v0[ 1 ] + v1[ 1 ] ] );

    if ( ctx ) {
      ctx.beginPath();
      ctx.moveTo( ...intersection );
      ctx.lineTo( intersection[ 0 ] + bisector[ 0 ] * radius, intersection[ 1 ] + bisector[ 1 ] * radius );
      ctx.stroke();
    }

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
    const tangentDist = radius / ( Math.tan( angleBetween / 2 ) );
    const start = [ 0, 1 ].map( i => intersection[ i ] + v0[ i ] * tangentDist );
    const end = [ 0, 1 ].map( i => intersection[ i ] + v1[ i ] * tangentDist );


    const startAngle = Math.atan2( start[ 1 ] - center[ 1 ], start[ 0 ] - center[ 0 ] );
    const endAngle = Math.atan2( end[ 1 ] - center[ 1 ], end[ 0 ] - center[ 0 ] );

    if ( ctx ) {
      ctx.beginPath();
      ctx.arc( ...center, radius, 0, Math.PI * 2 );
      ctx.stroke();

      [ start, end ].forEach( spot => {
        ctx.beginPath();
        ctx.arc( ...spot, 0.1, 0, Math.PI * 2 );
        ctx.fill();
      } );

      // [ startAngle, endAngle ].forEach( angle => {
      //   ctx.beginPath();
      //   ctx.arc( 
      //     center[ 0 ] + Math.cos( angle ) * radius, 
      //     center[ 1 ] + Math.sin( angle ) * radius,
      //     0.1, 
      //     0, 
      //     Math.PI * 2 
      //   );
      //   ctx.fill();
      // } );
    }

    return {
      center: center,
      radius: radius,
      startAngle: startAngle,
      endAngle: endAngle,
      counterclockwise: cross > 0 && D > 0,
    };
  }
}

function normalize( v ) {
  const len = Math.hypot( ...v );
  return v.map( e => e / len );
}
