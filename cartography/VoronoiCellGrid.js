import { Cell } from './Cell.js';
import Voronoi from './lib/rhill-voronoi-core.js';

export function getVoronoiGrid( width = 100, height = 100, seeds = 100, lloyds = 10 ) {
  const points = Array.from( Array( seeds ), _ => ( { 
    x: Math.random() * width, 
    y: Math.random() * height,
  } ) );

  const bbox = { xl: 0, xr: width, yt: 0, yb: height };

  const voronoi = new Voronoi();
  let diagram = voronoi.compute( points, bbox );

  for ( let i = 0; i < lloyds; i ++ ) {
    const points = Array.from( diagram.cells, cell => {
      let x = 0, y = 0;
      cell.halfedges.forEach( half => {
        x += half.getStartpoint().x;
        y += half.getStartpoint().y;
      } );
      x /= cell.halfedges.length;
      y /= cell.halfedges.length;

      return { x: x, y: y };
    } );

    diagram = voronoi.compute( points, bbox );
  }

  const cells = [];
  
  diagram.cells.forEach( cell => {
    // Leave off boundry edges
    if ( cell.halfedges.every( e => e.edge.lSite != null && e.edge.rSite != null ) ) {
      const mapCell = new Cell( 
        cell.halfedges.map( e => {
          const point = e.getStartpoint();
          return [ point.x, point.y ];
        } )
      );

      cell.halfedges.forEach( ( halfEdge, index ) => {
        halfEdge.mapEdge = mapCell.edges[ index ];
      } );

      cell.mapCell = mapCell;
      cells.push( mapCell );
    }
  } );

  diagram.cells.forEach( cell => {
    if ( cell.mapCell ) {
      cell.halfedges.forEach( ( halfedge, index ) => {
        const otherSite = halfedge.edge.rSite == cell.site ? halfedge.edge.lSite : halfedge.edge.rSite;
        const otherCell = diagram.cells[ otherSite.voronoiId ];

        if ( otherCell?.mapCell ) {
          const otherEdgeIndex = otherCell.halfedges.findIndex( he => he.edge.lSite == cell.site || he.edge.rSite == cell.site );
          cell.mapCell.edges[ index ].neighbor = otherCell.mapCell.edges[ otherEdgeIndex ];
        }
      } )
    }
  } );

  return cells;
}