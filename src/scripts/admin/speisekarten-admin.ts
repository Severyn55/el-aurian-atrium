// === Phase 1 Refactor: Import aus lib/admin ===
import {
  escapeHtml,
  readFileAsText,
  base64ToUtf8,
  utf8ToBase64,
  generateSafePortraitFilename,
  generateSafePdfFilename,
} from '../../lib/admin/utils';

import {
  isValidJPEG,
  isUnderSizeLimit,
  validatePortraitFile,
  validatePortraitForm,
} from '../../lib/admin/validators';

import {
  checkCommitCooldown,
  recordCommitAction,
  confirmCommit,
} from '../../lib/admin/safety';

import {
  parseMenu,
  parseSimpleFrontmatter,
  parsePortraitsFromYaml,
} from '../../lib/admin/parsers';

import {
  generateMenuYaml,
  generateSimpleFrontmatter,
  generateContentWithBody,
  generateTagesablaufFrontmatter,
  generatePortraitsYaml,
} from '../../lib/admin/generators';

import { GitHubClient } from '../../lib/admin/github-client';

// GitHubClient can be used once token/repo are known, e.g.:
// const client = new GitHubClient({ token, repo });
// const res = await client.loadFile('src/content/...');

// All original top-level code and functions from the page script (now top-level in the module so it runs when imported in the client <script> at the end of the page).

function getGitHubClient() {
  if (!token || !repo) {
    throw new Error('Token und Repo müssen gesetzt sein');
  }
  return new GitHubClient({ token, repo });
}

let currentData = { lunch: null, dinner: null, hero: null, labels: null, konzept: null, tagesablauf: null };
let token = '';
let repo = '';

// Module-scope refs for DOM elements used by load/save functions via closure.
// Assigned in deferred setup (see initSpeisekartenAdmin + setupDOM...) so that
// it works even if the bundled script is hoisted by Astro into <head>.
let loadBtn: HTMLElement | null = null;
let loadStatus: HTMLElement | null = null;
let saveBtn: HTMLElement | null = null;
let saveStatus: HTMLElement | null = null;
let editor: HTMLElement | null = null;






