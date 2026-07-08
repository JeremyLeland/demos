import * as Angle from './Angle.js';
import { GameCanvas } from './GameCanvas.js';

const Constants = {
  Spinner: {
    TipRadius: 0.1,
    BaseRadius: 0.5,
    TipLength: 4,
    BaseLength: 2.5,
    AngleAccel: -0.000005,
  },
  Limbs: [
    'right foot',
    'left hand',
    'left foot',
    'right hand',
  ],
  Colors: [
    'red',
    'green',
    'yellow',
    'blue',
  ],
};

const FootPath1 = new Path2D( `
  M -0.9024639426356051,0.009603489512464591
  L -0.3304297683130988,0.9340301407338849
  Q 0.7149157836195881,0.44960834311505593 0.9678280926747607,0.004413458528419012
  Q 0.4666408162043424,-0.0812579147245466 -0.12741003800767636,0.13797911534326013
  L -0.41614730409962186,-0.30272526707474257
  M 0.37737632504812596,0.004080795766491778
  L 0.5297108081858006,0.45012282724235225
  M -0.555578239190794,0.5701825660542853
  L 0.05601112274487548,0.7418304982076409
  M -0.41614730409962186,-0.30272526707474257
  Q -0.670417560153729,-0.17986241711594075 -0.9024639426356051,0.009603489512464591
  M -0.9635306966429388,-0.08908245870875975
  L -0.9024639426356051,0.009603489512464591
  M -0.48269451287565324,-0.40429735349861173
  L -0.41614730409962186,-0.30272526707474257
` );

const FootPath2 = new Path2D( `
  M -0.47685214177316737,-0.2722790990685878
  L -0.3010452749006425,0.007084756778092283
  M -0.5319359789725402,-0.24268505439587168
  L -0.3598141553925305,0.03914054844022208
  M -0.5914140588248987,-0.20856239766155485
  L -0.4185830358844185,0.06852493551965377
  M -0.6453733680215165,-0.17559823832135674
  L -0.46666661704458834,0.1085946219308036
  M -0.6939605841279703,-0.14423215654929677
  L -0.5174216027874565,0.13263651884391336
  M -0.7468931503655512,-0.108190935990963
  L -0.5708478867799978,0.17003480067236487
  M -0.7945469637819713,-0.0740275258387797
  L -0.6216027661898409,0.2101044870835147
  M -0.846452787060515,-0.03490924406231019
  L -0.6670150491003375,0.24750287524499126
` );

function drawFoot( ctx ) {
  ctx.fillStyle = 'red';
  ctx.fill( FootPath1 );
  ctx.lineWidth = 0.02;
  ctx.stroke( FootPath1 );
  ctx.lineWidth = 0.01;
  ctx.stroke( FootPath2 );
}

const HandPath1 = new Path2D( `
  M -0.6347550667857671,0.2767772222582199
  L -0.776461343629665,0.44391780328976593
  L -0.33317529759700815,0.8763032886089306
  Q -0.2603239995060671,0.7275180415742467 -0.11516581892402256,0.6655607539895585
  C 0.13677480899830097,0.8061903068800425 0.3269272514261504,0.3454761336860299 0.9349130928798877,0.45481836400325837
  Q 0.9784349829829152,0.15955999799800558 0.42622440573163534,0.2186413805631664
  L 0.9022115553724825,-0.36998419739058797
  C 0.9962663127053899,-0.535294507061231 0.8991973679683413,-0.6060279248510786 0.7132701421800949,-0.48262240875388773
  C 0.9703246828023511,-0.8521230949136768 0.7887305798899883,-0.9506257374528837 0.5134280236411435,-0.6497630621019698
  C 0.6818197563323463,-0.9363750666705216 0.569849898730685,-1.0574870610440423 0.2554503526732823,-0.6969984154000667
  C 0.35567693226741776,-0.936977338811737 0.1748508826041555,-0.9689664453299585 0.04834129008071697,-0.7987362106829458
  L -0.5947867298578198,-0.04660352372445198
  Q -0.7372546249690762,0.1371496028135566 -0.6347550667857671,0.2767772222582199
  Z
` );

