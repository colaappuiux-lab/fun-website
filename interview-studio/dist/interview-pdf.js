'use strict';

const pdfWidth = 595;
const pdfHeight = 842;
const pdfScale = 2.5;
const pdfMargin = 48;
const pdfFonts = '"PingFang TC", "Microsoft JhengHei", "Noto Sans CJK TC", sans-serif';

function makeInterviewPdf(record, summaryLabels, scoreLabel, itemCode) {
  const canvas = document.createElement('canvas');
  canvas.lang = 'zh-Hant';
  canvas.width = Math.ceil(pdfWidth * pdfScale);
  canvas.height = Math.ceil(pdfHeight * pdfScale);
  const context = canvas.getContext('2d', { alpha: false });
  const pages = [];
  const graphemes = new Intl.Segmenter('zh-Hant');
  const textWidth = pdfWidth - pdfMargin * 2;
  context.scale(canvas.width / pdfWidth, canvas.height / pdfHeight);
  context.textBaseline = 'top';
  let y = pdfMargin;

  function text(value, size, color, weight = 400, x = pdfMargin, top = y) {
    context.font = `${weight} ${size}px ${pdfFonts}`;
    context.fillStyle = color;
    context.fillText(value, x, top);
  }

  function rule(top, color = '#e2dbee') {
    context.fillStyle = color;
    context.fillRect(pdfMargin, top, textWidth, 0.8);
  }

  function startPage() {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pdfWidth, pdfHeight);
    text('APP UI／UX　面試工作台', 10, '#59449b', 700, pdfMargin, 26);
    rule(43);
    y = 61;
  }

  function finishPage() {
    rule(pdfHeight - 45);
    context.textAlign = 'right';
    text(`第 ${pages.length + 1} 頁`, 9, '#5d566c', 400, pdfWidth - pdfMargin, pdfHeight - 34);
    context.textAlign = 'left';
    const encoded = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    pages.push(Uint8Array.from(atob(encoded), character => character.charCodeAt(0)));
  }

  function reserve(height) {
    if (y + height <= pdfHeight - 61) return;
    finishPage();
    startPage();
  }

  function paragraph(value, options = {}) {
    const { size = 11, lineHeight = 17, weight = 400, color = '#29253a', gap = 4 } = options;
    const content = String(value ?? '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
    for (const hardLine of content.split('\n')) {
      context.font = `${weight} ${size}px ${pdfFonts}`;
      let line = '';
      for (const { segment } of graphemes.segment(hardLine)) {
        if (line && context.measureText(line + segment).width > textWidth) {
          reserve(lineHeight);
          text(line, size, color, weight);
          y += lineHeight;
          line = '';
        }
        line += segment;
      }
      reserve(lineHeight);
      text(line, size, color, weight);
      y += lineHeight;
    }
    y += gap;
  }

  function section(title) {
    reserve(56);
    y += 6;
    rule(y, '#b6a5df');
    y += 12;
    paragraph(title, { size: 16, lineHeight: 22, weight: 700, color: '#48318e', gap: 7 });
  }

  function detail(label, value) {
    reserve(36);
    paragraph(label, { size: 10, lineHeight: 14, weight: 700, color: '#574284', gap: 2 });
    paragraph(value || '未填寫', { gap: 7 });
  }

  startPage();
  paragraph('面試紀錄', { size: 28, lineHeight: 38, weight: 700, gap: 9 });
  detail('姓名', record.basic.name);
  detail('日期', record.basic.date);
  section('評量項目');
  if (!record.items.length) paragraph('這場面試沒有評量項目。');
  for (const item of record.items) {
    reserve(74);
    paragraph(`${itemCode(item)}　${item.title}`, { size: 13, lineHeight: 19, weight: 700, gap: 4 });
    paragraph(`評分　${scoreLabel(item.score)}`, { color: '#48318e', weight: 700 });
    paragraph(`判斷依據　${item.criteria}`, { color: '#4e485d' });
    detail('具體例子與結果', item.example);
    y += 7;
  }
  section('面試後摘要');
  for (const [key, label] of summaryLabels) detail(label, record.summary[key]);
  section('待追問筆記');
  paragraph(record.notes || '未填寫');
  if (record.legacy?.length) {
    section('舊版欄位');
    for (const { label, value } of record.legacy) detail(label, value);
  }
  finishPage();

  return encodeInterviewPdf(pages, canvas.width, canvas.height);
}

function encodeInterviewPdf(pages, pixelWidth, pixelHeight) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;

  function append(value) {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes);
    length += bytes.length;
  }

  function object(id, body, stream) {
    offsets[id] = length;
    append(`${id} 0 obj\n${body}\n`);
    if (stream) {
      append('stream\n');
      append(stream);
      append('\nendstream\n');
    }
    append('endobj\n');
  }

  append('%PDF-1.4\n');
  append(new Uint8Array([37, 226, 227, 207, 211, 10]));
  object(1, '<< /Type /Catalog /Pages 2 0 R /Lang (zh-Hant) >>');
  const pageIds = pages.map((_, index) => 3 + index * 3);
  object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`);

  pages.forEach((image, index) => {
    const id = pageIds[index];
    const content = `q ${pdfWidth} 0 0 ${pdfHeight} 0 0 cm /PageImage Do Q`;
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /PageImage ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`);
    object(id + 1, `<< /Length ${content.length} >>`, content);
    object(id + 2, `<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>`, image);
  });

  const crossReference = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (const offset of offsets.slice(1)) append(`${String(offset).padStart(10, '0')} 00000 n \n`);
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${crossReference}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

function downloadInterviewPdf(pdf, { name, date }) {
  const cleanName = name.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ').trim();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(pdf);
  link.download = ['面試紀錄', Array.from(cleanName).slice(0, 50).join(''), date].filter(Boolean).join('-') + '.pdf';
  document.body.append(link);
  link.click();
  link.remove();
  const url = link.href;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
