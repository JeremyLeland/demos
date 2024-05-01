// http://www.tantrix.com/english/TantrixTiles.html
const ColorSequences = [
  'YYBRBR',
  'YYBRRB',
  'RRBBYY',
  'YRBRYB',
  'YYRBBR',
  'RBYBRY',
  'BBYRYR',
  'BBRYRY',
  'YBRBYR',
  'YYRBRB',
  'RRBYBY',
  'RRYBYB',
  'BBYRRY',
  'YYBBRR',
  'GGRYYR',
  'GGYRRY',
  'YYGRGR',
  'YYRGRG',
  'RRGYGY',
  'RRYGYG',
  'GGRRYY',
  'YYGRRG',
  'GYYRRG',
  'GGBRRB',
  'GGRRBB',
  'BBGRRG',
  'RRBGBG',
  'GGBBRR',
  'RRGBGB',
  'GGRBBR',
  'GGRYRY',
  'RYGYRG',
  'GGYRYR',
  'GYRYGR',
  'GRYRGY',
  'GGRBRB',
  'BBGRGR',
  'BBRGRG',
  'RBGBRG',
  'RGBGRB',
  'GGBRBR',
  'BGRGBR',
  'GGBBYY',
  'BGYGBY',
  'GGYYBB',
  'GGBYBY',
  'GGYBBY',
  'GGBYYB',
  'YYGBBG',
  'YGBGYB',
  'BYGYBG',
  'GGYBYB',
  'YYGBGB',
  'YYBGBG',
  'BBGYGY',
  'BBYGYG',
];

export const NumTiles = ColorSequences.length;

const Colors = {
  'Y': 'yellow',
  'G': 'green',
  'B': 'blue',
  'R': 'red',
};

const hexagon = new Path2D();
for ( let i = 0; i < 6; i ++ ) {
  const angle = i * Math.PI * 2 / 6;
  hexagon.lineTo( Math.cos( angle ), Math.sin( angle ) );
}
hexagon.closePath();

export function drawTile( ctx, tileIndex ) {
  const colorSequence = ColorSequences[ tileIndex ];

  ctx.fillStyle = 'black';
  ctx.fill( hexagon );

  let start = 0, end = 0;
  for ( let i = 0; i < 3; i ++ ) {
    for ( end = start + 1; end < 6; end ++ ) {
      if ( colorSequence[ start ] == colorSequence[ end ] ) {
        break;
      }
    }

    ctx.beginPath();

    const DIST = 0.85;
    const angle1 = ( start - 0.5 ) * Math.PI * 2 / 6;
    ctx.moveTo( Math.cos( angle1 ) * DIST, Math.sin( angle1 ) * DIST );

    const angle2 = ( end - 0.5 ) * Math.PI * 2 / 6;
    ctx.quadraticCurveTo( 0, 0, Math.cos( angle2 ) * DIST, Math.sin( angle2 ) * DIST );

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.15;
    ctx.stroke();

    ctx.strokeStyle = Colors[ colorSequence[ start ] ];
    ctx.lineWidth = 0.1;
    ctx.stroke();

    start ++;
    if ( start == end ) {
      start ++;
    }
  }
}