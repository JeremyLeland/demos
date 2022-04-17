class Edge {
  start;
  end;

  parent;
  neighbor;
  linked = false;

  previous;
  next;

  constructor( start, end, parent ) {
    this.start = start;
    this.end = end;
    this.parent = parent;
  }

  getLength() {
    return Math.hypot( this.end.x - this.start.x, this.end.y - this.start.y );
  }

  // TODO: Clearer term for this than 'offset'?
  getOffsetPoints( offset ) {
    
    const points = [];
    
    const startAngle = Math.atan2( this.parent.y - this.start.y, this.parent.x - this.start.x );
    points.push( {
      x: this.start.x + Math.cos( startAngle ) * offset,
      y: this.start.y + Math.sin( startAngle ) * offset,
    } );

    if ( this.next.parent != this.parent ) {
      const endAngle = Math.atan2( this.parent.y - this.end.y, this.parent.x - this.end.x );

      points.push( {
        x: this.end.x + Math.cos( endAngle ) * offset,
        y: this.end.y + Math.sin( endAngle ) * offset,
      } );
    }

    return points;

    // const prev = this.previous.start, curr = this.start, next = this.end;
    // const prevAngle = Math.atan2( curr.y - prev.y, curr.x - prev.x );
    // const currAngle = Math.atan2( next.y - curr.y, next.x - curr.x );
    // const delta = deltaAngle( prevAngle, currAngle );

    // if ( Math.abs( delta ) < Math.PI - 1e-6 ) {
    //   const midAngle = prevAngle + delta * 0.5;
    //   return [ {
    //     x: this.start.x + offset * Math.sin( midAngle ),
    //     y: this.start.y + offset * -Math.cos( midAngle ),
    //   } ];
    // }
    // else {
    //   const leftAngle = prevAngle + Math.PI * 0.25;
    //   const rightAngle = prevAngle + Math.PI * 0.75;
    //   return [ {
    //     x: this.start.x + offset * Math.sin( leftAngle ),
    //     y: this.start.y + offset * -Math.cos( leftAngle ),
    //   }, {
    //     x: this.start.x + offset * Math.sin( rightAngle ),
    //     y: this.start.y + offset * -Math.cos( rightAngle ),
    //   } ];
    // }
  }
  
  draw( ctx ) {
    ctx.beginPath();
    ctx.moveTo( this.start.x, this.start.y );
    ctx.lineTo( this.end.x, this.end.y );
    ctx.strokeStyle = this.linked ? 'dimgray' : 'white';
    ctx.lineWidth = this.linked ? 0.5 : 2;
    ctx.stroke();

    // // DEBUG: Edge angles
    // const prev = this.previous.start, curr = this.start, next = this.end;
    // const prevAngle = Math.atan2( curr.y - prev.y, curr.x - prev.x );
    // const currAngle = Math.atan2( next.y - curr.y, next.x - curr.x );
    // const delta = deltaAngle( prevAngle, currAngle );
    
    // const midX = ( this.start.x + this.end.x ) / 2;
    // const midY = ( this.start.y + this.end.y ) / 2;
    // const midAngle = prevAngle + delta * 0.5;
    // const xOff = 20 * Math.sin( midAngle );
    // const yOff = 20 * -Math.cos( midAngle );
    
    // if ( !this.linked ) {

    //   ctx.strokeStyle = 'orange';
    //   ctx.beginPath();
    //   ctx.lineTo( this.start.x, this.start.y );
    //   ctx.lineTo( this.start.x + xOff, this.start.y + yOff );
    //   ctx.stroke();
      
    //   ctx.fillStyle = 'orange';
    //   ctx.fillText( delta.toFixed( 4 ), this.start.x + xOff, this.start.y + yOff ); 
    // }

    if ( this.neighbor ) {
      ctx.beginPath();
      ctx.moveTo( ( this.start.x + this.end.x ) / 2, ( this.start.y + this.end.y ) / 2 );
      ctx.lineTo( this.neighbor.x, this.neighbor.y );
      ctx.strokeStyle = this.linked ? 'green' : 'blue';
      ctx.lineWidth = this.linked ? 1 : 0.5;
      ctx.stroke();
    }
  }
}

function fixAngle( a ) {
  return a > Math.PI ? a - Math.PI * 2 : a <= -Math.PI ? a + Math.PI * 2 : a;
}

function deltaAngle( a, b ) {
  return fixAngle( b - a );
}

export class Cell {
  edges = [];

  // Node info for pathfinding
  x = 0;
  y = 0;
  links = new Set();

  constructor( points ) {
    points.forEach( point => {
      this.x += point.x;
      this.y += point.y;
    } );

    if ( points.length > 0 ) {
      this.x /= points.length;
      this.y /= points.length;
    }

    for ( let i = 0; i < points.length; i ++ ) {
      const current = points[ i ], next = points[ ( i + 1 ) % points.length ];
      this.edges.push( new Edge( current, next, this ) );
    }

    for ( let i = 0; i < this.edges.length; i ++ ) {
      const current = this.edges[ i ];
      const prev = this.edges[ ( points.length + i - 1 ) % points.length ];
      const next = this.edges[ ( i + 1 ) % points.length ];
      current.previous = prev;
      current.next = next;
    }
  }

  draw( ctx ) {
    this.edges.forEach( edge => edge.draw( ctx ) );

    ctx.fillStyle = this.edges.length > 0 ? 'olive' : 'darkred';
    ctx.fillRect( this.x - 1, this.y - 1, 2, 2 );
  }

  detachEdge( edge ) {
    if ( edge.neighbor ) {
      const otherEdge = edge.neighbor.edges.find( e => e.neighbor == this );

      edge.neighbor = otherEdge.neighbor = null;
      edge.linked = otherEdge.linked = false;

      this.links.delete( edge.neighbor );

      // TODO: Fix edge prev/next
    }
  }

  detachAll() {
    this.edges.forEach( edge => this.detachEdge( edge ) );
  }

  linkTo( other ) {
    const thisEdge = this.edges.find( edge => edge.neighbor == other );
    const otherEdge = other.edges.find( edge => edge.neighbor == this );

    if ( thisEdge && otherEdge ) {
      thisEdge.linked = otherEdge.linked = true;
  
      thisEdge.previous.next = otherEdge.next;
      thisEdge.next.previous = otherEdge.previous;
  
      otherEdge.previous.next = thisEdge.next;
      otherEdge.next.previous = thisEdge.previous;

      this.links.add( other );

      return true;
    }
    else { 
      return false;
    }
  }

  unlinkFrom( other ) {
    // TODO: Fix other links

    this.links.delete( other );
  }

  getUnlinkedEdges() {
    return this.edges.filter( e => e.neighbor && !e.linked );
  }
}