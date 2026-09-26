import { ESTADOS, EstadoCorte } from '../constants';

export interface FactorResultado {
  label: string;
  pct: number;
  puntaje: number | null; // null = no simulable (prueba especial)
  color: string;
}

export interface ResultadoData {
  carrera: string;
  universidad: string;
  puntaje: number;
  corte: number | null;
  anioCortes: number;
  estado: EstadoCorte;
  minimo: { label: string; valor: number } | null;
  factores: FactorResultado[];
  codigoDemre?: string;
  vacantes?: number | null;
  avisos: string[];
}

export const fmt = (n: number, dec = 2) =>
  n.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const deltaTexto = (d: ResultadoData) => {
  if (d.corte === null) return `Sin corte ${d.anioCortes}`;
  const delta = d.puntaje - d.corte;
  return `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))} pts ${delta >= 0 ? 'sobre' : 'bajo'} el corte`;
};

const W = 1080;
const H = 1350;
const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    let last = cut[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
    cut[maxLines - 1] = `${last.trimEnd()}…`;
    return cut;
  }
  return lines;
}

export async function renderResultadoCanvas(d: ResultadoData): Promise<HTMLCanvasElement> {
  try {
    await Promise.all(['400', '600', '700'].map((w) => document.fonts.load(`${w} 40px Inter`)));
  } catch {
    // sin la fuente web se usa la del sistema
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const meta = ESTADOS[d.estado];
  const ringColor = d.estado === 'sindato' ? '#2563EB' : meta.color;

  ctx.fillStyle = '#F4F3F1';
  ctx.fillRect(0, 0, W, H);

  const cx = 60, cy = 60, cw = W - 120, ch = H - 120;
  rrect(ctx, cx, cy, cw, ch, 48);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E7E5E1';
  ctx.lineWidth = 2;
  ctx.stroke();

  const px = cx + 64;
  const innerW = cw - 128;
  ctx.textBaseline = 'alphabetic';

  // Encabezado
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText('Simulador', px, cy + 100);
  const sw = ctx.measureText('Simulador ').width;
  ctx.fillStyle = '#2563EB';
  ctx.fillText('PAES', px + sw, cy + 100);
  ctx.fillStyle = '#94A3B8';
  ctx.font = `600 22px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('ADMISIÓN 2027', cx + cw - 64, cy + 98);
  ctx.textAlign = 'left';

  // Carrera y universidad
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 54px ${FONT}`;
  const carreraLines = wrap(ctx, d.carrera, innerW, 2);
  let y = cy + 190;
  for (const l of carreraLines) {
    ctx.fillText(l, px, y);
    y += 64;
  }
  ctx.fillStyle = '#64748B';
  ctx.font = `400 30px ${FONT}`;
  const uniLines = wrap(ctx, d.universidad, innerW, 2);
  y += 2;
  for (const l of uniLines) {
    ctx.fillText(l, px, y);
    y += 40;
  }

  // Distribución de abajo hacia arriba: pie, leyenda, barra, recuadros y estado tienen alto fijo;
  // el anillo usa el espacio que queda y se achica si la carrera o la sede ocupan dos líneas.
  const footerY = cy + ch - 44;

  // Leyenda: se mide primero para saber cuántas líneas ocupa.
  const legendItems: { f: FactorResultado; ew: number; itemW: number; line: number; x: number }[] = [];
  {
    let lx = px, line = 0;
    for (const f of d.factores) {
      ctx.font = `400 22px ${FONT}`;
      const ew = ctx.measureText(`${f.label} `).width;
      ctx.font = `700 22px ${FONT}`;
      const itemW = 20 + ew + ctx.measureText(`${f.pct}%`).width + 28;
      if (lx + itemW > px + innerW && lx > px) { lx = px; line++; }
      legendItems.push({ f, ew, itemW, line, x: lx });
      lx += itemW;
    }
  }
  const legendLines = (legendItems.at(-1)?.line ?? 0) + 1;
  const legendLastY = footerY - 56;
  const legendFirstY = legendLastY - (legendLines - 1) * 34;
  const barY = legendFirstY - 52;
  const labelY = barY - 18;
  const boxH = 110;
  const boxY = labelY - 52 - boxH;
  const pillY = boxY - 52;

  const ringSpace = pillY - 84 - (y + 40);
  const R = Math.max(120, Math.min(190, Math.floor(ringSpace / 2)));
  const rcx = W / 2;
  const rcy = pillY - 84 - R;
  const k = R / 190;

  // Anillo
  ctx.lineCap = 'round';
  ctx.lineWidth = 40 * k;
  ctx.strokeStyle = '#ECEAE6';
  ctx.beginPath();
  ctx.arc(rcx, rcy, R, 0, Math.PI * 2);
  ctx.stroke();
  const prog = Math.max(0.001, Math.min(1, d.puntaje / 1000));
  ctx.strokeStyle = ringColor;
  ctx.beginPath();
  ctx.arc(rcx, rcy, R, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
  ctx.stroke();
  if (d.corte !== null) {
    const a = -Math.PI / 2 + (d.corte / 1000) * Math.PI * 2;
    const t = 26 * k;
    ctx.lineWidth = 8 * k;
    ctx.strokeStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(rcx + Math.cos(a) * (R - t), rcy + Math.sin(a) * (R - t));
    ctx.lineTo(rcx + Math.cos(a) * (R + t), rcy + Math.sin(a) * (R + t));
    ctx.stroke();
  }

  const [ent, dec] = fmt(d.puntaje).split(',');
  const big = Math.round(120 * k), small = Math.round(60 * k);
  ctx.textAlign = 'left';
  ctx.font = `700 ${big}px ${FONT}`;
  const entW = ctx.measureText(ent).width;
  ctx.font = `700 ${small}px ${FONT}`;
  const decW = ctx.measureText(`,${dec}`).width;
  const startX = rcx - (entW + decW) / 2;
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 ${big}px ${FONT}`;
  ctx.fillText(ent, startX, rcy + 30 * k);
  ctx.fillStyle = '#94A3B8';
  ctx.font = `700 ${small}px ${FONT}`;
  ctx.fillText(`,${dec}`, startX + entW, rcy + 30 * k);
  ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round(26 * Math.max(k, 0.85))}px ${FONT}`;
  ctx.fillText('ponderado de 1.000', rcx, rcy + 78 * k);

  // Estado + delta
  ctx.font = `700 32px ${FONT}`;
  const pillText = meta.label;
  const pillW = ctx.measureText(pillText).width + 64;
  const pillH = 60;
  const delta = deltaTexto(d);
  ctx.font = `600 30px ${FONT}`;
  const deltaW = ctx.measureText(delta).width;
  const rowW = pillW + 24 + deltaW;
  const rx = rcx - rowW / 2;
  rrect(ctx, rx, pillY - pillH / 2 - 10, pillW, pillH, pillH / 2);
  ctx.fillStyle = meta.hex.tint;
  ctx.fill();
  ctx.fillStyle = meta.hex.ink;
  ctx.textAlign = 'center';
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText(pillText, rx + pillW / 2, pillY + 2);
  ctx.textAlign = 'left';
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText(delta, rx + pillW + 24, pillY + 1);

  // Corte y mínimo
  const boxW = (innerW - 24) / 2;
  const boxes: [string, string][] = [
    [`Corte ${d.anioCortes}`, d.corte !== null ? fmt(d.corte) : 'Sin dato'],
    [d.minimo?.label ?? 'Mínimo para postular', d.minimo ? fmt(d.minimo.valor, 0) : '—'],
  ];
  boxes.forEach(([label, value], i) => {
    const bxx = px + i * (boxW + 24);
    rrect(ctx, bxx, boxY, boxW, boxH, 24);
    ctx.fillStyle = '#F4F3F1';
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.font = `400 24px ${FONT}`;
    ctx.fillText(label, bxx + 28, boxY + 42);
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 36px ${FONT}`;
    ctx.fillText(value, bxx + 28, boxY + 86);
  });

  // Barra de ponderación con leyenda
  ctx.fillStyle = '#94A3B8';
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText('CÓMO PONDERA ESTA CARRERA', px, labelY);
  const total = d.factores.reduce((a, f) => a + f.pct, 0) || 100;
  let bx = px;
  const gap = 4;
  d.factores.forEach((f, i) => {
    const w = (f.pct / total) * (innerW - gap * (d.factores.length - 1));
    rrect(ctx, bx, barY, Math.max(w, 6), 16, i === 0 || i === d.factores.length - 1 ? 8 : 2);
    ctx.fillStyle = f.color;
    ctx.fill();
    bx += w + gap;
  });
  for (const it of legendItems) {
    const ly = legendFirstY + it.line * 34;
    ctx.beginPath();
    ctx.arc(it.x + 7, ly - 7, 7, 0, Math.PI * 2);
    ctx.fillStyle = it.f.color;
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.font = `400 22px ${FONT}`;
    ctx.fillText(`${it.f.label} `, it.x + 20, ly);
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(`${it.f.pct}%`, it.x + 20 + it.ew, ly);
  }

  // Pie
  ctx.fillStyle = '#94A3B8';
  ctx.font = `400 24px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`simuladorpaes.vercel.app · Cortes de referencia Admisión ${d.anioCortes}`, W / 2, cy + ch - 44);
  ctx.textAlign = 'left';

  return canvas;
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nombreArchivo(d: ResultadoData, ext: string) {
  const slug = `${d.carrera}-${d.universidad}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    .slice(0, 60);
  return `simulador-paes-${slug}.${ext}`;
}

// Comparte la imagen con navigator.share (WhatsApp, etc.). Si el navegador no puede compartir
// archivos, la descarga. Devuelve cómo terminó para que la UI muestre el aviso adecuado.
export async function compartirResultado(d: ResultadoData): Promise<'compartido' | 'descargado' | 'cancelado'> {
  const canvas = await renderResultadoCanvas(d);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), 'image/png')
  );
  const nombre = nombreArchivo(d, 'png');
  const file = new File([blob], nombre, { type: 'image/png' });
  const texto = `Mi ponderado para ${d.carrera} en ${d.universidad}: ${fmt(d.puntaje)} (${ESTADOS[d.estado].label}). Simulado en simuladorpaes.vercel.app`;

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Mi resultado PAES', text: texto });
      return 'compartido';
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'cancelado';
      // otro error al compartir: caemos a la descarga
    }
  }
  descargar(blob, nombre);
  return 'descargado';
}

export { descargar };
