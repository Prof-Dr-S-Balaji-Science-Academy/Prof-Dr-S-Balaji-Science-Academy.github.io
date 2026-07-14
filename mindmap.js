/* =========================================================
   mindmap.js — Interactive Mind Map Renderer
   Prof. Dr. S. Balaji Science Academy
   ========================================================= */

/* ── State ── */
let currentSubject = null;
let transform = { x: 0, y: 0, scale: 1 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let nodeStates = {}; // id → collapsed/expanded
let nodePositions = {}; // id → {x, y}

/* ── Color palette per level ── */
const LEVEL_COLORS = [
  { bg: '#0d2ad4', text: '#ffffff', border: '#0a1fa8' },           // L0 root
  { bg: '#1e3a8a', text: '#ffffff', border: '#1e40af' },           // L1
  { bg: '#eef2ff', text: '#0d2ad4', border: '#c7d2fe' },           // L2
  { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },           // L3
  { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },           // L4
];

const SUBJECT_COLORS = {
  chemistry:   { accent: '#0d2ad4', light: '#eef2ff', border: '#c7d2fe' },
  biology:     { accent: '#16a34a', light: '#f0fdf4', border: '#bbf7d0' },
  physics:     { accent: '#d97706', light: '#fffbeb', border: '#fde68a' },
  environment: { accent: '#0891b2', light: '#ecfeff', border: '#a5f3fc' },
};

/* ── Layout constants ── */
const NODE_HEIGHT = 38;
const NODE_MIN_W  = 140;
const NODE_MAX_W  = 260;
const H_GAP = 80;   // horizontal gap between levels
const V_GAP = 14;   // vertical gap between siblings

/* ── Subject selector ── */
const SUBJECTS_CONFIG = [
  {
    key: 'cbse-class10-science',
    label: 'CBSE Class 10 Science',
    file: 'assets/mindmap/cbse-class10-science.js',
    emoji: '🔬',
    available: true,
  },
  {
    key: 'cbse-class12-physics',
    label: 'CBSE Class 12 Physics',
    file: 'assets/mindmap/cbse-class12-physics.js',
    emoji: '⚡',
    available: false,
  },
  {
    key: 'cbse-class12-chemistry',
    label: 'CBSE Class 12 Chemistry',
    file: 'assets/mindmap/cbse-class12-chemistry.js',
    emoji: '🧪',
    available: false,
  },
  {
    key: 'tn-class12-physics',
    label: 'State Board Class 12 Physics',
    file: 'assets/mindmap/tn-class12-physics.js',
    emoji: '🌊',
    available: false,
  },
  {
    key: 'tn-class12-chemistry',
    label: 'State Board Class 12 Chemistry',
    file: 'assets/mindmap/tn-class12-chemistry.js',
    emoji: '🧬',
    available: false,
  },
];

/* =========================================================
   Bootstrap
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  setupHero();
  setupMobileMenu();
});

function setupMobileMenu() {
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('navMobile');
  const cls = document.getElementById('closeMenu');
  if (ham && nav) ham.addEventListener('click', () => nav.classList.add('active'));
  if (cls && nav) cls.addEventListener('click', () => nav.classList.remove('active'));
  document.querySelectorAll('.nav-link-mobile').forEach(l =>
    l.addEventListener('click', () => nav && nav.classList.remove('active'))
  );
}

function setupHero() {
  const btn = document.getElementById('viewMindMapBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const picker = document.getElementById('subjectPicker');
      if (picker) {
        picker.scrollIntoView({ behavior: 'smooth', block: 'start' });
        picker.classList.add('highlight-pulse');
        setTimeout(() => picker.classList.remove('highlight-pulse'), 1200);
      }
    });
  }
}

/* =========================================================
   Subject Picker (rendered from JS for maintainability)
   ========================================================= */
function renderSubjectPicker() {
  const container = document.getElementById('subjectPickerCards');
  if (!container) return;
  container.innerHTML = '';

  SUBJECTS_CONFIG.forEach(s => {
    const card = document.createElement('button');
    card.className = 'subject-card' + (s.available ? '' : ' subject-card--soon');
    card.setAttribute('data-key', s.key);
    card.innerHTML = `
      <span class="subject-card__emoji">${s.emoji}</span>
      <span class="subject-card__label">${s.label}</span>
      ${s.available ? '' : '<span class="subject-card__badge">Coming Soon</span>'}
    `;
    if (s.available) {
      card.addEventListener('click', () => loadSubject(s));
    }
    container.appendChild(card);
  });
}

/* =========================================================
   Load Subject Data
   ========================================================= */
function loadSubject(subjectConfig) {
  // Highlight active card
  document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
  const activeCard = document.querySelector(`[data-key="${subjectConfig.key}"]`);
  if (activeCard) activeCard.classList.add('active');

  if (!subjectConfig.available) return;

  const mapSection = document.getElementById('mindMapSection');
  if (mapSection) {
    mapSection.style.display = 'block';
    mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Show loading
  showMapLoader(subjectConfig.label);

  if (window.MINDMAP_DATA && currentSubject === subjectConfig.key) {
    initMindMap(window.MINDMAP_DATA, subjectConfig.label);
    return;
  }

  currentSubject = subjectConfig.key;
  // Reset MINDMAP_DATA from prior load
  window.MINDMAP_DATA = null;

  const script = document.createElement('script');
  script.src = subjectConfig.file;
  script.onload = () => {
    if (window.MINDMAP_DATA) {
      initMindMap(window.MINDMAP_DATA, subjectConfig.label);
    }
  };
  script.onerror = () => {
    showMapError('Could not load mind map data. Please try again.');
  };
  document.head.appendChild(script);
}

function showMapLoader(label) {
  const canvas = document.getElementById('mindMapCanvas');
  if (!canvas) return;
  canvas.innerHTML = `
    <div class="mm-loader">
      <div class="mm-loader__ring"></div>
      <p>Loading <strong>${label}</strong> Mind Map…</p>
    </div>`;
}

function showMapError(msg) {
  const canvas = document.getElementById('mindMapCanvas');
  if (!canvas) return;
  canvas.innerHTML = `<div class="mm-error">${msg}</div>`;
}

/* =========================================================
   Mind Map Init
   ========================================================= */
function initMindMap(data, label) {
  nodeStates = {};
  nodePositions = {};
  transform = { x: 0, y: 0, scale: 1 };

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    renderMobileTree(data, label);
  } else {
    renderDesktopCanvas(data, label);
  }
}

/* =========================================================
   DESKTOP: SVG Canvas with pan/zoom
   ========================================================= */
function renderDesktopCanvas(data, label) {
  const canvas = document.getElementById('mindMapCanvas');
  canvas.innerHTML = '';
  canvas.className = 'mm-canvas mm-canvas--desktop';

  // Controls
  const controls = document.createElement('div');
  controls.className = 'mm-controls';
  controls.innerHTML = `
    <button class="mm-ctrl-btn" id="mmZoomIn" title="Zoom In">＋</button>
    <button class="mm-ctrl-btn" id="mmZoomOut" title="Zoom Out">－</button>
    <button class="mm-ctrl-btn" id="mmReset" title="Reset View">⟳</button>
    <button class="mm-ctrl-btn" id="mmExpandAll" title="Expand All">⊞</button>
    <button class="mm-ctrl-btn" id="mmCollapseAll" title="Collapse All">⊟</button>
  `;
  canvas.appendChild(controls);

  const hint = document.createElement('div');
  hint.className = 'mm-hint';
  hint.textContent = 'Drag to pan · Scroll to zoom · Click nodes to expand';
  canvas.appendChild(hint);

  // SVG wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'mm-svg-wrapper';
  canvas.appendChild(wrapper);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'mmSvg');
  wrapper.appendChild(svg);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', 'mmGroup');
  svg.appendChild(g);

  // Build layout
  buildAndRenderSvg(data, svg, g, wrapper);

  // Pan + Zoom
  setupPanZoom(wrapper, svg, g);

  // Control buttons
  document.getElementById('mmZoomIn').addEventListener('click', () => applyZoom(1.2, wrapper, g));
  document.getElementById('mmZoomOut').addEventListener('click', () => applyZoom(0.8, wrapper, g));
  document.getElementById('mmReset').addEventListener('click', () => resetView(svg, g, wrapper, data));
  document.getElementById('mmExpandAll').addEventListener('click', () => {
    setAllNodes(data, false);
    buildAndRenderSvg(data, svg, g, wrapper);
  });
  document.getElementById('mmCollapseAll').addEventListener('click', () => {
    setAllNodes(data, true);
    buildAndRenderSvg(data, svg, g, wrapper);
  });
}

