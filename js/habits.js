/**
 * Habits: a small set of daily habits with checkboxes that reset every
 * day. Storage shape: { habits: [{ id, text }], doneByDate: { 'YYYY-MM-DD': [id, ...] } }.
 * Old dates are pruned on load so storage doesn't grow forever.
 */
const Habits = (() => {
  const STORAGE_KEY = 'homebase_habits';
  const KEEP_DAYS = 30;

  let data = { habits: [], doneByDate: {} };
  let list, form, input, progressBadge, emptyNote;

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function pruneOldDates() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
    Object.keys(data.doneByDate).forEach((key) => {
      const d = new Date(key + 'T00:00:00');
      if (Number.isNaN(d.getTime()) || d < cutoff) delete data.doneByDate[key];
    });
  }

  async function persist() {
    await Store.set(STORAGE_KEY, data);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    const key = todayKey();
    const doneToday = data.doneByDate[key] || [];

    list.innerHTML = '';
    data.habits.forEach((habit) => {
      const done = doneToday.includes(habit.id);
      const li = document.createElement('li');
      li.className = 'task-item' + (done ? ' done' : '');
      li.dataset.id = habit.id;
      li.innerHTML = `
        <button type="button" class="chk" aria-label="${done ? 'Mark not done today' : 'Mark done today'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <button type="button" class="txt">${escapeHtml(habit.text)}</button>
        <button type="button" class="del-x" aria-label="Remove habit" title="Remove">×</button>
      `;
      list.appendChild(li);
    });

    progressBadge.textContent = data.habits.length ? `${doneToday.length}/${data.habits.length} today` : '';
    if (emptyNote) emptyNote.style.display = data.habits.length ? 'none' : '';
  }

  function toggleDone(id) {
    const key = todayKey();
    const doneToday = new Set(data.doneByDate[key] || []);
    if (doneToday.has(id)) doneToday.delete(id);
    else doneToday.add(id);
    data.doneByDate[key] = Array.from(doneToday);
  }

  function handleListClick(e) {
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.closest('.del-x')) {
      data.habits = data.habits.filter((h) => h.id !== id);
      persist();
      render();
      return;
    }

    if (e.target.closest('.chk') || e.target.closest('.txt')) {
      toggleDone(id);
      persist();
      render();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    data.habits.push({ id: 'h' + Date.now(), text });
    input.value = '';
    persist();
    render();
  }

  async function init() {
    list = document.getElementById('habitList');
    form = document.getElementById('habitForm');
    input = document.getElementById('habitInput');
    progressBadge = document.getElementById('habitProgress');
    emptyNote = document.getElementById('habitEmpty');

    const stored = await Store.get(STORAGE_KEY, null);
    data = stored && stored.habits ? stored : { habits: [], doneByDate: {} };
    pruneOldDates();

    form.addEventListener('submit', handleSubmit);
    list.addEventListener('click', handleListClick);

    render();
    await persist();
  }

  return { init };
})();