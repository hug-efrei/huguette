/* ═══════════════════════════════════════════════════════════
   HUGUETTE — app.js
   ═══════════════════════════════════════════════════════════ */

// ── Avatar pixel art : Huguette (24×24, données ARGB) ─────
// Chaque entrée est un uint32 0xAARRGGBB (alpha=0 → transparent).
// Sprite dessiné par l'utilisateur, rendu pixel par pixel.

const AVATAR_W = 24;
const AVATAR_H = 24;

const AVATAR_DATA = [
  0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0xff7c848b,0xff808489,0xff7e898d,0xff7d838a,0xff7f8487,0xff7c848b,0xff7e8489,0xff7a8289,0xff7e868d,0xff7a848b,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0xff64727e,0xffc3d0d8,0xffc6d1d9,0xffd2e2e9,0xffd8e3eb,0xffadb6bf,0xffaab4be,0xffabb6be,0xffb1bac3,0xffd5e1eb,0xffd6e2ec,0xff6e7e85,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0xff777f86,0xff758187,0xffc4ced8,0xffc0ccd6,0xffd0e1ea,0xffcee0e7,0xffafb9c3,0xffa7b6bf,0xffa8b6c2,0xffa4b2be,0xffd1e2eb,0xffd5e7ee,0xff78818a,0xff7f848d,0xff788289,0x00000000,0x00000000,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0x00000000,0xff7a8087,0xffbecbd3,0xffbac6d0,0xffc4d0da,0xffd3e5ec,0xffb7c2ca,0xffb6bfc9,0xffb4c4cb,0xffbbcbd1,0xffbcccd2,0xffbeced5,0xffbeced5,0xffd3e4ed,0xffd1e4eb,0xffcee1e9,0xffc4d1d9,0xff79858b,0x00000000,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0xff7b838a,0xffa8b4be,0xffcedeeb,0xffd1e2eb,0xffd2e5ed,0xffb8c4ce,0xffb8c3cb,0xffc7d7de,0xffa5b3bf,0xffbdd0d5,0xffd6e6ed,0xffd1e2eb,0xffd0e1ea,0xffbeced4,0xffcddfe6,0xffd0e1ea,0xffc5d7de,0xffc3d3da,0xff7e868d,0x00000000,0x00000000,
  0x00000000,0x00000000,0xff7c838c,0xffaab6c0,0xffcfe2ea,0xffc3ced6,0xffbecdd6,0xffd3e4ed,0xffd4e3ec,0xffd0e1ea,0xffa2b2be,0xff7b818c,0xffbdcdd4,0xffbdcdd4,0xffbdcdd4,0xffd1e2eb,0xffd2e5ec,0xffbeced5,0xffbacad1,0xffd6e2ec,0xffc4d4db,0xff7a8289,0x00000000,0x00000000,
  0x00000000,0x00000000,0xff7c838c,0xffaab6c2,0xffc5d5dc,0xffbed0d7,0xffbacbd4,0xffbecbd3,0xffd2e3ec,0xffa6b2bc,0xff78818a,0xff6090de,0xffa5b3bf,0xffc2d2d9,0xffbdd0d8,0xffaab6c2,0xffbdd0d7,0xffc8d7e0,0xffc5d3df,0xffa0a9b6,0xffc3d2db,0xffb4c4cb,0xff777e87,0x00000000,
  0x00000000,0x00000000,0xff78818a,0xffc1d0d9,0xffc2cfd7,0xffa5b3bf,0xffa8b4be,0xffcddde3,0xffa5b3bf,0xff77828a,0xff6495e1,0xff88bef5,0xff757d84,0xffaab4be,0xffa7b3bd,0xff768087,0xffa6b0ba,0xffc8d7e0,0xffc1d4dc,0xffa1a9b6,0xffa4acb9,0xffc1d4dc,0xff778389,0x00000000,
  0x00000000,0xff747e85,0xffabb7c3,0xffc1ced6,0xffabb4c1,0xffacb5c3,0xffacb5c2,0xff7d868f,0xff7b848e,0xff5e8fdd,0xff8bc2f5,0xff8cc1f4,0xff618ed8,0xff707e95,0xff76848a,0xff6290de,0xff7a818a,0xffa2b4bf,0xffc9d8e1,0xffc7d3dd,0xff9fa6b5,0xffa6b1b9,0xff7b828b,0x00000000,
  0x00000000,0xff7a8289,0xffa8b7c0,0xffc0cfd8,0xffa9b4c2,0xffa4b4c1,0xffafbdc9,0xff757b86,0xff757e87,0xff6a9bdf,0xff6696de,0xff5f8ddb,0xff5e8fd9,0xff728398,0xff727a87,0xff6393db,0xff77808a,0xffaab8c4,0xffc1d0d9,0xffbfced7,0xffa3abb8,0xff9da8b6,0xff7b828b,0x00000000,
  0x00000000,0xff7a868c,0xffa4b4c1,0xffa6b3c1,0xffabb9c5,0xff1f2849,0xff212a4c,0xff263256,0xff232e4e,0xff252e4f,0xff85bcf5,0xff8fc1f5,0xff8fc5f4,0xff1f2849,0xff272e55,0xff1f2b4d,0xff232c4d,0xff202a48,0xffc2d1da,0xffbbced3,0xffb8cad1,0xffa1adb9,0xff7a818a,0x00000000,
  0x00000000,0xff7b8488,0xffa6b4c0,0xff7d8690,0xff232d4f,0xffacc3dd,0xffd0e0ec,0xffb9c4c8,0xffb3bec2,0xffadcbe4,0xff252e54,0xff88bef3,0xff242e50,0xffb0cbe6,0xffb5c1c5,0xffb8c3c7,0xffa4b4ba,0xffaec4dd,0xff242f4f,0xff212c4c,0xff7f8590,0xffa3b3bf,0xff767d86,0x00000000,
  0x00000000,0xff7d828b,0xff7d858c,0xff6b9fe2,0xff20294a,0xffc1dbec,0xffd0e3f2,0xffa9c7e2,0xff667389,0xffb4cfe9,0xff202447,0xff242d52,0xff232c4d,0xffb4cfe4,0xffb5cfe7,0xff637188,0xffb7d2e7,0xffc5dff0,0xff222b4c,0xff73a8eb,0xff6699e2,0xffa0b1be,0xff7b828b,0x00000000,
  0x00000000,0xff7a818a,0xff7e8491,0xff89bdf2,0xff252f51,0xffb0c9e3,0xffaccae5,0xffb1cce6,0xff607283,0xffb4cee6,0xff212a4b,0xff6c9cde,0xff222b4c,0xffb6d4e7,0xffb3cde5,0xff69768c,0xffb3d0e5,0xffbed6ea,0xff242d4f,0xff5a85ce,0xff91c1f5,0xffa4b4c0,0xff78818a,0x00000000,
  0x00000000,0xff79878d,0xffa7b8c5,0xff5f93e0,0xff202c4e,0xff212c4c,0xffb7cee8,0xffb2cbe5,0xffb2cfe4,0xff202a48,0xff6690db,0xff78adf0,0xff73a1e1,0xff212b4d,0xffaecbe6,0xffb9d4e9,0xffb4d1e6,0xff24284b,0xff212a4f,0xff6293e1,0xff6597e3,0xffa5b5c2,0xff7c838c,0x00000000,
  0x00000000,0xff798089,0xffd5e5ec,0xff7c838c,0xff20294a,0xff70a2ea,0xff242e50,0xff222b4c,0xff222a4f,0xff6597df,0xff8bbff4,0xff8ec0f4,0xff8abef3,0xff5e90dc,0xff232f51,0xff242d4e,0xff222b4d,0xff6da2eb,0xff232c4d,0xff7a838d,0xff7b828b,0xffafc0c9,0xffcad6e0,0xff787e85,
  0x00000000,0xff7d878e,0xffd4e5ee,0xff7c868d,0xff364058,0xff7ea3df,0xff6d9ce0,0xff72a6e9,0xff699fe0,0xff8ac0f7,0xff92bffc,0xff92befd,0xff8dbbfb,0xff6595d5,0xff689de0,0xff70a3e1,0xff6da4e9,0xff89afe9,0xff343952,0xff778089,0xff7a8289,0xffb0c0cc,0xffc4d3dc,0xff757e88,
  0xff7e868d,0xffbfcfd5,0xffd4e6ed,0xffa4b6c1,0xff7c8589,0xff242f4f,0xff4f72a4,0xff6fa2e8,0xff8fc3f2,0xff8bc2f5,0xff8cc0f5,0xff8fc1f5,0xff90c1f3,0xff8abef3,0xff5d8edc,0xff8dbff4,0xff73a8e7,0xff222a4f,0xff7d848d,0xff7b838a,0xff798188,0xffaebeca,0xffc6d5de,0xff79858b,
  0xff7b868a,0xffbbcdd4,0xff9dacb5,0xffbdccd5,0xff7a8289,0xff798188,0xff788294,0xff242d4e,0xff6ea2e9,0xff8bbdf1,0xff91c0f4,0xff8dbff3,0xff8ec0f4,0xff95c4f7,0xff85bef1,0xff72a6ec,0xff222c4e,0xff7d828b,0xff7b858c,0xff7d8487,0xffadb9c5,0xffc1d2db,0xffabb9c5,0xff7a818a,
  0x00000000,0xff777e87,0xffa3b1bd,0xff7e848f,0xffa7b2c0,0xff7c848b,0xff7a8289,0xff7d848d,0xff242a4d,0xff232c4e,0xff6495df,0xff6192de,0xff6192dc,0xff172756,0xff252e53,0xff253056,0xff212b4d,0xff7d838a,0xff7a818a,0xffa8b4c0,0xff798089,0xffa3b3bf,0xff7c828d,0x00000000,
  0x00000000,0x00000000,0xff7c848b,0x00000000,0xff79828c,0xff78818a,0xff7a8293,0xff273055,0xff4a5dc0,0xff2a418d,0xff6690db,0xff6093dc,0xff5f92db,0xff132756,0xff262e53,0xff354a9c,0xff4761bb,0xff242c51,0xff80898d,0xff79838a,0xff7a8289,0xff737c80,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0xff253050,0xff192761,0xff4d63c3,0xff4b61c0,0xff4d66c4,0xff2e3c88,0xff2c3b8a,0xff2d418e,0xff596ec9,0xff4d63c2,0xff4b63c3,0xff4d63c3,0xff5066c5,0xff242d4e,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,0xff232e4e,0xff1b2860,0xff4d65c5,0xff38489b,0xff4e68c6,0xff4f63c2,0xff4f62c3,0xff5162c3,0xff4b5ebf,0xff4960c3,0xff4054ac,0xff4f62c3,0xff5167c7,0xff242e50,0x00000000,0x00000000,0x00000000,0x00000000,0x00000000,
  0x00000000,0x00000000,0x00000000,0x00000000,0xff20294a,0xff4f61c6,0xff4b5db8,0xff3f53aa,0xff495fbf,0xff4c65c5,0xff4d60c3,0xff4f64c7,0xff4c62c2,0xff4f65c5,0xff5065c8,0xff2b3d90,0xff5467c8,0xff4e64c4,0xff4557b0,0xff212a4c,0x00000000,0x00000000,0x00000000,0x00000000,
];