function setAllNodes(node, collapsed, skipRoot = true) {
  if (!skipRoot && node.children && node.children.length) {
    nodeStates[node.id] = collapsed;
  }
  if (node.children) {
    node.children.forEach(c => setAllNodes(c, collapsed, false));
  }
}

/* ── Layout engine ── */
function computeLayout(node, level = 0, x = 0) {
  const w = getNodeWidth(node.label);
  const nodeX = x;

  if (!node.children || !node.children.length || nodeStates[node.id]) {
    // Leaf or collapsed
    nodePositions[node.id] = { x: nodeX, y: 0, w, h: NODE_HEIGHT, level };
    return NODE_HEIGHT;
  }

  let childY = 0;
  const childX = nodeX + w + H_GAP;
  const childHeights = [];

  node.children.forEach(child => {
    const ch = computeLayout(child, level + 1, childX);
    childHeights.push(ch);
    childY += ch + V_GAP;
  });

  childY -= V_GAP;
  const totalH = Math.max(childY, NODE_HEIGHT);

  // Centre this node vertically on its children
  let runY = 0;
  node.children.forEach((child, i) => {
    nodePositions[child.id].y += runY - (totalH - NODE_HEIGHT) / 2;
    runY += childHeights[i] + V_GAP;
  });

  nodePositions[node.id] = { x: nodeX, y: 0, w, h: NODE_HEIGHT, level };
  return totalH;
}