const HandPath2 = new Path2D( `
  M -0.6347550667857671,0.2767772222582199
  C -0.2828316870767975,0.5723972316671257 0.09149684461563379,-0.0539800568888108 -0.20236972609967419,-0.24644549763033186

  M -0.11516581892402256,0.6655607539895585
  C -0.5367283427903649,0.3029117618946388 0.032868733170686615,0.008726037357053129 0.28815160091454395,0.0878356644327607
  Q 0.15495331376603663,-0.05360467935079001 -0.07519748199607523,-0.20284354404250582

  M 0.2554503526732823,-0.6969984154000667
  L -0.03886261709493466,-0.33364926017291174
  M 0.5134280236411435,-0.6497630621019698
  L 0.16097950144401674,-0.22101104880961198
  M 0.7132701421800949,-0.48262240875388773
  L 0.34775374589333286,-0.08077117022116576

  M 0.3862561141140486,-0.029465095115076778
  Q 0.36187936177176927,-0.09925240471759421 0.29167576724759847,-0.110977233315388
  M 0.19731451097822905,-0.16650867914136547
  Q 0.17834262593969769,-0.250972708826335 0.10398180199565932,-0.23701119053921982
  M 0.014282949277755641,-0.2875521214380463
  Q -0.023780222880647857,-0.3496534844320955 -0.09336498676318117,-0.33853039708977417
`);

function drawHand( ctx ) {
  ctx.fillStyle = 'tan';
  ctx.fill( HandPath1 );
  ctx.lineWidth = 0.02;
  ctx.stroke( HandPath1 );
  ctx.stroke( HandPath2 );
}

const NumLimbs = Constants.Limbs.length;
const NumColors = Constants.Colors.length;

const TWO_PI = Math.PI * 2;
const PI_2 = Math.PI / 2;

const ColorAngleWidth = TWO_PI / NumLimbs / NumColors;

const spinnerPath = new Path2D();
spinnerPath.arc( Constants.Spinner.TipLength, 0, Constants.Spinner.TipRadius, -PI_2, PI_2 );
spinnerPath.arc( -Constants.Spinner.BaseLength, 0, Constants.Spinner.BaseRadius, PI_2, -PI_2 );

const spinner = {
  angle: 0,
  dAngle: 0,
};

const limbColors = Array( NumLimbs );

const gameCanvas = new GameCanvas();
gameCanvas.backgroundColor = 'white';

gameCanvas.update = ( dt ) => {
  spinner.angle += spinner.dAngle * dt + Constants.Spinner.AngleAccel * dt * dt / 2;
  spinner.dAngle += Constants.Spinner.AngleAccel * dt;

  if ( spinner.dAngle < 0 ) {
    spinner.dAngle = 0;
    gameCanvas.stop();

    // Save resulting limb color
    const index = Math.floor( ( spinner.angle % TWO_PI ) / ColorAngleWidth );

    const limb = Math.floor( index / NumColors );
    const color = index % NumColors;

    limbColors[ limb ] = color;
  }
}

