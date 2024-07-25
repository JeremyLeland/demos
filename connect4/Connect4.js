const Cols = 7, Rows = 6;

const piecePath = new Path2D();
piecePath.arc( 0, 0, 0.5, 0, Math.PI * 2 );

const PieceColors = [ 'red', 'yellow' ];

const BoardPath = new Path2D();
BoardPath.rect( -0.5, -0.5, Cols, Rows );
for ( let row = 0; row < Rows; row++ ) {
  for ( let col = 0; col < Cols; col++ ) {
    BoardPath.moveTo( col, row );
    BoardPath.arc( col, row, 0.4, 0, Math.PI * 2 );
  }
}

const BoardColor = 'tan';

export class Connect4 {
  static newGame() {
    return new Connect4( {
      board: Array( Cols * Rows ).fill( 0 ),
      history: [],
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
            ctx.fillStyle = PieceColors[ team - 1 ];
            ctx.fill( piecePath );
          }
          ctx.restore();
        }
      }
    }

    ctx.fillStyle = BoardColor;
    ctx.fill( BoardPath, 'evenodd' );
  }
}