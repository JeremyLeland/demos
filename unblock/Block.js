const ARENA_SIZE = 6;
const EXIT_ROW = 2;

const arenaDiv = document.getElementById( 'arena' );

export class Block {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  
  #div;

  constructor( values ) {
    Object.assign( this, values );

    const isPrimary = this.y == EXIT_ROW && this.height == 1;

    this.#div = document.createElement( 'div' );
    this.#div.className = 'block ' + ( isPrimary ? 'primary' : `cols${ this.width }rows${ this.height }` );
    this.#div.owner = this;
    
    this.#updateDiv();

    arenaDiv.appendChild( this.#div );
  }

  center() { 
    return {
      x: this.x + this.width / 2, 
      y: this.y + this.height / 2, 
    };
  }

  getMoveBounds( others ) {
    const bounds = {
      block: this,
      minX: this.width == 1 ? this.x : 0,
      minY: this.height == 1 ? this.y : 0,
      maxX: this.width == 1 ? this.x : ( Math.floor( this.y ) == EXIT_ROW ? Infinity : ARENA_SIZE - this.width ),
      maxY: this.height == 1 ? this.y : ARENA_SIZE - this.height,
    }
    
    const thisCenter = this.center();
    others.filter( e => e != this ).forEach( other => {
      const otherCenter = other.center();

      if ( Math.abs( otherCenter.y - thisCenter.y ) < ( this.height + other.height ) / 2 ) {
        const left = other.x + other.width;
        if ( left <= this.x )   bounds.minX = Math.max( left, bounds.minX );

        const right = other.x - this.width;
        if ( this.x <= right  ) bounds.maxX = Math.min( right, bounds.maxX );
      }

      if ( Math.abs( otherCenter.x - thisCenter.x ) < ( this.width + other.width ) / 2 ) {
        const top = other.y + other.height;
        if ( top  <= this.y )   bounds.minY = Math.max( top, bounds.minY );

        const bottom = other.y - this.height;
        if ( this.y <= bottom ) bounds.maxY = Math.min( bottom, bounds.maxY );
      }
    } );

    return bounds;
  }

  moveTo( x, y ) {
    this.x = x;
    this.y = y;

    this.#updateDiv();
  }

  moveBy( dx, dy, moveBounds ) {
    const x = Math.max( moveBounds.minX, Math.min( moveBounds.maxX, this.x + dx ) );
    const y = Math.max( moveBounds.minY, Math.min( moveBounds.maxY, this.y + dy ) );
    
    this.moveTo( x, y );
  }

  stopMove() {
    this.moveTo( Math.round( this.x ), Math.round( this.y ) );
  }

  isWinningBlock() {
    return this.y == EXIT_ROW && this.height == 1 && this.x >= ARENA_SIZE - 2;
  }

  #updateDiv() {
    this.#div.style.transform = `translate( ${ this.x * 10 }px,${ this.y * 10 }px )`;
  }
}