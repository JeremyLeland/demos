// Visualizing some slop to clean up later

function findBlendCircle(c1, c2) {
  const { x: x1, y: y1, r: r1 } = c1;
  const { x: x2, y: y2, r: r2 } = c2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return null; // concentric = no unique solution

  // Solve for r3 numerically (external-external case)
  // Equation: distance between circle centers = (r1 + r3) + (r2 + r3) - 2*sqrt((r1 + r3)*(r2 + r3) - ...)
  // Easier: we can find r3 where two offset circles intersect.
  function test(r3) {
    return (r1 + r3 + r2 + r3) - d;
  }

  // Simple numeric estimate: start around overlap region
  let r3 = Math.max(1e-6, (r1 + r2 - d) / 2);
  if (r3 <= 0) r3 = Math.min(r1, r2) * 0.5;

  // Build the two offset circles
  const R1 = r1 + r3;
  const R2 = r2 + r3;

  // Intersection points of two circles of radii R1 and R2
  const a = (R1 * R1 - R2 * R2 + d * d) / (2 * d);
  const hSq = R1 * R1 - a * a;
  if (hSq < 0) return null; // no intersection
  const h = Math.sqrt(hSq);

  // Midpoint along centerline
  const xm = x1 + (a * dx) / d;
  const ym = y1 + (a * dy) / d;

  // Two intersection points — pick the one “outside” (higher y for example)
  const x3a = xm + (h * dy) / d;
  const y3a = ym - (h * dx) / d;
  const x3b = xm - (h * dy) / d;
  const y3b = ym + (h * dx) / d;

  // Both candidate tangent circles
  const candidates = [
    { x: x3a, y: y3a, r: r3 },
    { x: x3b, y: y3b, r: r3 }
  ];

  // return candidates;

  // Pick the one outside both base circles
  const outside = candidates.filter(c =>
    Math.hypot(c.x - x1, c.y - y1) > r1 &&
    Math.hypot(c.x - x2, c.y - y2) > r2
  );

  return outside.length ? outside[0] : candidates[0];
}

function tangentPoint(c1, c3) {
  const dx = c3.x - c1.x;
  const dy = c3.y - c1.y;
  const d = Math.hypot(dx, dy);
  const t = c1.r / (c1.r + c3.r);
  return { x: c1.x + dx * t, y: c1.y + dy * t };
}


// Example: overlapping circles
const c1 = { x: 0, y: 0, r: 3 };
const c2 = { x: 4, y: 0, r: 2.5 };

const blend = findBlendCircle(c1, c2);
console.log("Blend circle:", blend);

const t1 = tangentPoint(c1, blend);
const t2 = tangentPoint(c2, blend);
console.log("Tangent points:", t1, t2);


import { Canvas } from '../../src/common/Canvas.js';
import { Grid } from '../../src/common/Grid.js';

const grid = new Grid( -5, -5, 5, 5 );

const canvas = new Canvas();
canvas.backgroundColor = '#123';
canvas.bounds = [ grid.minX - 0.5, grid.minY - 0.5, grid.maxX + 0.5, grid.maxY + 0.5 ];

canvas.draw = ( ctx ) => {
  ctx.lineWidth = 0.02;
  grid.draw( ctx );

  ctx.strokeStyle = 'white';

  [ c1, c2, blend ].forEach( circle => {
    ctx.beginPath();
    ctx.arc( circle.x, circle.y, circle.r, 0, Math.PI * 2 );
    // ctx.strokeStyle = arc.color;
    ctx.stroke();
  });

  ctx.fillStyle = 'red';
  [ t1, t2 ].forEach( p => {
    ctx.beginPath();
    ctx.arc( p.x, p.y, 0.05, 0, Math.PI * 2 );
    ctx.fill();
  })
}