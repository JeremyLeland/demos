export class Line {
  x1;
  y1;
  x2;
  y2;

  length;
  normal;

  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.length = Math.hypot( x2 - x1, y2 - y1 );
    this.normal = {
      x: ( y2 - y1 ) / this.length,
      y: ( x1 - x2 ) / this.length,
    }
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

  // Based on: https://www.jeffreythompson.org/collision-detection/line-line.php
  getDistance( x, y, dx, dy ) {
    const D = ( dy * ( this.x2 - this.x1 ) - dx * ( this.y2 - this.y1 ) );

    const us = ( dx * ( this.y1 - y ) - dy * ( this.x1 - x ) ) / D;
    if ( 0 <= us && us <= 1 ) {
      const them = ( ( this.x2 - this.x1 ) * ( this.y1 - y ) - ( this.y2 - this.y1 ) * ( this.x1 - x ) ) / D;
      return them;
    }
    else {
      return Infinity;
    }
  }
}