function drawAvatar() {
  const canvas = document.getElementById('avatar-canvas');
  const ctx = canvas.getContext('2d');
  const PX = 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < AVATAR_H; y++) {
    for (let x = 0; x < AVATAR_W; x++) {
      const v = AVATAR_DATA[y * AVATAR_W + x];
      if (((v >>> 24) & 0xff) === 0) continue;
      const b = (v >>> 16) & 0xff;
      const g = (v >>> 8)  & 0xff;
      const r =  v         & 0xff;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * PX, y * PX, PX, PX);
    }
  }
}

// ── Dialogues Huguette ────────────────────────────────────

const DIALOGUES = {
  idle:   "Bonjour ! Quel livre puis-je vous dénicher aujourd'hui ? Tapez un titre ou un auteur.",
  search: "Je fouille mes registres… Un instant, je vous prie.",
  found:  (n) => `Voici ce que j'ai trouvé — ${n} référence${n > 1 ? 's' : ''}. Laquelle vous convient ?`,
  none:   "Toutes mes excuses, je n'ai rien trouvé dans les archives pour cette requête.",
  dl_ok:  (t) => `Très bien ! J'envoie l'ouvrage à la bibliothèque. Il sera disponible sous peu.`,
  dl_err: "Hélas, une erreur est survenue lors de l'acquisition. Réessayez dans un moment.",
  status: "Voici l'état de vos acquisitions en cours.",
};

