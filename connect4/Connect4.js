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
      active: { x: 0, y: -1, vy: 0, ay: 0 },
    } );
  }

  constructor( json ) {
    Object.assign( this, json );
  }

  update( dt ) {
    this.active.y += this.active.vy * dt + 0.5 * this.active.ay * dt * dt;
    this.active.vy += this.active.ay * dt;
    
    const col = this.active.x;
    const row = Math.round( this.active.y );
    const nextRow = Math.round( this.active.y + 0.5 );

    if ( nextRow < Rows && this.getAt( this.active.x, nextRow ) == 0 ) {
      return true;    // keep going
    }
    else {
      this.applyMove( [ col, row ] );

      this.active.y = -1;
      this.active.vy = 0;
      this.active.ay = 0;

      return false;
    }
  }

  draw( ctx ) {
    ctx.save(); {
      ctx.translate( this.active.x, this.active.y );
      ctx.fillStyle = PieceColors[ this.turn ];
      ctx.fill( piecePath );
    }
    ctx.restore();

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

    const current = this.getAt( ...move );
    
    if ( current != 0 ) {
      console.warn( `Board already has Player ${ current } at ${ move }` );
      return;
    }

    this.setAt( ...move, this.turn );

    // TODO: Check for victory
      // const longest = game.getLongestAt( col, row, team );
      // if ( longest >= 4 ) {
      //   console.log( `Team ${ team } wins with ${ longest } in a row!` );
      // }

    this.turn = this.turn == Players ? 1 : this.turn + 1;
    this.history.push( move );
  }

  undo() {
    const toRemove = this.history.pop();

    if ( toRemove ) {
      this.turn = this.turn == 1 ? Players : this.turn - 1;
      
      // TODO: Unset victory

      this.setAt( ...toRemove, 0 );
    }
    else {
      console.warn( 'No moves to undo' );
    }
  }

  getNextRowAt( col ) {
    for ( let row = Rows - 1; row >= 0; row-- ) {
      if ( this.getAt( col, row ) == 0 ) {
        return row;
      }
    }

    return -1;
  }

  getPossibleMoves() {
    const moves = [];

    for ( let col = 0; col < Cols; col ++ ) {
      const nextRow = this.getNextRowAt( col );
      if ( nextRow > -1 ) {
        moves.push( [ col, nextRow ] );
      }
    }

    return moves;
  }

  getLongestAt( col, row, team ) {
    // console.log( `Finding longest line for Player ${ team } at ${ col },${ row }` );
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

        // console.log( `  Length for orientation ${ orientation } is ${ length }`);

        longest = Math.max( longest, length );
      } );
    }
    else {
      console.warn( `Player at ${ col },${ row } is actually ${ this.getAt( col, row ) }, expecting ${ team }` );
    }

    return longest;
  }
}