export class Board {
  static ARENA_SIZE = 6;
  static EXIT_ROW = 2;
  blocks = [];

  #blockGrid;

  constructor( level ) {
    this.blocks = Array.from( level );
    this.#updateBlockGrid();
  }

  #updateBlockGrid() {
    this.#blockGrid = Array.from( Array( Board.ARENA_SIZE ), _ => Array( Board.ARENA_SIZE ) );

    this.blocks.forEach( block => {
      for ( let row = block.y; row < block.y + block.height; row ++ ) {
        for ( let col = block.x; col < block.x + block.width; col ++ ) {
          this.#blockGrid[ col ][ row ] = block;
        }
      }
    } );
  }

  getMoveBounds( block ) {
    const bounds = {
      block: block,
      minX: block.x,
      minY: block.y,
      maxX: block.x,
      maxY: block.y,
    }

    if ( block.width == 1 ) {
      while ( bounds.minY > 0 && !this.#blockGrid[ block.x ][ bounds.minY - 1 ] ) { bounds.minY --; }
      while ( bounds.maxY < Board.ARENA_SIZE - block.height && !this.#blockGrid[ block.x ][ bounds.maxY + block.height ] ) { bounds.maxY ++; }
    }

    if ( block.height == 1 ) {
      while ( bounds.minX > 0 && !this.#blockGrid[ bounds.minX - 1 ][ block.y ] ) { bounds.minX --; }
      while ( bounds.maxX < Board.ARENA_SIZE - block.width  && !this.#blockGrid[ bounds.maxX + block.width ][ block.y ]  ) { bounds.maxX ++; }
    }

    return bounds;
  }

  getAvailableMoves() {
    const moves = [];

    this.blocks.forEach( block => {
      const bounds = this.getMoveBounds( block );
      
      for ( let x = bounds.minX; x <= bounds.maxX; x ++ ) {        
        if ( x != block.x ) {
          moves.push( { block: block, dx: x - block.x, dy: 0 } );
        }
      }
      for ( let y = bounds.minY; y <= bounds.maxY; y ++ ) {
        if ( y != block.y ) {
          moves.push( { block: block, dx: 0, dy: y - block.y } );
        }
      }
    } );

    return moves;
  }

  applyMove( move ) {
    move.block.x += move.dx;
    move.block.y += move.dy;

    this.#updateBlockGrid();
  }
}