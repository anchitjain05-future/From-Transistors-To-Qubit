/**
 * bloch-sphere.js — Bloch Sphere Renderer (Canvas 2D)
 *
 * Renders a 3D Bloch sphere visualization for qubit states using Canvas 2D
 * with an oblique isometric-style projection.
 *
 * From Transistors to Qubits: A Hybrid Learning Framework
 * 25MCCE19 Lab Project
 */

// ============================================================
// 3D → 2D PROJECTION
// ============================================================

/**
 * Simple oblique projection for 3D → 2D.
 * x-axis points right, y-axis points up, z-axis points toward viewer-left.
 * The projection is: screen_x = x + z*cos(angle), screen_y = -y + z*sin(angle)
 *
 * @param {number} x3d
 * @param {number} y3d
 * @param {number} z3d
 * @param {number} cx - Canvas center x
 * @param {number} cy - Canvas center y
 * @param {number} scale - Sphere radius in pixels
 * @returns {{ x: number, y: number }}
 */
function project(x3d, y3d, z3d, cx, cy, scale) {
  const angle = Math.PI / 6; // 30 degrees for oblique projection
  const obliqueFactor = 0.5;
  const x = cx + scale * (x3d + z3d * obliqueFactor * Math.cos(angle));
  const y = cy + scale * (-y3d + z3d * obliqueFactor * Math.sin(angle));
  return { x, y };
}

// ============================================================
// BLOCH SPHERE CLASS
// ============================================================