gameCanvas.draw = ( ctx ) => {

  ctx.font = 'bold 0.5px Arial Narrow';
  ctx.fillStyle = 'black';

  const TextOffset = 4.75;
  ctx.textBaseline = 'hanging';   // 'top' to low in FF
  ctx.textAlign = 'left';
  ctx.fillText( 'LEFT FOOT',  -TextOffset, -TextOffset );
  ctx.textAlign = 'right';
  ctx.fillText( 'RIGHT HAND',  TextOffset, -TextOffset );

  ctx.textBaseline = 'alphabetic';  // 'bottom' too high in FF
  ctx.textAlign = 'left';
  ctx.fillText( 'LEFT HAND', -TextOffset,  TextOffset );
  ctx.textAlign = 'right';
  ctx.fillText( 'RIGHT FOOT',   TextOffset,  TextOffset );


  ctx.font = '1.5px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const IconOffset = 3.5;

  // Left foot
  ctx.save(); {
    ctx.translate( -IconOffset, -IconOffset - 0.3 );
    drawFoot( ctx );
  }
  ctx.restore();

  // Right hand
  ctx.save(); {
    ctx.translate( IconOffset, -IconOffset );
    ctx.scale( 0.8, 0.8 );
    drawHand( ctx );
  }
  ctx.restore();

  // Left hand
  ctx.save(); {
    ctx.translate( -IconOffset, IconOffset );
    ctx.scale( -0.8, 0.8 );
    drawHand( ctx );
  }
  ctx.restore();

  // Right foot
  ctx.save(); {
    ctx.translate( IconOffset, IconOffset - 0.1 );
    ctx.scale( -1, 1 );
    ctx.rotate( Math.PI * 0.3 );
    drawFoot( ctx );
  }
  ctx.restore();

  const ColorOffset = 3.5;

  // Quadrants
  ctx.beginPath();
  ctx.moveTo( ColorOffset, 0 );
  ctx.lineTo( 5, 0 );
  ctx.moveTo( 0, ColorOffset );
  ctx.lineTo( 0, 5 );
  ctx.moveTo( -ColorOffset, 0 );
  ctx.lineTo( -5, 0 );
  ctx.moveTo( 0, -ColorOffset );
  ctx.lineTo( 0, -5 );
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.05;
  ctx.stroke();

  // Colors
  const ColorRadius = ColorOffset * ColorAngleWidth / 2;

  for ( let i = 0; i < NumLimbs * NumColors; i ++ ) {
    const angle = getAngleForIndex( i );

    ctx.beginPath();
    ctx.arc( Math.cos( angle ) * ColorOffset, Math.sin( angle ) * ColorOffset, ColorRadius, 0, TWO_PI );
    ctx.fillStyle = Constants.Colors[ i % NumColors ];
    ctx.fill();
  }

  // Selected limb color outlines
  const OutlineWidth = 0.15;

  limbColors.forEach( ( colorIndex, limbIndex ) => {
    if ( limbColors[ limbIndex ] === colorIndex ) {
      const angle = getAngleForIndex( limbIndex * NumColors + colorIndex );

      ctx.beginPath();
      ctx.arc( Math.cos( angle ) * ColorOffset, Math.sin( angle ) * ColorOffset, ColorRadius - OutlineWidth / 2, 0, TWO_PI );
      ctx.strokeStyle = 'black';
      ctx.lineWidth = OutlineWidth;
      ctx.stroke();
    }
  } );

  // Spinner
  ctx.rotate( spinner.angle );
  ctx.fillStyle = 'black';
  ctx.fill( spinnerPath );
}



//
// Input
//

const MinSpins = 1;
const MaxSpins = 3;

gameCanvas.pointerDown = ( m ) => {

  // const goalAngle = Math.atan2( m.y, m.x );
  const goalAngle = getAngleForIndex( roll() );

  const numSpins = Math.round( MinSpins + Math.random() * ( MaxSpins - MinSpins ) );

  const sweepAngle = Angle.sweepAngle( spinner.angle, goalAngle ) + numSpins * TWO_PI;

  // Find initial velocity to reach desired sweepAngle using equations of motion
  spinner.dAngle = Math.sqrt( -2 * Constants.Spinner.AngleAccel * sweepAngle );

  gameCanvas.start();
}

function roll() {
  for ( let retries = 0; retries < 100; retries ++ ) {
    const roll = Math.floor( Math.random() * NumLimbs * NumColors );

    const limb = Math.floor( roll / NumColors );
    const color = roll % NumColors;

    if ( limbColors[ limb ] === color ) {
      console.log( `${ Constants.Limbs[ limb ] } is already ${ Constants.Colors[ color ] }, re-rolling (attempt ${ retries + 1 })` );
    }
    else {
      return roll;
    }
  }

  console.warn( 'Failed to get unique roll after 100 attempts!' );
}

function getAngleForIndex( i ) {
  return ( i + 0.5 ) * TWO_PI / NumLimbs / NumColors;
}