function getNodeWidth(label) {
  // Approximate: ~7.5px per char + padding
  return Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, label.length * 7.5 + 32));
}

function buildAndRenderSvg(data, svg, g, wrapper) {
  nodePositions = {};
  const totalH = computeLayout(data, 0, 60);

  // Shift all y so minimum is 40
  const allY = Object.values(nodePositions).map(p => p.y);
  const minY = Math.min(...allY);
  const shiftY = 40 - minY;
  Object.values(nodePositions).forEach(p => { p.y += shiftY; });

  // Compute canvas size
  const allX = Object.values(nodePositions).map(p => p.x + p.w);
  const maxX = Math.max(...allX) + 80;
  const maxY = Math.max(...Object.values(nodePositions).map(p => p.y + p.h)) + 60;

  svg.setAttribute('width', maxX);
  svg.setAttribute('height', maxY);
  svg.setAttribute('viewBox', `0 0 ${maxX} ${maxY}`);

  // Clear group
  while (g.firstChild) g.removeChild(g.firstChild);

  // Render edges first (so nodes appear on top)
  renderEdges(data, g);
  // Render nodes
  renderNodes(data, g, data, svg, wrapper);

  // Auto-center on first render
  if (transform.x === 0 && transform.y === 0 && transform.scale === 1) {
    const wW = wrapper.clientWidth;
    const wH = wrapper.clientHeight;
    transform.scale = Math.min(1, (wW - 40) / maxX, (wH - 40) / maxY);
    transform.x = (wW - maxX * transform.scale) / 2;
    transform.y = Math.max(20, (wH - maxY * transform.scale) / 2);
    applyTransform(g);
  }
}

function renderEdges(node, g) {
  if (!node.children || nodeStates[node.id]) return;

  const from = nodePositions[node.id];
  if (!from) return;

  node.children.forEach(child => {
    const to = nodePositions[child.id];
    if (!to) return;

    const x1 = from.x + from.w;
    const y1 = from.y + from.h / 2;
    const x2 = to.x;
    const y2 = to.y + to.h / 2;
    const cx = (x1 + x2) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', getLevelColor(to.level).border);
    path.setAttribute('stroke-width', Math.max(1, 2.5 - to.level * 0.4));
    path.setAttribute('stroke-opacity', '0.7');
    path.setAttribute('stroke-linecap', 'round');
    g.appendChild(path);

    renderEdges(child, g);
  });
}

