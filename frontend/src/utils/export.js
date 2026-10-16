import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Renders a DOM node at full size (ignores the on-screen preview scaling) to a canvas.
export async function nodeToCanvas(node, scale = 3) {
  if (document.fonts?.ready) await document.fonts.ready;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none';
  const clone = node.cloneNode(true);
  clone.style.transform = 'none';
  clone.style.margin = '0';
  wrap.appendChild(clone);
  document.body.appendChild(wrap);
  try {
    return await html2canvas(clone, { scale, useCORS: true, backgroundColor: '#ffffff', logging: false });
  } finally {
    wrap.remove();
  }
}

export function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function pdfFromCanvases(canvases, w, h) {
  const o = w > h ? 'l' : 'p';
  const pdf = new jsPDF({ orientation: o, unit: 'px', format: [w, h], hotfixes: ['px_scaling'] });
  canvases.forEach((c, i) => {
    if (i) pdf.addPage([w, h], o);
    pdf.addImage(c.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
  });
  return pdf;
}

export async function saveCanvas(canvas, type, name, w, h) {
  if (type === 'pdf') {
    pdfFromCanvases([canvas], w, h).save(name + '.pdf');
    return;
  }
  const mime = type === 'jpg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise((r) => canvas.toBlob(r, mime, 0.95));
  saveBlob(blob, name + '.' + type);
}
