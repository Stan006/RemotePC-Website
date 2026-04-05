/**
 * releases.js
 * Fetches release data from GitHub on page load,
 * renders the release timeline, and wires up
 * search + filter functionality.
 */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────── */
  const REPO       = 'Stan006/RemotePC';
  const TAGS_URL   = `https://api.github.com/repos/${REPO}/tags?per_page=100`;
  const RELS_URL   = `https://api.github.com/repos/${REPO}/releases?per_page=100`;
  const GH_TAG_URL = (tag) => `https://github.com/${REPO}/releases/tag/${tag}`;

  /* ── DOM refs ──────────────────────────────────── */
  const feed          = document.getElementById('releases-feed');
  const skeleton      = document.getElementById('skeleton-group');
  const emptyEl       = document.getElementById('releases-empty');
  const errorEl       = document.getElementById('releases-error');
  const errorMsg      = document.getElementById('error-message');
  const metaCount     = document.getElementById('meta-count');
  const metaUpdated   = document.getElementById('meta-updated');
  const sideLatestTag = document.getElementById('sidebar-latest-tag');
  const sideLatestDate= document.getElementById('sidebar-latest-date');
  const sideCount     = document.getElementById('sidebar-count');
  const searchInput   = document.getElementById('release-search');
  const filterBtns    = document.querySelectorAll('.filter-btn');
  const retryBtn      = document.getElementById('retry-btn');
  const clearSearchBtn= document.getElementById('clear-search-btn');

  /* ── State ─────────────────────────────────────── */
  let allCards    = [];   // { tag, version, type, date, notes, sha, url }
  let activeFilter= 'all';
  let searchQuery = '';

  /* ── Helpers ───────────────────────────────────── */

  /**
   * Classify a semver string as major / minor / patch.
   * Strips leading 'v' before parsing.
   */
  function classify(tagName) {
    const v = tagName.replace(/^v/i, '');
    const parts = v.split('.').map(Number);
    if (isNaN(parts[0])) return 'patch';
    if (parts[0] > 0 && (parts[1] === 0 || isNaN(parts[1])) && (parts[2] === 0 || isNaN(parts[2]))) return 'major';
    if (!isNaN(parts[1]) && parts[1] > 0 && (parts[2] === 0 || isNaN(parts[2]))) return 'minor';
    return 'patch';
  }

  /** Format an ISO date string into a human-readable form. */
  function formatDate(iso) {
    if (!iso) return 'Unknown date';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Relative time ("2 months ago"). */
  function relativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60)   return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60)   return `${mins}m ago`;
    const hrs  = Math.floor(mins / 60);
    if (hrs  < 24)   return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30)   return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  /** Minimal Markdown → safe HTML converter (no external lib needed). */
  function markdownToHtml(md) {
    if (!md) return '';

    // Escape HTML first
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings (## and ###)
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm,  '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm,   '<h2>$1</h2>');

    // Bold / italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g,     '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bullet lists — group consecutive lines
    html = html.replace(/((?:^[-*+] .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => {
        const text = l.replace(/^[-*+] /, '');
        return `<li>${text}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    });

    // Paragraphs — wrap non-tagged lines
    html = html.replace(/^(?!<[a-z])(.+)$/gm, '<p>$1</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  /* ── Fetch ─────────────────────────────────────── */

  /**
   * Merges tags (always available) with release data (may be absent).
   * Returns a unified array sorted newest-first.
   */
  async function fetchData() {
    const [tagsRes, relsRes] = await Promise.all([
      fetch(TAGS_URL),
      fetch(RELS_URL),
    ]);

    if (!tagsRes.ok) throw new Error(`GitHub API error: ${tagsRes.status}`);

    const tags     = await tagsRes.json();
    const releases = relsRes.ok ? await relsRes.json() : [];

    // Build lookup map: tag name → release data
    const relMap = {};
    for (const rel of releases) {
      relMap[rel.tag_name] = rel;
    }

    // Merge
    const merged = tags.map((tag) => {
      const rel  = relMap[tag.name] || {};
      return {
        tag      : tag.name,
        version  : tag.name,
        type     : classify(tag.name),
        date     : rel.published_at || rel.created_at || null,
        notes    : rel.body || '',
        name     : rel.name || tag.name,
        sha      : tag.commit ? tag.commit.sha.slice(0, 7) : '',
        url      : rel.html_url || `https://github.com/${REPO}/releases/tag/${tag.name}`,
        prerelease: rel.prerelease || false,
      };
    });

    // Sort: releases with dates first (newest), undated to end
    merged.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date) - new Date(a.date);
      if (a.date) return -1;
      if (b.date) return  1;
      return 0;
    });

    return merged;
  }

  /* ── Render ────────────────────────────────────── */

  function buildCard(data, index, isLatest) {
    const card = document.createElement('article');
    card.className = `release-card${isLatest ? ' is-latest' : ''}`;
    card.setAttribute('aria-label', `Release ${data.version}`);
    card.style.animationDelay = `${index * 55}ms`;

    const typeCls   = `tag-${data.type}`;
    const typeLabel = data.type.charAt(0).toUpperCase() + data.type.slice(1);
    const dateStr   = formatDate(data.date);
    const rel       = relativeTime(data.date);
    const title     = data.name !== data.version ? data.name : '';

    card.innerHTML = `
      <div class="release-card-header" role="button" tabindex="0" aria-expanded="false">
        <div class="release-card-left">
          <span class="release-tag-pill ${typeCls}">${typeLabel}</span>
          <span class="release-version">${escHtml(data.version)}</span>
          ${title ? `<span class="release-title">${escHtml(title)}</span>` : ''}
        </div>
        <div class="release-card-right">
          ${data.date ? `<time class="release-date" datetime="${data.date}" title="${dateStr}">${rel || dateStr}</time>` : ''}
          <div class="release-toggle" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      <div class="release-card-body" role="region">
        <div class="release-card-content">
          <div class="release-notes">
            ${data.notes ? markdownToHtml(data.notes) : '<p class="no-notes">No release notes for this version.</p>'}
          </div>
          <div class="release-card-footer">
            <a href="${escHtml(data.url)}" target="_blank" rel="noopener noreferrer" class="release-gh-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              View on GitHub
            </a>
            ${data.sha ? `<span class="release-commit" title="Commit SHA">${escHtml(data.sha)}</span>` : ''}
          </div>
        </div>
      </div>
    `;

    // Expand / collapse
    const header = card.querySelector('.release-card-header');
    function toggle() {
      const open = card.classList.toggle('open');
      header.setAttribute('aria-expanded', String(open));
    }
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    return card;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /** Render (or re-render) the visible subset into the feed. */
  function render() {
    // Remove existing cards (keep skeleton hidden)
    feed.querySelectorAll('.release-card').forEach(c => c.remove());

    const filtered = allCards.filter((d, i) => {
      const matchFilter = activeFilter === 'all' || d.type === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        d.version.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });

    if (filtered.length === 0) {
      emptyEl.hidden = false;
    } else {
      emptyEl.hidden = true;
      filtered.forEach((d, i) => {
        const isLatest = allCards.indexOf(d) === 0;
        feed.appendChild(buildCard(d, i, isLatest));
      });
    }
  }

  /** Populate header meta and sidebar with aggregate info. */
  function updateMeta(data) {
    const latest = data[0];

    // Meta bar
    metaCount.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      ${data.length} release${data.length !== 1 ? 's' : ''}`;

    metaUpdated.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Sidebar
    sideLatestTag.textContent  = latest ? latest.version : '—';
    sideLatestDate.textContent = latest && latest.date ? formatDate(latest.date) : 'Unknown';
    sideCount.textContent      = data.length;
  }

  /* ── Init ──────────────────────────────────────── */

  async function init() {
    skeleton.hidden  = false;
    errorEl.hidden   = true;
    emptyEl.hidden   = true;
    feed.setAttribute('aria-busy', 'true');

    try {
      const data = await fetchData();
      allCards   = data;

      skeleton.hidden = true;
      feed.removeAttribute('aria-busy');
      updateMeta(data);

      // Open the latest card by default
      render();
      const firstCard = feed.querySelector('.release-card');
      if (firstCard) {
        firstCard.classList.add('open');
        firstCard.querySelector('.release-card-header').setAttribute('aria-expanded', 'true');
      }

    } catch (err) {
      skeleton.hidden = true;
      errorEl.hidden  = false;
      errorMsg.textContent = err.message || 'Could not load release data. Please try again.';
      console.error('[releases.js]', err);
    }
  }

  /* ── Search & Filter wiring ─────────────────────── */

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    render();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  retryBtn.addEventListener('click', init);

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    render();
  });

  /* ── Kick off ───────────────────────────────────── */
  init();

})();