function renderNodes(node, g, rootData, svg, wrapper) {
  const pos = nodePositions[node.id];
  if (!pos) return;

  const color = getLevelColor(pos.level);
  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = nodeStates[node.id];

  // Node group
  const ng = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  ng.setAttribute('class', 'mm-node-g');
  ng.style.cursor = hasChildren ? 'pointer' : 'default';

  // Rect (pill shape)
  const rx = NODE_HEIGHT / 2;
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', pos.x);
  rect.setAttribute('y', pos.y);
  rect.setAttribute('width', pos.w);
  rect.setAttribute('height', pos.h);
  rect.setAttribute('rx', rx);
  rect.setAttribute('ry', rx);
  rect.setAttribute('fill', color.bg);
  rect.setAttribute('stroke', color.border);
  rect.setAttribute('stroke-width', pos.level === 0 ? 2 : 1.5);

  // Drop shadow filter id
  const filterId = `shadow-${node.id.replace(/[^a-z0-9]/gi, '')}`;
  const defs = g.querySelector('defs') || (() => {
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    g.insertBefore(d, g.firstChild);
    return d;
  })();
  if (!document.getElementById(filterId)) {
    defs.innerHTML += `
      <filter id="${filterId}" x="-10%" y="-20%" width="120%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color.border}" flood-opacity="0.18"/>
      </filter>`;
  }
  rect.setAttribute('filter', `url(#${filterId})`);

  ng.appendChild(rect);

  // Label
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', pos.x + (hasChildren ? pos.w / 2 - 8 : pos.w / 2));
  text.setAttribute('y', pos.y + pos.h / 2 + 1);
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', color.text);
  text.setAttribute('font-size', pos.level === 0 ? '13' : '11.5');
  text.setAttribute('font-weight', pos.level <= 1 ? '700' : '600');
  text.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
  text.setAttribute('pointer-events', 'none');
  text.textContent = truncateLabel(node.label, pos.w);
  ng.appendChild(text);

  // Expand/Collapse indicator "›"
  if (hasChildren) {
    const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    indicator.setAttribute('x', pos.x + pos.w - 14);
    indicator.setAttribute('y', pos.y + pos.h / 2 + 1);
    indicator.setAttribute('dominant-baseline', 'middle');
    indicator.setAttribute('text-anchor', 'middle');
    indicator.setAttribute('fill', color.text);
    indicator.setAttribute('font-size', '11');
    indicator.setAttribute('font-weight', '700');
    indicator.setAttribute('pointer-events', 'none');
    indicator.setAttribute('opacity', '0.8');
    indicator.textContent = isCollapsed ? '›' : '‹';
    ng.appendChild(indicator);
  }

  // Click handler
  if (hasChildren) {
    ng.addEventListener('click', () => {
      nodeStates[node.id] = !nodeStates[node.id];
      buildAndRenderSvg(rootData, svg, g, wrapper);
    });

    ng.addEventListener('mouseenter', () => {
      rect.setAttribute('filter', 'brightness(0.93)');
    });
    ng.addEventListener('mouseleave', () => {
      rect.setAttribute('filter', `url(#${filterId})`);
    });
  }

  g.appendChild(ng);

  if (!isCollapsed && node.children) {
    node.children.forEach(child => renderNodes(child, g, rootData, svg, wrapper));
  }
}

function getLevelColor(level) {
  return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
}

function truncateLabel(label, width) {
  const maxChars = Math.floor((width - 32) / 7);
  return label.length > maxChars ? label.substring(0, maxChars - 1) + '…' : label;
}

/* ── Pan & Zoom ── */
function setupPanZoom(wrapper, svg, g) {
  // Mouse drag
  wrapper.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    dragStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    wrapper.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    transform.x = e.clientX - dragStart.x;
    transform.y = e.clientY - dragStart.y;
    applyTransform(g);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    wrapper.style.cursor = 'grab';
  });

  // Wheel zoom
  wrapper.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = wrapper.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(3, Math.max(0.2, transform.scale * factor));

    transform.x = mx - (mx - transform.x) * (newScale / transform.scale);
    transform.y = my - (my - transform.y) * (newScale / transform.scale);
    transform.scale = newScale;
    applyTransform(g);
  }, { passive: false });

  // Touch pinch-zoom
  let lastTouchDist = null;
  let lastTouchMid = null;

  wrapper.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      dragStart = {
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y
      };
    } else if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchMid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
    }
  }, { passive: true });

  wrapper.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      transform.x = e.touches[0].clientX - dragStart.x;
      transform.y = e.touches[0].clientY - dragStart.y;
      applyTransform(g);
    } else if (e.touches.length === 2 && lastTouchDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const mid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      const factor = dist / lastTouchDist;
      const newScale = Math.min(3, Math.max(0.2, transform.scale * factor));
      const rect = wrapper.getBoundingClientRect();
      const mx = mid.x - rect.left;
      const my = mid.y - rect.top;
      transform.x = mx - (mx - transform.x) * (newScale / transform.scale);
      transform.y = my - (my - transform.y) * (newScale / transform.scale);
      transform.scale = newScale;
      lastTouchDist = dist;
      lastTouchMid = mid;
      applyTransform(g);
    }
  }, { passive: false });

  wrapper.addEventListener('touchend', () => {
    isDragging = false;
    lastTouchDist = null;
  });

  wrapper.style.cursor = 'grab';
}