// Effet machine à écrire (style Pokémon)
let _typeTimer = null;

function setDialogue(text) {
  const el     = document.getElementById('dialogue-text');
  const arrow  = document.getElementById('dialogue-arrow');
  if (_typeTimer) clearInterval(_typeTimer);

  el.textContent = '';
  if (arrow) arrow.style.opacity = '0';

  let i = 0;
  _typeTimer = setInterval(() => {
    if (i >= text.length) {
      clearInterval(_typeTimer);
      _typeTimer = null;
      if (arrow) arrow.style.opacity = '1';
      return;
    }
    el.textContent += text[i++];
  }, 22);
}

// ── Toast ─────────────────────────────────────────────────

let _toastTimer = null;

function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show toast-${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'toast'; }, 3500);
}

// ── Utilitaires ───────────────────────────────────────────

function formatBytes(b) {
  if (!b) return '?';
  if (b < 1024)        return b + ' o';
  if (b < 1024 ** 2)   return (b / 1024).toFixed(0) + ' Ko';
  if (b < 1024 ** 3)   return (b / 1024 ** 2).toFixed(1) + ' Mo';
  return (b / 1024 ** 3).toFixed(2) + ' Go';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function detectFormat(title) {
  const t = title.toLowerCase();
  if (t.includes('epub')) return 'EPUB';
  if (t.includes('pdf'))  return 'PDF';
  if (t.includes('mobi') || t.includes('azw')) return 'MOBI';
  if (t.includes('djvu')) return 'DJVU';
  return 'EBOOK';
}

function seederTag(n) {
  if (n >= 10) return { cls: 'tag-s-high', label: `🌱 ${n} exemplaires` };
  if (n >= 3)  return { cls: 'tag-s-mid',  label: `🌱 ${n} exemplaires` };
  if (n >= 1)  return { cls: 'tag-s-low',  label: `🌱 ${n} exemplaire` };
  return { cls: 'tag-s-low', label: '⚠ aucun semeur' };
}

function bookIcon(n) {
  if (n >= 10) return '📚';
  if (n >= 3)  return '📖';
  return '🔖';
}

function flavorText(result) {
  const { seeders, size } = result;
  const fmt = detectFormat(result.title);
  let quality = '';
  if (size > 50 * 1024 * 1024) quality = 'Édition enrichie, probablement illustrée. ';
  if (size < 500 * 1024 && size > 0) quality = 'Édition légère — idéale pour lecture mobile. ';

  if (seeders >= 20) return quality + 'Ouvrage très demandé en ce moment — acquisition rapide assurée.';
  if (seeders >= 10) return quality + "Bonne circulation, vous recevrez l'exemplaire rapidement.";
  if (seeders >= 5)  return quality + 'Disponibilité correcte. Je vous le recommande.';
  if (seeders >= 2)  return quality + 'Quelques exemplaires disponibles — ne tardez pas trop.';
  if (seeders === 1) return quality + 'Un seul lecteur partage cet exemplaire. Rare et précieux.';
  return quality + "Aucun semeur actif. L'acquisition pourrait prendre du temps, voire échouer.";
}

// ── API ───────────────────────────────────────────────────

async function apiSearch(q) {
  const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || r.statusText); }
  return r.json();
}

