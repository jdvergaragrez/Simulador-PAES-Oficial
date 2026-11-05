import { ESTADOS } from '../constants';
import { ResultadoData, fmt, nombreArchivo } from './resultado';

// Helvetica estándar de PDF cubre WinAnsi (acentos y ñ) pero no el signo menos Unicode.
const ascii = (s: string) => s.replace(/−/g, '-');

export async function descargarReportePdf(d: ResultadoData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 18;
  const innerW = W - M * 2;
  const meta = ESTADOS[d.estado];
  let y = M;

  const text = (s: string, x: number, yy: number, opts?: Parameters<typeof doc.text>[3]) => doc.text(ascii(s), x, yy, opts);

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor('#0F172A');
  text('Simulador', M, y + 4);
  doc.setTextColor('#2563EB');
  text('PAES', M + doc.getTextWidth('Simulador '), y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#94A3B8');
  const fecha = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  text(`Reporte de simulación · Admisión 2027 · ${fecha}`, W - M, y + 4, { align: 'right' });
  y += 10;
  doc.setDrawColor('#E8ECF1');
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 12;

  // Carrera y universidad
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor('#0F172A');
  const carreraLines = doc.splitTextToSize(ascii(d.carrera), innerW) as string[];
  doc.text(carreraLines, M, y);
  y += carreraLines.length * 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#64748B');
  const uniLines = doc.splitTextToSize(ascii(d.universidad), innerW) as string[];
  doc.text(uniLines, M, y);
  y += uniLines.length * 5 + 8;

  // Bloque de puntaje
  const blockH = 34;
  doc.setFillColor('#F2F4F7');
  doc.roundedRect(M, y, innerW, blockH, 4, 4, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#94A3B8');
  text('PONDERADO ESTIMADO', M + 8, y + 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor('#0F172A');
  text(fmt(d.puntaje), M + 8, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#94A3B8');
  text('de 1.000', M + 8, y + 30);

  // Estado (pastilla) + delta, a la derecha del bloque
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const pillW = doc.getTextWidth(meta.label) + 10;
  const colX = M + innerW / 2;
  doc.setFillColor(meta.hex.tint);
  doc.roundedRect(colX, y + 6, pillW, 8, 4, 4, 'F');
  doc.setTextColor(meta.hex.ink);
  text(meta.label, colX + pillW / 2, y + 11.4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(meta.hex.ink);
  if (d.corte !== null) {
    const delta = d.puntaje - d.corte;
    text(`${delta >= 0 ? '+' : '-'}${fmt(Math.abs(delta))} pts ${delta >= 0 ? 'sobre' : 'bajo'} el corte`, colX, y + 21);
  }
  doc.setTextColor('#64748B');
  doc.setFontSize(9);
  text(`Corte ${d.anioCortes}: ${d.corte !== null ? fmt(d.corte) : 'sin dato'}`, colX, y + 27);
  if (d.minimo) text(`${d.minimo.label}: ${fmt(d.minimo.valor, 0)}`, colX, y + 31.5);
  y += blockH + 12;

  // Desglose de ponderación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor('#0F172A');
  text('Cómo pondera esta carrera', M, y);
  y += 5;

  // Barra segmentada
  const total = d.factores.reduce((a, f) => a + f.pct, 0) || 100;
  let bx = M;
  d.factores.forEach((f) => {
    const w = (f.pct / total) * innerW;
    doc.setFillColor(f.color);
    doc.rect(bx, y, Math.max(w - 0.6, 0.5), 3, 'F');
    bx += w;
  });
  y += 10;

  // Tabla
  const cols = [M, M + 92, M + 122, W - M];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#94A3B8');
  text('FACTOR', cols[0], y);
  text('PONDERACIÓN', cols[1] + 22, y, { align: 'right' });
  text('TU PUNTAJE', cols[2] + 30, y, { align: 'right' });
  text('APORTE', cols[3], y, { align: 'right' });
  y += 3;
  doc.line(M, y, W - M, y);
  y += 7;

  let sumaAporte = 0;
  doc.setFontSize(10);
  for (const f of d.factores) {
    const aporte = f.puntaje !== null ? (f.puntaje * f.pct) / 100 : null;
    if (aporte !== null) sumaAporte += aporte;
    doc.setFillColor(f.color);
    doc.circle(cols[0] + 1.5, y - 1.3, 1.5, 'F');
    doc.setTextColor('#0F172A');
    text(f.label, cols[0] + 6, y);
    doc.setTextColor('#64748B');
    text(`${f.pct}%`, cols[1] + 22, y, { align: 'right' });
    text(f.puntaje !== null ? fmt(f.puntaje, 0) : 'No simulada', cols[2] + 30, y, { align: 'right' });
    doc.setTextColor('#0F172A');
    text(aporte !== null ? fmt(aporte) : '—', cols[3], y, { align: 'right' });
    y += 4;
    doc.setDrawColor('#F1EFEA');
    doc.line(M, y, W - M, y);
    y += 6;
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#0F172A');
  text('Ponderado', cols[0] + 6, y);
  text(fmt(sumaAporte), cols[3], y, { align: 'right' });
  y += 12;

  // Datos de la carrera
  const datos: [string, string][] = [];
  if (d.codigoDemre) datos.push(['Código DEMRE', d.codigoDemre]);
  if (d.vacantes != null) datos.push(['Vacantes 2027', String(d.vacantes)]);
  if (datos.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    datos.forEach(([k, v], i) => {
      const x = M + i * 60;
      doc.setTextColor('#94A3B8');
      text(k, x, y);
      doc.setTextColor('#0F172A');
      text(v, x, y + 5);
    });
    y += 14;
  }

  // Avisos
  if (d.avisos.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const aviso of d.avisos) {
      const lines = doc.splitTextToSize(ascii(aviso), innerW - 10) as string[];
      const h = lines.length * 4.4 + 5;
      doc.setFillColor('#FEF3C7');
      doc.roundedRect(M, y, innerW, h, 2, 2, 'F');
      doc.setTextColor('#92400E');
      doc.text(lines, M + 5, y + 5.5);
      y += h + 4;
    }
  }

  // Pie
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#94A3B8');
  const pie = doc.splitTextToSize(
    ascii(`Ponderaciones oficiales DEMRE, Admisión 2027. Los puntajes de corte son los de la Admisión ${d.anioCortes}, como referencia. Herramienta orientativa e independiente del DEMRE y de las universidades: verifica siempre en las fuentes oficiales antes de postular. simuladorpaes.vercel.app`),
    innerW
  ) as string[];
  doc.text(pie, M, 297 - M - pie.length * 3.6 + 3.6);

  doc.save(nombreArchivo(d, 'pdf'));
}
