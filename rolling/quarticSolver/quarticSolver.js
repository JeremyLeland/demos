// https://javascriptsource.com/quartic-equation-solver/

/* This script and many more are available free online at
The JavaScript Source!! http://javascriptsource.com
Created by: Brian Kieffer | http://www.freewebs.com/brianjs/ */

function calcmult(a2,b2,c2,d2,e2) {
  var real = a2*c2 - b2*d2
  var img = b2*c2 + a2*d2

  if (e2 == 0) {
    return real
  } else {
    return img
  }
}

function isquareroot(a1,b1,n1) {
  var y = Math.sqrt((a1*a1) + (b1*b1));
  var y1 = Math.sqrt((y - a1) / 2);
  var x1 = b1 / (2*y1);

  if (n1 == 0) {
    return x1
  } else {
    return y1
  }
}

function extractcoefficents() {
  // Extract X^4 Coefficent
  var aq = document.numbers2.a.value;
  var aq2 = aq // Keeps Orignial AQ value
  // Extract X^3 Coefficent
  var bq = document.numbers2.b.value;
  var bq2 = bq // Keeps Orignial BQ Value
  // Extract X^2 Coefficent
  var cq = document.numbers2.c.value;
  // Extract X Coefficent
  var dq = document.numbers2.d.value;
  // Extract Constant
  var eq = document.numbers2.e.value;
  // Define Perfect Quartic Varible
  var perfect = 0;
  var perfectbiquadratic = 0;

  // The Bi-Quadratic 2 Perfect Squares that are negative test
  if (cq*cq - 4*aq*eq == 0 && cq > 0) {
    perfectbiquadratic = 1;
  }

  // Divide Equation by the X^4 Coefficent to make equation in the form of X^4 + AX^3 + BX^2 + CX + D
  bq /= aq;
  cq /= aq;
  dq /= aq;
  eq /= aq;
  aq = 1;
  var f2 = cq - (3*bq*bq / 8);
  var g2 = dq + (bq*bq*bq/8) - (bq*cq/2);
  var h2 = eq - (3*bq*bq*bq*bq/256) + (bq*bq*(cq/16)) - (bq*dq/4);
  var a = 1;
  var b = f2/2
  var c = (f2*f2 - (4*h2)) / 16
  var d = -1*((g2*g2)/64)

  if (b == 0 && c == 0 && d == 0) {
    perfect = 1
  }

  // Cubic routine starts here…..
  var f = (((3*c) / a) - ((b*b) / (a*a))) / 3;
  var g = (((2*b*b*b) / (a*a*a)) - ((9*b*c) / (a*a)) + ((27*d) / a)) / 27
  var h = eval(((g*g)/4) + ((f*f*f)/27))
  var z = 1/3;
  var i;
  var j;
  var k;
  var l;
  var m;
  var n;
  var p;
  var xoneterm;
  var xtwoterm;
  var xthreeterm;
  var alreadydone;
  var alreadydone2 = 0;
  var ipart = 0;
  var p = 0
  var q = 0
  var r = 0
  var s = 0

  if (h <= 0) {
    var exec = 2
    i = Math.sqrt(((g*g) / 4) - h);
    j = Math.pow(i,z);
    k = Math.acos(-1 * (g / (2*i)));
    l = -1*j;
    m = Math.cos(k / 3);
    n = Math.sqrt(3) * Math.sin(k / 3);
    p = (b / (3*a)) * -1;
    xoneterm = (2*j) * Math.cos(k/3) - (b / (3*a));
    xtwoterm = l * (m + n) + p;
    xthreeterm = l * (m - n) + p;
  }

  if (h > 0) {
    var exec = 1
    var R = (-1*(g / 2)) + Math.sqrt(h);
    if (R < 0) {
      var S = -1*(Math.pow((-1*R),z))
    } else {
      var S = Math.pow(R,z);
    }
    var T = (-1*(g / 2)) - Math.sqrt(h);
    if (T < 0) {
      var U = -1*(Math.pow((-1*T),z));
    } else {
    var U = Math.pow(T,z);
    }

    xoneterm = (S + U) - (b / (3*a));
    xtwoterm = (-1*(S+U)/2) - (b / (3*a));
    var ipart = ((S-U) * Math.sqrt(3)) / 2;
    xthreeterm = xtwoterm;
  }

  if (f == 0 && g == 0 && h == 0) {
    if ((d/a) < 0 ) {
      xoneterm = (Math.pow((-1*(d/a)),z));
      xtwoterm = xoneterm;
      xthreeterm = xoneterm;
    } else {
      xoneterm = -1*(Math.pow((d/a),z));
      xtwoterm = xoneterm;
      xthreeterm = xoneterm;
    }
  }
  // ….and ends here.

  // Return to solving the Quartic.
  if (ipart == 0 && xoneterm.toFixed(10) == 0) {
    var alreadydone2 = 1
    var p2 = Math.sqrt(xtwoterm)
    var q = Math.sqrt(xthreeterm)
    var r = -g2 / (8*p2*q)
    var s = bq2/(4*aq2)
  }

  if (ipart == 0 && xtwoterm.toFixed(10) == 0 && alreadydone2 == 0 && alreadydone2 != 1) {
    var alreadydone2 = 2
    var p2 = Math.sqrt(xoneterm)
    var q = Math.sqrt(xthreeterm)
    var r = -g2 / (8*p2*q)
    var s = bq2/(4*aq2)
  }

  if (ipart == 0 && xthreeterm.toFixed(10) == 0 && alreadydone2 == 0 && alreadydone2 != 1 && alreadydone2 != 2) {
    var alreadydone2 = 3
    var p2 = Math.sqrt(xoneterm)
    var q = Math.sqrt(xtwoterm)
    var r = -g2 / (8*p2*q)
    var s = bq2/(4*aq2)
  }

  if (alreadydone2 == 0 && ipart == 0) {
    if (xthreeterm.toFixed(10) < 0) {
      var alreadydone2 = 4
      var p2 = Math.sqrt(xoneterm)
      var q = Math.sqrt(xtwoterm)
      var r = -g2 / (8*p2*q)
      var s = bq2/(4*aq2)
    } else {
      var alreadydone2 = 5
      var p2 = Math.sqrt(xoneterm.toFixed(10))
      var q = Math.sqrt(xthreeterm.toFixed(10))
      var r = -g2 / (8*p2*q)
      var s = bq2/(4*aq2)
    }
  }

  if (ipart != 0) {
    var p2 = isquareroot(xtwoterm,ipart,0)
    var p2ipart = isquareroot(xtwoterm,ipart,1)
    var q = isquareroot(xthreeterm,-ipart,0)
    var qipart = isquareroot(xthreeterm,-ipart,1)
    var mult = calcmult(p2,p2ipart,q,qipart,0)
    var r = -g2/(8*mult)
    var s = bq2/(4*aq2)
  }

  if (ipart == 0 && xtwoterm.toFixed(10) < 0 && xthreeterm.toFixed(10) < 0) {
    xtwoterm /= -1
    xthreeterm /= -1
    var p2 = 0
    var q = 0
    var p2ipart = Math.sqrt(xtwoterm)
    var qipart = Math.sqrt(xthreeterm)
    var mult = calcmult(p2,p2ipart,q,qipart,0)
    var r = -g2/(8*mult)
    var s = bq2/(4*aq2)
    var ipart = 1
  }

  if (xoneterm.toFixed(10) > 0 && xtwoterm.toFixed(10) < 0 && xthreeterm.toFixed(10) == 0 && ipart == 0) {
    xtwoterm /= -1
    var p2 = Math.sqrt(xoneterm)
    var q = 0
    var p2ipart = 0
    var qipart = Math.sqrt(xtwoterm)
    var mult = calcmult(p2,p2ipart,q,qipart,0)
    var mult2 = calcmult(p2,p2ipart,q,qipart,1)
    var r = -g2/(8*mult)
    if (mult2 != 0) {
      var ripart = g2/(8*mult2)
      var r = 0
    }
    var s = bq2/(4*aq2)
    var ipart = 1
  }

  if (xtwoterm.toFixed(10) == 0 && xthreeterm.toFixed(10) == 0 && ipart == 0) {
    var p2 = Math.sqrt(xoneterm)
    var q = 0
    var r = 0
    var s = bq2/(4*aq2)
  }

  const solution = {
    x1: document.getElementsByName( 'x1' )[ 0 ],
    x2: document.getElementsByName( 'x2' )[ 0 ],
    x3: document.getElementsByName( 'x3' )[ 0 ],
    x4: document.getElementsByName( 'x4' )[ 0 ],
    x1i: document.getElementsByName( 'x1i' )[ 0 ],
    x2i: document.getElementsByName( 'x2i' )[ 0 ],
    x3i: document.getElementsByName( 'x3i' )[ 0 ],
    x4i: document.getElementsByName( 'x4i' )[ 0 ],
  }

  if (ipart == 0) {
    solution.x1.value = "  " + eval((p2 + q + r - s).toFixed(10))
    solution.x2.value = "  " + eval((p2 - q - r - s).toFixed(10))
    solution.x3.value = "  " + eval((-p2 + q - r - s).toFixed(10))
    solution.x4.value = "  " + eval((-p2 - q + r - s).toFixed(10))
    solution.x1i.value = "  " +  0
    solution.x2i.value = "  " +  0
    solution.x3i.value = "  " +  0
    solution.x4i.value = "  " +  0
  }

  if (perfect == 1) {
    solution.x1.value = "  " + -bq/4
    solution.x2.value = "  " + -bq/4
    solution.x3.value = "  " + -bq/4
    solution.x4.value = "  " + -bq/4
    solution.x1i.value = "  " +  0
    solution.x2i.value = "  " +  0
    solution.x3i.value = "  " +  0
    solution.x4i.value = "  " +  0
  }

  if (ipart == 0 && xtwoterm.toFixed(10) < 0 && xthreeterm.toFixed(10) < 0) {
    xtwoterm /= -1
    xthreeterm /= -1
    var p2 = 0
    var q = 0
    var p2ipart = Math.sqrt(xtwoterm)
    var qipart = Math.sqrt(xthreeterm)
    var mult = calcmult(p2,p2ipart,q,qipart,0)
    var r = -g2/(8*mult)
    var s = bq2/(4*aq2)
    var ipart = 1
  }

  if (xoneterm.toFixed(10) > 0 && xtwoterm.toFixed(10) < 0 && xthreeterm.toFixed(10) == 0 && ipart == 0) {
    xtwoterm /= -1
    var p2 = Math.sqrt(xoneterm)
    var q = 0
    var p2ipart = 0
    var qipart = Math.sqrt(xtwoterm)
    var mult = calcmult(p2,p2ipart,q,qipart,0)
    var mult2 = calcmult(p2,p2ipart,q,qipart,1)
    var r = -g2/(8*mult)
    if (mult2 != 0) {
      var ripart = g2/(8*mult2)
      var r = 0
    }
    var s = bq2/(4*aq2)
    var ipart = 1
  }

  if (xtwoterm.toFixed(10) == 0 && xthreeterm.toFixed(10) == 0 && ipart == 0) {
    var p2 = Math.sqrt(xoneterm)
    var q = 0
    var r = 0
    var s = bq2/(4*aq2)
  }

  if (ipart != 0) {
    solution.x1.value = "  " + eval((p2 + q + r - s).toFixed(10))
    solution.x1i.value = "  " + eval((p2ipart + qipart).toFixed(10))
    solution.x2.value = "  " + eval((p2 - q - r - s).toFixed(10))
    solution.x2i.value = "  " + eval((p2ipart - qipart).toFixed(10))
    solution.x3.value = "  " + eval((-p2 + q - r - s).toFixed(10))
    solution.x3i.value = "  " + eval((-p2ipart + qipart).toFixed(10))
    solution.x4.value = "  " + eval((-p2 - q + r - s).toFixed(10))
    solution.x4i.value = "  " + eval((-p2ipart - qipart).toFixed(10))
  }

  if (perfectbiquadratic == 1) {
    solution.x1i.value = "  " + eval(Math.sqrt(cq/2).toFixed(10))
    solution.x2i.value = "  " + eval(Math.sqrt(cq/2).toFixed(10))
    solution.x3i.value = "  -" + eval(Math.sqrt(cq/2).toFixed(10))
    solution.x4i.value = "  -" + eval(Math.sqrt(cq/2).toFixed(10))
    solution.x1.value = "  " + 0
    solution.x2.value = "  " + 0
    solution.x3.value = "  " + 0
    solution.x4.value = "  " + 0
  }
}