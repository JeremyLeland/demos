export class Line {
  slope = {};
  normal = {};

  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.length = Math.hypot( this.x2 - this.x1, this.y2 - this.y1 );
    
    this.slope.angle = Math.atan2( this.y2 - this.y1, this.x2 - this.x1 );
    this.slope.x = Math.cos( this.slope.angle );
    this.slope.y = Math.sin( this.slope.angle );
    
    this.normal.angle = Math.atan2( this.x1 - this.x2, this.y2 - this.y1 );
    this.normal.x = Math.cos( this.normal.angle );
    this.normal.y = Math.sin( this.normal.angle );
  }

  draw( ctx ) {
    ctx.beginPath();
    ctx.moveTo( this.x1, this.y1 );
    ctx.lineTo( this.x2, this.y2 );
    ctx.lineWidth = 1;
    ctx.stroke();

    const midX = ( this.x1 + this.x2 ) / 2;
    const midY = ( this.y1 + this.y2 ) / 2;
    const NORM_LEN = 10;
    ctx.beginPath();
    ctx.moveTo( midX, midY );
    ctx.lineTo( midX + this.normal.x * NORM_LEN, midY + this.normal.y * NORM_LEN );
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // NOTE: This doesn't take into account whether we're actually inside segment
  distanceTo( x, y ) {
    return ( x - this.x1 ) * this.normal.x + ( y - this.y1 ) * this.normal.y;
  }

  static getIntersection( x1, y1, x2, y2, x3, y3, x4, y4, segment = true ) {
    const D = ( y4 - y3 ) * ( x2 - x1 ) - ( x4 - x3 ) * ( y2 - y1 );

    if ( D != 0 ) {
      const uA = ( ( x4 - x3 ) * ( y1 - y3 ) - ( y4 - y3 ) * ( x1 - x3 ) ) / D;
      const uB = ( ( x2 - x1 ) * ( y1 - y3 ) - ( y2 - y1 ) * ( x1 - x3 ) ) / D;

      // Bounds check uB here so we can just return uA
      if ( !segment || ( 0 <= uB && uB <= 1 ) ) {
        return uA;
      }
      // return {
      //   uA: uA,
      //   uB: uB,
      //   // position: {
      //   //   x: x1 + ( x2 - x1 ) * uA,
      //   //   y: y1 + ( y2 - y1 ) * uA,
      //   // }
      // }
    }

    return Infinity;
  }
}