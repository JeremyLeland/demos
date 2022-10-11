import { Board } from './Board.js';

// Graphical representation of Board
export class Arena {
  div;

  constructor( board ) {
    this.div = document.createElement( 'div' );
    this.div.className = 'arena';

    board.blocks.forEach( block => {
      this.div.appendChild( divFromBlock( block ) );
    } );
  }
}

function divFromBlock( block ) {
  const div = document.createElement( 'div' );

  const isPrimary = block.y == Board.EXIT_ROW && block.height == 1;
  div.className = 'block ' + ( isPrimary ? 'primary' : `cols${ block.width }rows${ block.height }` );

  div.style.transform = `translate( ${ block.x * 10 }px,${ block.y * 10 }px )`;

  div.block = block;

  return div;
}