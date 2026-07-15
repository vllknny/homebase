/**
 * Notes: one quick scratchpad, auto-saved a moment after typing stops.
 */
const Notes = (() => {
  const STORAGE_KEY = 'homebase_notes';
  let textarea, savedBadge, saveTimer;

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await Store.set(STORAGE_KEY, textarea.value);
      flashSaved();
    }, 500);
  }

  function flashSaved() {
    savedBadge.textContent = 'Saved';
    savedBadge.classList.add('show');
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => savedBadge.classList.remove('show'), 1200);
  }

  async function init() {
    textarea = document.getElementById('notesArea');
    savedBadge = document.getElementById('notesSaved');

    textarea.value = await Store.get(STORAGE_KEY, '');
    textarea.addEventListener('input', scheduleSave);
  }

  return { init };
})();
