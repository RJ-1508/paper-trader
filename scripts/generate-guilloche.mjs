// Guilloche asset generator for Paper Trader.
// Math: canonical hypotrochoid (rose engine) and phase-shifted sinusoid
// interference (straight-line engine), per Wolfram MathWorld "Hypotrochoid"
// and Wikipedia "Guilloché". Deterministic: same input, same SVG.
//
//   x(t) = (R - r) cos t + d cos(((R - r) / r) t)
//   y(t) = (R - r) sin t - d sin(((R - r) / r) t)
//
// The curve closes after (r / gcd(R, r)) full revolutions and has
// (R / gcd(R, r)) lobes of rotational symmetry.

import { writeFileSync } from "node:fs";

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const fmt = (n) => Number(n.toFixed(1));

function hypotrochoidPath(R, r, d, cx, cy, scale, samplesPerRev = 260) {
  const revs = r / gcd(R, r);
  const total = Math.ceil(revs * samplesPerRev);
  const k = (R - r) / r;
  let path = "";
  for (let i = 0; i <= total; i++) {
    const t = (i / samplesPerRev) * 2 * Math.PI;
    const x = cx + scale * ((R - r) * Math.cos(t) + d * Math.cos(k * t));
    const y = cy + scale * ((R - r) * Math.sin(t) - d * Math.sin(k * t));
    path += (i === 0 ? "M" : "L") + fmt(x) + " " + fmt(y);
  }
  return path + "Z";
}

// ---------------------------------------------------------------- rosette --
// A rose-engine rosette: one hypotrochoid geometry, pen distance d stepped
// through a range. The overlap of the nested closed curves produces the
// engine-turned moiré. R, r chosen so R/gcd = 30 lobes (certificate-like).
function rosette({ size = 480, rings = 14, stroke = "#9BA7B4" } = {}) {
  const cx = size / 2, cy = size / 2;
  const R = 120, r = 28; // gcd 4 -> 30 lobes, 7 revolutions to close
  const dMin = 22, dMax = 66;
  const reach = R - r + dMax; // max radius of the figure
  const scale = (size / 2 - 8) / reach;
  let paths = "";
  for (let i = 0; i < rings; i++) {
    const d = dMin + ((dMax - dMin) * i) / (rings - 1);
    // opacity falls off toward the outer, larger curves
    const op = fmt(0.5 - 0.28 * (i / (rings - 1)));
    paths += `  <path d="${hypotrochoidPath(R, r, d, cx, cy, scale)}" opacity="${op}"/>\n`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none" stroke="${stroke}" stroke-width="0.6">
${paths}</svg>\n`;
}

// ------------------------------------------------------------------- band --
// A straight-line-engine border band: two mirrored families of sinusoids,
// each family fanned across a phase range, interfering into the woven
// lens pattern used on certificate borders. Width chosen so the pattern
// tiles seamlessly: an integer number of wavelengths across the viewBox.
function band({
  width = 1200, height = 72, waves = 10, curvesPerFamily = 9,
  stroke = "#9BA7B4",
} = {}) {
  const mid = height / 2;
  const ampMax = height * 0.34;
  const omega = (2 * Math.PI * waves) / width; // integer waves -> seamless tile
  let paths = "";
  for (const dir of [1, -1]) {
    for (let i = 0; i < curvesPerFamily; i++) {
      const f = i / (curvesPerFamily - 1); // 0..1 across the family
      const amp = ampMax * (0.35 + 0.65 * f);
      const phase = 0;
      let dAttr = "";
      const steps = width / 2;
      for (let s = 0; s <= steps; s++) {
        const x = (s / steps) * width;
        const y = mid + dir * amp * Math.sin(omega * x + phase);
        dAttr += (s === 0 ? "M" : "L") + fmt(x) + " " + fmt(y);
      }
      const op = fmt(0.42 - 0.22 * f);
      paths += `  <path d="${dAttr}" opacity="${op}"/>\n`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" fill="none" stroke="${stroke}" stroke-width="0.55">
${paths}</svg>\n`;
}

writeFileSync("guilloche-rosette.svg", rosette());
writeFileSync("guilloche-band.svg", band());
console.log("wrote guilloche-rosette.svg, guilloche-band.svg");
