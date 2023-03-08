export class Curve {
  start;
  control1;
  control2;
  end;

  static getCurvesThroughPoints( points, tension ) {
    const curves = [];

    for ( let i = 0; i < points.length - 1; i ++ ) {
      const before = points[ Math.max( i - 1, 0 ) ];
      const start = points[ i ];
      const end = points[ i + 1 ];
      const after = points[ Math.min( i + 2, points.length - 1 ) ];

      curves.push( Curve.fromAdjacentPoints( before, start, end, after, tension ) );
    }

    return curves;
  }

  static getLoopThroughPoints( points, tension ) {
    const curves = [];

    for ( let i = 0; i < points.length; i ++ ) {
      const before = points[ modulo( i - 1, points.length ) ];
      const start = points[ i ];
      const end = points[ modulo( i + 1, points.length ) ];
      const after = points[ modulo( i + 2, points.length ) ];

      curves.push( Curve.fromAdjacentPoints( before, start, end, after, tension ) );
    }

    return curves;
  }

  // See: http://csharphelper.com/blog/2019/04/draw-a-smooth-curve-in-wpf-and-c/
  static fromAdjacentPoints( before, start, end, after, tension = 0.5 ) {
    const control_scale = tension / 0.5 * 0.175;
    
    const p2 = [
      start[ 0 ] + control_scale * ( end[ 0 ] - before[ 0 ] ),
      start[ 1 ] + control_scale * ( end[ 1 ] - before[ 1 ] ),
    ];
    const p3 = [
      end[ 0 ] - control_scale * ( after[ 0 ] - start[ 0 ] ),
      end[ 1 ] - control_scale * ( after[ 1 ] - start[ 1 ] ),
    ];

    return new Curve( start, p2, p3, end );
  }

  constructor( start, control1, control2, end ) {
    this.start = start;
    this.control1 = control1;
    this.control2 = control2;
    this.end = end;
  }

  getPosition( t ) {
    const x =     (1-t) * (1-t) * (1-t) * this.start[ 0 ] +
              3 * (1-t) * (1-t) *    t  * this.control1[ 0 ] +
              3 * (1-t) *    t  *    t  * this.control2[ 0 ] +
                     t  *    t  *    t  * this.end[ 0 ];

    const y =     (1-t) * (1-t) * (1-t) * this.start[ 1 ] +
              3 * (1-t) * (1-t) *    t  * this.control1[ 1 ] +
              3 * (1-t) *    t  *    t  * this.control2[ 1 ] +
                     t  *    t  *    t  * this.end[ 1 ];

    return [ x, y ];
  }

  // See: https://pomax.github.io/bezierinfo/#derivatives
  getNormal( t ) {
    const x = 3 * (1-t) * (1-t) * ( this.control1[ 0 ] - this.start[ 0 ] ) +
              3 * (1-t) *    t  * ( this.control2[ 0 ] - this.control1[ 0 ] ) +
              3 *    t  *    t  * ( this.end[ 0 ] - this.control2[ 0 ] );

    const y = 3 * (1-t) * (1-t) * ( this.control1[ 1 ] - this.start[ 1 ] ) +
              3 * (1-t) *    t  * ( this.control2[ 1 ] - this.control1[ 1 ] ) +
              3 *    t  *    t  * ( this.end[ 1 ] - this.control2[ 1 ] );

    const dist = Math.hypot( x, y );
    return [ y / dist, -x / dist ];
  }

  draw( ctx, step = 0.05 ) {
    const posPath = new Path2D();
    const normPath = new Path2D();
    
    for ( let t = 0; t <= 1; t += step ) {
      const pos = this.getPosition( t );
      const norm = this.getNormal( t );

      posPath.lineTo( pos[ 0 ], pos[ 1 ] );
      normPath.moveTo( pos[ 0 ], pos[ 1 ] );
      normPath.lineTo( pos[ 0 ] + norm[ 0 ] * 10, pos[ 1 ] + norm[ 1 ] * 10 );
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'yellow';
    ctx.stroke( posPath );
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'gray';
    ctx.stroke( normPath );
  }
}

function modulo( a, n ) {
  return ( ( a % n ) + n ) % n;
}