import { JewelInfo } from './Jewels.js';

const Cols = 5;
const Rows = 5;

const GridPath = new Path2D();
for ( let x = 0; x <= Cols; x ++ ) {
  GridPath.moveTo( x - 0.5, 0 - 0.5 );
  GridPath.lineTo( x - 0.5, Rows - 0.5 );  
}
for ( let y = 0; y <= Rows; y ++ ) {
  GridPath.moveTo( 0 - 0.5, y - 0.5 );
  GridPath.lineTo( Cols - 0.5, y - 0.5 );
}

export class Board {
  pieces;

  draw( ctx ) {

    ctx.strokeStyle = 'gray';
    ctx.stroke( GridPath );
    

    this.pieces.forEach( piece => {
      ctx.translate( piece.x, piece.y );
      ctx.scale( 0.5, 0.5 );

      const info = JewelInfo[ piece.type ];

      ctx.fillStyle = info.fillStyle;
      ctx.fill( info.fill );

      ctx.strokeStyle = 'black';
      ctx.stroke( info.stroke );

      ctx.scale( 2, 2 );
      ctx.translate( -piece.x, -piece.y );
    })
  }
}