async function apiDownload(magnet, title) {
  const r = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ magnet, title }),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || r.statusText); }
  return r.json();
}

async function apiStatus() {
  const r = await fetch('/api/status');
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

async function apiHealth() {
  try { const r = await fetch('/api/health'); return r.ok; } catch { return false; }
}

// ── Render résultats (fiches RP) ──────────────────────────

let _lastResults = [];
let _sortMode    = null;   // null = pas de tri actif
let _sortDir     = 'desc'; // 'desc' | 'asc'

// Comparateurs base (ordre décroissant "naturel")
const SORTERS_DESC = {
  seeders: (a, b) => (b.seeders  || 0) - (a.seeders  || 0),
  size:    (a, b) => (b.size     || 0) - (a.size     || 0),
  title:   (a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }),
  year:    (a, b) => (b.pub_year || 0) - (a.pub_year || 0),
};

function applySortAndRender() {
  let results = [..._lastResults];
  if (_sortMode && SORTERS_DESC[_sortMode]) {
    const cmp = SORTERS_DESC[_sortMode];
    results.sort(_sortDir === 'asc' ? (a, b) => cmp(b, a) : cmp);
  }
  document.getElementById('results-count').textContent =
    `${results.length} RÉFÉRENCE${results.length !== 1 ? 'S' : ''}`;
  renderResults(results);
}

