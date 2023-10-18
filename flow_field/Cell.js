import { Line } from './Line.js';

export class Cell {
  x = 0;
  y = 0;
  edges = [];

  constructor( points ) {
    for ( let i = 0; i < points.length; i ++ ) {
      const a = points[ i ], b = points[ ( i + 1 ) % points.length ];

      const edge = new Line( ...a, ...b );
      edge.parent = this;

      this.edges.push( edge );
    }

    this.#updateCenter();
  }

  #updateCenter() {
    this.x = 0;
    this.y = 0;

    this.edges.forEach( edge => {
      this.x += edge.x1;
      this.y += edge.y1;
    } );

    this.x /= this.edges.length;
    this.y /= this.edges.length;
  }

  contains( x, y ) {
    return this.edges.every( edge => edge.isOutsideOfPoint( x, y ) );
  }

  // isConvexEdge( index ) {
  //   const other = this.links[ index ];
  //   if ( other ) {
  //     const otherIndex = other.links.findIndex( l => l == this );

  //     const thisBeforeEdgeStart = this.edges.at( index - 1 ).slope.angle;
  //     const otherAfterEdgeStart = other.edges[ ( otherIndex + 1 ) % other.edges.length ].slope.angle;

  //     const otherBeforeEdgeEnd = other.edges.at( otherIndex - 1 ).slope.angle;
  //     const thisAfterEdgeEnd = this.edges[ ( index + 1 ) % this.edges.length ].slope.angle;

  //     return ( Math.PI + deltaAngle( thisBeforeEdgeStart, otherAfterEdgeStart ) < Math.PI && 
  //              Math.PI + deltaAngle( otherBeforeEdgeEnd,  thisAfterEdgeEnd    ) < Math.PI );
  //   }

  //   return false;
  // }

  // merge( index ) {
  //   const other = this.links[ index ];
  //   other.links.forEach( ( otherLink, i ) => {
  //     if ( otherLink == this ) {
  //       const extract = ( arr ) => arr.slice( i + 1 ).concat( arr.slice( 0, i ) );

  //       this.edges.splice( index, 1, ...extract( other.edges ) );
  //       this.links.splice( index, 1, ...extract( other.links ) );

  //       this.#updateCenter();
  //     }
  //     // Update other linked cells to point to us
  //     else if ( otherLink ) {
  //       const neighborLinkIndex = otherLink.links.findIndex( l => l == other );
  //       otherLink.links[ neighborLinkIndex ] = this;
  //     }
  //   } );
  // }
  

  // unlink( index ) {
  //   const other = this.links[ index ];
  //   if ( other ) {
  //     const otherIndex = other.links.findIndex( link => link == this );
  //     other.links[ otherIndex ] = null;
  //   }

  //   this.links[ index ] = null;
  // }

  linkAll() {
    this.edges.filter( e => e.neighbor ).forEach( edge =>
      edge.linked = edge.neighbor.linked = true
    );
  }

  unlinkAll() {
    this.edges.filter( e => e.neighbor ).forEach( edge =>
      edge.linked = edge.neighbor.linked = false
    );
  }

  draw( ctx, color = 'cyan' ) {
    ctx.beginPath();
    ctx.arc( this.x, this.y, 1, 0, Math.PI * 2 );
    ctx.fillStyle = 'red';
    ctx.fill();

    ctx.fillStyle = color;

    ctx.save();
    ctx.globalAlpha = 0.2;
    
    ctx.beginPath();
    this.edges.forEach( edge => ctx.lineTo( edge.x1, edge.y1 ) );
    ctx.fill();

    ctx.restore();

    this.edges.forEach( edge => {
      ctx.strokeStyle = color;
      edge.draw( ctx );

      if ( edge.neighbor ) {
        ctx.beginPath();
        ctx.moveTo( this.x, this.y );
        ctx.lineTo( edge.neighbor.parent.x, edge.neighbor.parent.y );

        ctx.strokeStyle = edge.linked ? 'green' : 'maroon';
        ctx.stroke();
      }
    } );
  }
}
