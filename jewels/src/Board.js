import { JewelInfo } from './Jewels.js';

const Cols = 6;
const Rows = 6;

const GridPath = new Path2D();
for ( let x = 0; x <= Cols; x ++ ) {
  GridPath.moveTo( x - 0.5, 0 - 0.5 );
  GridPath.lineTo( x - 0.5, Rows - 0.5 );  
}
for ( let y = 0; y <= Rows; y ++ ) {
  GridPath.moveTo( 0 - 0.5, y - 0.5 );
  GridPath.lineTo( Cols - 0.5, y - 0.5 );
}

const Axis = {
  Horizontal: { x: 1, y: 0 },
  Vertical:   { x: 0, y: 1 },
};

export class Board {
  pieces = [];

  #selected = null;
  #other = null;
  #moveAxis = null;
  #moveX = 0;
  #moveY = 0;

  static randomBoard() {
    const board = new Board();

    const jewelTypes = Object.keys( JewelInfo );

    for ( let y = 0; y < Rows; y ++ ) {
      for ( let x = 0; x < Cols; x ++ ) {
        board.pieces.push( {
          type: jewelTypes[ Math.floor( Math.random() * jewelTypes.length ) ],
          x: x,
          y: y,
        } );
      }
    }

    return board;
  }

  draw( ctx ) {

    ctx.strokeStyle = 'gray';
    ctx.stroke( GridPath );
  
    this.pieces.forEach( piece => {
      let x = piece.x;
      let y = piece.y;

      if ( piece == this.#selected ) {
        x += this.#moveX;
        y += this.#moveY;
      }
      else if ( piece == this.#other ) {
        x -= this.#moveX;
        y -= this.#moveY;
      }

      ctx.translate( x, y );
      ctx.scale( 0.5, 0.5 );

      const info = JewelInfo[ piece.type ];

      ctx.fillStyle = info.fillStyle;
      ctx.fill( info.fill );

      ctx.strokeStyle = 'black';
      ctx.stroke( info.stroke );

      ctx.scale( 2, 2 );
      ctx.translate( -x, -y );
    } );
  }

  // TODO: Better name!
  checkWins() {
    const pieceArray = Array( Cols * Rows );
    const toRemove = new Set();

    this.pieces.forEach( p => pieceArray[ p.x + p.y * Cols ] = p );

    console.log( pieceArray );

    for ( let row = 0; row < Rows; row ++ ) { 
      for ( let col = 0; col < Cols; col ++ ) {
        const startPiece = pieceArray[ col + row * Cols ];
    
        [
          [ 1, 0 ],   // vertical
          [ 0, 1 ],   // horizontal
        ].forEach( orientation => {
          let length = 1;
          const linePieces = [ startPiece ];
    
          [ -1, 1 ].forEach( dir => {
            let c = col, r = row;
    
            while ( true ) {
              c += dir * orientation[ 0 ];
              r += dir * orientation[ 1 ];
    
              if ( 0 <= c && c < Cols && 0 <= r && r < Rows ) {
                const otherPiece = pieceArray[ c + r * Cols ];

                if ( otherPiece.type == startPiece.type ) {
                  length ++;
                  linePieces.push( otherPiece )
                }
                else {
                  break;
                }
              }
              else {
                break;
              }
            }
          } );

          if ( length >= 3 ) {
            toRemove.add( ...linePieces );
          }
        } );
      }
    }

    console.log( toRemove );
  }

  startDrag( x, y ) {
    this.#selected = this.pieces.find( p => Math.hypot( x - p.x, y - p.y ) < 0.5 );
  }

  moveDrag( dx, dy ) {
    if ( !this.#selected ) {
      return;
    }

    if ( Math.abs( this.#moveX ) < 0.01 && Math.abs( this.#moveY ) < 0.01 ) {
      this.#moveAxis = Math.abs( dx ) > Math.abs( dy ) ? Axis.Horizontal : Axis.Vertical;
      this.#moveX = 0;
      this.#moveY = 0;
    }

    this.#moveX = Math.max( -1, Math.min( 1, this.#moveX + this.#moveAxis.x * dx ) );
    this.#moveY = Math.max( -1, Math.min( 1, this.#moveY + this.#moveAxis.y * dy ) );

    this.#other = this.pieces.find( p => 
      p.x == this.#selected.x + Math.sign( this.#moveX ) && 
      p.y == this.#selected.y + Math.sign( this.#moveY ) 
    );

    // An invalid drag counts as no drag at all
    // This makes dragging around edges and corners look better, so we can immediately choose a different axis
    if ( this.#other == null ) {
      this.#moveX = 0;
      this.#moveY = 0;
    }
  }

  stopDrag() {
    // TODO: Check for valid move
    if ( this.#selected ) {
      this.#selected.x = Math.round( this.#selected.x + this.#moveX );
      this.#selected.y = Math.round( this.#selected.y + this.#moveY );
      this.#selected = null;
    }

    if ( this.#other ) {
      this.#other.x = Math.round( this.#other.x - this.#moveX );
      this.#other.y = Math.round( this.#other.y - this.#moveY );
      this.#other = null;
    }

    this.#moveAxis = null;
    this.#moveX = 0;
    this.#moveY = 0;
  }
}