// Cycle tri-état pour un bouton de tri (desc → asc → désactivé)
function cycleSortBtn(btn, allBtns, onSort) {
  const prev = btn.dataset.dir || '';
  // Réinitialise tous les boutons du groupe
  allBtns.forEach((b) => { delete b.dataset.dir; });

  if (prev === '') {
    btn.dataset.dir = 'desc';
  } else if (prev === 'desc') {
    btn.dataset.dir = 'asc';
  }
  // Si prev === 'asc' on ne remet pas dir → désactivé
  onSort(btn.dataset.dir || null);
}

function renderResults(results) {
  const list = document.getElementById('results-grid');
  list.innerHTML = '';

  results.forEach((r) => {
    const fmt    = detectFormat(r.title);
    const seed   = seederTag(r.seeders);
    const flavor = flavorText(r);
    const icon   = bookIcon(r.seeders);

    const yearLabel = r.pub_year ? ` · ${r.pub_year}` : '';

    const fiche = document.createElement('div');
    fiche.className = 'fiche';
    fiche.innerHTML = `
      <div class="fiche-header">
        <span class="fiche-icon">${icon}</span>
        <div>
          <div class="fiche-title">${escapeHtml(r.title)}</div>
          <div class="fiche-sub">${escapeHtml(formatBytes(r.size))}${escapeHtml(yearLabel)}</div>
        </div>
      </div>
      <div class="fiche-flavor">${escapeHtml(flavor)}</div>
      <div class="fiche-footer">
        <div class="fiche-tags">
          <span class="tag tag-format">${fmt}</span>
          <span class="tag tag-seeders ${seed.cls}">${escapeHtml(seed.label)}</span>
          <span class="tag tag-indexer">${escapeHtml(r.indexer)}</span>
        </div>
        <button class="btn-emprunter"
          data-magnet="${escapeHtml(r.magnet)}"
          data-title="${escapeHtml(r.title)}">
          EMPRUNTER
        </button>
      </div>
    `;

    fiche.querySelector('.btn-emprunter').addEventListener('click', onDownloadClick);
    list.appendChild(fiche);
  });
}

// ── Render downloads ──────────────────────────────────────

let _lastTorrents = [];
let _dlSortMode   = null;
let _dlSortDir    = 'desc';

const DL_SORTERS_DESC = {
  date:     (a, b) => (b.added_on || 0) - (a.added_on || 0),
  name:     (a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }),
  progress: (a, b) => (b.progress || 0) - (a.progress || 0),
};

