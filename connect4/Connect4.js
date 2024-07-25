const Cols = 7, Rows = 6, Players = 2;

const piecePath = new Path2D();
piecePath.arc( 0, 0, 0.5, 0, Math.PI * 2 );

const PieceColors = [ '', 'red', 'yellow' ];

const BoardPath = new Path2D();
BoardPath.rect( -0.5, -0.5, Cols, Rows );
for ( let row = 0; row < Rows; row++ ) {
  for ( let col = 0; col < Cols; col++ ) {
    BoardPath.moveTo( col, row );
    BoardPath.arc( col, row, 0.4, 0, Math.PI * 2 );
  }
}

const BoardColor = 'tan';

// NOTE: Turn is 1-indexed so the turn/team match the values in board (0 means no piece)

export class Connect4 {
  static newGame() {
    return new Connect4( {
      board: Array( Cols * Rows ).fill( 0 ),
      history: [],
      turn: 1,
    } );
  }

  constructor( json ) {
    Object.assign( this, json );
  }

  draw( ctx ) {
    for ( let row = 0; row < Rows; row++ ) {
      for ( let col = 0; col < Cols; col++ ) {
        const team = this.board[ col + row * Cols ];
        if ( team > 0 ) {
          ctx.save(); {
            ctx.translate( col, row );
            ctx.fillStyle = PieceColors[ team ];
            ctx.fill( piecePath );
          }
          ctx.restore();
        }
      }
    }

    ctx.fillStyle = BoardColor;
    ctx.fill( BoardPath, 'evenodd' );
  }

  applyMove( move ) {
    console.log( `Applying move for Player ${ this.turn }: ${ move }` );

    if ( move[ 0 ] < 0 || move[ 0 ] >= Cols ) {
      console.warn( `Invalid column: ${ move[ 0 ] }` );
      return;
    }

    if ( move[ 1 ] < 0 || move[ 1 ] >= Rows ) {
      console.warn( `Invalid row: ${ move[ 1 ] }` );
      return;
    }

    const index = move[ 0 ] + move[ 1 ] * Cols; 

    if ( this.board[ index ] != 0 ) {
      console.warn( `Board already has Player ${ this.board[ index ] } at ${ move }` );
      return;
    }

    this.board[ move[ 0 ] + move[ 1 ] * Cols ] = this.turn;
    this.turn = this.turn == Players ? 1 : this.turn + 1;
    this.history.push( move );
  }

  undo() {
    const toRemove = this.history.pop();

    if ( toRemove ) {
      this.turn = this.turn == 1 ? Players : this.turn - 1;
      this.board[ toRemove[ 0 ] + toRemove[ 1 ] * Cols ] = 0;
    }
  }

  getPossibleMoves() {
    const moves = [];

    for ( let col = 0; col < Cols; col ++ ) {
      for ( let row = Rows - 1; row >= 0; row -- ) {
        if ( this.board[ col + row * Cols ] == 0 ) {
          moves.push( [ col, row ] );
          break;
        }
      }
    }

    return moves;
  }
}