export class CellMap {
  static fromCellGrid( cellGrid ) {
    const cells = [];

    for ( let row = 0; row < cellGrid[ 0 ].length; row ++ ) {
      for ( let col = 0; col < cellGrid.length; col ++ ) {
        cells.push( cellGrid[ col ][ row ] );
      }
    }

    return new CellMap( cells );
  }

  cells = [];

  constructor( cells ) {
    this.cells = cells;
  }

  fullyLink() {
    this.cells.forEach( cell => 
      cell.getUnlinkedEdges().forEach( edge => cell.linkTo( edge.neighbor ) ) 
    );
  }

  removeCell( cell ) {
    cell.detachAll();
    this.cells = this.cells.filter( c => c != cell );
  }

  getSolidEdges() {
    const edges = [];
    this.cells.forEach( cell => edges.push( ...cell.getSolidEdges() ) );
    return edges;
  }
}