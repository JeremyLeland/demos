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

  getLoops() {
    const loops = [];

    const unvisited = new Set( this.getSolidEdges() );
    const visited = new Set();
    
    while ( unvisited.size > 0 ) {
      const points = [];
      let [ edge ] = unvisited;

      let currentCell = edge.parent;
      let edgeIndex = currentCell.edges.indexOf( edge );

      while ( !visited.has( edge ) ) {
        visited.add( edge );
        unvisited.delete( edge );

        points.push( edge.start );

        edgeIndex = ( edgeIndex + 1 ) % currentCell.edges.length;
        edge = currentCell.edges[ edgeIndex ];

        while ( edge.linked ) {
          edgeIndex = edge.neighbor.edges.findIndex( edge => edge.neighbor == currentCell );
          currentCell = edge.neighbor;
          edgeIndex = ( edgeIndex + 1 ) % currentCell.edges.length;
          edge = currentCell.edges[ edgeIndex ];
        }
      }

      loops.push( points );
    }

    return loops;
  }
}