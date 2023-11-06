export class Line {
  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  draw( ctx ) {
    ctx.beginPath();
    ctx.moveTo( this.x1, this.y1 );
    ctx.lineTo( this.x2, this.y2 );
    // ctx.lineWidth = 1;
    ctx.stroke();

    const midX = ( this.x1 + this.x2 ) / 2;
    const midY = ( this.y1 + this.y2 ) / 2;

    const normalAngle = Math.atan2( this.x1 - this.x2, this.y2 - this.y1 );
    const normalX = Math.cos( normalAngle );
    const normalY = Math.sin( normalAngle );

    const NORM_LEN = 1;
    ctx.beginPath();
    ctx.moveTo( midX, midY );
    ctx.lineTo( midX + normalX * NORM_LEN, midY + normalY * NORM_LEN );
    // ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  static compare( x1, y1, x2, y2, x3, y3, x4, y4 ) {
    // Line vs Line: http://paulbourke.net/geometry/pointlineplane/
    const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );

    if ( D != 0 ) {
      const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
      const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;

      if ( 0 <= uA && uA <= 1 && 0 <= uB && uB <= 1 ) {
        const intersection = {
          x: x1 + ( x2 - x1 ) * uA,
          y: y1 + ( y2 - y1 ) * uA,
        };

        // If lines are colliding, return the distance that line A impinges on line B
        // (should be a negative number)
        // TODO: Do we care about distance B impinges on A? Is that any different?
        const bNormalAngle = Math.atan2( x3 - x4, y4 - y3 );
        const bNormalX = Math.cos( bNormalAngle );
        const bNormalY = Math.sin( bNormalAngle );

        const dist1 = ( x1 - x3 ) * bNormalX + ( y1 - y3 ) * bNormalY;
        const dist2 = ( x2 - x3 ) * bNormalX + ( y2 - y3 ) * bNormalY;

        return {
          closestA: intersection,
          closestB: intersection,
          angle: Math.PI + bNormalAngle,
          distance: Math.min( dist1, dist2 ),
        }
      }
    }

    // Nearest points on line segments
    // Based on Lua example from: 
    // https://stackoverflow.com/questions/2824478/shortest-distance-between-two-line-segments
    // This appears to be based on Sunday's segment distance algorithm, see "Practical Geometry Algorithms"

    const rx = x3 - x1;
    const ry = y3 - y1;
    const ux = x2 - x1;
    const uy = y2 - y1;
    const vx = x4 - x3;
    const vy = y4 - y3;

    const ru = rx * ux + ry * uy;
    const rv = rx * vx + ry * vy;
    const uu = ux * ux + uy * uy;
    const uv = ux * vx + uy * vy;
    const vv = vx * vx + vy * vy;

    const det = uu * vv - uv * uv;
    let s, t;

    // Parallel case
    if ( det < 1e-6 * uu * vv ) {
      s = Math.max( 0, Math.min( ru / uu, 1 ) );
      t = 0;
    }
    else {
      s = Math.max( 0, Math.min( ( ru * vv - rv * uv ) / det, 1 ) );
      t = Math.max( 0, Math.min( ( ru * uv - rv * uu ) / det, 1 ) );
    }

    const S = Math.max( 0, Math.min( ( t * uv + ru ) / uu, 1 ) );
    const T = Math.max( 0, Math.min( ( s * uv - rv ) / vv, 1 ) );

    const Ax = x1 + S * ux;
    const Ay = y1 + S * uy;
    const Bx = x3 + T * vx;
    const By = y3 + T * vy;

    return {
      closestA: { x: Ax, y: Ay },
      closestB: { x: Bx, y: By },
      angle:    Math.atan2( By - Ay, Bx - Ax ),
      distance: Math.hypot( Bx - Ax, By - Ay ),
    }
  }

  static pointInsideLine( x, y, x1, y1, x2, y2 ) {
    return ( x - x1 ) * ( y1 - y2 ) + ( y - y1 ) * ( x2 - x1 ) < 0;
  }

  // Based on: https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  // See also: http://paulbourke.net/geometry/pointlineplane/
  getClosestPoint( x, y, radius = 0 ) {
    const px = this.x2 - this.x1;
    const py = this.y2 - this.y1;
    const D = ( px * px ) + ( py * py );
    const offset = radius / Math.sqrt( D );

    const u = Math.max( offset, Math.min( 1 - offset, 
      ( ( x - this.x1 ) * px + ( y - this.y1 ) * py ) / D 
    ) );

    const Ax = this.x1 + u * px;
    const Ay = this.y1 + u * py;
    
    return {
      x: Ax, 
      y: Ay,
      angle:    Math.atan2( y - Ay, x - Ax ),
      distance: Math.hypot( x - Ax, y - Ay ),
    };
  }

  isOutsideOfPoint( x, y ) {
    return Line.pointInsideLine( x, y, this.x1, this.y1, this.x2, this.y2 );
  }
}