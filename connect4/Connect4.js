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

  getAt( col, row ) {
    return this.board[ col + row * Cols ];
  }

  setAt( col, row, team ) {
    this.board[ col + row * Cols ] = team;
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

    const current = this.getAt( move[ 0 ], move[ 1 ] );
    
    if ( current != 0 ) {
      console.warn( `Board already has Player ${ current } at ${ move }` );
      return;
    }

    this.setAt( move[ 0 ], move[ 1 ], this.turn );
    this.turn = this.turn == Players ? 1 : this.turn + 1;
    this.history.push( move );
  }

  undo() {
    const toRemove = this.history.pop();

    if ( toRemove ) {
      this.turn = this.turn == 1 ? Players : this.turn - 1;
      this.setAt( toRemove[ 0 ], toRemove[ 1 ], 0 );
    }
    else {
      console.warn( 'No moves to undo' );
    }
  }

  getPossibleMoves() {
    const moves = [];

    for ( let col = 0; col < Cols; col ++ ) {
      for ( let row = Rows - 1; row >= 0; row -- ) {
        if ( this.getAt( col, row ) == 0 ) {
          moves.push( [ col, row ] );
          break;
        }
      }
    }

    return moves;
  }

  getLongestAt( col, row, team ) {
    console.log( `Finding longest line for Player ${ team } at ${ col },${ row }` );
    let longest = 0;

    if ( this.getAt( col, row ) == team ) {
      [
        [ 1, 0 ],   // vertical
        [ 0, 1 ],   // horizontal
        [ 1, 1 ],   // diagonal 1
        [ 1, -1 ],  // diagonal 2
      ].forEach( orientation => {
        let length = 1;

        [ -1, 1 ].forEach( dir => {
          let c = col, r = row;

          while ( true ) {
            c += dir * orientation[ 0 ];
            r += dir * orientation[ 1 ];

            if ( 0 <= c && c < Cols && 0 <= r && r < Rows && this.getAt( c, r ) == team ) {
              length ++;
            }
            else {
              break;
            }
          }
        } );

        console.log( `  Length for orientation ${ orientation } is ${ length }`)

        longest = Math.max( longest, length );
      } );
    }
    else {
      console.warn( `Player at ${ col },${ row } is actually ${ this.getAt( col, row ) }, expecting ${ team }` );
    }

    return longest;
  }
}