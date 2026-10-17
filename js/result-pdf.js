/* ─────────────────────────────────────────────────────────────────────
 * result-pdf.js  (ES module, Phase 10)
 * Turns an off-screen result report into a PDF in the student's browser.
 * The report is a container whose children each have the class "rp-block"
 * (a heading block, then one block per question). Each block is drawn with
 * its maths exactly as on screen, then placed on A4 pages without being cut
 * in the middle (a block taller than a page is sliced).
 * The two libraries are loaded from jsDelivr (pinned versions, integrity-checked) only when a student asks for a PDF.
 * ───────────────────────────────────────────────────────────────────── */
const LIBS = [
  { src: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    integrity: "sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H" },
  { src: "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
    integrity: "sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk" }
];
let libsPromise = null;

function loadScript(lib) {
  const src = lib.src;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.integrity = lib.integrity; s.crossOrigin = "anonymous"; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load " + src));
    document.head.appendChild(s);
  });
}
export function loadPdfLibs() {
  if (window.html2canvas && window.jspdf) return Promise.resolve();
  if (!libsPromise) {
    libsPromise = Promise.all(LIBS.map(loadScript)).catch((e) => { libsPromise = null; throw e; });
  }
  return libsPromise;
}

/* Waits for MathJax, typesets the report and waits for fonts and pictures. */
async function prepare(root) {
  if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
    try { await window.MathJax.startup.promise; } catch (e) { /* ignore */ }
  }
  if (window.MathJax && window.MathJax.typesetPromise) {
    try { await window.MathJax.typesetPromise([root]); } catch (e) { console.error(e); }
  }
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* ignore */ } }
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(imgs.map((im) => (im.complete ? null : new Promise((res) => { im.onload = res; im.onerror = res; }))));
}

/* html2canvas finds where the text baseline sits by placing a tiny unclassed <img> next to a sample word, in a
 * hidden <div> directly under <body> of the live page. The site-wide rule "img { display: block }" pushes that
 * probe onto its own line, so every line of text was drawn too low inside its box (pills, option rows, tiles).
 * While the PDF is being drawn, this one rule puts only that probe back to a normal inline image. */
function addBaselineFix() {
  const st = document.createElement("style");
  st.id = "rp-baseline-fix";
  st.textContent = 'body > div[style*="hidden"] > img { display: inline !important; max-width: none !important; }';
  document.head.appendChild(st);
  return st;
}

/* root: the report element (already in the page, off-screen). Returns a PDF Blob. */
export async function reportToPdf(root, onStep) {
  await loadPdfLibs();
  await prepare(root);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PAGE_W = 210, PAGE_H = 297, MARGIN = 10;
  const W = PAGE_W - 2 * MARGIN, MAXY = PAGE_H - MARGIN;
  let y = MARGIN;
  const blocks = Array.from(root.querySelectorAll(":scope > .rp-block"));
  const baselineFix = addBaselineFix();
  try {
  for (let i = 0; i < blocks.length; i++) {
    if (onStep) onStep(i + 1, blocks.length);
    const canvas = await window.html2canvas(blocks[i], {
      scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: root.offsetWidth
    });
    const hMm = (canvas.height / canvas.width) * W;
    if (hMm <= MAXY - MARGIN) {
      if (y + hMm > MAXY && y > MARGIN) { pdf.addPage(); y = MARGIN; }
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN, y, W, hMm);
      y += hMm + 3;
    } else {
      /* A very tall block: slice it across pages. */
      const pageHpx = Math.floor(((MAXY - MARGIN) / W) * canvas.width);
      for (let top = 0; top < canvas.height; top += pageHpx) {
        const h = Math.min(pageHpx, canvas.height - top);
        const part = document.createElement("canvas");
        part.width = canvas.width; part.height = h;
        part.getContext("2d").drawImage(canvas, 0, top, canvas.width, h, 0, 0, canvas.width, h);
        if (y > MARGIN) { pdf.addPage(); y = MARGIN; }
        const pm = (h / canvas.width) * W;
        pdf.addImage(part.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN, y, W, pm);
        y += pm + 3;
      }
    }
  }
  } finally { baselineFix.remove(); }
  /* Page numbers */
  const pages = pdf.getNumberOfPages();
  pdf.setFontSize(8);
  pdf.setTextColor(124, 130, 138);
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.text("Page " + p + " of " + pages, PAGE_W / 2, PAGE_H - 4, { align: "center" });
  }
  return pdf.output("blob");
}

/* The summary block at the top of every result PDF (mock and practice share it).
 * opts: { title, subtitle, stats: [{ value, label, tone }], meta: [[label, value], ...], notes: [text, ...] }
 * tone is "correct" or "wrong" (colours the number only). Returns the block element. */
export function reportHead(opts) {
  const mk = (cls, text) => { const d = document.createElement("div"); d.className = cls; if (text != null) d.textContent = text; return d; };
  const head = mk("rp-block rp-head");
  head.append(mk("rp-brand", "Prof. Dr. S. Balaji Science Academy"), mk("rp-title", opts.title), mk("rp-sub", opts.subtitle));
  const stats = mk("rp-stats");
  (opts.stats || []).forEach((st) => {
    const t = mk("rp-stat" + (st.tone ? " rp-" + st.tone : ""));
    t.append(mk("rp-stat-v", st.value), mk("rp-stat-k", st.label));
    stats.append(t);
  });
  head.append(stats);
  const meta = mk("rp-meta");
  (opts.meta || []).forEach((m) => {
    const c = mk("rp-m");
    c.append(mk("rp-m-k", m[0]), mk("rp-m-v", m[1]));
    meta.append(c);
  });
  head.append(meta);
  (opts.notes || []).forEach((n) => head.append(mk("rp-note", n)));
  return head;
}

export function pdfFileName(title) {
  const base = String(title || "mock-test").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "mock-test";
  return "Result-" + base + ".pdf";
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* True when this browser can share a PDF file through its share sheet (most phones). */
export function canShareFiles() {
  try {
    if (!navigator.share || !navigator.canShare) return false;
    const f = new File([new Blob(["x"], { type: "application/pdf" })], "x.pdf", { type: "application/pdf" });
    return navigator.canShare({ files: [f] });
  } catch (e) { return false; }
}

/* Opens the share sheet with the PDF. Resolves false if the student closed it. */
export async function shareBlob(blob, name, title, text) {
  const file = new File([blob], name, { type: "application/pdf" });
  try {
    await navigator.share({ files: [file], title: title, text: text });
    return true;
  } catch (e) {
    if (e && e.name === "AbortError") return false;
    throw e;
  }
}