export class BlochSphere {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this._cssWidth = rect.width;
      this._cssHeight = rect.height;
    } else {
      this._cssWidth = canvas.width;
      this._cssHeight = canvas.height;
    }

    // State vector angles (spherical coordinates)
    this._theta = 0; // polar angle (0 = |0⟩, π = |1⟩)
    this._phi = 0;   // azimuthal angle

    // Initial render
    this.render(0, 0);
  }

  /**
   * Detect current theme from body class
   * @returns {'dark'|'light'}
   */
  _getTheme() {
    return document.body.classList.contains('light-theme') ? 'light' : 'dark';
  }

  /**
   * Get theme colors
   */
  _colors() {
    const isDark = this._getTheme() === 'dark';
    return {
      sphere: isDark ? 'rgba(88, 166, 255, 0.08)' : 'rgba(3, 102, 214, 0.06)',
      sphereBorder: isDark ? 'rgba(88, 166, 255, 0.35)' : 'rgba(3, 102, 214, 0.4)',
      equator: isDark ? 'rgba(88, 166, 255, 0.3)' : 'rgba(3, 102, 214, 0.3)',
      meridian: isDark ? 'rgba(88, 166, 255, 0.15)' : 'rgba(3, 102, 214, 0.2)',
      axisX: '#ff6b6b',
      axisY: '#3fb950',
      axisZ: '#58a6ff',
      axisNeg: isDark ? '#555' : '#aaa',
      arrow: '#f78166',
      arrowHead: '#f78166',
      text: isDark ? '#c9d1d9' : '#24292e',
      textMuted: isDark ? '#8b949e' : '#6a737d',
      grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      bg: isDark ? '#0d1117' : '#f6f8fa',
      projectionLine: isDark ? 'rgba(247,129,102,0.3)' : 'rgba(200,80,50,0.3)',
    };
  }

  /**
   * Render the Bloch sphere for given spherical angles θ, φ.
   * Convention: |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩
   *
   * @param {number} theta - Polar angle (0 = |0⟩ at north pole, π = |1⟩ at south pole)
   * @param {number} phi   - Azimuthal angle (0 = |+⟩ direction)
   */
  render(theta, phi) {
    this._theta = theta;
    this._phi = phi;

    const ctx = this.ctx;
    const W = this._cssWidth;
    const H = this._cssHeight;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38; // sphere radius in pixels
    const col = this._colors();

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, 0, W, H);

    // ---- Draw sphere ----
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = col.sphere;
    ctx.fill();
    ctx.strokeStyle = col.sphereBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ---- Draw equatorial circle (XY plane) ----
    // Project ellipse — for oblique projection, this is an ellipse
    this._drawEllipse(ctx, cx, cy, R, col.equator, 1, false);

    // ---- Draw meridian circles ----
    // XZ plane (vertical circle in center)
    this._drawVerticalCircle(ctx, cx, cy, R, col.meridian);

    // ---- Draw axes ----
    // Z axis (|0⟩ top, |1⟩ bottom)
    const zTop = project(0, 1.15, 0, cx, cy, R);
    const zBot = project(0, -1.15, 0, cx, cy, R);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), zTop, col.axisZ, '|0⟩', col.text, 'center', -14);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), zBot, col.axisNeg, '|1⟩', col.textMuted, 'center', 14);

    // X axis (|+⟩ right, |−⟩ left)
    const xPos = project(1.15, 0, 0, cx, cy, R);
    const xNeg = project(-1.15, 0, 0, cx, cy, R);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), xPos, col.axisX, '|+⟩', col.textMuted, 'left', 0);
    this._drawDashedLine(ctx, project(0, 0, 0, cx, cy, R), xNeg, col.axisNeg);

    // Y axis (|+i⟩ front, |−i⟩ back)
    const yPos = project(0, 0, 1.15, cx, cy, R);
    const yNeg = project(0, 0, -1.15, cx, cy, R);
    this._drawAxis(ctx, project(0, 0, 0, cx, cy, R), yPos, col.axisY, '|+i⟩', col.textMuted, 'left', 0);
    this._drawDashedLine(ctx, project(0, 0, 0, cx, cy, R), yNeg, col.axisNeg);

    // ---- Draw state vector ----
    // Bloch vector: x = sin(θ)cos(φ), y = cos(θ), z = sin(θ)sin(φ)
    // NOTE: Our y-axis in Bloch sphere is z in 3D space
    const bx = Math.sin(theta) * Math.cos(phi);   // Bloch X component
    const bz_bloch = Math.cos(theta);              // Bloch Z component (our "y" in 3D)
    const by = Math.sin(theta) * Math.sin(phi);   // Bloch Y component (our "z" in 3D)

    // Map: 3D(x, y, z) = Bloch(bx, bz_bloch, by)
    const tipPoint = project(bx, bz_bloch, by, cx, cy, R);
    const origin = project(0, 0, 0, cx, cy, R);

    // Draw projection lines to axes
    const xyPlanePoint = project(bx, 0, by, cx, cy, R);
    ctx.beginPath();
    ctx.moveTo(tipPoint.x, tipPoint.y);
    ctx.lineTo(xyPlanePoint.x, xyPlanePoint.y);
    ctx.strokeStyle = col.projectionLine;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw the state vector arrow
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(tipPoint.x, tipPoint.y);
    ctx.strokeStyle = col.arrow;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Arrow head
    this._drawArrowHead(ctx, origin, tipPoint, col.arrowHead);

    // State vector tip dot
    ctx.beginPath();
    ctx.arc(tipPoint.x, tipPoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = col.arrowHead;
    ctx.fill();

    // ---- Labels: show θ, φ values ----
    ctx.font = '11px monospace';
    ctx.fillStyle = col.text;
    ctx.textAlign = 'left';
    const thetaDeg = (theta * 180 / Math.PI).toFixed(1);
    const phiDeg = (phi * 180 / Math.PI).toFixed(1);
    ctx.fillText(`θ = ${thetaDeg}°`, 8, H - 28);
    ctx.fillText(`φ = ${phiDeg}°`, 8, H - 14);

    // State label
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = col.arrow;
    const alpha_re = Math.cos(theta / 2).toFixed(3);
    const beta_re = Math.sin(theta / 2).toFixed(3);
    ctx.fillText(`α=${alpha_re}, β=${beta_re}`, W - 8, H - 14);
  }

  /**
   * Draw the equatorial ellipse (projection of unit circle in XZ plane)
   */
  _drawEllipse(ctx, cx, cy, R, color, lineWidth, dashed) {
    // For oblique projection with factor 0.5 at 30°, the equator projects to an ellipse
    // Sample points on the unit circle in XZ plane (y=0) and project them
    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const angle = (2 * Math.PI * i) / N;
      const x3 = Math.cos(angle);
      const z3 = Math.sin(angle);
      const p = project(x3, 0, z3, cx, cy, R);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw a vertical circle (in XY plane)
   */
  _drawVerticalCircle(ctx, cx, cy, R, color) {
    ctx.beginPath();
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const angle = (2 * Math.PI * i) / N;
      const x3 = Math.cos(angle);
      const y3 = Math.sin(angle);
      const p = project(x3, y3, 0, cx, cy, R);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw an axis line with label
   */
  _drawAxis(ctx, from, to, color, label, textColor, textAlign, textOffsetY) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    if (label) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = textAlign;
      ctx.fillText(label, to.x + (textAlign === 'left' ? 5 : 0), to.y + textOffsetY);
    }
  }

  /**
   * Draw a dashed line
   */
  _drawDashedLine(ctx, from, to, color) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Draw an arrowhead
   */
  _drawArrowHead(ctx, from, to, color) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = 8;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - size * Math.cos(angle - Math.PI / 6),
      to.y - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - size * Math.cos(angle + Math.PI / 6),
      to.y - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  /**
   * Render from Bloch vector components (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  renderFromXYZ(x, y, z) {
    // Convert Bloch vector to angles
    const r = Math.sqrt(x * x + y * y + z * z);
    if (r < 1e-10) {
      this.render(Math.PI / 2, 0); // equator for mixed state
      return;
    }
    const theta = Math.acos(Math.max(-1, Math.min(1, z / r)));
    const phi = Math.atan2(y, x);
    this.render(theta, phi);
  }

  /**
   * Render from qubit state amplitudes α, β (complex numbers as {re, im})
   * @param {{ re: number, im: number }} alpha
   * @param {{ re: number, im: number }} beta
   */
  renderFromState(alpha, beta) {
    // Compute Bloch vector from density matrix elements
    const prob_alpha = alpha.re * alpha.re + alpha.im * alpha.im;
    const prob_beta = beta.re * beta.re + beta.im * beta.im;

    // alpha_star * beta
    const asb_re = alpha.re * beta.re + alpha.im * beta.im;
    const asb_im = alpha.re * beta.im - alpha.im * beta.re;

    const bx = 2 * asb_re;
    const by = 2 * asb_im;
    const bz = prob_alpha - prob_beta;

    this.renderFromXYZ(bx, by, bz);
  }

  /**
   * Animate the sphere rotating to a new state
   * @param {number} targetTheta
   * @param {number} targetPhi
   * @param {number} [duration=500] ms
   */
  animateTo(targetTheta, targetPhi, duration = 500) {
    const startTheta = this._theta;
    const startPhi = this._phi;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

      const theta = startTheta + (targetTheta - startTheta) * eased;
      const phi = startPhi + (targetPhi - startPhi) * eased;
      this.render(theta, phi);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Show the mixed state (Bloch vector at origin, dashed sphere)
   */
  renderMixed() {
    this.render(Math.PI / 2, 0);
    // The render method will show a vector on the equator;
    // for a truly mixed state we'd need to draw the origin dot only
  }
}
