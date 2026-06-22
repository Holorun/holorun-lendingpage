(function () {
  const CX = 400, CY = 400;
  const R1 = 244, R2 = 308;   // segment inner/outer radius — sides shortened ~20%
  const SEG_OUTER_HALF = 28;  // half-width of the outer (yellow) edge — longer, also widens purple/magenta taper
  const SEG_INNER_HALF = 20;  // tuned so purple/magenta run parallel to the gear's orange/blue sides
  const RL = (R1 + R2) / 2;   // label radius

  const SEGMENTS = [
    { id: 'home',    label: 'Holorun',  center: 0   },
    { id: 'features', label: 'Features', center: 72  },
    { id: 'vision',   label: 'Vision',   center: 144 },
    { id: 'apps',     label: 'Apps',     center: 216 },
    { id: 'devices',  label: 'Devices',  center: 288 },
  ];
  const HALF_WIDTH = 22;

  function polar(angleDeg, r) {
    const rad = (angleDeg - 90) * Math.PI / 180; // unused helper kept simple below
    return rad;
  }

  function pt(angleDeg, r) {
    const rad = angleDeg * Math.PI / 180;
    return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
  }

  // segment shape: flared like a petal — wider at the outer arc, narrower at
  // the inner arc, so the sides tilt slightly instead of running pure-radial
  function sectorPath(aOuter1, aOuter2, aInner1, aInner2, r1, r2) {
    const p0 = pt(aInner1, r1), p1 = pt(aOuter1, r2), p2 = pt(aOuter2, r2), p3 = pt(aInner2, r1);
    return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} A ${r2} ${r2} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r1} ${r1} 0 0 0 ${p0.x} ${p0.y} Z`;
  }

  function arcPath(a1, a2, r) {
    const p1 = pt(a1, r), p2 = pt(a2, r);
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
  }

  // gear shape: ONE circle only — the gasket's own circumference (229) — is
  // the anchor. The whole gear is that one circle, locally extended outward
  // by GEAR_HEIGHT. There is no second independent "green" circle anymore;
  // it's the same 229 as the gasket.
  const GEAR_BASE_RADIUS = 229; // the gasket's own radius — the one circle
  const GEAR_HEIGHT = 60;       // how far the extension reaches outward
  const TOP_ARCH = 3; // how far the top edge bows outward at its middle — keep small
  function spokePath(aOuter1, aOuter2, aInner1, aInner2) {
    const rInner = GEAR_BASE_RADIUS;       // GREEN
    const rOuter = rInner + GEAR_HEIGHT;   // RED — derived from green, not independent
    const p3 = pt(aInner1, rInner), p2 = pt(aInner2, rInner); // start on GREEN
    const p0 = pt(aOuter1, rOuter), p1 = pt(aOuter2, rOuter); // RED, derived outward
    const mid = (aOuter1 + aOuter2) / 2;
    const control = pt(mid, rOuter + TOP_ARCH * 2);
    return `M ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 0 1 ${p2.x} ${p2.y} L ${p1.x} ${p1.y} Q ${control.x} ${control.y} ${p0.x} ${p0.y} L ${p3.x} ${p3.y} Z`;
  }

  const svgNS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) {
    const node = document.createElementNS(svgNS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  // the ring is split into 3 stacked <svg> layers (rim / bezel / segments) —
  // each one tilts independently via CSS, but the coordinate math below is
  // identical either way since every layer shares the same 800x800 viewBox
  const segSvg = document.querySelector('.ring-layer--segments');
  const bezelSvg = document.querySelector('.ring-layer--bezel');
  const segGroup = segSvg.querySelector('.ring-segments');
  const spokeGroup = bezelSvg.querySelector('.ring-spokes');
  const labelGroup = segSvg.querySelector('.ring-labels');
  const defs = segSvg.querySelector('defs');

  // light nav segments + their hidden label-path defs
  SEGMENTS.forEach((seg, i) => {
    const a1 = seg.center - HALF_WIDTH;
    const a2 = seg.center + HALF_WIDTH;
    const aOuter1 = seg.center - SEG_OUTER_HALF, aOuter2 = seg.center + SEG_OUTER_HALF;
    const aInner1 = seg.center - SEG_INNER_HALF, aInner2 = seg.center + SEG_INNER_HALF;

    const path = el('path', {
      d: sectorPath(aOuter1, aOuter2, aInner1, aInner2, R1, R2),
      class: 'ring-segment',
      'data-target': seg.id,
      tabindex: '0',
      role: 'button',
      'aria-label': seg.label,
    });
    segGroup.appendChild(path);

    const pathId = 'labelPath' + i;
    defs.appendChild(el('path', { id: pathId, d: arcPath(a1, a2, RL) }));

    const text = el('text', { class: 'ring-label' });
    const textPath = el('textPath', { href: '#' + pathId, startOffset: '50%' });
    textPath.setAttribute('text-anchor', 'middle');
    textPath.textContent = seg.label;
    text.appendChild(textPath);
    labelGroup.appendChild(text);
  });

  // dark connector spokes fill every gap between adjacent segments — a fully closed ring
  const sorted = [...SEGMENTS].sort((a, b) => a.center - b.center);
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    const next = sorted[(i + 1) % sorted.length];
    const OUTER_BREATH = 7; // gap at the tip (near the segments) — controls red's length only, independent of the dash gap; sides tilt inward more steeply as this grows
    const INNER_BREATH = -2; // small, modest taper — much less flare than before, but not fully parallel; also pulls the two gears a bit closer
    const curEnd = cur.center + HALF_WIDTH;
    let nextStart = next.center - HALF_WIDTH;
    if (nextStart < curEnd) nextStart += 360;
    const aOuter1 = curEnd + OUTER_BREATH, aOuter2 = nextStart - OUTER_BREATH;
    const aInner1 = curEnd + INNER_BREATH, aInner2 = nextStart - INNER_BREATH;
    spokeGroup.appendChild(el('path', {
      d: spokePath(aOuter1, aOuter2, aInner1, aInner2),
      class: 'ring-spoke',
    }));
  }

  // click / keyboard activation
  segGroup.addEventListener('click', (e) => {
    const seg = e.target.closest('.ring-segment');
    if (!seg) return;
    const target = document.getElementById(seg.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  segGroup.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const seg = e.target.closest('.ring-segment');
    if (!seg) return;
    e.preventDefault();
    const target = document.getElementById(seg.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // the rim/bezel/segments layers each drift independently in 3D — handled
  // entirely by continuous CSS animations on .ring-layer--* (see ring.css)
})();
