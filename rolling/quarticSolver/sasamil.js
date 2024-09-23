// Based on https://github.com/sasamil/Quartic/blob/master/quartic.cpp

const eps=1e-12;

console.log( solve_quartic( -2, -3, 4, 4 ) );  // -1, -1, 2, 2
console.log( solve_quartic( 4, 3, -4, -4 ) );  // -2, -2, -1, 1
console.log( solve_quartic( 2, -7, -8, 12 ) ); // 1, -1, 2, -3


//---------------------------------------------------------------------------
// solve cubic equation x^3 + a*x^2 + b*x + c
// x - array of size 3
// In case 3 real roots: => x[0], x[1], x[2], return 3
//         2 real roots: x[0], x[1],          return 2
//         1 real root : x[0], x[1] ± i*x[2], return 1
function solveP3( x, a, b, c ) {
  const a2 = a*a;
  let q  = (a2 - 3*b)/9;
  const r  = (a*(2*a2-9*b) + 27*c)/54;
  const r2 = r*r;
  const q3 = q*q*q;
  let A,B;

  if(r2<q3)
  {
    let t=r/Math.sqrt(q3);
    if( t<-1) t=-1;
    if( t> 1) t= 1;
    t=Math.acos(t);
    a/=3; q=-2*Math.sqrt(q);
    x[0]=q*Math.cos(t/3)-a;
    x[1]=q*Math.cos((t+Math.PI * 2)/3)-a;
    x[2]=q*Math.cos((t-Math.PI * 2)/3)-a;
    return 3;
  }
  else
  {
    A =-Math.pow( Math.abs(r)+Math.sqrt(r2-q3),1./3);
    if( r<0 ) A=-A;
    B = (0==A ? 0 : q/A);

    a/=3;
    x[0] =(A+B)-a;
    x[1] =-0.5*(A+B)-a;
    x[2] = 0.5*Math.sqrt(3.)*(A-B);
    if(Math.abs(x[2])<eps) { x[2]=x[1]; return 2; }
 
    return 1;
  }
}
 
//---------------------------------------------------------------------------
// Solve quartic equation x^4 + a*x^3 + b*x^2 + c*x + d
// (attention - this function returns dynamically allocated array. It has to be released afterwards)
function solve_quartic( a, b, c, d )
{
  const a3 = -b;
  const b3 =  a*c -4.*d;
  const c3 = -a*a*d - c*c + 4.*b*d;

  // cubic resolvent
  // y^3 − b*y^2 + (ac−4d)*y − a^2*d−c^2+4*b*d = 0

  const x3 = Array( 3 );
  const iZeroes = solveP3(x3, a3, b3, c3);

  let q1, q2, p1, p2, D, sqD, y;

  y = x3[0];
  // THE ESSENCE - choosing Y with maximal absolute value !
  if(iZeroes != 1)
  {
    if(Math.abs(x3[1]) > Math.abs(y)) y = x3[1];
    if(Math.abs(x3[2]) > Math.abs(y)) y = x3[2];
  }

  // h1+h2 = y && h1*h2 = d  <=>  h^2 -y*h + d = 0    (h === q)

  D = y*y - 4*d;
  if(Math.abs(D) < eps) //in other words - D==0
  {
    q1 = q2 = y * 0.5;
    // g1+g2 = a && g1+g2 = b-y   <=>   g^2 - a*g + b-y = 0    (p === g)
    D = a*a - 4*(b-y);
    if(Math.abs(D) < eps) //in other words - D==0
      p1 = p2 = a * 0.5;

    else
    {
      sqD = Math.sqrt(D);
      p1 = (a + sqD) * 0.5;
      p2 = (a - sqD) * 0.5;
    }
  }
  else
  {
    sqD = Math.sqrt(D);
    q1 = (y + sqD) * 0.5;
    q2 = (y - sqD) * 0.5;
    // g1+g2 = a && g1*h2 + g2*h1 = c       ( && g === p )  Krammer
    p1 = (a*q1-c)/(q1-q2);
    p2 = (c-a*q2)/(q1-q2);
  }

  let retval = Array.from( Array( 4 ), _ => ( {} ) );

  // solving quadratic eq. - x^2 + p1*x + q1 = 0
  D = p1*p1 - 4*q1;
  if(D < 0.0)
  {
    retval[0].real = -p1 * 0.5;
    retval[0].imag = Math.sqrt(-D) * 0.5;
    retval[1].real = -p1 * 0.5;
    retval[1].imag = Math.sqrt(-D) * -0.5;
  }
  else
  {
    sqD = Math.sqrt(D);
    retval[0].real = (-p1 + sqD) * 0.5;
    retval[1].real = (-p1 - sqD) * 0.5;
  }

  // solving quadratic eq. - x^2 + p2*x + q2 = 0
  D = p2*p2 - 4*q2;
  if(D < 0.0)
  {
    retval[2].real = -p2 * 0.5;
    retval[2].imag = Math.sqrt(-D) * 0.5;
    retval[2].real = -p2 * 0.5;
    retval[2].imag = Math.sqrt(-D) * -0.5;
  }
  else
  {
    sqD = Math.sqrt(D);
    retval[2].real = (-p2 + sqD) * 0.5;
    retval[3].real = (-p2 - sqD) * 0.5;
  }

  return retval;
}