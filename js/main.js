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
    grain: 0,
    wave: { enabled: true, intensity: 45 },
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

  const SKY_OPTIONS = [
    { value: 'auto', label: 'Auto — follow the time of day' },
    { value: 'dawn', label: 'Dawn' },
    { value: 'morning', label: 'Morning' },
    { value: 'midday', label: 'Midday' },
    { value: 'dusk', label: 'Dusk' },
    { value: 'evening', label: 'Evening' },
    { value: 'night', label: 'Night' },
  ];
  const CLOCK_OPTIONS = [
    { value: '12', label: '12-hour' },
    { value: '24', label: '24-hour' },
  ];
  const ENGINE_OPTIONS = [
    { value: 'google', label: 'Google' },
    { value: 'duckduckgo', label: 'DuckDuckGo' },
    { value: 'bing', label: 'Bing' },
    { value: 'startpage', label: 'Startpage' },
  ];
  const WEEK_START_OPTIONS = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
  ];

  let settings = { ...DEFAULT_SETTINGS };

  let clockEl, dateEl, greetingEl, searchForm, searchInput;
  let settingsBtn, settingsModal, closeSettingsBtn;
  let nameInput;
  let skyDropdown, clockDropdown, engineDropdown, weekStartDropdown;
  let grainInput, grainValueEl;
  let waveContainer, waveEnabledInput, waveIntensityInput, waveIntensityValueEl, waveIntensityField;
  let paletteSurfaceInput, paletteTextInput, paletteAccentInput, paletteAccentInkInput;
  let palettePresetsEl, previewDotLarge, previewStrip;

  /**
   * A small custom dropdown ("listbox") that replaces bare native
   * <select> elements so it can be styled to match the rest of the UI.
   * Mounts into the element with id `id`, which should be an empty
   * `.dropdown` container.
   */
  function createDropdown({ id, options, value, onChange }) {
    const root = document.getElementById(id);
    if (!root) return null;
    root.classList.add('dropdown');
    root.innerHTML = `
      <button type="button" class="dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
        <span class="dropdown-value"></span>
        <svg class="dropdown-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="dropdown-panel" role="listbox" tabindex="-1"></div>
    `;
    const trigger = root.querySelector('.dropdown-trigger');
    const valueEl = root.querySelector('.dropdown-value');
    const panel = root.querySelector('.dropdown-panel');

    let current = value;
    let focusIndex = 0;

    function setLabel() {
      const found = options.find((o) => o.value === current);
      valueEl.textContent = found ? found.label : '';
    }

    function renderOptions() {
      panel.innerHTML = '';
      options.forEach((opt) => {
        const item = document.createElement('div');
        item.className = 'dropdown-option' + (opt.value === current ? ' selected' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', opt.value === current ? 'true' : 'false');
        const label = document.createElement('span');
        label.textContent = opt.label;
        const check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        check.setAttribute('class', 'check');
        check.setAttribute('viewBox', '0 0 24 24');
        check.setAttribute('width', '14');
        check.setAttribute('height', '14');
        check.setAttribute('fill', 'none');
        check.setAttribute('stroke', 'currentColor');
        check.setAttribute('stroke-width', '2.4');
        check.setAttribute('stroke-linecap', 'round');
        check.setAttribute('stroke-linejoin', 'round');
        check.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        item.appendChild(label);
        item.appendChild(check);
        item.addEventListener('click', () => { select(opt.value); close(); trigger.focus(); });
        panel.appendChild(item);
      });
    }

    function select(val) {
      if (val === current) return;
      current = val;
      setLabel();
      renderOptions();
      onChange(val);
    }

    function focusItem(i) {
      const items = panel.querySelectorAll('.dropdown-option');
      focusIndex = Math.max(0, Math.min(items.length - 1, i));
      items.forEach((it, idx) => it.classList.toggle('active-focus', idx === focusIndex));
      items[focusIndex] && items[focusIndex].scrollIntoView({ block: 'nearest' });
    }

    function open() {
      document.querySelectorAll('.dropdown.open').forEach((d) => { if (d !== root) d.classList.remove('open'); });
      root.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      focusItem(Math.max(0, options.findIndex((o) => o.value === current)));
    }
    function close() {
      root.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function toggle() { root.classList.contains('open') ? close() : open(); }

    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (e) => {
      const isOpen = root.classList.contains('open');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen) { open(); } else { focusItem(focusIndex + 1); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) { open(); } else { focusItem(focusIndex - 1); }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isOpen) { select(options[focusIndex].value); close(); } else { open(); }
      } else if (e.key === 'Escape') {
        if (isOpen) { e.preventDefault(); close(); }
      } else if (e.key === 'Tab') {
        close();
      }
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) close();
    });

    renderOptions();
    setLabel();

    return {
      setValue(val) { current = val; setLabel(); renderOptions(); },
      getValue() { return current; },
    };
  }

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
    if (skyDropdown) skyDropdown.setValue(settings.sky);
    if (clockDropdown) clockDropdown.setValue(settings.clock);
    if (engineDropdown) engineDropdown.setValue(settings.engine);
    if (weekStartDropdown) weekStartDropdown.setValue(settings.weekStart);
    if (grainInput) {
      grainInput.value = settings.grain || 0;
      if (grainValueEl) grainValueEl.textContent = `${grainInput.value}%`;
    }
    if (waveEnabledInput) waveEnabledInput.checked = !!(settings.wave && settings.wave.enabled);
    if (waveIntensityInput) {
      waveIntensityInput.value = (settings.wave && settings.wave.intensity) || 0;
      if (waveIntensityValueEl) waveIntensityValueEl.textContent = `${waveIntensityInput.value}%`;
    }
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

    skyDropdown = createDropdown({
      id: 'settingSky',
      options: SKY_OPTIONS,
      value: settings.sky,
      onChange: (val) => {
        settings.sky = val;
        persistSettings();
        Sky.setOverride(settings.sky);
      },
    });
    clockDropdown = createDropdown({
      id: 'settingClock',
      options: CLOCK_OPTIONS,
      value: settings.clock,
      onChange: (val) => {
        settings.clock = val;
        persistSettings();
        updateClock();
      },
    });
    engineDropdown = createDropdown({
      id: 'settingEngine',
      options: ENGINE_OPTIONS,
      value: settings.engine,
      onChange: (val) => {
        settings.engine = val;
        persistSettings();
      },
    });
    weekStartDropdown = createDropdown({
      id: 'settingWeekStart',
      options: WEEK_START_OPTIONS,
      value: settings.weekStart,
      onChange: (val) => {
        settings.weekStart = val;
        persistSettings();
        Calendar.setWeekStart(settings.weekStart);
      },
    });

    grainInput.addEventListener('input', () => {
      settings.grain = Number(grainInput.value);
      if (grainValueEl) grainValueEl.textContent = `${grainInput.value}%`;
      applyGrainSetting();
    });
    grainInput.addEventListener('change', persistSettings);

    waveEnabledInput.addEventListener('change', () => {
      settings.wave = settings.wave || { ...DEFAULT_SETTINGS.wave };
      settings.wave.enabled = waveEnabledInput.checked;
      persistSettings();
      applyWaveSetting();
    });
    waveIntensityInput.addEventListener('input', () => {
      settings.wave = settings.wave || { ...DEFAULT_SETTINGS.wave };
      settings.wave.intensity = Number(waveIntensityInput.value);
      if (waveIntensityValueEl) waveIntensityValueEl.textContent = `${waveIntensityInput.value}%`;
      applyWaveSetting();
    });
    waveIntensityInput.addEventListener('change', persistSettings);

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
    grainInput = document.getElementById('settingGrain');
    grainValueEl = document.getElementById('settingGrainValue');
    waveContainer = document.getElementById('skyWaves');
    waveEnabledInput = document.getElementById('settingWaveEnabled');
    waveIntensityInput = document.getElementById('settingWaveIntensity');
    waveIntensityValueEl = document.getElementById('settingWaveIntensityValue');
    waveIntensityField = document.getElementById('waveIntensityField');
    paletteSurfaceInput = document.getElementById('paletteSurface');
    paletteTextInput = document.getElementById('paletteText');
    paletteAccentInput = document.getElementById('paletteAccent');
    paletteAccentInkInput = document.getElementById('paletteAccentInk');
    palettePresetsEl = document.getElementById('palettePresets');
    previewDotLarge = document.getElementById('previewDotLarge');
    previewStrip = document.getElementById('previewStrip');

    const stored = await Store.get(SETTINGS_KEY, null);
    settings = stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };

    // Migrate legacy settings shapes (grain used to be off/subtle/strong;
    // wave motion didn't exist yet).
    if (typeof settings.grain !== 'number') {
      const legacyGrain = { off: 0, subtle: 40, strong: 85 };
      settings.grain = legacyGrain[settings.grain] ?? 0;
    }
    if (!settings.wave || typeof settings.wave !== 'object') {
      settings.wave = { ...DEFAULT_SETTINGS.wave };
    } else {
      settings.wave = { ...DEFAULT_SETTINGS.wave, ...settings.wave };
    }

    wireSettingsInputs();
    populateSettingsForm();
    applyPalette();
    renderPalettePresets();
    updatePalettePreview();
    applyGrainSetting();
    applyWaveSetting();
    updateClock();
    setInterval(updateClock, 10000);

    searchForm.addEventListener('submit', handleSearch);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
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
    document.body.classList.add('grain');
    const pct = Math.max(0, Math.min(100, Number(settings.grain) || 0));
    document.body.style.setProperty('--grain-opacity', (pct / 100 * 0.85).toFixed(3));
  }

  function applyWaveSetting() {
    const wave = settings.wave || DEFAULT_SETTINGS.wave;
    const enabled = !!wave.enabled;
    if (waveContainer) waveContainer.style.display = enabled ? '' : 'none';
    if (waveIntensityField) waveIntensityField.style.opacity = enabled ? '1' : '.4';
    if (waveIntensityInput) waveIntensityInput.disabled = !enabled;

    const pct = Math.max(0, Math.min(100, Number(wave.intensity) || 0));
    const opacity = (0.12 + (pct / 100) * 0.55).toFixed(3);
    const speedBack = (34 - (pct / 100) * 22).toFixed(1) + 's';
    const speedFront = (22 - (pct / 100) * 14).toFixed(1) + 's';
    document.body.style.setProperty('--wave-opacity', enabled ? opacity : '0');
    document.body.style.setProperty('--wave-speed-back', speedBack);
    document.body.style.setProperty('--wave-speed-front', speedFront);
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
