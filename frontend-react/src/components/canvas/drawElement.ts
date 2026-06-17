import type { CanvasElement } from '../../types';

/** Renders a single canvas element. Pass isEditingText + selectedId to suppress text rendering during inline edit. */
export function drawElement(
  ctx: CanvasRenderingContext2D,
  el: CanvasElement,
  isEditingText = false,
  selectedElementId: string | null = null
): void {
  switch (el.tipo) {
    case 'zona': {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 0.3;
      ctx.fillStyle = el.fillColor || el.color || '#3498db';
      ctx.fillRect(el.x, el.y, el.width || 100, el.height || 60);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = el.color || '#3498db';
      ctx.lineWidth = 2;
      ctx.strokeRect(el.x, el.y, el.width || 100, el.height || 60);
      ctx.restore();
      break;
    }
    case 'linea': {
      if (el.x2 === undefined || el.y2 === undefined) break;
      ctx.save();
      ctx.strokeStyle = el.color || '#ffffff';
      ctx.lineWidth = el.strokeWidth || 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'circulo': {
      const rx = (el.width || 60) / 2;
      const ry = (el.height || 60) / 2;
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 0.3;
      ctx.fillStyle = el.fillColor || el.color || '#3498db';
      ctx.beginPath();
      ctx.ellipse(el.x, el.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = el.color || '#3498db';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'imagen': {
      if (!el.img) break;
      ctx.save();
      ctx.translate(el.x, el.y);
      if (el.rotation) ctx.rotate(el.rotation);
      if (el.flipped) ctx.scale(-1, 1);
      ctx.drawImage(el.img, -(el.width || 0) / 2, -(el.height || 0) / 2, el.width || 0, el.height || 0);
      ctx.restore();
      break;
    }
    case 'jugador': {
      const w = el.width || 40;
      ctx.save();
      ctx.beginPath();
      ctx.arc(el.x, el.y, w / 2, 0, Math.PI * 2);
      ctx.fillStyle = el.color || '#3498db';
      ctx.fill();
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (el.number) {
        ctx.fillStyle = el.textColor || 'white';
        ctx.font = `bold ${w * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.number, el.x, el.y);
      }
      ctx.restore();
      break;
    }
    case 'texto': {
      if (!el.texto) break;
      // Don't render if currently being edited inline
      if (isEditingText && el.id === selectedElementId) break;
      ctx.save();
      ctx.font = `bold ${el.fontSize}px Arial`;
      ctx.fillStyle = el.color || 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.texto, el.x, el.y);
      ctx.restore();
      break;
    }
    case 'flecha': {
      if (el.x2 === undefined || el.y2 === undefined) break;
      const headLength = 15;
      const arrowType = el.arrowType || 'solid';

      let headAngle: number;
      let cpX: number | undefined;
      let cpY: number | undefined;

      if (arrowType === 'curved') {
        const dx = el.x2 - el.x;
        const dy = el.y2 - el.y;
        cpX = el.cpX ?? ((el.x + el.x2) / 2 - dy * 0.3);
        cpY = el.cpY ?? ((el.y + el.y2) / 2 + dx * 0.3);
        headAngle = Math.atan2(el.y2 - cpY, el.x2 - cpX);
      } else {
        headAngle = Math.atan2(el.y2 - el.y, el.x2 - el.x);
      }

      const shortenBy = headLength * 0.7;
      const endX = el.x2 - shortenBy * Math.cos(headAngle);
      const endY = el.y2 - shortenBy * Math.sin(headAngle);

      ctx.save();
      ctx.strokeStyle = el.color || 'yellow';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (arrowType === 'solid') {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else if (arrowType === 'curved') {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.quadraticCurveTo(cpX!, cpY!, endX, endY);
        ctx.stroke();
      } else if (arrowType === 'dashed') {
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (arrowType === 'zigzag') {
        const dx = el.x2 - el.x;
        const dy = el.y2 - el.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const segments = Math.max(4, Math.floor(distance / 20));
        const perpX = (-dy / distance) * 8;
        const perpY = (dx / distance) * 8;
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const baseX = el.x + dx * t;
          const baseY = el.y + dy * t;
          const mult = i % 2 === 0 ? 1 : -1;
          ctx.lineTo(baseX + perpX * mult, baseY + perpY * mult);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.restore();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(
        el.x2 - headLength * Math.cos(headAngle - Math.PI / 6),
        el.y2 - headLength * Math.sin(headAngle - Math.PI / 6)
      );
      ctx.lineTo(
        el.x2 - headLength * Math.cos(headAngle + Math.PI / 6),
        el.y2 - headLength * Math.sin(headAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = el.color || 'yellow';
      ctx.fill();
      break;
    }
  }
}

/** Draws selection handles/overlay for the selected element (call after drawElement). */
export function drawSelectionOverlay(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
  if (el.tipo === 'flecha') {
    ctx.fillStyle = '#e74c3c';

    // Start handle
    ctx.beginPath();
    ctx.arc(el.x, el.y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // End handle
    ctx.beginPath();
    ctx.arc(el.x2 || 0, el.y2 || 0, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Control point for curved arrows
    if (el.arrowType === 'curved') {
      const dx = (el.x2 || 0) - el.x;
      const dy = (el.y2 || 0) - el.y;
      const cpX = el.cpX ?? ((el.x + (el.x2 || 0)) / 2 - dy * 0.3);
      const cpY = el.cpY ?? ((el.y + (el.y2 || 0)) / 2 + dx * 0.3);

      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo((el.x + (el.x2 || 0)) / 2, (el.y + (el.y2 || 0)) / 2);
      ctx.lineTo(cpX, cpY);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(cpX, cpY, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Dashed line indicator
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x2 || 0, el.y2 || 0);
    ctx.stroke();
    ctx.restore();
  } else if (el.tipo === 'imagen') {
    const w = el.width || 40;
    const h = el.height || 40;

    ctx.save();
    ctx.translate(el.x, el.y);
    if (el.rotation) ctx.rotate(el.rotation);

    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Rotation handle
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.arc(0, -h / 2 - 25, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Line to rotation handle
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.7)';
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, -h / 2 - 17);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scale handle
    ctx.fillStyle = '#3498db';
    ctx.fillRect(w / 2 - 8, h / 2 - 8, 12, 12);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(w / 2 - 8, h / 2 - 8, 12, 12);

    ctx.restore();
  } else {
    const w = el.width || (el.tipo === 'texto' ? (el.texto?.length || 0) * (el.fontSize || 20) * 0.6 + 20 : 40);
    const h = el.height || (el.tipo === 'texto' ? (el.fontSize || 20) + 10 : 40);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(el.x - w / 2, el.y - h / 2, w, h);
  }
}
