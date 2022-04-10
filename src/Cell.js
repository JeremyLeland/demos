class Edge {
  start;
  end;

  neighbor;
  linked = false;

  previous;
  next;

  constructor( start, end, neighbor ) {
    this.start = start;
    this.end = end;
    this.neighbor = neighbor;
  }

  draw( ctx ) {
    ctx.beginPath();
    ctx.moveTo( this.start.x, this.start.y );
    ctx.lineTo( this.end.x, this.end.y );
    ctx.strokeStyle = this.linked ? 'dimgray' : 'white';
    ctx.lineWidth = this.linked ? 0.5 : 2;
    ctx.stroke();

    if ( this.neighbor ) {
      ctx.beginPath();
      ctx.moveTo( ( this.start.x + this.end.x ) / 2, ( this.start.y + this.end.y ) / 2 );
      ctx.lineTo( this.neighbor.center.x, this.neighbor.center.y );
      ctx.strokeStyle = this.linked ? 'green' : 'darkblue';
      ctx.lineWidth = this.linked ? 1 : 0.5;
      ctx.stroke();
    }
  }
}

export class Cell {
  x;
  y;
  center = { x: 0, y: 0 };
  edges = [];

  constructor( points ) {
    points.forEach( point => {
      this.center.x += point.x;
      this.center.y += point.y;
    } );

    if ( points.length > 0 ) {
      this.center.x /= points.length;
      this.center.y /= points.length;
    }

    for ( let i = 0; i < points.length; i ++ ) {
      const current = points[ i ], next = points[ ( i + 1 ) % points.length ];
      this.edges.push( new Edge( current, next ) );
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

  linkTo( other ) {
    const thisEdge = this.edges.find( edge => edge.neighbor == other );
    const otherEdge = other.edges.find( edge => edge.neighbor == this );

    thisEdge.linked = otherEdge.linked = true;

    thisEdge.previous.next = otherEdge.next;
    thisEdge.next.previous = otherEdge.previous;

    otherEdge.previous.next = thisEdge.next;
    otherEdge.next.previous = thisEdge.previous;
  }
}