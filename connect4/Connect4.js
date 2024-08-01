const Cols = 7, Rows = 6, Players = 2;

const PieceColors = [ '', 'red', 'yellow' ];
const BoardColor = 'tan';

const GameStateKey = 'connect4GameState';

const piecePath = new Path2D();
piecePath.arc( 0, 0, 0.5, 0, Math.PI * 2 );

const BoardPath = new Path2D();
BoardPath.rect( -0.5, -0.5, Cols, Rows );
for ( let row = 0; row < Rows; row++ ) {
  for ( let col = 0; col < Cols; col++ ) {
    BoardPath.moveTo( col, row );
    BoardPath.arc( col, row, 0.4, 0, Math.PI * 2 );
  }
}


// NOTE: Turn is 1-indexed so the turn/team match the values in board (0 means no piece)

export class Connect4 {
  static fromLocalStore() {
    const gameState = JSON.parse( localStorage.getItem( GameStateKey ) );

    if ( gameState ) {
      return new Connect4( gameState );
    }
  }

  toLocalStore() {
    localStorage.setItem( GameStateKey, JSON.stringify( this ) );
  }

  static newGame( numHumanPlayers ) {
    return new Connect4( {
      board: Array( Cols * Rows ).fill( 0 ),
      history: [],
      turn: 1,
      victory: 0,
      aiPlayers: numHumanPlayers == 2 ? [] : [ 2 ],
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
    if ( this.victory == 0 ) {
      ctx.save(); {
        ctx.translate( this.active.x, this.active.y );
        ctx.fillStyle = PieceColors[ this.turn ];
        ctx.fill( piecePath );
      }
      ctx.restore();
    }

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

    if ( this.victory > 0 ) {
      ctx.font = '1px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'black';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText( `Player ${ this.victory } Wins!`, 3, 3 );
    }
  }

  getAt( col, row ) {
    return this.board[ col + row * Cols ];
  }

  setAt( col, row, team ) {
    this.board[ col + row * Cols ] = team;
  }

  dropActive() {
    this.active.ay = 0.00002;
  }

  applyMove( move ) {
    console.log( `Applying move for Player ${ this.turn }: ${ move }` );

    if ( this.victory > 0 ) {
      console.warn( `Player ${ this.victory } already won game` );
      return;
    }

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

    const longest = this.getLongestAt( move[ 0 ], move[ 1 ], this.turn );
    if ( longest >= 4 ) {
      this.victory = this.turn;
      console.log( `Player ${ this.turn } wins with ${ longest } in a row!` );
    }

    this.turn = this.turn == Players ? 1 : this.turn + 1;
    this.history.push( move );

    return longest;
  }

  undo() {
    const toRemove = this.history.pop();

    if ( toRemove ) {
      this.turn = this.turn == 1 ? Players : this.turn - 1;
      this.victory = 0;
      this.setAt( toRemove[ 0 ], toRemove[ 1 ], 0 );
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