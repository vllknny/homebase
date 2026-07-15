/**
 * Quick links ("favorite tabs"): a small grid of sites the person
 * jumps to often. Stored as [{ id, label, url }, ...].
 */
const Links = (() => {
  const STORAGE_KEY = 'homebase_links';
  const DEFAULT_LINKS = [
    { id: 'l1', label: 'Gmail', url: 'https://mail.google.com' },
    { id: 'l2', label: 'Drive', url: 'https://drive.google.com' },
    { id: 'l3', label: 'YouTube', url: 'https://youtube.com' },
    { id: 'l4', label: 'GitHub', url: 'https://github.com' },
  ];

  let links = [];
  let grid, modal, form, labelInput, urlInput, cancelBtn, addTile;

  function normalizeUrl(raw) {
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  }

  function deriveLabel(rawUrl) {
    const value = (rawUrl || '').trim();
    if (!value) return 'Link';

    try {
      const hostname = new URL(normalizeUrl(value)).hostname.replace(/^www\./i, '').replace(/\.$/, '');
      const parts = hostname.split('.').filter(Boolean);
      if (!parts.length) return 'Link';
      const withoutExtension = parts.slice(0, -1).join('.');
      return withoutExtension || parts[0] || 'Link';
    } catch (e) {
      return value.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] || 'Link';
    }
  }

  function extractUrl(raw) {
    const text = (raw || '').trim();
    if (!text) return '';

    const candidates = text.split(/\s+/).filter(Boolean);
    for (const candidate of candidates) {
      const cleaned = candidate.replace(/[),.;]+$/, '');
      if (/^https?:\/\//i.test(cleaned)) return normalizeUrl(cleaned);
      if (/^www\./i.test(cleaned)) return normalizeUrl(`https://${cleaned}`);
    }
    return '';
  }

  function domainOf(url) {
    try { return new URL(url).hostname; } catch (e) { return ''; }
  }

  function faviconUrl(url) {
    const domain = domainOf(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  }

  function initials(label) {
    return (label.trim()[0] || '?').toUpperCase();
  }

  async function persist() {
    await Store.set(STORAGE_KEY, links);
  }

  function render() {
    grid.innerHTML = '';

    links.forEach((link) => {
      const a = document.createElement('a');
      a.className = 'link-tile';
      a.href = link.url;
      a.title = link.url;
      a.addEventListener('dragover', (e) => handleDragOver(e, a));
      a.addEventListener('dragleave', (e) => handleDragLeave(e, a));
      a.addEventListener('drop', (e) => handleDrop(e, a));
      a.addEventListener('dragend', () => setDropTarget(false, a));

      const img = document.createElement('img');
      img.src = faviconUrl(link.url);
      img.alt = '';
      img.onerror = () => {
        img.replaceWith(fallbackIcon(link.label));
      };

      const span = document.createElement('span');
      span.textContent = link.label;

      const del = document.createElement('button');
      del.className = 'del-btn';
      del.type = 'button';
      del.textContent = '×';
      del.title = `Remove ${link.label}`;
      del.setAttribute('aria-label', `Remove ${link.label}`);
      del.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeLink(link.id);
      });

      a.appendChild(img);
      a.appendChild(span);
      a.appendChild(del);
      grid.appendChild(a);
    });

    addTile = document.createElement('button');
    addTile.type = 'button';
    addTile.className = 'link-tile add-tile';
    addTile.setAttribute('aria-label', 'Add a quick link');
    addTile.innerHTML = `<span class="fallback-icon">+</span><span>Add</span>`;
    addTile.addEventListener('click', openModal);
    addTile.addEventListener('dragover', (e) => handleDragOver(e, addTile));
    addTile.addEventListener('dragleave', (e) => handleDragLeave(e, addTile));
    addTile.addEventListener('drop', (e) => handleDrop(e, addTile));
    addTile.addEventListener('dragend', () => setDropTarget(false, addTile));
    grid.appendChild(addTile);
  }

  function fallbackIcon(label) {
    const span = document.createElement('span');
    span.className = 'fallback-icon';
    span.textContent = initials(label);
    return span;
  }

  function removeLink(id) {
    links = links.filter((l) => l.id !== id);
    persist();
    render();
  }

  function openModal() {
    labelInput.value = '';
    urlInput.value = '';
    modal.classList.add('open');
    setTimeout(() => labelInput.focus(), 50);
  }

  function addLinkFromUrl(rawUrl, labelOverride = '') {
    const normalized = normalizeUrl(rawUrl);
    const label = (labelOverride || deriveLabel(rawUrl)).trim() || deriveLabel(rawUrl);
    links.push({ id: 'l' + Date.now(), label, url: normalized });
    persist();
    render();
  }

  function setDropTarget(active, target) {
    grid.classList.toggle('drop-target', active);
    if (target) target.classList.toggle('drop-target', active);
  }

  function isInsideDropZone(element, relatedTarget) {
    return !!relatedTarget && (element === relatedTarget || element.contains(relatedTarget));
  }

  function handleDragOver(e, target = grid) {
    const payload = e.dataTransfer && (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'));
    if (!payload) return;
    e.preventDefault();
    setDropTarget(true, target);
  }

  function handleDragLeave(e, target = grid) {
    if (isInsideDropZone(target, e.relatedTarget) || isInsideDropZone(grid, e.relatedTarget)) return;
    setDropTarget(false, target);
  }

  function handleDrop(e, target = grid) {
    const payload = e.dataTransfer && (e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'));
    if (!payload) return;
    e.preventDefault();
    setDropTarget(false, target);

    const url = extractUrl(payload);
    if (!url) return;
    addLinkFromUrl(url);
  }

  function closeModal() {
    modal.classList.remove('open');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const rawUrl = urlInput.value.trim();
    const label = labelInput.value.trim() || deriveLabel(rawUrl);
    if (!rawUrl || !label) return;

    links.push({
      id: 'l' + Date.now(),
      label,
      url: normalizeUrl(rawUrl),
    });
    persist();
    render();
    closeModal();
  }

  async function init() {
    grid = document.getElementById('linksGrid');
    modal = document.getElementById('addLinkModal');
    form = document.getElementById('addLinkForm');
    labelInput = document.getElementById('linkLabel');
    urlInput = document.getElementById('linkUrl');
    cancelBtn = document.getElementById('cancelAddLink');

    const stored = await Store.get(STORAGE_KEY, null);
    if (stored && stored.length) {
      links = stored;
    } else {
      links = DEFAULT_LINKS.slice();
      await persist();
    }

    form.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    urlInput.addEventListener('input', () => {
      if (!labelInput.value.trim() && urlInput.value.trim()) {
        labelInput.value = deriveLabel(urlInput.value);
      }
    });
    grid.addEventListener('dragover', (e) => handleDragOver(e, grid));
    grid.addEventListener('dragleave', (e) => handleDragLeave(e, grid));
    grid.addEventListener('drop', (e) => handleDrop(e, grid));
    grid.addEventListener('dragend', () => setDropTarget(false, grid));

    render();
  }

  return { init };
})();