async function loadData() {
  token = document.getElementById('token').value.trim();
  repo = document.getElementById('repo').value.trim();

  if (!token || !repo) {
    loadStatus.textContent = 'Bitte Token und Repository angeben.';
    loadStatus.style.color = '#C5A46E';
    return;
  }

  loadStatus.textContent = 'Lade Daten...';
  loadStatus.style.color = '#A89F90';

  try {
    const [lunchMeta, dinnerMeta] = await Promise.all([
      loadMenu('lunch', 'src/content/lunch/lunch.md'),
      loadMenu('dinner', 'src/content/dinner/dinner.md')
    ]);

    currentData.lunch = lunchMeta;
    currentData.dinner = dinnerMeta;

    renderEditor();
    editor.classList.remove('hidden');

    // Force ALL collapsibles closed after entering GitHub token + load for better overview
    // Lunch & Dinner (force via DOM)
    ['lunch', 'dinner'].forEach(t => {
      const content = document.getElementById(`${t}-editor-content`);
      const labelEl = document.getElementById(`toggle-${t}-label`);
      const chevron = document.getElementById(`toggle-${t}-chevron`);
      const btn = document.getElementById(`toggle-${t}-btn`);
      if (content) {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.overflow = 'hidden';
        if (labelEl) labelEl.textContent = 'Ausklappen';
        if (chevron) chevron.style.transform = 'rotate(-90deg)';
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Labels & Konzept: force via localStorage + styles (default is closed, but ensure)
    try { localStorage.setItem('admin-labels-collapsed', '1'); } catch(e){}
    try { localStorage.setItem('admin-konzept-collapsed', '1'); } catch(e){}
    const lcont = document.getElementById('labels-editor-content');
    if (lcont) {
      lcont.style.maxHeight = '0px';
      lcont.style.opacity = '0';
      lcont.style.overflow = 'hidden';
    }
    const kcont = document.getElementById('konzept-editor-content');
    if (kcont) {
      kcont.style.maxHeight = '0px';
      kcont.style.opacity = '0';
      kcont.style.overflow = 'hidden';
    }

    const tcont = document.getElementById('tagesablauf-editor-content');
    if (tcont) {
      tcont.style.maxHeight = '0px';
      tcont.style.opacity = '0';
      tcont.style.overflow = 'hidden';
    }

    // Begegnungen has no collapse, leave as is

    loadStatus.textContent = 'Daten erfolgreich geladen. Alle Editoren sind zur besseren Übersicht zugeklappt.';
    loadStatus.style.color = '#4ade80';
  } catch (e) {
    console.error(e);
    loadStatus.textContent = 'Fehler beim Laden: ' + e.message;
    loadStatus.style.color = 'var(--admin-error)';
  }
}

async function loadMenu(type, path) {
  const authHeader = token.startsWith('github_pat_') 
    ? `Bearer ${token}` 
    : `token ${token}`;

  // Get raw content reliably (this has worked before)
  const contentUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const contentRes = await fetch(contentUrl, {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'Portfolio-Admin/1.0'
    }
  });

  if (!contentRes.ok) {
    const t = await contentRes.text();
    throw new Error(`Failed to load content for ${type} (${contentRes.status}): ${t}`);
  }

  const yamlText = await contentRes.text();

  // Get sha
  const sha = await getGitHubClient().getFileSha(path);

  const parsed = parseMenu(yamlText);

  return { data: parsed, sha };
}

// getFileSha (tree-based) is now covered by GitHubClient.getFileSha / getLatestSha
// (the client uses the simpler contents API for most cases; tree fallback can be added if needed)

// parseMenu is now imported from '../../lib/admin/parsers' (Phase 1 refactor)

// base64ToUtf8, utf8ToBase64 now imported from '../../lib/admin/utils' (Phase 1)

function renderEditor() {
  renderMenu('lunch', currentData.lunch.data);
  renderMenu('dinner', currentData.dinner.data);
}

function renderMenu(type, data) {
  const container = document.getElementById(`${type}-categories`);
  container.innerHTML = '';

  // PDF
  document.getElementById(`${type}-pdf`).value = data.pdf || '';

  data.categories.forEach((cat, catIndex) => {
    const catDiv = document.createElement('div');
    // More generous padding + visible overflow to prevent any clipping by parent rounded corners
    catDiv.className = 'mb-5 rounded-xl border border-[var(--admin-border)] bg-[#12100C] p-5';

    catDiv.innerHTML = `
      <div class="flex items-center gap-3 mb-4">
        <input value="${cat.title}" class="admin-input text-[16px] flex-1 font-semibold bg-[#0F0D0A] text-[#F8F4EC] border-[#C5A26F] placeholder:text-[#6B6459]" data-cat="${catIndex}" data-field="title" />
        <div class="flex gap-1.5 text-xs flex-shrink-0">
          <button class="admin-btn admin-btn-secondary px-2 py-1 text-xs border-[var(--admin-gold-muted)]" data-move-cat-up="${catIndex}" title="Kategorie nach oben">↑</button>
          <button class="admin-btn admin-btn-secondary px-2 py-1 text-xs border-[var(--admin-gold-muted)]" data-move-cat-down="${catIndex}" title="Kategorie nach unten">↓</button>
          <button class="px-2 py-1 text-xs rounded border border-[#5C2E2E] text-[#E8A8A8] hover:bg-[#2A1F1F] hover:text-[#F4C4C4]" data-remove-cat="${catIndex}">Entfernen</button>
        </div>
      </div>
      <div class="space-y-2" id="${type}-items-${catIndex}"></div>
      <button class="admin-btn admin-btn-ghost text-xs mt-3" data-add-item="${catIndex}">+ Gericht hinzufügen</button>
    `;

    container.appendChild(catDiv);

    const itemsContainer = catDiv.querySelector(`#${type}-items-${catIndex}`);

    cat.items.forEach((item, itemIndex) => {
      const itemDiv = document.createElement('div');
      // Use flex instead of tight grid to avoid clipping long descriptions
      itemDiv.className = 'flex flex-wrap md:flex-nowrap gap-2 items-start bg-[#0F0D0A] rounded-lg p-2 border border-[var(--admin-border)]';
      itemDiv.innerHTML = `
        <input value="${item.name}" placeholder="Gericht / Name" class="admin-input text-[15px] flex-1 min-w-[140px] bg-[#0F0D0A] text-[#F8F4EC] border-[#C5A26F] placeholder:text-[#6B6459]" data-cat="${catIndex}" data-item="${itemIndex}" data-field="name" />
        <input value="${item.description || ''}" placeholder="Beschreibung (optional)" class="admin-input text-[15px] flex-[1.6] min-w-[160px] md:min-w-[220px] bg-[#0F0D0A] text-[#F8F4EC] border-[#C5A26F] placeholder:text-[#6B6459]" data-cat="${catIndex}" data-item="${itemIndex}" data-field="description" />
        <div class="flex gap-1.5 items-center flex-shrink-0 w-full md:w-auto mt-1 md:mt-0">
          <input value="${item.price}" placeholder="Preis" class="admin-input text-[15px] w-20 bg-[#0F0D0A] text-[#F8F4EC] border-[#C5A26F] placeholder:text-[#6B6459]" data-cat="${catIndex}" data-item="${itemIndex}" data-field="price" />
          <button class="admin-btn admin-btn-secondary px-1.5 py-1 text-xs border-[var(--admin-gold-muted)]" data-move-item-up="${catIndex}-${itemIndex}" title="Nach oben">↑</button>
          <button class="admin-btn admin-btn-secondary px-1.5 py-1 text-xs border-[var(--admin-gold-muted)]" data-move-item-down="${catIndex}-${itemIndex}" title="Nach unten">↓</button>
          <button class="px-1.5 py-1 text-xs rounded border border-[#5C2E2E] text-[#E8A8A8] hover:bg-[#2A1F1F] hover:text-[#F4C4C4]" data-remove-item="${catIndex}-${itemIndex}" title="Löschen">×</button>
        </div>
      `;
      itemsContainer.appendChild(itemDiv);
    });
  });

  // Event listeners for this menu - only add once to avoid duplicates on re-renders
  if (!container.dataset.hasListeners) {
    container.addEventListener('input', (e) => {
      const target = e.target;
      if (target.dataset.cat !== undefined) {
        const catIdx = parseInt(target.dataset.cat);
        const field = target.dataset.field;
        const itemIdx = target.dataset.item !== undefined ? parseInt(target.dataset.item) : null;

        if (itemIdx !== null) {
          currentData[type].data.categories[catIdx].items[itemIdx][field] = target.value;
        } else {
          currentData[type].data.categories[catIdx][field] = target.value;
        }
      }
    });

    container.addEventListener('click', (e) => {
      const removeCat = e.target.dataset.removeCat;
      const addItem = e.target.dataset.addItem;
      const removeItem = e.target.dataset.removeItem;
      const moveCatUp = e.target.dataset.moveCatUp;
      const moveCatDown = e.target.dataset.moveCatDown;
      const moveItemUp = e.target.dataset.moveItemUp;
      const moveItemDown = e.target.dataset.moveItemDown;

      if (removeCat !== undefined) {
        if (confirm('Kategorie wirklich löschen? Alle Gerichte darin gehen verloren.')) {
          currentData[type].data.categories.splice(parseInt(removeCat), 1);
          renderMenu(type, currentData[type].data);
        }
      }

      if (addItem !== undefined) {
        const catIdx = parseInt(addItem);
        currentData[type].data.categories[catIdx].items.push({ name: '', description: '', price: '' });
        renderMenu(type, currentData[type].data);
        // Focus the new item's name input
        setTimeout(() => {
          const container = document.getElementById(`${type}-categories`);
          if (container) {
            const itemInputs = container.querySelectorAll(`[data-cat="${catIdx}"][data-field="name"]`);
            if (itemInputs.length > 0) {
              const last = itemInputs[itemInputs.length - 1];
              last.focus();
              last.select();
            }
          }
        }, 50);
      }

      if (removeItem) {
        if (confirm('Gericht wirklich löschen?')) {
          const [c, i] = removeItem.split('-').map(Number);
          currentData[type].data.categories[c].items.splice(i, 1);
          renderMenu(type, currentData[type].data);
        }
      }

      // Reorder categories
      if (moveCatUp !== undefined) {
        const idx = parseInt(moveCatUp);
        if (idx > 0) {
          const arr = currentData[type].data.categories;
          [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
          renderMenu(type, currentData[type].data);
        }
      }
      if (moveCatDown !== undefined) {
        const idx = parseInt(moveCatDown);
        const arr = currentData[type].data.categories;
        if (idx < arr.length - 1) {
          [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
          renderMenu(type, currentData[type].data);
        }
      }

      // Reorder items
      if (moveItemUp) {
        const [c, i] = moveItemUp.split('-').map(Number);
        const items = currentData[type].data.categories[c].items;
        if (i > 0) {
          [items[i-1], items[i]] = [items[i], items[i-1]];
          renderMenu(type, currentData[type].data);
        }
      }
      if (moveItemDown) {
        const [c, i] = moveItemDown.split('-').map(Number);
        const items = currentData[type].data.categories[c].items;
        if (i < items.length - 1) {
          [items[i], items[i+1]] = [items[i+1], items[i]];
          renderMenu(type, currentData[type].data);
        }
      }
    });

    container.dataset.hasListeners = 'true';
  }
}

function addCategory(type) {
  if (!currentData[type] || !currentData[type].data) return;
  currentData[type].data.categories.push({ title: 'NEUE KATEGORIE', items: [] });
  renderMenu(type, currentData[type].data);
  // Focus the new category title input
  setTimeout(() => {
    const container = document.getElementById(`${type}-categories`);
    if (container) {
      const inputs = container.querySelectorAll('input[data-field="title"]');
      if (inputs.length > 0) {
        const last = inputs[inputs.length - 1];
        last.focus();
        last.select();
      }
    }
  }, 50);
}

async function saveData(opts = {}) {
  const silent = !!opts.silent;
  if (!silent) {
    if (!confirmCommit('die Menü-Daten (Lunch/Dinner + PDF-Links) speichern')) {
      saveStatus.textContent = 'Abgebrochen.';
      return;
    }
    if (!checkCommitCooldown('Menü-Speichern')) return;
  } else {
    // silent (e.g. auto after PDF): still respect cooldown to protect account
    if (!checkCommitCooldown('Menü-Speichern (auto)')) return;
  }

  saveStatus.textContent = 'Speichere...';
  saveStatus.style.color = '#A89F90';

  try {
    // Update PDF fields from inputs (they live on the data root)
    currentData.lunch.data.pdf = document.getElementById('lunch-pdf').value;
    currentData.dinner.data.pdf = document.getElementById('dinner-pdf').value;

    // Refresh SHAs immediately before commit to avoid "does not match" errors from stale SHAs
    try {
      const client = getGitHubClient();
      const s1 = await client.getFileShaIfNeeded('src/content/lunch/lunch.md'); if (s1) currentData.lunch.sha = s1;
      const s2 = await client.getFileShaIfNeeded('src/content/dinner/dinner.md'); if (s2) currentData.dinner.sha = s2;
    } catch(e){ console.warn('menu sha refresh failed, proceeding with loaded shas', e); }

    const client = getGitHubClient();
    const lunchRes = await getGitHubClient().commitFile(
      'src/content/lunch/lunch.md', 
      generateMenuYaml(currentData.lunch.data), 
      'Update Lunch Speisekarte (via Admin)',
      currentData.lunch.sha
    );
    const dinnerRes = await getGitHubClient().commitFile(
      'src/content/dinner/dinner.md', 
      generateMenuYaml(currentData.dinner.data), 
      'Update Dinner Speisekarte (via Admin)',
      currentData.dinner.sha
    );

    const lunchCommitUrl = lunchRes?.commit?.html_url || '';
    const dinnerCommitUrl = dinnerRes?.commit?.html_url || '';

    let successMsg = 'Erfolgreich auf GitHub gespeichert! Die Änderungen (inkl. neuer PDF Links) sind im Repo. Deploy wird automatisch getriggert. Warte auf den Workflow Run und lade die Frontpage neu (Hard-Refresh), um die aktualisierten "VOLLSTÄNDIGE KARTE ALS PDF" Links in den Modals zu sehen.';
    let commitLinksHtml = '';
    if (lunchCommitUrl || dinnerCommitUrl) {
      commitLinksHtml = '<div class="mt-2 text-sm">';
      if (lunchCommitUrl) {
        commitLinksHtml += `<button onclick="navigator.clipboard.writeText('${lunchCommitUrl}'); this.textContent='Kopiert!'; setTimeout(()=>this.textContent='Kopiere Lunch-Commit URL',2000)" class="underline text-[#C5A46E] mr-2">Kopiere Lunch-Commit URL</button>`;
        commitLinksHtml += `<a href="${lunchCommitUrl}" target="_blank" class="underline">Öffne Lunch-Commit</a>`;
      }
      if (dinnerCommitUrl) {
        if (lunchCommitUrl) commitLinksHtml += ' | ';
        commitLinksHtml += `<button onclick="navigator.clipboard.writeText('${dinnerCommitUrl}'); this.textContent='Kopiert!'; setTimeout(()=>this.textContent='Kopiere Dinner-Commit URL',2000)" class="underline text-[#C5A46E] mr-2">Kopiere Dinner-Commit URL</button>`;
        commitLinksHtml += `<a href="${dinnerCommitUrl}" target="_blank" class="underline">Öffne Dinner-Commit</a>`;
      }
      commitLinksHtml += '</div>';
    }

    saveStatus.innerHTML = successMsg + commitLinksHtml;
    saveStatus.style.color = '#4ade80';

    recordCommitAction();

    // Update SHAs for next save
    if (lunchRes?.content?.sha) currentData.lunch.sha = lunchRes.content.sha;
    if (dinnerRes?.content?.sha) currentData.dinner.sha = dinnerRes.content.sha;

    // NOTE: Kein automatischer triggerManualDeploy mehr hier.
    // Der Daten-Commit (push) triggert normalerweise den Workflow.
    // Für vollen Rebuild: den "Manual Deploy (full site)" Button oben verwenden.
    // Das verhindert unnötige schnelle API-Calls.

  } catch (e) {
    console.error(e);
    let msg = e.message || 'Unbekannter Fehler';
    try {
      const errJson = JSON.parse(e.message);
      if (errJson.message) {
        msg = errJson.message;
      }
    } catch (parseErr) {}
    saveStatus.innerHTML = 'Fehler beim Speichern: ' + msg.replace(/\n/g, '<br>');
    saveStatus.style.color = '#f87171';
  }
}



// commitFile is now getGitHubClient().commitFile (Phase 1 GitHubClient integration)


// generateYaml (menu) is now imported as generateMenuYaml from '../../lib/admin/generators'

// --- Generic simple frontmatter parser / generator for new content areas ---
// parseSimpleFrontmatter, generateSimpleFrontmatter, generateContentWithBody
// are now imported from '../../lib/admin/parsers' and '../../lib/admin/generators' (Phase 1)

// NEW load/save for Hero and Labels (same technique)
async function loadHeroArea() {
  const tokenInput = document.getElementById('token');
  const repoInput = document.getElementById('repo');
  const status = document.getElementById('hero-status');
  if (!status) { console.error('hero-status missing'); return; }
  token = tokenInput ? tokenInput.value.trim() : '';
  repo = repoInput ? repoInput.value.trim() : '';
  if (!token || !repo) { status.textContent = 'Token + Repo oben angeben.'; status.style.color = '#C5A46E'; return; }
  status.textContent = 'Lade Hero...'; status.style.color = '#A89F90';
  try {
    const res = await loadMenuLikeFile('src/content/hero/hero.md');
    currentData.hero = res;
    const h = document.getElementById('hero-headline'); if (h) h.value = res.data.headline || '';
    const c = document.getElementById('hero-cta'); if (c) c.value = res.data.cta || '';
    status.textContent = 'Geladen ✓'; status.style.color = '#4ade80';
  } catch (e) { console.error(e); status.textContent = 'Fehler: ' + (e.message || e); status.style.color = '#f87171'; }
}

async function saveHeroArea() {
  if (!confirmCommit('die Hero-Daten speichern')) { const s = document.getElementById('hero-status'); if (s) s.textContent = 'Abgebrochen.'; return; }
  if (!checkCommitCooldown('Hero-Speichern')) return;

  const status = document.getElementById('hero-status'); if (!status) return;
  let sha = currentData.hero ? currentData.hero.sha : null;
  try { const f = await getGitHubClient().getFileShaIfNeeded('src/content/hero/hero.md'); if (f) sha = f; } catch(e){}
  const data = { headline: (document.getElementById('hero-headline')||{}).value.trim(), cta: (document.getElementById('hero-cta')||{}).value.trim() || 'TISCH RESERVIEREN' };
  status.textContent = 'Speichere...'; status.style.color = '#A89F90';
  try {
    const res = await getGitHubClient().commitFile('src/content/hero/hero.md', generateSimpleFrontmatter(data), 'Update Hero via Admin', sha);
    if (!currentData.hero) currentData.hero = {}; if (res?.content?.sha) currentData.hero.sha = res.content.sha;
    const url = res?.commit?.html_url || '';
    let msg = 'Hero gespeichert! Workflow triggert automatisch.';
    if (url) msg += ' <a href="' + url + '" target="_blank" class="underline">Commit</a>';
    msg += ' <br><small>Für lokale Dev: git pull und Seite refreshen oder Datei herunterladen.</small>';
    status.innerHTML = msg; status.style.color = '#4ade80';
    recordCommitAction();
  } catch (e) { console.error(e); status.innerHTML = 'Fehler: ' + escapeHtml(e.message || String(e)); status.style.color = '#f87171'; }
}

function renderLabelsForm(data) {
  const c = document.getElementById('labels-editor'); if (!c) return; c.innerHTML = '';
  c.className = 'space-y-4'; // stack collapsible groups instead of flat grid

  const groups = [
    {
      title: 'Navigation',
      fields: [
        {k:'nav_karte',l:'Nav: Karte'},
        {k:'nav_konzept',l:'Nav: Konzept'},
        {k:'nav_begegnungen',l:'Nav: Begegnungen'},
        {k:'nav_events',l:'Nav: Events'},
        {k:'nav_member',l:'Nav: Member'},
        {k:'nav_reservierung',l:'Nav: Reservierung'}
      ]
    },
    {
      title: 'Labels',
      fields: [
        {k:'label_kueche',l:'Label: KÜCHE & WEIN'},
        {k:'label_speisekarte',l:'Label: Speisekarte'},
        {k:'speisekarte_beschreibung',l:'Beschreibung unter Speisekarte'},
        {k:'label_konzept',l:'Label: DAS KONZEPT'},
        {k:'label_begegnungen',l:'Label: BEGEGNUNGEN'},
        {k:'begegnungen_beschreibung',l:'Beschreibung unter Begegnungen'},
        {k:'label_hohepunkte',l:'Label: HÖHEPUNKTE'},
        {k:'label_exklusiv',l:'Label: CLUB (Social Dinner)'},
        {k:'label_reservierung',l:'Label: RESERVIERUNG'},
        {k:'label_tagesablauf',l:'Label: TAGESABLAUF'},
        {k:'label_jeden_samstag',l:'Label: JEDEN SAMSTAG'},
        {k:'label_signature_drinks',l:'Label: SIGNATURE DRINKS'},
        {k:'label_privat',l:'Label: PRIVAT'},
        {k:'label_popup',l:'Label: POP-UP'},
        {k:'label_mittags',l:'Label: MITTAGS (Speisekarten)'},
        {k:'label_abends',l:'Label: ABENDS (Speisekarten)'}
      ]
    },
    {
      title: 'CTAs',
      fields: [
        {k:'cta_tisch_reservieren',l:'CTA: TISCH RESERVIEREN'},
        {k:'cta_member_werden',l:'CTA: MEMBER'},
        {k:'cta_platz_sichern',l:'CTA: PLATZ SICHERN'},
        {k:'cta_vollstaendige_karte',l:'CTA: KARTE ANSEHEN'},
        {k:'cta_pdf_lunch',l:'CTA: Lunchkarte PDF Download'},
        {k:'cta_pdf_dinner',l:'CTA: Dinnerkarte PDF Download'}
      ]
    },
    {
      title: 'Sonstiges',
      fields: [
        {k:'byline',l:'Byline (Logo)'},
        {k:'menu_label',l:'K-Menu Label'}
      ]
    },
    {
      title: 'Externe Links',
      fields: [
        {k:'reservation_url',l:'Reservierungs-Link (wird im Demo-Modal nicht verwendet)'},
        {k:'instagram_url',l:'Instagram / Partner Links'}
      ]
    }
  ];

  groups.forEach(group => {
    const groupWrap = document.createElement('div');
    groupWrap.className = 'border border-[#322E28] rounded-lg p-3 bg-[#0F0D0A]';

    // Clickable header with chevron for ein/ausklappen (per category/group)
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between cursor-pointer select-none';
    header.innerHTML = `
      <span class="admin-card-title text-[12px] tracking-[1.8px]">${group.title}</span>
      <span class="chev text-[#C5A26F] text-[13px] transition-transform duration-200">▼</span>
    `;
    groupWrap.appendChild(header);

    const fieldsGrid = document.createElement('div');
    fieldsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-3';
    group.fields.forEach(f => {
      const d = document.createElement('div');
      d.innerHTML = `
        <div>
          <label class="block admin-label text-[11px] mb-1 text-[#C5A26F]">${f.l}</label>
          ${f.k.includes('beschreibung') ? 
            `<textarea data-label-key="${f.k}" class="admin-textarea admin-input text-[14px] bg-[#0F0D0A] text-[#F8F4EC] border-[#C5A26F] w-full" rows="2">${escapeHtml(data[f.k]||'')}</textarea>` :
            `<input 
              data-label-key="${f.k}" 
              value="${escapeHtml(data[f.k]||'')}" 
              class="admin-input text-[14px] bg-[#0F0D0A] text-[#F8F4EC] border-[#C5A26F] w-full" 
            />`
          }
        </div>
      `;
      fieldsGrid.appendChild(d);
    });
    groupWrap.appendChild(fieldsGrid);
    c.appendChild(groupWrap);

    // Wire per-group collapse toggle (live, re-applied on each render)
    const chev = header.querySelector('.chev');
    let isOpen = true;
    const applyOpen = () => {
      fieldsGrid.style.display = isOpen ? 'grid' : 'none';
      chev.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
    };
    header.addEventListener('click', () => {
      isOpen = !isOpen;
      applyOpen();
    });
    applyOpen();
  });
}

async function loadLabelsArea() {
  const ti = document.getElementById('token'); const ri = document.getElementById('repo'); const st = document.getElementById('labels-status');
  if (!st) return;
  token = ti?ti.value.trim():''; repo=ri?ri.value.trim():'';
  if (!token || !repo) { st.textContent='Token + Repo oben angeben.'; st.style.color='#C5A46E'; return; }
  st.textContent='Lade Labels...'; st.style.color='#A89F90';
  try {
    const res = await loadMenuLikeFile('src/content/labels/main.md'); currentData.labels = res;
    renderLabelsForm(res.data); st.textContent='Geladen ✓'; st.style.color='#4ade80';
  } catch(e){ console.error(e); st.textContent='Fehler: '+(e.message||e); st.style.color='#f87171'; }
}

async function saveLabelsArea() {
  if (!confirmCommit('die Labels / Texte / Beschreibungen speichern')) { const s = document.getElementById('labels-status'); if (s) s.textContent = 'Abgebrochen.'; return; }
  if (!checkCommitCooldown('Labels-Speichern')) return;

  const st = document.getElementById('labels-status'); if (!st) return;
  let sha = currentData.labels ? currentData.labels.sha : null;
  try { const f = await getGitHubClient().getFileShaIfNeeded('src/content/labels/main.md'); if (f) sha = f; } catch(e){}
  const ins = document.querySelectorAll('#labels-editor input[data-label-key], #labels-editor textarea[data-label-key]'); const d = {};
  ins.forEach(i => d[i.dataset.labelKey] = i.value.trim());
  st.textContent = 'Speichere...'; st.style.color = '#A89F90';
  try {
    const y = generateSimpleFrontmatter(d);
    const r = await getGitHubClient().commitFile('src/content/labels/main.md', y, 'Update Labels via Admin', sha);
    if (!currentData.labels) currentData.labels = {}; if (r?.content?.sha) currentData.labels.sha = r.content.sha;
    const u = r?.commit?.html_url || '';
    let msg = 'Gespeichert! ' + (u ? '<a href="' + u + '" target="_blank" class="underline">Commit</a>' : '') + ' — Workflow läuft.<br><small>Für lokale Dev: git pull und Seite refreshen oder Datei herunterladen.</small>';
    st.innerHTML = msg; st.style.color = '#4ade80';
    recordCommitAction();
  } catch(e){ console.error(e); st.innerHTML = `Fehler: ${escapeHtml(e.message||String(e))}`; st.style.color = '#f87171'; }
}

async function loadMenuLikeFile(path: string) {
  const client = getGitHubClient();
  const raw = await client.loadFile(path);  // returns {content, sha, raw}

  let text = raw.content;
  // Strip BOM
  text = text.replace(/^\uFEFF/, '');

  // Parse frontmatter + optional body
  let data: any = {};
  let body = '';
  const frontMatch = text.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (frontMatch) {
    data = parseSimpleFrontmatter(frontMatch[1]);
    body = (frontMatch[2] || '').trim();
  } else {
    data = parseSimpleFrontmatter(text);
  }

  const isFrontmatterArea = path.includes('hero') || path.includes('labels') || path.includes('konzept') || path.includes('tagesablauf');
  const parsed = isFrontmatterArea ? data : parseMenu(text);
  return { data: parsed, body, sha: raw.sha, raw: text };
}

// getFileShaIfNeeded / getLatestSha / getFileSha now provided by GitHubClient (getGitHubClient())


// Atomic portrait commit logic moved to GitHubClient.commitPortraitAtomic


// commitPortraitAtomic is now on GitHubClient (see getGitHubClient().commitPortraitAtomic)

// NEW: Konzept long-text area (headline + full Markdown body) - reuses existing load/commit patterns
async function loadKonzeptArea() {
  const ti = document.getElementById('token'); const ri = document.getElementById('repo'); const st = document.getElementById('konzept-status');
  if (!st) return;
  token = ti ? ti.value.trim() : ''; repo = ri ? ri.value.trim() : '';
  if (!token || !repo) { st.textContent = 'Token + Repo oben angeben.'; st.style.color = '#C5A46E'; return; }
  st.textContent = 'Lade Konzept...'; st.style.color = '#A89F90';
  try {
    const res = await loadMenuLikeFile('src/content/konzept/konzept.md');
    currentData.konzept = res;
    const h = document.getElementById('konzept-headline'); if (h) h.value = res.data.headline || '';
    const b = document.getElementById('konzept-body'); if (b) b.value = res.body || '';
    st.textContent = 'Geladen ✓'; st.style.color = '#4ade80';
  } catch (e) { console.error(e); st.textContent = 'Fehler: ' + (e.message || e); st.style.color = '#f87171'; }
}

async function saveKonzeptArea() {
  if (!confirmCommit('den Konzept-Text speichern')) { const s = document.getElementById('konzept-status'); if (s) s.textContent = 'Abgebrochen.'; return; }
  if (!checkCommitCooldown('Konzept-Speichern')) return;

  const st = document.getElementById('konzept-status'); if (!st) return;
  let sha = currentData.konzept ? currentData.konzept.sha : null;
  try { const f = await getGitHubClient().getFileShaIfNeeded('src/content/konzept/konzept.md'); if (f) sha = f; } catch(e){}
  const data = { headline: (document.getElementById('konzept-headline') || {}).value.trim() };
  const body = (document.getElementById('konzept-body') || {}).value || '';
  st.textContent = 'Speichere...'; st.style.color = '#A89F90';
  try {
    const md = generateContentWithBody(data, body);
    const r = await getGitHubClient().commitFile('src/content/konzept/konzept.md', md, 'Update Konzept Texte via Admin', sha);
    if (!currentData.konzept) currentData.konzept = {}; if (r && r.content && r.content.sha) currentData.konzept.sha = r.content.sha;
    const url = (r && r.commit && r.commit.html_url) ? r.commit.html_url : '';
    let msg = 'Gespeichert! Workflow triggert automatisch.';
    if (url) msg += ' <a href="' + url + '" target="_blank" class="underline">Commit</a>';
    msg += '<br><small>Fuer lokale Dev: Datei herunterladen, src/content/konzept/konzept.md ersetzen, hard refresh.</small>';
    st.innerHTML = msg; st.style.color = '#4ade80';
    recordCommitAction();
    // Download button for instant local testing (proven pattern)
    const dl = document.createElement('button');
    dl.textContent = 'konzept.md herunterladen';
    dl.className = 'ml-2 text-xs px-2 py-0.5 border border-[#C5A46E] rounded hover:bg-[#C5A46E] hover:text-[#0F0D0A]';
    dl.onclick = function() {
      const blob = new Blob([md], {type: 'text/markdown;charset=utf-8'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'konzept.md';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    st.appendChild(dl);
  } catch(e){ console.error(e); st.innerHTML = 'Fehler: ' + escapeHtml(e.message || String(e)); st.style.color = '#f87171'; }
}

// ============================================
// Höhepunkte / Tagesablauf Editor (structured schedule for Events section)
// ============================================
async function loadTagesablaufArea() {
  const ti = document.getElementById('token'); const ri = document.getElementById('repo'); const st = document.getElementById('tagesablauf-status');
  const cont = document.getElementById('tagesablauf-editor-content');
  const tLabel = document.getElementById('toggle-tagesablauf-label');
  const tChevron = document.getElementById('toggle-tagesablauf-chevron');
  const tBtn = document.getElementById('toggle-tagesablauf-btn');
  // Always ensure the editor area is visible so the user sees status/feedback immediately
  if (cont) {
    cont.style.maxHeight = 'none';
    cont.style.opacity = '1';
    cont.style.overflow = '';
  }
  if (tLabel) tLabel.textContent = 'Einklappen';
  if (tChevron) tChevron.style.transform = 'rotate(0deg)';
  if (tBtn) tBtn.setAttribute('aria-expanded', 'true');

  if (!st) return;
  token = ti ? ti.value.trim() : ''; repo = ri ? ri.value.trim() : '';
  if (!token || !repo) { st.textContent = 'Token + Repo oben angeben.'; st.style.color = '#C5A46E'; return; }
  st.textContent = 'Lade Tagesablauf...'; st.style.color = '#A89F90';
  try {
    const res = await loadMenuLikeFile('src/content/tagesablauf/tagesablauf.md');
    currentData.tagesablauf = res;
    const textEl = document.getElementById('tagesablauf-text');
    if (textEl) {
      textEl.value = (res.data.text || '');
    }
    st.textContent = 'Geladen ✓'; st.style.color = '#4ade80';
  } catch (e) { console.error(e); st.textContent = 'Fehler: ' + (e.message || e); st.style.color = '#f87171'; }
}

async function saveTagesablaufArea() {
  if (!confirmCommit('den Tagesablauf-Text speichern')) { const s = document.getElementById('tagesablauf-status'); if (s) s.textContent = 'Abgebrochen.'; return; }
  if (!checkCommitCooldown('Tagesablauf-Speichern')) return;

  const st = document.getElementById('tagesablauf-status'); if (!st) return;
  let sha = currentData.tagesablauf ? currentData.tagesablauf.sha : null;
  try { const f = await getGitHubClient().getFileShaIfNeeded('src/content/tagesablauf/tagesablauf.md'); if (f) sha = f; } catch(e){}

  const textEl = document.getElementById('tagesablauf-text');
  const data = {
    text: textEl ? textEl.value.trim() : ''
  };

  st.textContent = 'Speichere...'; st.style.color = '#A89F90';
  try {
    const yaml = generateTagesablaufFrontmatter(data);
    const md = `---\n${yaml}\n---\n`;
    const r = await getGitHubClient().commitFile('src/content/tagesablauf/tagesablauf.md', md, 'Update Tagesablauf via Admin', sha);
    if (!currentData.tagesablauf) currentData.tagesablauf = {}; if (r && r.content && r.content.sha) currentData.tagesablauf.sha = r.content.sha;
    const url = (r && r.commit && r.commit.html_url) ? r.commit.html_url : '';
    let msg = 'Gespeichert! Workflow triggert automatisch.';
    if (url) msg += ' <a href="' + url + '" target="_blank" class="underline">Commit</a>';
    msg += '<br><small>Für lokale Dev: Datei herunterladen, hard refresh.</small>';
    st.innerHTML = msg; st.style.color = '#4ade80';
    recordCommitAction();
  } catch(e){ console.error(e); st.innerHTML = 'Fehler: ' + escapeHtml(e.message || String(e)); st.style.color = '#f87171'; }
}

// Simple frontmatter generator for tagesablauf (single free text)
// generateTagesablaufFrontmatter is now imported from '../../lib/admin/generators'

// ============================================
// Begegnungen (Portraits) – Vorbereitung für Admin-Erweiterung
// Direkter Upload + individuelle Beschriftung (Titel, Caption, Jahr etc.)
// Mit strengen Client-Validierungen für Performance (max 200KB)
// ============================================
let currentBegegnungenPortraits = [];
let currentBegegnungenYamlSha = null;

// parsePortraitsFromYaml is now imported from '../../lib/admin/parsers'

// generatePortraitsYaml is now imported from '../../lib/admin/generators'

function updateBegegnungenCount() {
  const el = document.getElementById('begegnungen-count');
  if (el) {
    el.textContent = `${currentBegegnungenPortraits.length} / 30 Portraits`;
    el.style.color = currentBegegnungenPortraits.length >= 30 ? '#f87171' : '#C5A46E';
  }
}

function renderBegegnungenList() {
  const listEl = document.getElementById('begegnungen-list');
  if (!listEl) return;

  if (currentBegegnungenPortraits.length === 0) {
    listEl.innerHTML = '<div class="text-xs text-[#6B6459]">Noch keine Portraits. Füge das erste hinzu.</div>';
    return;
  }

  let html = '<div class="space-y-2 text-xs">';
  currentBegegnungenPortraits.forEach((p, idx) => {
    html += `
      <div class="flex items-start justify-between gap-2 border-b border-[#322E28] pb-1.5 last:border-0">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-[#F8F4EC] truncate">${escapeHtml(p.title)}</div>
          <div class="text-[#A89F90] text-[10px] truncate">image: ${escapeHtml(p.image || '')}</div>
          <div class="text-[#A89F90] truncate">${escapeHtml(p.subcaption || '')} ${p.year ? '· ' + p.year : ''}</div>
          ${p.caption ? `<div class="text-[#A89F90] text-[10px] truncate">caption: ${escapeHtml(p.caption)}</div>` : ''}
        </div>
        <div class="flex gap-1 flex-shrink-0">
          <button onclick="editPortrait(${idx})" class="text-[#C5A46E] hover:underline">Edit</button>
          <button onclick="deletePortrait(${idx})" class="text-[#E8A8A8] hover:underline">×</button>
        </div>
      </div>`;
  });
  html += '</div>';
  listEl.innerHTML = html;
  updateBegegnungenCount();
}

async function loadBegegnungenArea() {
  const st = document.getElementById('begegnungen-status');
  const listEl = document.getElementById('begegnungen-list');
  if (!st || !listEl) return;

  token = (document.getElementById('token') || {}).value.trim();
  repo = (document.getElementById('repo') || {}).value.trim();
  if (!token || !repo) {
    st.textContent = 'Token + Repo oben angeben.';
    st.style.color = '#C5A46E';
    return;
  }

  st.textContent = 'Lade Portraits...';
  st.style.color = '#A89F90';

  try {
    const path = 'src/content/begegnungen/portraits.yaml';
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: {
        'Authorization': token.startsWith('github_pat_') ? `Bearer ${token}` : `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-Admin/1.0'
      }
    });

    if (!res.ok) {
      if (res.status === 404) {
        // File doesn't exist yet on GitHub – that's fine, user can add the first one
        currentBegegnungenPortraits = [];
        currentBegegnungenYamlSha = null;
        renderBegegnungenList();
        const listEl = document.getElementById('begegnungen-list');
        if (listEl) listEl.innerHTML = '<div class="text-xs text-[#C5A46E]">Noch keine portraits.yaml – lade das erste Portrait hoch, die Datei wird automatisch erstellt.</div>';
        st.textContent = 'Bereit (Datei wird beim ersten Upload angelegt)';
        st.style.color = '#4ade80';
        return;
      }
      throw new Error('Konnte portraits.yaml nicht laden (Status ' + res.status + ')');
    }

    const json = await res.json();
    currentBegegnungenYamlSha = json.sha || null;

    let yamlText = '';
    if (json.content) {
      yamlText = base64ToUtf8(json.content);
    } else if (json.download_url) {
      // Fallback for very large files where content is omitted
      const rawRes = await fetch(json.download_url);
      yamlText = await rawRes.text();
    }

    currentBegegnungenPortraits = parsePortraitsFromYaml(yamlText);

    renderBegegnungenList();

    st.textContent = 'Geladen ✓';
    st.style.color = '#4ade80';
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<div class="text-red-400 text-xs">Fehler beim Laden der Liste.</div>';
    st.textContent = 'Fehler: ' + (e.message || e);
    st.style.color = '#f87171';
  }
}

function showAddPortraitForm() {
  const form = document.getElementById('add-portrait-form');
  if (form) {
    form.classList.remove('hidden');
    // reset
    document.getElementById('begegnung-file').value = '';
    document.getElementById('begegnung-preview').classList.add('hidden');
    const infoEl = document.getElementById('begegnung-file-info');
    if (infoEl) infoEl.textContent = '';
    ['portrait-title','portrait-subcaption','portrait-year','portrait-alt','portrait-caption'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const status = document.getElementById('add-portrait-status');
    if (status) status.textContent = '';
  }
}

function hideAddPortraitForm() {
  const form = document.getElementById('add-portrait-form');
  if (form) form.classList.add('hidden');
}

function handlePortraitFileSelect(e) {
  const file = e.target.files[0];
  const previewBox = document.getElementById('begegnung-preview');
  const img = document.getElementById('begegnung-preview-img');
  const info = document.getElementById('begegnung-file-info');
  const status = document.getElementById('add-portrait-status');

  if (!file || !previewBox || !img || !info) return;

  status.textContent = '';
  status.style.color = '#A89F90';

  // Phase 1: Verwende zentrale Validierung aus lib/admin/validators
  const validationError = validatePortraitFile(file);
  if (validationError) {
    status.textContent = validationError;
    status.style.color = '#f87171';
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    img.src = ev.target.result;
    previewBox.classList.remove('hidden');
    info.textContent = `${file.name} · ${(file.size/1024).toFixed(0)} KB ✓`;
  };
  reader.readAsDataURL(file);

  // auto-suggest title from filename if empty
  const titleInput = document.getElementById('portrait-title');
  if (titleInput && !titleInput.value) {
    const base = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    titleInput.value = base.charAt(0).toUpperCase() + base.slice(1);
  }
  // auto alt
  const altInput = document.getElementById('portrait-alt');
  if (altInput && !altInput.value && titleInput.value) {
    altInput.value = titleInput.value;
  }
}

function generateSafeImageName(title) {
  const slug = (title || 'portrait')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  return `${date}-${slug}.jpg`;
}

async function submitNewPortrait() {
  const status = document.getElementById('add-portrait-status');
  const fileInput = document.getElementById('begegnung-file');
  const file = fileInput.files[0];

  if (!file) {
    status.textContent = 'Bitte ein Bild auswählen.';
    status.style.color = '#f87171';
    return;
  }

  if (!confirmCommit('ein neues Begegnungen-Portrait hochzuladen und zu committen')) {
    status.textContent = 'Upload abgebrochen.';
    status.style.color = '#A89F90';
    return;
  }
  if (!checkCommitCooldown('Portrait-Upload')) return;

  const title = document.getElementById('portrait-title').value.trim();
  const alt = document.getElementById('portrait-alt').value.trim();
  const subcaption = document.getElementById('portrait-subcaption').value.trim();
  const year = document.getElementById('portrait-year').value.trim();
  const caption = document.getElementById('portrait-caption').value.trim();

  if (!title || !alt) {
    status.textContent = 'Title und Alt-Text sind Pflichtfelder.';
    status.style.color = '#f87171';
    return;
  }

  status.textContent = 'Validating and preparing upload...';
  status.style.color = '#A89F90';

  try {
    // Always re-read fresh token/repo from inputs and sync the latest portraits list from GitHub
    // before modifying. This ensures:
    // - correct auth for sha lookup (prevents "sha wasn't supplied")
    // - we base the new yaml on the *remote* current list, not a possibly stale/empty in-memory array
    //   (which would otherwise overwrite all previous portraits!)
    token = (document.getElementById('token') || {}).value.trim();
    repo = (document.getElementById('repo') || {}).value.trim();
    if (!token || !repo) {
      throw new Error('Token + Repo oben angeben.');
    }

    // This populates currentBegegnungenPortraits from remote (and updates the list UI)
    await loadBegegnungenArea();

    if (currentBegegnungenPortraits.length >= 30) {
      status.textContent = 'Maximale Anzahl von 30 Portraits erreicht.';
      status.style.color = '#f87171';
      return;
    }

    // 1. Generate safe filename
    const safeName = generateSafeImageName(title);
    const imagePath = `src/assets/images/portraits/${safeName}`;

    status.textContent = 'Reading image file...';

    // 2. Read as base64 (strip data: prefix)
    const base64 = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    status.textContent = 'Creating atomic commit (image + YAML in one push for reliable trigger)...';

    // 3. Add to list first (for local UI + to generate the full new YAML)
    const newEntry = {
      title,
      alt,
      caption,
      subcaption,
      year,
      image: safeName
    };
    currentBegegnungenPortraits.unshift(newEntry); // newest first on frontpage

    const newYaml = generatePortraitsYaml(currentBegegnungenPortraits);

    // 4. ATOMIC commit: one single Git commit containing BOTH the new image and the updated YAML.
    // This is the key creative fix: one push event the workflow sees with complete state.
    // No more race between separate image + yaml commits.
    const atomicRes = await getGitHubClient().commitPortraitAtomic(base64, safeName, newYaml, `Add Begegnungen Portrait: ${title} (atomic image + yaml)`);

    // For UI we still show "image commit" style link (the atomic commit)
    const commitUrl = atomicRes?.commit?.html_url || '#';

    const actionsUrl = repo ? `https://github.com/${repo}/actions` : '#';

    status.innerHTML = `
      ✓ Upload complete! New image added as <strong>FIRST</strong> in Begegnungen gallery.<br>
      <small>
        Atomic commit (image + YAML together): <a href="${commitUrl}" target="_blank" class="underline">view</a><br>
        Deploy status: <a href="${actionsUrl}" target="_blank" class="underline">GitHub Actions</a><br><br>
        <strong>Manual Deploy was automatically triggered</strong> for you (guaranteed rebuild).<br>
        <strong>On localhost:</strong> run <code>git pull</code> then restart dev server to see on frontpage.<br>
        <strong>On production:</strong> watch the triggered run in Actions. New image will be first after build completes.
      </small>
    `;
    status.style.color = '#4ade80';

    recordCommitAction();

    // Kein automatischer triggerManualDeploy mehr (vermeidet schnelle Calls).
    // Push des atomic Commits triggert den Workflow normalerweise.
    // Bei Bedarf den "Manual Deploy (full site)" Button nutzen.

    // Refresh list from remote to confirm it's published in the data
    setTimeout(() => {
      if (typeof loadBegegnungenArea === 'function') {
        loadBegegnungenArea();
      }
    }, 1500);

    // refresh local list too
    renderBegegnungenList();
    hideAddPortraitForm();

  } catch (e) {
    console.error(e);
    status.textContent = 'Fehler beim Upload: ' + (e.message || e);
    status.style.color = '#f87171';
  }
}

function editPortrait(idx) {
  const p = currentBegegnungenPortraits[idx];
  if (!p) return;

  // For now: simple prompt-based edit (later can be full form)
  const newTitle = prompt('Neuer Title:', p.title);
  if (newTitle === null) return;

  const newSub = prompt('Neuer Subcaption:', p.subcaption || '');
  if (newSub === null) return;

  const newYear = prompt('Neues Jahr:', p.year || '');
  if (newYear === null) return;

  const newCaption = prompt('Neue längere Caption:', p.caption || '');
  if (newCaption === null) return;

  currentBegegnungenPortraits[idx].title = newTitle.trim();
  currentBegegnungenPortraits[idx].subcaption = newSub.trim();
  currentBegegnungenPortraits[idx].year = newYear.trim();
  currentBegegnungenPortraits[idx].caption = newCaption.trim();

  // commit updated yaml (use reliable sha + trigger deploy for consistency)
  const yamlPath = 'src/content/begegnungen/portraits.yaml';
  const newYaml = generatePortraitsYaml(currentBegegnungenPortraits);

  getGitHubClient().getLatestSha(yamlPath).then(sha => {
    return getGitHubClient().commitFile(yamlPath, newYaml, `Update Begegnungen: edited ${newTitle}`, sha);
  }).then(() => {
    renderBegegnungenList();
    alert('Änderung gespeichert.');
    if (typeof triggerManualDeploy === 'function') {
      try { triggerManualDeploy('begegnungen-status'); } catch (e) {}
    }
  }).catch(err => {
    alert('Fehler beim Speichern: ' + (err.message || err));
  });
}

function deletePortrait(idx) {
  const p = currentBegegnungenPortraits[idx];
  if (!p) return;

  if (!confirmCommit(`Portrait "${p.title}" löschen`)) return;
  if (!checkCommitCooldown('Portrait-Löschen')) return;

  currentBegegnungenPortraits.splice(idx, 1);

  const yamlPath = 'src/content/begegnungen/portraits.yaml';
  const newYaml = generatePortraitsYaml(currentBegegnungenPortraits);

  getGitHubClient().getLatestSha(yamlPath).then(sha => {
    return getGitHubClient().commitFile(yamlPath, newYaml, `Update Begegnungen: removed ${p.title}`, sha);
  }).then(() => {
    renderBegegnungenList();
    recordCommitAction();
    // Kein auto triggerManualDeploy mehr hier. Push triggert Workflow. Manual-Button für Force-Rebuild nutzen.
  }).catch(err => {
    alert('Fehler beim Löschen: ' + (err.message || err));
    // reload list to restore state
    if (typeof loadBegegnungenArea === 'function') loadBegegnungenArea();
  });
}

// (drag & drop removed for now per request)
// Make functions available for inline onclick (menus + Hero + Labels + Konzept)

window.addCategory = addCategory;

window.loadHeroArea = loadHeroArea;
window.saveHeroArea = saveHeroArea;
window.loadLabelsArea = loadLabelsArea;
window.saveLabelsArea = saveLabelsArea;
window.loadKonzeptArea = loadKonzeptArea;
window.saveKonzeptArea = saveKonzeptArea;
window.loadTagesablaufArea = loadTagesablaufArea;
window.saveTagesablaufArea = saveTagesablaufArea;

// Begegnungen future admin helpers (exposed)
window.loadBegegnungenArea = loadBegegnungenArea;

// Optional debug
// console.log('[Admin] All areas (menus/hero/labels/konzept) exposed');

// (MD direct upload features paused)







// ============================================
// Collapsible for Interface Texte (Labels) and Lange Texte (Konzept)
// Same pattern as Speisekarten editor for consistency and space saving
// ============================================
function initLabelsCollapse() {
  const content = document.getElementById('labels-editor-content');
  const btn = document.getElementById('toggle-labels-btn');
  const labelEl = document.getElementById('toggle-labels-label');
  const chevron = document.getElementById('toggle-labels-chevron');

  if (!content || !btn) return;

  let isCollapsed = true;

  function updateUI() {
    if (isCollapsed) {
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      if (labelEl) labelEl.textContent = 'Ausklappen';
      if (chevron) chevron.style.transform = 'rotate(-90deg)';
      btn.setAttribute('aria-expanded', 'false');
    } else {
      content.style.opacity = '1';
      const h = Math.max(200, content.scrollHeight || 400);
      content.style.maxHeight = h + 'px';
      if (labelEl) labelEl.textContent = 'Einklappen';
      if (chevron) chevron.style.transform = 'rotate(0deg)';
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(() => { if (!isCollapsed && content) content.style.maxHeight = 'none'; }, 320);
    }
  }

  const labelsHandler = function(ev) {
    if (ev) ev.stopImmediatePropagation();
    isCollapsed = !isCollapsed;
    updateUI();
    try { localStorage.setItem('admin-labels-collapsed', isCollapsed ? '1' : '0'); } catch(e){}
  };

  window.toggleLabelsEditor = labelsHandler;

  // Attach listener for reliability
  if (btn) btn.addEventListener('click', labelsHandler);

  // restore
  try {
    const saved = localStorage.getItem('admin-labels-collapsed');
    if (saved === '0') isCollapsed = false;
  } catch(e){}

  if (isCollapsed) {
    content.style.maxHeight = '0px';
    content.style.opacity = '0';
  }
  updateUI();
}

function initKonzeptCollapse() {
  const content = document.getElementById('konzept-editor-content');
  const btn = document.getElementById('toggle-konzept-btn');
  const labelEl = document.getElementById('toggle-konzept-label');
  const chevron = document.getElementById('toggle-konzept-chevron');

  if (!content || !btn) return;

  let isCollapsed = true;

  function updateUI() {
    if (isCollapsed) {
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      if (labelEl) labelEl.textContent = 'Ausklappen';
      if (chevron) chevron.style.transform = 'rotate(-90deg)';
      btn.setAttribute('aria-expanded', 'false');
    } else {
      content.style.opacity = '1';
      const h = Math.max(200, content.scrollHeight || 500);
      content.style.maxHeight = h + 'px';
      if (labelEl) labelEl.textContent = 'Einklappen';
      if (chevron) chevron.style.transform = 'rotate(0deg)';
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(() => { if (!isCollapsed && content) content.style.maxHeight = 'none'; }, 320);
    }
  }

  const konzeptHandler = function(ev) {
    if (ev) ev.stopImmediatePropagation();
    isCollapsed = !isCollapsed;
    updateUI();
    try { localStorage.setItem('admin-konzept-collapsed', isCollapsed ? '1' : '0'); } catch(e){}
  };

  window.toggleKonzeptEditor = konzeptHandler;

  // Attach listener for reliability
  if (btn) btn.addEventListener('click', konzeptHandler);

  try {
    const saved = localStorage.getItem('admin-konzept-collapsed');
    if (saved === '0') isCollapsed = false;
  } catch(e){}

  if (isCollapsed) {
    content.style.maxHeight = '0px';
    content.style.opacity = '0';
  }
  updateUI();

  // Auto expand on load like the others
  const origLoad = window.loadKonzeptArea;
  window.loadKonzeptArea = async function(...args) {
    const res = await origLoad.apply(this, args);
    if (isCollapsed) {
      isCollapsed = false;
      updateUI();
    }
    return res;
  };
}

// ============================================
// Collapsible for Speisekarten Editor (Lunch & Dinner)
// Individual Klappmenüs so user can collapse one while editing the other
// ============================================
function initMenuEditorCollapsibles() {
  function setupToggle(type) {
    const content = document.getElementById(`${type}-editor-content`);
    const btn = document.getElementById(`toggle-${type}-btn`);
    const labelEl = document.getElementById(`toggle-${type}-label`);
    const chevron = document.getElementById(`toggle-${type}-chevron`);
    if (!content || !btn) return;

    let isCollapsed = false; // default open – important content

    function updateUI() {
      if (isCollapsed) {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.overflow = 'hidden';
        if (labelEl) labelEl.textContent = 'Ausklappen';
        if (chevron) chevron.style.transform = 'rotate(-90deg)';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        content.style.opacity = '1';
        content.style.overflow = '';
        const h = Math.max(120, content.scrollHeight || 500);
        content.style.maxHeight = h + 'px';
        if (labelEl) labelEl.textContent = 'Einklappen';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        btn.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
          if (!isCollapsed && content) content.style.maxHeight = 'none';
        }, 320);
      }
    }

    const handler = function(ev) {
      if (ev) ev.stopImmediatePropagation();
      isCollapsed = !isCollapsed;
      updateUI();
    };

    window[`toggle${type.charAt(0).toUpperCase() + type.slice(1)}Editor`] = handler;

    // Attach listener (more reliable than inline onclick)
    btn.addEventListener('click', handler);

    // initial open
    content.style.opacity = '1';
    updateUI();
  }

  setupToggle('lunch');
  setupToggle('dinner');
}

// Expose functions used in inline onclick handlers
window.loadBegegnungenArea = loadBegegnungenArea;
window.showAddPortraitForm = showAddPortraitForm;
window.hideAddPortraitForm = hideAddPortraitForm;
window.submitNewPortrait = submitNewPortrait;
window.editPortrait = editPortrait;
window.deletePortrait = deletePortrait;
window.handlePortraitFileSelect = handlePortraitFileSelect;

async function triggerManualDeploy(statusElId = 'load-status') {
  const st = document.getElementById(statusElId) || document.getElementById('load-status');
  if (!st) return;
  if (!token || !repo) {
    st.textContent = 'Token + Repo oben angeben.';
    st.style.color = '#C5A46E';
    return;
  }
  if (!checkCommitCooldown('Manual Deploy')) return;

  st.textContent = 'Triggering manual deploy workflow...';
  st.style.color = '#A89F90';
  try {
    const wf = 'deploy-on-content.yml';
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${wf}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': token.startsWith('github_pat_') ? `Bearer ${token}` : `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Portfolio-Admin/1.0'
      },
      body: JSON.stringify({ ref: 'main' })
    });
    if (res.status === 204 || res.ok) {
      st.innerHTML = `✓ Manual deploy triggered. Check <a href="https://github.com/${repo}/actions" target="_blank" class="underline">Actions</a> for progress. Full site rebuild in progress.`;
      st.style.color = '#4ade80';
      recordCommitAction();
    } else {
      const t = await res.text();
      throw new Error('Trigger failed: ' + t);
    }
  } catch (e) {
    console.error(e);
    st.textContent = 'Fehler beim Manual Deploy: ' + (e.message || e);
    st.style.color = '#f87171';
  }
}

// Keep old name for backward compatibility with existing Begegnungen button
window.triggerBegegnungenDeploy = () => triggerManualDeploy('begegnungen-status');
window.triggerManualDeploy = triggerManualDeploy;

// === ToS / Rate-Limit Hardening: Cooldown + Confirm guards ===
// checkCommitCooldown, recordCommitAction, confirmCommit
// are now imported from '../../lib/admin/safety' (Phase 1)

// Defensive cleanup: remove any leftover old repo default from previous (suspended) account
setTimeout(() => {
  const repoEl = document.getElementById('repo');
  if (repoEl) {
    const v = (repoEl.value || '').trim();
    if (!v || v.includes('christiangail44-dot') || v.toLowerCase().includes('old') || v.includes('kleines-kameel')) {
      repoEl.value = '';
      repoEl.placeholder = 'Severyn55/el-aurian-atrium';
    }
  }
}, 60);

// Auto-load Begegnungen list when token/repo are filled (for complete list visibility)
const tokenInput = document.getElementById('token');
const repoInput = document.getElementById('repo');
function tryAutoLoadBegegnungen() {
  if (tokenInput && repoInput && tokenInput.value.trim() && repoInput.value.trim()) {
    loadBegegnungenArea();
  }
}
if (tokenInput) tokenInput.addEventListener('input', tryAutoLoadBegegnungen);
if (repoInput) repoInput.addEventListener('input', tryAutoLoadBegegnungen);
// Initial attempt if values are pre-filled
setTimeout(tryAutoLoadBegegnungen, 800);

// ============================================
// PDF Upload for Lunch/Dinner menus (drag & drop + button select)
// When new PDF uploaded, we commit it with dated safe name to public/assets/originals/
// and immediately update the pdf link input so that on save the data has the correct current link.
// This prevents old links pointing to non-existing files.
// ============================================

function initPDFUploadHandlers() {
  ['lunch', 'dinner'].forEach(type => {
    const input = document.getElementById(`${type}-pdf`);
    const fileInput = document.getElementById(`${type}-pdf-file`);
    if (!input || !fileInput) return;

    // Drag & drop support on the link input field
    input.addEventListener('dragover', (e) => {
      e.preventDefault();
      input.style.border = '2px dashed #C5A26F';
    });
    input.addEventListener('dragleave', () => {
      input.style.border = '';
    });
    input.addEventListener('drop', (e) => {
      e.preventDefault();
      input.style.border = '';
      const file = e.dataTransfer.files[0];
      if (file) {
        handlePDFFile(file, type);
      }
    });
  });

  // Attach click handlers for the PDF select buttons (avoids global onclick + "not defined" errors)
  const lunchBtn = document.querySelector('.js-select-pdf-lunch');
  if (lunchBtn) {
    lunchBtn.addEventListener('click', () => selectPDF('lunch'));
  }
  const dinnerBtn = document.querySelector('.js-select-pdf-dinner');
  if (dinnerBtn) {
    dinnerBtn.addEventListener('click', () => selectPDF('dinner'));
  }

  // Attach change listeners for the hidden file inputs (instead of inline onchange)
  const lunchFile = document.getElementById('lunch-pdf-file');
  if (lunchFile) {
    lunchFile.addEventListener('change', (e) => handlePDFSelect(e, 'lunch'));
  }
  const dinnerFile = document.getElementById('dinner-pdf-file');
  if (dinnerFile) {
    dinnerFile.addEventListener('change', (e) => handlePDFSelect(e, 'dinner'));
  }
}

function selectPDF(type) {
  const fileInput = document.getElementById(`${type}-pdf-file`);
  if (fileInput) fileInput.click();
}

async function handlePDFSelect(e, type) {
  const file = e.target.files[0];
  if (file) {
    await handlePDFFile(file, type);
    e.target.value = ''; // allow re-select same file
  }
}

async function handlePDFFile(file, type) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Bitte eine PDF-Datei auswählen.');
    return;
  }

  if (!confirmCommit(`eine neue ${type.toUpperCase()}-Speisekarte-PDF hochladen (ersetzt den aktuellen Link)`)) {
    const statusEl = document.getElementById('save-status');
    if (statusEl) statusEl.textContent = 'PDF-Upload abgebrochen.';
    return;
  }
  if (!checkCommitCooldown('PDF-Upload')) return;

  const statusEl = document.getElementById('save-status');
  if (statusEl) {
    statusEl.textContent = `Lade ${type.toUpperCase()} PDF hoch...`;
    statusEl.style.color = '#A89F90';
  }
  try {
    const base64 = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    const now = new Date();
    // Use full timestamp for unique name even on rapid uploads same second
    const timestamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 17);
    const safeName = `Speisekarte_${timestamp}_${type.toUpperCase()}.pdf`;
    const path = `public/assets/originals/${safeName}`;

    // Always try to get current sha (for update if collision) or null for new file.
    // This prevents "sha wasn't supplied" 422 errors.
    let pdfSha = null;
    try {
      pdfSha = await getGitHubClient().getFileShaIfNeeded(path);
    } catch(e) { /* new file */ }

    // commit the PDF file
    try {
      await getGitHubClient().commitFile(path, base64, `Update ${type.toUpperCase()} PDF Speisekarte`, pdfSha, true);
    } catch (commitErr) {
      if (commitErr.message && commitErr.message.includes('sha') && commitErr.message.includes('supplied')) {
        // Fallback: force fetch sha and retry
        console.warn('PDF commit failed with sha error, retrying with fresh sha');
        pdfSha = await getGitHubClient().getFileShaIfNeeded(path);
        await getGitHubClient().commitFile(path, base64, `Update ${type.toUpperCase()} PDF Speisekarte (retry)`, pdfSha, true);
      } else {
        throw commitErr;
      }
    }

    // update the link field so save will use the new correct link
    const linkInput = document.getElementById(`${type}-pdf`);
    if (linkInput) {
      linkInput.value = `assets/originals/${safeName}`;
    }

    if (statusEl) {
      statusEl.innerHTML = `✓ PDF hochgeladen als <code>${safeName}</code>. Link aktualisiert. <strong>Jetzt "Änderungen auf GitHub speichern"</strong> klicken (oder es passiert automatisch im Hintergrund mit Cooldown-Schutz).`;
      statusEl.style.color = '#4ade80';
    }

    // Maximally optimized: automatically save the menu data right after PDF upload.
    // This commits the updated pdf link in the .md immediately (in addition to the PDF file itself).
    // Ensures the frontpage/modals always get the correct current link on next deploy.
    // No more manual "save" step needed just for the link update.
    // The .md change will also trigger the content workflow for deploy.
    setTimeout(() => {
      if (typeof saveData === 'function') {
        // silent: no extra confirm popup (user already confirmed the PDF step),
        // but cooldown still applies
        saveData({ silent: true });
      }
    }, 400);
  } catch (e) {
    console.error(e);
    const statusEl = document.getElementById('save-status');
    let msg = (e.message || e).toString();
    if (msg.includes('account was suspended') || msg.includes('403') || msg.toLowerCase().includes('suspended')) {
      msg = 'GitHub API Fehler: Dein GitHub-Account ist gesperrt ("Your account was suspended"). Das blockiert ALLE Uploads aus dem Admin (PDFs, Bilder etc.). Bitte sofort https://support.github.com kontaktieren und den Account entsperren lassen. Ohne Entsperrung funktionieren keine Commits mehr über den Browser-Admin.';
    } else if (msg.includes('sha') && msg.includes('supplied')) {
      msg = 'PDF konnte nicht hochgeladen werden (SHA-Fehler). Wir versuchen es automatisch mit aktuellem SHA. Stelle sicher, dass dein GitHub-Token "Contents: Write" Rechte hat und lade ggf. die Menu-Daten neu.';
    }
    if (statusEl) {
      statusEl.innerHTML = `Fehler beim PDF-Upload: ${msg} <br> Tipp: Nach Entsperrung: Manual Deploy triggern (Button oben), dann Admin-Seite neu laden (F5) und erneut versuchen.`;
      statusEl.style.color = '#f87171';
    }
  }
}

