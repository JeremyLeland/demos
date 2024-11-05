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
  None:       { x: 0, y: 0 },
  Horizontal: { x: 1, y: 0 },
  Vertical:   { x: 0, y: 1 },
};

export class Board {
  pieces = [];

  #selected = null;
  #moveAxis = Axis.None;
  #moveDist = 0;

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

    const moveX = this.#moveAxis.x * this.#moveDist;
    const moveY = this.#moveAxis.y * this.#moveDist;
    
    const other = this.#selected ? 
      this.pieces.find( p => 
        p.x == this.#selected.x + Math.sign( moveX ) && 
        p.y == this.#selected.y + Math.sign( moveY ) 
      ) :
      null;

    this.pieces.forEach( piece => {
      let x = piece.x;
      let y = piece.y;

      if ( piece == this.#selected ) {
        x += moveX;
        y += moveY;
      }
      else if ( piece == other ) {
        x -= moveX;
        y -= moveY;
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

  startDrag( x, y ) {
    this.#selected = this.pieces.find( p => Math.hypot( x - p.x, y - p.y ) < 0.5 );
  }

  moveDrag( dx, dy ) {
    if ( this.#moveAxis == Axis.None ) {
      this.#moveAxis = Math.abs( dx ) > Math.abs( dy ) ? Axis.Horizontal : Axis.Vertical;
    }

    this.#moveDist += this.#moveAxis.x * dx;
    this.#moveDist += this.#moveAxis.y * dy;
    this.#moveDist = Math.max( -1, Math.min( 1, this.#moveDist ) );
  }

  stopDrag() {
    this.#selected = null;
    this.#moveAxis = Axis.None;
    this.#moveDist = 0;
  }
}