/**
 * Living sky: picks a palette mode from the current hour (or a manual
 * override from Settings) and crossfades between two stacked scene
 * layers whenever the mode changes.
 */
const Sky = (() => {
  const MODES = ['dawn', 'morning', 'midday', 'dusk', 'evening', 'night'];
  let sceneA, sceneB, activeEl, inactiveEl;
  let currentMode = null;
  let overrideMode = 'auto';

  function modeForHour(hour) {
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 16) return 'midday';
    if (hour >= 16 && hour < 19) return 'dusk';
    if (hour >= 19 && hour < 22) return 'evening';
    return 'night';
  }

  function targetMode() {
    if (overrideMode && overrideMode !== 'auto' && MODES.includes(overrideMode)) {
      return overrideMode;
    }
    return modeForHour(new Date().getHours());
  }

  function applyMode(mode, force) {
    if (mode === currentMode && !force) return;
    currentMode = mode;
    document.body.setAttribute('data-sky', mode);

    // Paint the hidden layer with the new mode, then crossfade it in.
    inactiveEl.setAttribute('data-sky', mode);
    requestAnimationFrame(() => {
      inactiveEl.classList.add('active');
      activeEl.classList.remove('active');
      const tmp = activeEl;
      activeEl = inactiveEl;
      inactiveEl = tmp;
    });
  }

  function tick() {
    applyMode(targetMode(), false);
  }

  function setOverride(mode) {
    overrideMode = mode || 'auto';
    applyMode(targetMode(), true);
  }

  function init(initialOverride) {
    sceneA = document.getElementById('sceneA');
    sceneB = document.getElementById('sceneB');
    activeEl = sceneA;
    inactiveEl = sceneB;
    overrideMode = initialOverride || 'auto';

    const initial = targetMode();
    currentMode = initial;
    document.body.setAttribute('data-sky', initial);
    sceneA.setAttribute('data-sky', initial);
    sceneB.setAttribute('data-sky', initial);
    sceneA.classList.add('active');

    // Re-check every few minutes; the crossfade only fires on an actual change.
    setInterval(tick, 3 * 60 * 1000);
  }

  return { init, setOverride, MODES };
})();