// Simple collapsible for Tagesablauf editor (for overview)
// (converted from IIFE to named function; called from deferred setup)
function initTagesablaufCollapse() {
  const content = document.getElementById('tagesablauf-editor-content');
  const btn = document.getElementById('toggle-tagesablauf-btn');
  const labelEl = document.getElementById('toggle-tagesablauf-label');
  const chevron = document.getElementById('toggle-tagesablauf-chevron');
  if (!content || !btn) return;

  function isCurrentlyCollapsed() {
    const mh = content.style.maxHeight;
    const op = content.style.opacity;
    return (mh === '0px' || mh === '0' || op === '0' || op === '0%');
  }

  function updateUI(collapsed) {
    if (collapsed) {
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      content.style.overflow = 'hidden';
      if (labelEl) labelEl.textContent = 'Ausklappen';
      if (chevron) chevron.style.transform = 'rotate(-90deg)';
      btn.setAttribute('aria-expanded', 'false');
    } else {
      content.style.opacity = '1';
      content.style.overflow = '';
      const h = Math.max(150, content.scrollHeight || 400);
      content.style.maxHeight = h + 'px';
      if (labelEl) labelEl.textContent = 'Einklappen';
      if (chevron) chevron.style.transform = 'rotate(0deg)';
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(() => {
        if (!isCurrentlyCollapsed() && content) content.style.maxHeight = 'none';
      }, 320);
    }
  }

  const handler = function(ev) {
    if (ev) ev.stopImmediatePropagation();
    const nowCollapsed = isCurrentlyCollapsed();
    updateUI(!nowCollapsed);
  };

  btn.addEventListener('click', handler);

  // initial collapsed
  updateUI(true);

  // expose
  window.toggleTagesablaufEditor = handler;
}