function applyTransform(g) {
  g.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.scale})`);
}

function applyZoom(factor, wrapper, g) {
  const rect = wrapper.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const newScale = Math.min(3, Math.max(0.2, transform.scale * factor));
  transform.x = cx - (cx - transform.x) * (newScale / transform.scale);
  transform.y = cy - (cy - transform.y) * (newScale / transform.scale);
  transform.scale = newScale;
  applyTransform(g);
}

function resetView(svg, g, wrapper, data) {
  transform = { x: 0, y: 0, scale: 1 };
  buildAndRenderSvg(data, svg, g, wrapper);
}

/* =========================================================
   MOBILE: Accordion Tree
   ========================================================= */
function renderMobileTree(data, label) {
  const canvas = document.getElementById('mindMapCanvas');
  canvas.innerHTML = '';
  canvas.className = 'mm-canvas mm-canvas--mobile';

  const title = document.createElement('div');
  title.className = 'mm-mobile-title';
  title.textContent = label;
  canvas.appendChild(title);

  const tree = document.createElement('div');
  tree.className = 'mm-mobile-tree';
  canvas.appendChild(tree);

  renderMobileNode(data, tree, 0, true);
}

function renderMobileNode(node, container, level, isRoot) {
  const hasChildren = node.children && node.children.length > 0;
  const colorInfo = getMobileColor(node, level);

  const item = document.createElement('div');
  item.className = `mm-mob-item mm-mob-level-${level}`;

  const header = document.createElement('div');
  header.className = 'mm-mob-header';
  header.style.setProperty('--accent', colorInfo.accent);
  header.style.setProperty('--bg', colorInfo.bg);
  header.style.setProperty('--text', colorInfo.text);
  header.style.setProperty('--border', colorInfo.border);
  header.style.paddingLeft = `${Math.min(level * 16 + 12, 60)}px`;

  const labelEl = document.createElement('span');
  labelEl.className = 'mm-mob-label';
  labelEl.textContent = node.label;
  header.appendChild(labelEl);

  if (hasChildren) {
    const toggle = document.createElement('span');
    toggle.className = 'mm-mob-toggle';
    toggle.textContent = '›';
    header.appendChild(toggle);

    const childWrap = document.createElement('div');
    childWrap.className = 'mm-mob-children';
    childWrap.style.display = 'none';

    let rendered = false;
    header.addEventListener('click', () => {
      const isOpen = childWrap.style.display !== 'none';
      childWrap.style.display = isOpen ? 'none' : 'block';
      toggle.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';

      if (!rendered) {
        node.children.forEach(child => renderMobileNode(child, childWrap, level + 1, false));
        rendered = true;
      }
    });

    // Auto-expand root
    if (isRoot) {
      childWrap.style.display = 'block';
      toggle.style.transform = 'rotate(90deg)';
      node.children.forEach(child => renderMobileNode(child, childWrap, level + 1, false));
      rendered = true;
    }

    item.appendChild(header);
    item.appendChild(childWrap);
  } else {
    item.appendChild(header);
  }

  container.appendChild(item);
}

function getMobileColor(node, level) {
  // Check if this is a top-level subject node
  const subjectKey = node.id ? node.id.split('-')[0] : '';
  const subjectColor = SUBJECT_COLORS[subjectKey];

  if (level === 0) return { accent: '#0d2ad4', bg: '#0d2ad4', text: '#ffffff', border: '#0a1fa8' };
  if (level === 1 && subjectColor) return { accent: subjectColor.accent, bg: subjectColor.accent, text: '#ffffff', border: subjectColor.accent };
  if (level === 2 && subjectColor) return { accent: subjectColor.accent, bg: subjectColor.light, text: subjectColor.accent, border: subjectColor.border };

  const fallback = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)];
  return { accent: fallback.border, bg: fallback.bg, text: fallback.text, border: fallback.border };
}

/* =========================================================
   Resize handler
   ========================================================= */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.MINDMAP_DATA && currentSubject) {
      const config = SUBJECTS_CONFIG.find(s => s.key === currentSubject);
      if (config) initMindMap(window.MINDMAP_DATA, config.label);
    }
  }, 300);
});

/* =========================================================
   Init picker on page load
   ========================================================= */
window.addEventListener('DOMContentLoaded', renderSubjectPicker);
