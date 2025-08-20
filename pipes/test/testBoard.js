import { Canvas } from '../src/common/Canvas.js';
import { Board } from '../src/Pipes.js';

let mouseCol, mouseRow;

const board = Board.fromLocalStore() ?? Board.newGame();

const canvas = new Canvas();
canvas.backgroundColor = '#321';
// canvas.lineWidth = 1;
canvas.zoom = 1 / 8;
canvas.scrollX = 0.5;
canvas.scrollY = -1;

canvas.update = ( dt ) => {
  board.update( dt );
}

canvas.draw = ( ctx ) => {
  board.draw( ctx, mouseCol, mouseRow );
}

canvas.start();

//
// Slider
//
const lengthSlider = document.createElement( 'input' );

Object.assign( lengthSlider.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

Object.assign( lengthSlider, {
  type: 'range',
  value: board.flowLength,
  min: 0,
  max: 18,
  step: 0.01,
} );

document.body.appendChild( lengthSlider );

lengthSlider.addEventListener( 'input', _ => {
  board.flowLength = +lengthSlider.value;

  canvas.redraw();
} );


//
// Input
//

canvas.pointerMove = m => {
  mouseCol = Math.round( m.x );
  mouseRow = Math.round( m.y );

  if ( mouseCol < 0 || board.cols <= mouseCol || mouseRow < 0 || board.rows <= mouseRow ) {
    mouseCol = mouseRow = undefined;
  }

  canvas.redraw();
};

canvas.pointerDown = m => {
  if ( mouseCol != undefined && mouseRow != undefined ) {
    board.playerInput( mouseCol, mouseRow );
  }

  canvas.redraw();
}