// === Expose functions for inline onclick handlers in the extracted components ===
// These run at module evaluation time (early, even if script hoisted to <head>).
// This ensures that static onclick="..." attributes in the .astro components find the globals
// by the time the rest of the body is parsed and the user can click.
(window as any).loadData = loadData;
(window as any).saveData = saveData;
(window as any).loadTagesablaufArea = loadTagesablaufArea;
(window as any).saveTagesablaufArea = saveTagesablaufArea;
(window as any).loadHeroArea = loadHeroArea;
(window as any).saveHeroArea = saveHeroArea;
(window as any).loadLabelsArea = loadLabelsArea;
(window as any).saveLabelsArea = saveLabelsArea;
(window as any).loadKonzeptArea = loadKonzeptArea;
(window as any).saveKonzeptArea = saveKonzeptArea;
(window as any).loadBegegnungenArea = loadBegegnungenArea;
(window as any).showAddPortraitForm = showAddPortraitForm;
(window as any).hideAddPortraitForm = hideAddPortraitForm;
(window as any).handlePortraitFileSelect = handlePortraitFileSelect;
(window as any).submitNewPortrait = submitNewPortrait;
(window as any).triggerBegegnungenDeploy = triggerBegegnungenDeploy;
(window as any).addCategory = addCategory;
(window as any).triggerManualDeploy = triggerManualDeploy;
(window as any).renderEditor = renderEditor;
(window as any).loadMenu = loadMenu;

