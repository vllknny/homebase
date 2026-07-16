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
    { value: 'brave', label: 'Brave' },
  ];
  const WEEK_START_OPTIONS = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
  ];

  let settings = { ...DEFAULT_SETTINGS };

  let clockEl, dateEl, greetingEl, searchForm, searchInput;
  let settingsBtn, settingsModal, closeSettingsBtn;
  let themeModal, openThemeBtn, closeThemeBtn, backToSettingsBtn;
  let nameInput;
  let skyDropdown, clockDropdown, engineDropdown, weekStartDropdown;
  let grainInput, grainValueEl;
  let waveContainer, waveEnabledInput, waveIntensityInput, waveIntensityValueEl, waveIntensityField;
  let palettePresetsEl, previewDotLarge, previewStrip, triggerPreviewDot, triggerPreviewName;
  let surfaceSwatch, textSwatch, accentSwatch, accentInkSwatch;

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

  /**
   * A small custom color-picker popover (SV square + hue slider + hex
   * input) that replaces the native OS color dialog so it matches the
   * rest of the UI. Mounts one shared popover element and repositions/
   * retargets it per swatch button on open.
   */
  let colorPopoverEl = null;
  let colorPopoverState = null;

  function ensureColorPopover() {
    if (colorPopoverEl) return colorPopoverEl;
    colorPopoverEl = document.createElement('div');
    colorPopoverEl.className = 'color-popover';
    colorPopoverEl.innerHTML = `
      <div class="sv-square"><div class="sv-square-thumb"></div></div>
      <input type="range" class="hue-slider" min="0" max="360" step="1" value="0" aria-label="Hue">
      <div class="color-popover-row">
        <div class="color-popover-preview"></div>
        <input type="text" class="hex-input" maxlength="7" spellcheck="false" aria-label="Hex color">
      </div>
    `;
    document.body.appendChild(colorPopoverEl);

    const svSquare = colorPopoverEl.querySelector('.sv-square');
    const svThumb = colorPopoverEl.querySelector('.sv-square-thumb');
    const hueSlider = colorPopoverEl.querySelector('.hue-slider');
    const preview = colorPopoverEl.querySelector('.color-popover-preview');
    const hexInput = colorPopoverEl.querySelector('.hex-input');

    let hsv = { h: 0, s: 0, v: 1 };

    function emit(hex) {
      if (colorPopoverState && colorPopoverState.onChange) colorPopoverState.onChange(hex);
    }

    function render() {
      const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
      const hex = rgbToHex(r, g, b);
      const pure = hsvToRgb(hsv.h, 1, 1);
      svSquare.style.backgroundColor = rgbToHex(pure.r, pure.g, pure.b);
      svThumb.style.left = `${hsv.s * 100}%`;
      svThumb.style.top = `${(1 - hsv.v) * 100}%`;
      hueSlider.value = hsv.h;
      preview.style.background = hex;
      if (document.activeElement !== hexInput) hexInput.value = hex.toUpperCase();
      return hex;
    }

    function setFromHex(hex, silent) {
      const { r, g, b } = hexToRgb(hex);
      hsv = rgbToHsv(r, g, b);
      const outHex = render();
      if (!silent) emit(outHex);
    }

    function setFromPointer(clientX, clientY) {
      const rect = svSquare.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      hsv.s = x;
      hsv.v = 1 - y;
      emit(render());
    }

    let dragging = false;
    svSquare.addEventListener('pointerdown', (e) => {
      dragging = true;
      svSquare.setPointerCapture(e.pointerId);
      setFromPointer(e.clientX, e.clientY);
    });
    svSquare.addEventListener('pointermove', (e) => { if (dragging) setFromPointer(e.clientX, e.clientY); });
    svSquare.addEventListener('pointerup', () => { dragging = false; });

    hueSlider.addEventListener('input', () => {
      hsv.h = Number(hueSlider.value);
      emit(render());
    });

    hexInput.addEventListener('input', () => {
      const val = hexInput.value.trim();
      if (/^#?[0-9a-fA-F]{6}$/.test(val)) {
        setFromHex(val.startsWith('#') ? val : '#' + val);
      }
    });

    document.addEventListener('pointerdown', (e) => {
      if (!colorPopoverEl.classList.contains('open')) return;
      if (colorPopoverEl.contains(e.target)) return;
      if (colorPopoverState && colorPopoverState.triggerEl && colorPopoverState.triggerEl.contains(e.target)) return;
      closeColorPopover();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && colorPopoverEl.classList.contains('open')) closeColorPopover();
    });

    colorPopoverEl._setFromHex = setFromHex;
    return colorPopoverEl;
  }

  function closeColorPopover() {
    if (!colorPopoverEl) return;
    colorPopoverEl.classList.remove('open');
    if (colorPopoverState && colorPopoverState.triggerEl) colorPopoverState.triggerEl.classList.remove('active');
    colorPopoverState = null;
  }

  function openColorPopover(triggerEl, hex, onChange) {
    const popover = ensureColorPopover();
    if (colorPopoverState && colorPopoverState.triggerEl) colorPopoverState.triggerEl.classList.remove('active');
    colorPopoverState = { triggerEl, onChange };
    triggerEl.classList.add('active');
    popover._setFromHex(hex, true);
    const rect = triggerEl.getBoundingClientRect();
    const popW = 232;
    let left = rect.left;
    let top = rect.bottom + 10;
    if (left + popW > window.innerWidth - 16) left = window.innerWidth - popW - 16;
    if (top + 300 > window.innerHeight - 16) top = rect.top - 300 - 10;
    popover.style.left = `${Math.max(16, left)}px`;
    popover.style.top = `${Math.max(16, top)}px`;
    popover.classList.add('open');
  }

  /** Wires a `.color-swatch-btn` to open the shared popover and persist changes. */
  function createColorSwatch({ buttonId, get, set }) {
    const btn = document.getElementById(buttonId);
    if (!btn) return null;
    function refresh() { btn.style.background = get(); }
    btn.addEventListener('click', () => {
      openColorPopover(btn, get(), (hex) => {
        set(hex);
        refresh();
      });
    });
    refresh();
    return { refresh };
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

  function hexToRgb(hex) {
    const clean = (hex || '#ffffff').trim().replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const intValue = parseInt(full, 16);
    if (Number.isNaN(intValue)) return { r: 255, g: 255, b: 255 };
    return { r: (intValue >> 16) & 255, g: (intValue >> 8) & 255, b: intValue & 255 };
  }

  function rgbToHex(r, g, b) {
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
  }

  function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  }

  // Relative luminance (WCAG), used to decide whether a chosen text color
  // needs a light "glass" underneath it or a dark one to stay readable.
  function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function applyPalette() {
    const palette = settings.palette || DEFAULT_SETTINGS.palette;
    const textColor = palette.text || DEFAULT_SETTINGS.palette.text;
    const surfaceColor = palette.surface || DEFAULT_SETTINGS.palette.surface;
    const accentColor = palette.accent || DEFAULT_SETTINGS.palette.accent;
    const accentInkColor = palette.accentInk || DEFAULT_SETTINGS.palette.accentInk;

    // Cards and panels sit as translucent "glass" over the ever-changing
    // sky. Light text reads fine on the usual dark glass, but dark text
    // needs the glass itself to turn light and much more opaque to keep
    // enough contrast — so we scale everything off the text color's
    // luminance rather than using one fixed set of alphas.
    const lum = relativeLuminance(textColor);
    const lightMode = lum < 0.5;
    const depth = lightMode ? Math.min(1, (0.5 - lum) / 0.5) : Math.min(1, (lum - 0.5) / 0.5);

    document.body.classList.toggle('theme-light-text', lightMode);
    document.body.style.setProperty('--accent', accentColor);
    document.body.style.setProperty('--accent-ink', accentInkColor);
    document.body.style.setProperty('--text', textColor);
    document.body.style.setProperty('--text-dim', hexToRgba(textColor, .94));
    document.body.style.setProperty('--text-faint', hexToRgba(textColor, .78));

    if (lightMode) {
      // Frosted *light* glass: opaque enough that dark text is legible.
      document.body.style.setProperty('--surface', hexToRgba(surfaceColor, 0.72 + depth * 0.22));
      document.body.style.setProperty('--surface-hover', hexToRgba(surfaceColor, 0.84 + depth * 0.14));
      document.body.style.setProperty('--surface-border', hexToRgba('#000000', 0.1));
      document.body.style.setProperty('--surface-strong', hexToRgba(surfaceColor, 0.9 + depth * 0.08));
      document.body.style.setProperty('--surface-muted', hexToRgba(surfaceColor, 0.88));
      document.body.style.setProperty('--panel-bg-1', hexToRgba(surfaceColor, 0.97));
      document.body.style.setProperty('--panel-bg-2', hexToRgba('#ffffff', 0.94));
      document.body.style.setProperty('--panel-border', hexToRgba('#000000', 0.1));
      document.body.style.setProperty('--panel-hover', hexToRgba('#000000', 0.06));
      document.body.style.setProperty('--panel-input-bg', hexToRgba('#000000', 0.04));
      document.body.style.setProperty('--hero-shadow', '0 1px 3px rgba(255,255,255,.9), 0 2px 22px rgba(255,255,255,.55)');
    } else {
      // Frosted *dark* glass, the original look.
      document.body.style.setProperty('--surface', hexToRgba(surfaceColor, .08));
      document.body.style.setProperty('--surface-hover', hexToRgba(surfaceColor, .12));
      document.body.style.setProperty('--surface-border', hexToRgba(surfaceColor, .18));
      document.body.style.setProperty('--surface-strong', hexToRgba(surfaceColor, .16));
      document.body.style.setProperty('--surface-muted', hexToRgba(surfaceColor, .72));
      document.body.style.setProperty('--panel-bg-1', 'rgba(30, 32, 40, .98)');
      document.body.style.setProperty('--panel-bg-2', 'rgba(15, 16, 23, .98)');
      document.body.style.setProperty('--panel-border', 'rgba(255, 255, 255, .14)');
      document.body.style.setProperty('--panel-hover', 'rgba(255, 255, 255, .08)');
      document.body.style.setProperty('--panel-input-bg', 'rgba(255, 255, 255, .06)');
      document.body.style.setProperty('--hero-shadow', '0 2px 20px rgba(0,0,0,.35)');
    }
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
    if (surfaceSwatch) surfaceSwatch.refresh();
    if (textSwatch) textSwatch.refresh();
    if (accentSwatch) accentSwatch.refresh();
    if (accentInkSwatch) accentInkSwatch.refresh();
  }

  function openSettings() {
    settingsModal.classList.add('open');
  }
  function closeSettings() {
    settingsModal.classList.remove('open');
  }
  function openTheme() {
    closeColorPopover();
    closeSettings();
    themeModal.classList.add('open');
  }
  function closeTheme() {
    closeColorPopover();
    themeModal.classList.remove('open');
  }
  function backToSettingsFromTheme() {
    closeTheme();
    openSettings();
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

    surfaceSwatch = createColorSwatch({
      buttonId: 'paletteSurfaceBtn',
      get: () => (settings.palette && settings.palette.surface) || DEFAULT_SETTINGS.palette.surface,
      set: (hex) => {
        settings.palette = settings.palette || {};
        settings.palette.surface = hex;
        persistSettings(); applyPalette(); updatePalettePreview();
      },
    });
    textSwatch = createColorSwatch({
      buttonId: 'paletteTextBtn',
      get: () => (settings.palette && settings.palette.text) || DEFAULT_SETTINGS.palette.text,
      set: (hex) => {
        settings.palette = settings.palette || {};
        settings.palette.text = hex;
        persistSettings(); applyPalette(); updatePalettePreview();
      },
    });
    accentSwatch = createColorSwatch({
      buttonId: 'paletteAccentBtn',
      get: () => (settings.palette && settings.palette.accent) || DEFAULT_SETTINGS.palette.accent,
      set: (hex) => {
        settings.palette = settings.palette || {};
        settings.palette.accent = hex;
        persistSettings(); applyPalette(); updatePalettePreview();
      },
    });
    accentInkSwatch = createColorSwatch({
      buttonId: 'paletteAccentInkBtn',
      get: () => (settings.palette && settings.palette.accentInk) || DEFAULT_SETTINGS.palette.accentInk,
      set: (hex) => {
        settings.palette = settings.palette || {};
        settings.palette.accentInk = hex;
        persistSettings(); applyPalette(); updatePalettePreview();
      },
    });

    openThemeBtn.addEventListener('click', openTheme);
    closeThemeBtn.addEventListener('click', closeTheme);
    backToSettingsBtn.addEventListener('click', backToSettingsFromTheme);
  }

  function wireGlobalModalDismiss() {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettings();
    });
    themeModal.addEventListener('click', (e) => {
      if (e.target === themeModal) closeTheme();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeColorPopover();
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
    themeModal = document.getElementById('themeModal');
    openThemeBtn = document.getElementById('openThemeBtn');
    closeThemeBtn = document.getElementById('closeTheme');
    backToSettingsBtn = document.getElementById('backToSettings');

    nameInput = document.getElementById('settingName');
    grainInput = document.getElementById('settingGrain');
    grainValueEl = document.getElementById('settingGrainValue');
    waveContainer = document.getElementById('skyWaves');
    waveEnabledInput = document.getElementById('settingWaveEnabled');
    waveIntensityInput = document.getElementById('settingWaveIntensity');
    waveIntensityValueEl = document.getElementById('settingWaveIntensityValue');
    waveIntensityField = document.getElementById('waveIntensityField');
    palettePresetsEl = document.getElementById('palettePresets');
    previewDotLarge = document.getElementById('previewDotLarge');
    previewStrip = document.getElementById('previewStrip');
    triggerPreviewDot = document.getElementById('triggerPreviewDot');
    triggerPreviewName = document.getElementById('triggerPreviewName');

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

  const PALETTE_PRESETS = [
    { name: 'Neutral', surface: '#FFFFFF', text: '#F8F6F9', accent: '#D9D9D9', accentInk: '#141414' },
    { name: 'Night', surface: '#0F1220', text: '#EAE9F0', accent: '#D9D9D9', accentInk: '#141414' },
    { name: 'Warm', surface: '#FFF8F2', text: '#241b14', accent: '#F2C6A0', accentInk: '#2b1508' },
    { name: 'Cool', surface: '#F6FBFF', text: '#0f1724', accent: '#A7E0F0', accentInk: '#062931' },
    { name: 'Amber', surface: '#1A120B', text: '#F5E6D3', accent: '#E8A34D', accentInk: '#241205' },
    { name: 'Slate', surface: '#10151F', text: '#E7ECF3', accent: '#8FA6C7', accentInk: '#0B1220' },
    { name: 'Rose', surface: '#FFF5F7', text: '#3a1420', accent: '#EFAFC1', accentInk: '#3a0f1a' },
    { name: 'Sage', surface: '#F4F7F2', text: '#1f2b1a', accent: '#AEC79B', accentInk: '#17240f' },
    { name: 'Lavender', surface: '#F7F5FC', text: '#241832', accent: '#C2AAE8', accentInk: '#1C1228' },
    { name: 'Mono Light', surface: '#FFFFFF', text: '#141414', accent: '#C7C7C7', accentInk: '#141414' },
  ];

  function paletteEquals(a, b) {
    return a && b && a.surface === b.surface && a.text === b.text && a.accent === b.accent && a.accentInk === b.accentInk;
  }

  function renderPalettePresets() {
    if (!palettePresetsEl) return;
    palettePresetsEl.innerHTML = '';
    PALETTE_PRESETS.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-swatch-btn';
      if (paletteEquals(settings.palette, p)) btn.classList.add('active');
      btn.innerHTML = `<span class="preset-swatch" style="background: linear-gradient(135deg, ${p.surface}, ${p.accent})"></span><span class="preset-name">${p.name}</span>`;
      btn.addEventListener('click', () => {
        settings.palette = { ...p };
        persistSettings();
        populateSettingsForm();
        applyPalette();
        updatePalettePreview();
        renderPalettePresets();
      });
      palettePresetsEl.appendChild(btn);
    });
  }

  function updatePalettePreview() {
    const p = settings.palette || DEFAULT_SETTINGS.palette;
    const surface = p.surface || DEFAULT_SETTINGS.palette.surface;
    const accent = p.accent || DEFAULT_SETTINGS.palette.accent;
    const matched = PALETTE_PRESETS.find((preset) => paletteEquals(p, preset));
    if (previewDotLarge) previewDotLarge.style.background = surface;
    if (previewStrip) previewStrip.style.background = `linear-gradient(90deg, ${accent}, ${surface})`;
    if (triggerPreviewDot) triggerPreviewDot.style.background = `linear-gradient(135deg, ${surface}, ${accent})`;
    if (triggerPreviewName) triggerPreviewName.textContent = matched ? matched.name : 'Custom';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
