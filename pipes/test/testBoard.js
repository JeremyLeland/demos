import { Canvas } from '../src/common/Canvas.js';
import { Board } from '../src/Pipes.js';

let mouseCol, mouseRow;

const board = Board.fromLocalStore() ?? new Board();

window.addEventListener( 'beforeunload', _ => {
  board.toLocalStore();
} );

const canvas = new Canvas();
canvas.backgroundColor = '#321';
// canvas.lineWidth = 1;
canvas.zoom = 1 / 8;
canvas.scrollX = 0.5;
canvas.scrollY = -1;

canvas.update = ( dt ) => {
  board.update( dt );

  lengthSlider.value = board.flowLength;
}

canvas.draw = ( ctx ) => {
  board.draw( ctx, mouseCol, mouseRow );
}

canvas.start();


//
// UI
//
const playButton = document.createElement( 'button' );

Object.assign( playButton.style, {
  border: 0,
  padding: 0,
  verticalAlign: 'super',
} );

function updatePlayButtonLabel() {
  playButton.textContent = board.flowSpeed == 0 ? '▶️' : '⏸️';
}
updatePlayButtonLabel();

playButton.addEventListener( 'click', _ => {
  board.flowSpeed = board.flowSpeed == 0 ? 0.001 : 0;
  updatePlayButtonLabel();
} );

const lengthSlider = document.createElement( 'input' );

Object.assign( lengthSlider.style, {
  width: '90%',
} );

Object.assign( lengthSlider, {
  type: 'range',
  value: board.flowLength,
  min: 0,
  max: 50,
  step: 0.01,
} );

lengthSlider.addEventListener( 'input', _ => {
  board.flowLength = +lengthSlider.value;

  canvas.redraw();
} );

const ui = document.createElement( 'div' );
Object.assign( ui.style, {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '99%',
} );

ui.appendChild( playButton );
ui.appendChild( lengthSlider );
document.body.appendChild( ui );


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