export type FieldType = 'grass' | 'indoor' | 'beach';
export type ViewMode = 'full' | 'half-left' | 'half-right';

interface FieldPalette {
  dark: string;
  light: string;
  stripe: string;
  line: string;
}

const PALETTES: Record<FieldType, FieldPalette> = {
  grass: {
    dark:   '#1a6610',
    light:  '#207d15',
    stripe: '#26921a',
    line:   'rgba(255,255,255,0.96)',
  },
  indoor: {
    dark:   '#0c4272',
    light:  '#105890',
    stripe: '#1464a0',
    line:   'rgba(255,255,255,0.97)',
  },
  beach: {
    dark:   '#a8762a',
    light:  '#bc8a35',
    stripe: '#cc9c42',
    line:   'rgba(255,255,255,0.92)',
  },
};

/**
 * Draws a football field on a canvas context using pure Canvas 2D API —
 * crisp at any resolution, no PNG required.
 *
 * @param ctx     - 2D rendering context of the canvas
 * @param W       - canvas logical width
 * @param H       - canvas logical height
 * @param fieldType - 'grass' | 'indoor' | 'beach'
 * @param viewMode  - 'full' | 'half-left' | 'half-right'
 */
export function drawFieldCanvas(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  fieldType: FieldType = 'grass',
  viewMode: ViewMode = 'full',
): void {
  const pal = PALETTES[fieldType];

  // ── Background gradient ─────────────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,   pal.dark);
  grad.addColorStop(0.4, pal.light);
  grad.addColorStop(0.6, pal.light);
  grad.addColorStop(1,   pal.dark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── Mowing stripes ──────────────────────────────────────────────────
  const stripeCount = 14;
  const sw = W / stripeCount;
  ctx.globalAlpha = 0.11;
  ctx.fillStyle = pal.stripe;
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillRect(i * sw, 0, sw, H);
  }
  ctx.globalAlpha = 1;

  // ── Layout: field margins & scale ──────────────────────────────────
  // Standard football field: 105 m × 68 m
  const padX = W * 0.048;
  const padY = H * 0.075;
  const fw = W - padX * 2;
  const fh = H - padY * 2;

  // Horizontal range of meters shown
  const mStart = viewMode === 'half-right' ? 52.5 : 0;
  const mEnd   = viewMode === 'half-left'  ? 52.5 : 105;
  const mLen   = mEnd - mStart;

  // Pixels per meter
  const scX = fw / mLen;
  const scY = fh / 68;

  // Field-meters → canvas pixels
  const px = (m: number) => padX + (m - mStart) * scX;
  const py = (m: number) => padY + m * scY;

  // Base line width (scale with canvas size)
  const lw = Math.max(1.5, W / 540);

  ctx.strokeStyle = pal.line;
  ctx.fillStyle   = pal.line;
  ctx.lineWidth   = lw;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  // ── Outer boundary ──────────────────────────────────────────────────
  // Use padX (= px(mStart)) so the rect always starts at the visible left edge,
  // even for half-right where px(0) would be off-canvas.
  ctx.strokeRect(padX, py(0), fw, fh);

  // ── Center features ─────────────────────────────────────────────────
  if (viewMode === 'full') {
    // Center line
    ctx.beginPath();
    ctx.moveTo(px(52.5), py(0));
    ctx.lineTo(px(52.5), py(68));
    ctx.stroke();

    // Center circle (r = 9.15 m)
    ctx.beginPath();
    ctx.arc(px(52.5), py(34), 9.15 * scX, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(px(52.5), py(34), lw * 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // For half-field: show boundary line at the cut + half of center circle
    const cutPx = viewMode === 'half-left' ? px(52.5) : px(52.5);

    // Clip to field area so circle doesn't overflow
    ctx.save();
    ctx.beginPath();
    ctx.rect(padX - 1, padY - 1, fw + 2, fh + 2);
    ctx.clip();

    // Center circle (half visible)
    ctx.beginPath();
    ctx.arc(cutPx, py(34), 9.15 * scX, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Center spot
    ctx.beginPath();
    ctx.arc(cutPx, py(34), lw * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Helper: draw one goal end ───────────────────────────────────────
  // goalXm   : x-position of the goal line in meters (0 or 105)
  // inward   : +1 if penalty area extends towards center from left (left goal)
  //          : -1 if penalty area extends towards center from right (right goal)
  const drawGoalEnd = (goalXm: number, inward: number) => {
    const gPx = px(goalXm);

    // Skip if entirely off canvas
    if (inward === 1 && gPx > W + padX * 2) return;
    if (inward === -1 && gPx < -padX * 2) return;

    // 6-yard box: 5.5 m deep × 18.32 m wide (±9.16 m from centre)
    ctx.strokeRect(
      gPx,
      py(34 - 9.16),
      5.5 * scX * inward,
      18.32 * scY,
    );

    // 18-yard box: 16.5 m deep × 40.32 m wide (±20.16 m from centre)
    ctx.strokeRect(
      gPx,
      py(34 - 20.16),
      16.5 * scX * inward,
      40.32 * scY,
    );

    // Penalty spot (11 m)
    const spotXm = goalXm + 11 * inward;
    ctx.beginPath();
    ctx.arc(px(spotXm), py(34), lw * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Penalty arc — clip to outside the penalty area
    const paEdgeXm = goalXm + 16.5 * inward;
    ctx.save();
    ctx.beginPath();
    if (inward === 1) {
      // Right of penalty area edge
      ctx.rect(px(paEdgeXm), padY - 10, W, fh + 20);
    } else {
      // Left of penalty area edge
      ctx.rect(0, padY - 10, px(paEdgeXm), fh + 20);
    }
    ctx.clip();
    ctx.beginPath();
    ctx.arc(px(spotXm), py(34), 9.15 * scX, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Goal (7.32 m wide, 2.44 m deep — outside the field boundary)
    const goalDepth = 2.44 * scX; // always positive
    const goalY     = py(34 - 3.66);
    const goalH     = 7.32 * scY;
    ctx.lineWidth = lw * 1.6;
    if (inward === 1) {
      // Left goal: extends to the left of x=0
      ctx.strokeRect(px(goalXm) - goalDepth, goalY, goalDepth, goalH);
    } else {
      // Right goal: extends to the right of x=105
      ctx.strokeRect(px(goalXm), goalY, goalDepth, goalH);
    }
    ctx.lineWidth = lw;
  };

  // ── Helper: corner arc ──────────────────────────────────────────────
  const drawCorner = (cornerXm: number, cornerYm: number, startAngle: number) => {
    const cpx = px(cornerXm);
    if (cpx < -30 || cpx > W + 30) return;
    ctx.beginPath();
    ctx.arc(cpx, py(cornerYm), 1 * scX, startAngle, startAngle + Math.PI / 2);
    ctx.stroke();
  };

  // ── Render goal ends & corners per view mode ────────────────────────
  if (viewMode === 'full') {
    drawGoalEnd(0, 1);
    drawGoalEnd(105, -1);
    drawCorner(0,   0,  0);
    drawCorner(105, 0,  Math.PI / 2);
    drawCorner(0,   68, -Math.PI / 2);
    drawCorner(105, 68, Math.PI);
  } else if (viewMode === 'half-left') {
    drawGoalEnd(0, 1);
    drawCorner(0, 0,  0);
    drawCorner(0, 68, -Math.PI / 2);
  } else {
    // half-right
    drawGoalEnd(105, -1);
    drawCorner(105, 0,  Math.PI / 2);
    drawCorner(105, 68, Math.PI);
  }
}