function renderDownloads(torrents) {
  _lastTorrents = torrents;
  let sorted = [...torrents];
  if (_dlSortMode && DL_SORTERS_DESC[_dlSortMode]) {
    const cmp = DL_SORTERS_DESC[_dlSortMode];
    sorted.sort(_dlSortDir === 'asc' ? (a, b) => cmp(b, a) : cmp);
  }

  const list = document.getElementById('dl-list');
  if (!sorted.length) {
    list.innerHTML = '<p class="dl-empty">Aucune acquisition en cours.</p>';
    return;
  }

  list.innerHTML = '';
  sorted.forEach((t) => {
    const pct     = (t.progress * 100).toFixed(0);
    const speed   = t.dlspeed ? formatBytes(t.dlspeed) + '/s' : '—';
    const dateStr = t.added_on
      ? new Date(t.added_on * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—';
    const item = document.createElement('div');
    item.className = 'dl-item';
    item.innerHTML = `
      <div class="dl-item-name">${escapeHtml(t.name)}</div>
      <div class="dl-progress-wrap">
        <div class="dl-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="dl-meta-row">
        <span>${pct}%</span>
        <span>${escapeHtml(speed)}</span>
        <span>${escapeHtml((t.state || '?').toUpperCase())}</span>
        <span>📅 ${escapeHtml(dateStr)}</span>
        <span>⇅ ${t.ratio !== undefined ? t.ratio.toFixed(2) : '—'}</span>
      </div>
    `;
    list.appendChild(item);
  });
}

// ── Handlers ─────────────────────────────────────────────

async function onSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;

  const btn = document.getElementById('search-btn');
  btn.disabled = true;
  setDialogue(DIALOGUES.search);
  document.getElementById('results-area').hidden = true;
  document.getElementById('empty-state').hidden  = true;

  try {
    const data    = await apiSearch(q);
    const results = data.results || [];

    if (!results.length) {
      _lastResults = [];
      setDialogue(DIALOGUES.none);
      document.getElementById('empty-state').hidden = false;
    } else {
      _lastResults = results;
      setDialogue(DIALOGUES.found(results.length));
      applySortAndRender();
      document.getElementById('results-area').hidden = false;
    }
  } catch (err) {
    setDialogue(`Erreur : ${err.message}`);
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function onDownloadClick(e) {
  const btn    = e.currentTarget;
  const magnet = btn.dataset.magnet;
  const title  = btn.dataset.title;

  btn.disabled    = true;
  btn.textContent = '…';

  try {
    const data = await apiDownload(magnet, title);
    if (data.success) {
      setDialogue(DIALOGUES.dl_ok(title));
      showToast('Ouvrage envoyé à la bibliothèque !', 'success');
      btn.textContent = '✓ ACQUIS';
    } else {
      throw new Error('qBittorrent a refusé la requête');
    }
  } catch (err) {
    setDialogue(DIALOGUES.dl_err);
    showToast(`Erreur : ${err.message}`, 'error');
    btn.disabled    = false;
    btn.textContent = 'EMPRUNTER';
  }
}

async function onRefreshDownloads() {
  try {
    const data = await apiStatus();
    renderDownloads(data.torrents || []);
  } catch (err) {
    showToast(`Erreur status : ${err.message}`, 'error');
  }
}

// ── Tabs ──────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach((el) => { el.hidden = true; });
  document.querySelectorAll('.nav-btn').forEach((b)  => { b.classList.remove('active'); });
  document.getElementById(`panel-${name}`).hidden = false;
  document.getElementById(`tab-${name}`).classList.add('active');
}

// ── Health ────────────────────────────────────────────────

async function checkHealth() {
  const dot   = document.getElementById('status-dot');
  const label = document.getElementById('status-label');
  const ok    = await apiHealth();
  dot.className   = ok ? 'status-dot online' : 'status-dot offline';
  label.textContent = ok ? 'EN LIGNE' : 'HORS LIGNE';
}

// ── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  drawAvatar();
  checkHealth();

  document.getElementById('search-btn').addEventListener('click', onSearch);
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onSearch();
  });
  document.getElementById('refresh-btn').addEventListener('click', () => {
    setDialogue(DIALOGUES.status);
    onRefreshDownloads();
  });
  document.getElementById('tab-search').addEventListener('click', () => {
    switchTab('search');
    const msg = _lastResults.length > 0
      ? DIALOGUES.found(_lastResults.length)
      : DIALOGUES.idle;
    setDialogue(msg);
  });

  document.getElementById('tab-downloads').addEventListener('click', () => {
    switchTab('downloads');
    setDialogue(DIALOGUES.status);
    onRefreshDownloads();
  });

  // Tri des résultats de recherche (tri-état par bouton)
  const searchSortBtns = [...document.querySelectorAll('[data-sort]')];
  searchSortBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      cycleSortBtn(btn, searchSortBtns, (dir) => {
        _sortMode = dir ? btn.dataset.sort : null;
        _sortDir  = dir || 'desc';
        if (_lastResults.length) applySortAndRender();
      });
    });
  });

  // Tri des téléchargements (tri-état par bouton)
  const dlBtns = [
    { el: document.getElementById('dl-sort-date'),     mode: 'date' },
    { el: document.getElementById('dl-sort-name'),     mode: 'name' },
    { el: document.getElementById('dl-sort-progress'), mode: 'progress' },
  ];
  const dlEls = dlBtns.map((b) => b.el);
  dlBtns.forEach(({ el, mode }) => {
    el.addEventListener('click', () => {
      cycleSortBtn(el, dlEls, (dir) => {
        _dlSortMode = dir ? mode : null;
        _dlSortDir  = dir || 'desc';
        if (_lastTorrents.length) renderDownloads(_lastTorrents);
      });
    });
  });
});
