export class Line {
  x1;
  y1;
  x2;
  y2;

  length;
  slope;
  normal;

  static getLoopThroughPoints( points ) {
    return Array.from( points, ( _, i ) => {
      const current = points[ i ], next = points[ ( i + 1 ) % points.length ];
      return new Line( current[ 0 ], current[ 1 ], next[ 0 ], next[ 1 ] );
    } )
  }

  constructor( x1, y1, x2, y2 ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.length = Math.hypot( x2 - x1, y2 - y1 );
    this.slope = {
      x: ( x2 - x1 ) / this.length,
      y: ( y2 - y1 ) / this.length,
    }
    this.normal = {
      x: this.slope.y,
      y: -this.slope.x,
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
  getTimeToHit( x, y, dx, dy, radius = 0 ) {
    const D = ( dy * ( this.x2 - this.x1 ) - dx * ( this.y2 - this.y1 ) );

    const ux = this.x1 - x + this.normal.x * radius;
    const uy = this.y1 - y + this.normal.y * radius;

    const us = ( dx * uy - dy * ux ) / D;
    if ( 0 <= us && us <= 1 ) {
      const them = ( ( this.x2 - this.x1 ) * uy - ( this.y2 - this.y1 ) * ux ) / D;
      return them;
    }
    else {
      return Infinity;
    }
  }
}