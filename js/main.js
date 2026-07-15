/**
 * Wires up the clock, greeting, search bar and settings modal, then
 * boots the Sky, Links, Planner, Calendar and Notes modules.
 */
(function () {
  const SETTINGS_KEY = 'homebase_settings';
  const DEFAULT_SETTINGS = {
    name: '',
    sky: 'auto',
    clock: '12',
    engine: 'google',
    weekStart: '0',
    grain: 'off',
    palette: {
      surface: '#FFFFFF',
      text: '#F8F6F9',
      accent: '#f7f1ea',
      accentInk: '#2b1a08',
    },
  };

  const SEARCH_ENGINES = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    brave: 'https://search.brave.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    startpage: 'https://www.startpage.com/sp/search?query=',
  };

  let settings = { ...DEFAULT_SETTINGS };

  let clockEl, dateEl, greetingEl, searchForm, searchInput;
  let settingsBtn, settingsModal, closeSettingsBtn;
  let nameInput, skySelect, clockSelect, engineSelect, weekStartSelect;
  let grainSelect;
  let paletteSurfaceInput, paletteTextInput, paletteAccentInput, paletteAccentInkInput;
  let palettePresetsEl, previewDotLarge, previewStrip;

  function greetingWord(hour) {
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let suffix = '';

    if (settings.clock === '12') {
      suffix = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
    } else {
      hours = String(hours).padStart(2, '0');
    }

    clockEl.innerHTML = `${hours}:${minutes}${settings.clock === '12' ? `<span class="clock-suffix">${suffix}</span>` : ''}`;
    dateEl.textContent = now.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });

    const word = greetingWord(now.getHours());
    greetingEl.textContent = settings.name ? `${word}, ${settings.name}` : `${word}.`;
  }

  function isProbablyUrl(str) {
    if (/^https?:\/\//i.test(str)) return true;
    if (/^[\w-]+(\.[a-z]{2,})+([/:?#].*)?$/i.test(str) && !str.includes(' ')) return true;
    return false;
  }

  function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    if (isProbablyUrl(query)) {
      const url = /^https?:\/\//i.test(query) ? query : 'https://' + query;
      window.location.href = url;
    } else {
      const base = SEARCH_ENGINES[settings.engine] || SEARCH_ENGINES.google;
      window.location.href = base + encodeURIComponent(query);
    }
  }

  function hexToRgba(hex, alpha) {
    const value = (hex || '#ffffff').trim();
    const clean = value.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const intValue = parseInt(full, 16);
    if (Number.isNaN(intValue)) return `rgba(255,255,255,${alpha})`;
    const r = (intValue >> 16) & 255;
    const g = (intValue >> 8) & 255;
    const b = intValue & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function applyPalette() {
    const palette = settings.palette || DEFAULT_SETTINGS.palette;
    const textColor = palette.text || DEFAULT_SETTINGS.palette.text;
    const surfaceColor = palette.surface || DEFAULT_SETTINGS.palette.surface;
    const accentColor = palette.accent || DEFAULT_SETTINGS.palette.accent;
    const accentInkColor = palette.accentInk || DEFAULT_SETTINGS.palette.accentInk;

    document.body.style.setProperty('--accent', accentColor);
    document.body.style.setProperty('--accent-ink', accentInkColor);
    document.body.style.setProperty('--text', textColor);
    document.body.style.setProperty('--text-dim', hexToRgba(textColor, .94));
    document.body.style.setProperty('--text-faint', hexToRgba(textColor, .78));
    document.body.style.setProperty('--surface', hexToRgba(surfaceColor, .08));
    document.body.style.setProperty('--surface-hover', hexToRgba(surfaceColor, .12));
    document.body.style.setProperty('--surface-border', hexToRgba(surfaceColor, .18));
    document.body.style.setProperty('--surface-strong', hexToRgba(surfaceColor, .16));
    document.body.style.setProperty('--surface-muted', hexToRgba(surfaceColor, .72));
  }

  async function persistSettings() {
    await Store.set(SETTINGS_KEY, settings);
  }

  function populateSettingsForm() {
    nameInput.value = settings.name;
    skySelect.value = settings.sky;
    clockSelect.value = settings.clock;
    engineSelect.value = settings.engine;
    weekStartSelect.value = settings.weekStart;
    if (grainSelect) grainSelect.value = settings.grain || 'off';
    const p = settings.palette || DEFAULT_SETTINGS.palette;
    if (paletteSurfaceInput) paletteSurfaceInput.value = p.surface || DEFAULT_SETTINGS.palette.surface;
    if (paletteTextInput) paletteTextInput.value = p.text || DEFAULT_SETTINGS.palette.text;
    if (paletteAccentInput) paletteAccentInput.value = p.accent || DEFAULT_SETTINGS.palette.accent;
    if (paletteAccentInkInput) paletteAccentInkInput.value = p.accentInk || DEFAULT_SETTINGS.palette.accentInk;
  }

  function openSettings() {
    settingsModal.classList.add('open');
  }
  function closeSettings() {
    settingsModal.classList.remove('open');
  }

  function wireSettingsInputs() {
    nameInput.addEventListener('input', () => {
      settings.name = nameInput.value;
      persistSettings();
      updateClock();
    });
    skySelect.addEventListener('change', () => {
      settings.sky = skySelect.value;
      persistSettings();
      Sky.setOverride(settings.sky);
    });
    clockSelect.addEventListener('change', () => {
      settings.clock = clockSelect.value;
      persistSettings();
      updateClock();
    });
    engineSelect.addEventListener('change', () => {
      settings.engine = engineSelect.value;
      persistSettings();
    });
    weekStartSelect.addEventListener('change', () => {
      settings.weekStart = weekStartSelect.value;
      persistSettings();
      Calendar.setWeekStart(settings.weekStart);
    });
    grainSelect.addEventListener('change', () => {
      settings.grain = grainSelect.value;
      persistSettings();
      applyGrainSetting();
    });

    if (paletteSurfaceInput) paletteSurfaceInput.addEventListener('input', () => {
      settings.palette = settings.palette || {};
      settings.palette.surface = paletteSurfaceInput.value;
      persistSettings(); applyPalette(); updatePalettePreview();
    });
    if (paletteTextInput) paletteTextInput.addEventListener('input', () => {
      settings.palette = settings.palette || {};
      settings.palette.text = paletteTextInput.value;
      persistSettings(); applyPalette(); updatePalettePreview();
    });
    if (paletteAccentInput) paletteAccentInput.addEventListener('input', () => {
      settings.palette = settings.palette || {};
      settings.palette.accent = paletteAccentInput.value;
      persistSettings(); applyPalette(); updatePalettePreview();
    });
    if (paletteAccentInkInput) paletteAccentInkInput.addEventListener('input', () => {
      settings.palette = settings.palette || {};
      settings.palette.accentInk = paletteAccentInkInput.value;
      persistSettings(); applyPalette(); updatePalettePreview();
    });

  }

  function wireGlobalModalDismiss() {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.modal-overlay.open').forEach((m) => m.classList.remove('open'));
    });
  }

  /* layout mode removed */

  async function init() {
    clockEl = document.getElementById('clock');
    dateEl = document.getElementById('dateLine');
    greetingEl = document.getElementById('greeting');
    searchForm = document.getElementById('searchForm');
    searchInput = document.getElementById('searchInput');

    settingsBtn = document.getElementById('settingsBtn');
    settingsModal = document.getElementById('settingsModal');
    closeSettingsBtn = document.getElementById('closeSettings');

    nameInput = document.getElementById('settingName');
    skySelect = document.getElementById('settingSky');
    clockSelect = document.getElementById('settingClock');
    engineSelect = document.getElementById('settingEngine');
    weekStartSelect = document.getElementById('settingWeekStart');
    grainSelect = document.getElementById('settingGrain');
    paletteSurfaceInput = document.getElementById('paletteSurface');
    paletteTextInput = document.getElementById('paletteText');
    paletteAccentInput = document.getElementById('paletteAccent');
    paletteAccentInkInput = document.getElementById('paletteAccentInk');
    palettePresetsEl = document.getElementById('palettePresets');
    previewDotLarge = document.getElementById('previewDotLarge');
    previewStrip = document.getElementById('previewStrip');

    const stored = await Store.get(SETTINGS_KEY, null);
    settings = stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };

    populateSettingsForm();
    applyPalette();
    renderPalettePresets();
    updatePalettePreview();
    applyGrainSetting();
    updateClock();
    setInterval(updateClock, 10000);

    searchForm.addEventListener('submit', handleSearch);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    wireSettingsInputs();
    wireGlobalModalDismiss();
    searchInput.focus();

    // layout toggle removed

    Sky.init(settings.sky);
    await Links.init();
    await Planner.init();
    await Calendar.init(settings.weekStart);
    await Notes.init();
  }

  function applyGrainSetting() {
    document.body.classList.remove('grain', 'grain-strong');
    const g = settings.grain || 'off';
    if (g === 'subtle') document.body.classList.add('grain');
    if (g === 'strong') document.body.classList.add('grain-strong');
  }

  function renderPalettePresets() {
    if (!palettePresetsEl) return;
    const presets = [
      { name: 'Neutral', surface: '#FFFFFF', text: '#F8F6F9', accent: '#D9D9D9', accentInk: '#141414' },
      { name: 'Warm', surface: '#FFF8F2', text: '#241b14', accent: '#F2C6A0', accentInk: '#2b1508' },
      { name: 'Cool', surface: '#F6FBFF', text: '#0f1724', accent: '#A7E0F0', accentInk: '#062931' },
      { name: 'Night', surface: '#0F1220', text: '#EAE9F0', accent: '#D9D9D9', accentInk: '#141414' },
    ];
    palettePresetsEl.innerHTML = '';
    presets.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-swatch';
      btn.title = p.name;
      btn.style.background = `linear-gradient(90deg, ${p.surface}, ${p.accent})`;
      btn.addEventListener('click', () => {
        settings.palette = { ...p };
        persistSettings();
        populateSettingsForm();
        applyPalette();
        updatePalettePreview();
      });
      palettePresetsEl.appendChild(btn);
    });
  }

  function updatePalettePreview() {
    if (!previewDotLarge || !previewStrip) return;
    const p = settings.palette || DEFAULT_SETTINGS.palette;
    previewDotLarge.style.background = p.surface || DEFAULT_SETTINGS.palette.surface;
    previewStrip.style.background = `linear-gradient(90deg, ${p.accent || DEFAULT_SETTINGS.palette.accent}, ${p.surface || DEFAULT_SETTINGS.palette.surface})`;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
