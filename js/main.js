/**
 * Wires up the clock, greeting, search bar and settings modal, then
 * boots the Sky, Links, Planner, Calendar and Notes modules.
 */
(function () {
  const SETTINGS_KEY = 'homebase_settings';
  const WIDGET_IDS = ['links', 'planner', 'calendar', 'notes', 'quote', 'habits'];
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
    widgets: {
      order: WIDGET_IDS.slice(),
      enabled: { links: true, planner: true, calendar: true, notes: true, quote: false, habits: false },
      collapsed: { links: false, planner: false, calendar: false, notes: false, quote: false, habits: false },
    },
  };

  const WIDGET_DEFS = {
    links: {
      title: 'Quick Links',
      hint: 'Shortcuts to your favorite sites',
      icon: '<circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/>',
    },
    planner: {
      title: 'Planner',
      hint: 'A simple task list',
      icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    },
    calendar: {
      title: 'Calendar',
      hint: 'Month view with day notes',
      icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    },
    notes: {
      title: 'Notes',
      hint: 'One quick scratchpad',
      icon: '<path d="M4 4h16v12H9l-5 5z"/>',
    },
    quote: {
      title: 'Quote',
      hint: 'A quote of the day',
      icon: '<path d="M7 7h4v6H7a2 2 0 0 0 0 4"/><path d="M15 7h4v6h-4a2 2 0 0 0 0 4"/>',
    },
    habits: {
      title: 'Habits',
      hint: 'A daily habit checklist',
      icon: '<path d="M9 11l3 3L22 4"/><path d="M12 2a10 10 0 1 0 9.17 6"/>',
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
    { value: 'brave', label: 'Brave' },
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
  let themeModal, openThemeBtn, closeThemeBtn, backToSettingsBtn;
  let widgetsModal, openWidgetsBtn, closeWidgetsBtn, backToSettingsFromWidgetsBtn, widgetListEl, dashboardEl;
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
    updateWidgetsTriggerSummary();
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
    widgetsModal.addEventListener('click', (e) => {
      if (e.target === widgetsModal) closeWidgets();
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
    dashboardEl = document.getElementById('dashboard');

    settingsBtn = document.getElementById('settingsBtn');
    settingsModal = document.getElementById('settingsModal');
    closeSettingsBtn = document.getElementById('closeSettings');
    themeModal = document.getElementById('themeModal');
    openThemeBtn = document.getElementById('openThemeBtn');
    closeThemeBtn = document.getElementById('closeTheme');
    backToSettingsBtn = document.getElementById('backToSettings');
    widgetsModal = document.getElementById('widgetsModal');
    openWidgetsBtn = document.getElementById('openWidgetsBtn');
    closeWidgetsBtn = document.getElementById('closeWidgets');
    backToSettingsFromWidgetsBtn = document.getElementById('backToSettingsFromWidgets');
    widgetListEl = document.getElementById('widgetList');

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
    // wave motion and widget layout didn't exist yet).
    if (typeof settings.grain !== 'number') {
      const legacyGrain = { off: 0, subtle: 40, strong: 85 };
      settings.grain = legacyGrain[settings.grain] ?? 0;
    }
    if (!settings.wave || typeof settings.wave !== 'object') {
      settings.wave = { ...DEFAULT_SETTINGS.wave };
    } else {
      settings.wave = { ...DEFAULT_SETTINGS.wave, ...settings.wave };
    }
    normalizeWidgetSettings();

    wireSettingsInputs();
    populateSettingsForm();
    applyPalette();
    renderPalettePresets();
    updatePalettePreview();
    applyGrainSetting();
    applyWaveSetting();
    applyWidgetLayout();
    wireCardCollapseButtons();
    wireWidgetList();
    updateWidgetsTriggerSummary();
    updateClock();
    setInterval(updateClock, 10000);

    searchForm.addEventListener('submit', handleSearch);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    openWidgetsBtn.addEventListener('click', openWidgets);
    closeWidgetsBtn.addEventListener('click', closeWidgets);
    backToSettingsFromWidgetsBtn.addEventListener('click', backToSettingsFromWidgets);
    wireGlobalModalDismiss();
    searchInput.focus();

    // layout toggle removed

    Sky.init(settings.sky);
    await Links.init();
    await Planner.init();
    await Calendar.init(settings.weekStart);
    await Notes.init();
    await Quote.init();
    await Habits.init();
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

  /* ----------------------------------------------------------------
     Widgets — dashboard cards can be reordered, hidden, or collapsed.
     Every card always exists in the DOM (each module inits exactly
     once); layout only ever touches CSS `order`/classes so nothing
     needs to be re-initialized when the arrangement changes.
     ---------------------------------------------------------------- */

  function normalizeWidgetSettings() {
    const w = settings.widgets && typeof settings.widgets === 'object' ? settings.widgets : {};
    const order = Array.isArray(w.order) ? w.order.filter((id) => WIDGET_DEFS[id]) : [];
    WIDGET_IDS.forEach((id) => { if (!order.includes(id)) order.push(id); });
    const enabled = {};
    const collapsed = {};
    WIDGET_IDS.forEach((id) => {
      enabled[id] = w.enabled && typeof w.enabled[id] === 'boolean' ? w.enabled[id] : DEFAULT_SETTINGS.widgets.enabled[id];
      collapsed[id] = !!(w.collapsed && w.collapsed[id]);
    });
    settings.widgets = { order, enabled, collapsed };
  }

  function setCardCollapsed(card, collapsed, animate) {
    const wrap = card.querySelector('.card-body-wrap');
    card.classList.toggle('collapsed', collapsed);
    if (!wrap) return;

    if (!animate) {
      wrap.style.maxHeight = collapsed ? '0px' : 'none';
      return;
    }

    if (collapsed) {
      wrap.style.maxHeight = wrap.scrollHeight + 'px';
      // eslint-disable-next-line no-unused-expressions
      wrap.offsetHeight; // force reflow so the browser sees the starting height before we animate
      wrap.style.maxHeight = '0px';
    } else {
      const target = wrap.scrollHeight;
      wrap.style.maxHeight = target + 'px';
      const onEnd = (e) => {
        if (e.propertyName !== 'max-height') return;
        wrap.style.maxHeight = 'none';
        wrap.removeEventListener('transitionend', onEnd);
      };
      wrap.addEventListener('transitionend', onEnd);
    }
  }

  function applyWidgetLayout() {
    if (!dashboardEl) return;
    const { order, enabled, collapsed } = settings.widgets;
    order.forEach((id, index) => {
      const card = dashboardEl.querySelector(`.card[data-widget="${id}"]`);
      if (!card) return;
      card.style.order = index;
      card.classList.toggle('widget-hidden', !enabled[id]);
      setCardCollapsed(card, !!collapsed[id], false);
    });
  }

  function toggleWidgetCollapsed(id) {
    const collapsed = !settings.widgets.collapsed[id];
    settings.widgets.collapsed[id] = collapsed;
    persistSettings();
    const card = dashboardEl.querySelector(`.card[data-widget="${id}"]`);
    if (card) setCardCollapsed(card, collapsed, true);
  }

  function wireCardCollapseButtons() {
    if (!dashboardEl) return;
    dashboardEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.card-collapse-btn');
      if (!btn) return;
      toggleWidgetCollapsed(btn.dataset.widget);
    });
  }

  let widgetDragId = null;

  function renderWidgetList() {
    if (!widgetListEl) return;
    const { order, enabled } = settings.widgets;
    widgetListEl.innerHTML = '';

    order.forEach((id, index) => {
      const def = WIDGET_DEFS[id];
      if (!def) return;
      const row = document.createElement('div');
      row.className = 'widget-row' + (enabled[id] ? '' : ' disabled');
      row.draggable = true;
      row.dataset.id = id;
      row.innerHTML = `
        <span class="widget-drag-handle" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
        </span>
        <span class="widget-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${def.icon}</svg>
        </span>
        <span class="widget-row-label">
          <span class="name">${def.title}</span>
          <span class="hint">${def.hint}</span>
        </span>
        <span class="widget-row-controls">
          <button type="button" class="widget-reorder-btn" data-move="up" aria-label="Move ${def.title} up" ${index === 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button type="button" class="widget-reorder-btn" data-move="down" aria-label="Move ${def.title} down" ${index === order.length - 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <label class="toggle-switch" style="margin-left:6px">
            <input type="checkbox" data-toggle-enabled ${enabled[id] ? 'checked' : ''} aria-label="Show ${def.title}">
            <span class="toggle-slider"></span>
          </label>
        </span>
      `;
      widgetListEl.appendChild(row);
    });

    updateWidgetsTriggerSummary();
  }

  function moveWidget(id, direction) {
    const order = settings.widgets.order;
    const from = order.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    persistSettings();
    applyWidgetLayout();
    renderWidgetList();
  }

  function reorderWidgetTo(id, targetId) {
    if (id === targetId) return;
    const order = settings.widgets.order;
    const from = order.indexOf(id);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return;
    order.splice(from, 1);
    order.splice(to, 0, id);
    persistSettings();
    applyWidgetLayout();
    renderWidgetList();
  }

  function wireWidgetList() {
    if (!widgetListEl) return;

    widgetListEl.addEventListener('click', (e) => {
      const moveBtn = e.target.closest('.widget-reorder-btn');
      if (moveBtn) {
        const row = moveBtn.closest('.widget-row');
        moveWidget(row.dataset.id, moveBtn.dataset.move === 'up' ? -1 : 1);
      }
    });

    widgetListEl.addEventListener('change', (e) => {
      if (!e.target.matches('[data-toggle-enabled]')) return;
      const row = e.target.closest('.widget-row');
      const id = row.dataset.id;
      settings.widgets.enabled[id] = e.target.checked;
      persistSettings();
      applyWidgetLayout();
      renderWidgetList();
    });

    widgetListEl.addEventListener('dragstart', (e) => {
      const row = e.target.closest('.widget-row');
      if (!row) return;
      widgetDragId = row.dataset.id;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', widgetDragId); } catch (err) { /* Safari */ }
    });
    widgetListEl.addEventListener('dragend', (e) => {
      const row = e.target.closest('.widget-row');
      if (row) row.classList.remove('dragging');
      widgetListEl.querySelectorAll('.widget-row.drag-over').forEach((r) => r.classList.remove('drag-over'));
      widgetDragId = null;
    });
    widgetListEl.addEventListener('dragover', (e) => {
      const row = e.target.closest('.widget-row');
      if (!row || !widgetDragId || row.dataset.id === widgetDragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      widgetListEl.querySelectorAll('.widget-row.drag-over').forEach((r) => { if (r !== row) r.classList.remove('drag-over'); });
      row.classList.add('drag-over');
    });
    widgetListEl.addEventListener('dragleave', (e) => {
      const row = e.target.closest('.widget-row');
      if (row) row.classList.remove('drag-over');
    });
    widgetListEl.addEventListener('drop', (e) => {
      const row = e.target.closest('.widget-row');
      if (!row || !widgetDragId) return;
      e.preventDefault();
      row.classList.remove('drag-over');
      reorderWidgetTo(widgetDragId, row.dataset.id);
    });
  }

  function updateWidgetsTriggerSummary() {
    const nameEl = document.getElementById('widgetsTriggerName');
    const hintEl = document.getElementById('widgetsTriggerHint');
    if (!nameEl || !hintEl) return;
    const total = settings.widgets.order.length;
    const activeCount = settings.widgets.order.filter((id) => settings.widgets.enabled[id]).length;
    nameEl.textContent = 'Manage widgets';
    hintEl.textContent = `${activeCount} of ${total} shown`;
  }

  function openWidgets() {
    closeSettings();
    renderWidgetList();
    widgetsModal.classList.add('open');
  }
  function closeWidgets() {
    widgetsModal.classList.remove('open');
  }
  function backToSettingsFromWidgets() {
    closeWidgets();
    openSettings();
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