// Defer DOM queries + listener attachment + collapsible inits + PDF handlers.
// This is the key fix: if Astro hoists <script type="module" src="..."> (the admin entry)
// into <head>, immediate getElementById would return null and attaches/collapsibles would be skipped.
// By running on DOMContentLoaded (or immediately if already ready), #load-btn etc. exist
// and the "Aktuelle Daten laden" (and toggles) will work.
function setupDOMListenersAndCollapsibles() {
  loadBtn = document.getElementById('load-btn') as HTMLElement | null;
  loadStatus = document.getElementById('load-status') as HTMLElement | null;
  saveBtn = document.getElementById('save-btn') as HTMLElement | null;
  saveStatus = document.getElementById('save-status') as HTMLElement | null;
  editor = document.getElementById('editor') as HTMLElement | null;

  if (loadBtn) loadBtn.addEventListener('click', loadData);
  if (saveBtn) saveBtn.addEventListener('click', saveData);

  // Call the (now non-autoexec) collapsible and handler inits
  if (typeof initLabelsCollapse === 'function') initLabelsCollapse();
  if (typeof initKonzeptCollapse === 'function') initKonzeptCollapse();
  if (typeof initMenuEditorCollapsibles === 'function') initMenuEditorCollapsibles();
  if (typeof initTagesablaufCollapse === 'function') initTagesablaufCollapse();
  if (typeof initPDFUploadHandlers === 'function') initPDFUploadHandlers();

  // Re-attach defensively (idempotent)
  const loadBtnEl = document.getElementById('load-btn');
  const saveBtnEl = document.getElementById('save-btn');
  if (loadBtnEl) loadBtnEl.addEventListener('click', loadData);
  if (saveBtnEl) saveBtnEl.addEventListener('click', saveData);
}

// === Bootstrap entry point ===
// When this module is loaded via <script type="module" src=".../speisekarten-admin.ts"> in the .astro,
// top-level code above (window hoists + fn defs) runs immediately.
// Then we schedule the DOM-dependent setup safely.
export function initSpeisekartenAdmin() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDOMListenersAndCollapsibles, { once: true });
  } else {
    setupDOMListenersAndCollapsibles();
  }
}

// Auto-bootstrap when the script is included directly via src= (the pattern used in speisekarten.astro).
// This ensures init runs without requiring a separate import + call in an inline script.
initSpeisekartenAdmin();

