import { Line } from './Line.js';

export class Cell {

  static Debug = true;

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

  isConvexEdge( index ) {
    const other = this.edges[ index ].neighbor?.parent;

    if ( other ) {
      const otherIndex = other.edges.findIndex( e => e.neighbor?.parent == this );

      const thisBeforeEdgeStart = this.edges.at( index - 1 );
      const otherAfterEdgeStart = other.edges.at( ( otherIndex + 1 ) % other.edges.length );

      const otherBeforeEdgeEnd = other.edges.at( otherIndex - 1 );
      const thisAfterEdgeEnd = this.edges.at( ( index + 1 ) % this.edges.length );

      const startConvex = !Line.pointInsideLine( 
        thisBeforeEdgeStart.x2, thisBeforeEdgeStart.y2,
        thisBeforeEdgeStart.x1, thisBeforeEdgeStart.y1, otherAfterEdgeStart.x2, otherAfterEdgeStart.y2
      );

      const endConvex = !Line.pointInsideLine( 
        thisAfterEdgeEnd.x1, thisAfterEdgeEnd.y1,
        otherBeforeEdgeEnd.x1, otherBeforeEdgeEnd.y1, thisAfterEdgeEnd.x2, thisAfterEdgeEnd.y2,
      );

      return startConvex && endConvex;
    }
  }

  // TODO: What if we completely surround another cell? 
  // Either need to swallow it up, or handle two separate loops of edges

  merge( index ) {
    const edge = this.edges[ index ];
    const other = edge.neighbor?.parent;

    if ( other ) {
      const otherIndex = other.edges.indexOf( edge.neighbor );
      const otherEdges = other.edges.slice( otherIndex + 1 ).concat( other.edges.slice( 0, otherIndex ) );
      
      this.edges.splice( index, 1, ...otherEdges );
      this.edges = this.edges.filter( e => e.neighbor?.parent != this && e.neighbor?.parent != other );

      otherEdges.forEach( e => e.parent = this );

      other.edges = null;

      this.#updateCenter();
    }
  }

  collapse( edge ) {
    const midX = ( edge.x1 + edge.x2 ) / 2;
    const midY = ( edge.y1 + edge.y2 ) / 2;

    const visited = new Set();

    [ edge, edge.neighbor ].forEach( e => {
      if ( e ) {
        visited.add( e );

        const index = e.parent.edges.indexOf( e );

        let before = e.parent.edges.at( index - 1 );
        let after = e.parent.edges.at( ( index + 1 ) % e.parent.edges.length );
    
        before.x2 = after.x1 = midX;
        before.y2 = after.y1 = midY;

        // visited.add( before );
        // visited.add( after );
    
        while ( before.neighbor && !visited.has( before.neighbor ) ) {
          const edge1 = before.neighbor;
          const index1 = edge1.parent.edges.indexOf( edge1 );
          before = edge1.parent.edges.at( index1 - 1 );
    
          before.x2 = edge1.x1 = midX;
          before.y2 = edge1.y1 = midY;

          edge1.parent.#updateCenter();

          // visited.add( before );
          // visited.add( edge1 );
        }
    
        while ( after.neighbor && !visited.has( after.neighbor ) ) {
          const edge2 = after.neighbor;
          const index2 = edge2.parent.edges.indexOf( edge2 );
          after = edge2.parent.edges.at( ( index2 + 1 ) % edge2.parent.edges.length );
    
          edge2.x2 = after.x1 = midX;
          edge2.y2 = after.y1 = midY;

          edge2.parent.#updateCenter();

          // visited.add( edge2 );
          // visited.add( after );
        }
    
        // e.neighbor = null;
        e.parent.edges.splice( index, 1 );

        if ( e.parent.edges.length == 2 ) {
          const A = e.parent.edges[ 0 ].neighbor;
          const B = e.parent.edges[ 1 ].neighbor;

          if ( A )  A.neighbor = B;
          if ( B )  B.neighbor = A;

          e.parent.edges = null;
        }
        else {
          e.parent.#updateCenter();
        }
      }
    } );

    
  }
  
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

  remove() {
    this.edges.filter( e => e.neighbor ).forEach( edge => {
      edge.neighbor.linked = false;
      edge.neighbor.neighbor = null;
    } );
    this.edges = null;
  }

  draw( ctx, color = 'cyan' ) {

    ctx.save(); {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      
      ctx.beginPath();
      this.edges?.forEach( edge => ctx.lineTo( edge.x1, edge.y1 ) );
      ctx.fill();     
    }
    ctx.restore();

    if ( Cell.Debug ) {
      ctx.beginPath();
      ctx.arc( this.x, this.y, 1, 0, Math.PI * 2 );
      ctx.fillStyle = 'red';
      ctx.fill();

      this.edges?.forEach( edge => {
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
}
