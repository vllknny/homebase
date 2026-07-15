/**
 * Planner: a lightweight task list. [{ id, text, done }, ...]
 * Uses event delegation on the list so re-renders stay cheap.
 */
const Planner = (() => {
  const STORAGE_KEY = 'homebase_tasks';
  let tasks = [];
  let list, form, input, countBadge;

  async function persist() {
    await Store.set(STORAGE_KEY, tasks);
  }

  function render() {
    list.innerHTML = '';

    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      li.innerHTML = `
        <button type="button" class="chk" aria-label="${task.done ? 'Mark not done' : 'Mark done'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <button type="button" class="txt">${escapeHtml(task.text)}</button>
        <button type="button" class="del-x" aria-label="Delete task" title="Delete">×</button>
      `;
      list.appendChild(li);
    });

    const remaining = tasks.filter((t) => !t.done).length;
    countBadge.textContent = tasks.length ? `${remaining} of ${tasks.length} left` : '';
    list.closest('.card-planner').classList.toggle('is-empty', tasks.length === 0);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function handleListClick(e) {
    const li = e.target.closest('.task-item');
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.closest('.del-x')) {
      tasks = tasks.filter((t) => t.id !== id);
      persist();
      render();
      return;
    }

    if (e.target.closest('.chk') || e.target.closest('.txt')) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        task.done = !task.done;
        persist();
        render();
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    tasks.push({ id: 't' + Date.now(), text, done: false });
    input.value = '';
    persist();
    render();
  }

  async function init() {
    list = document.getElementById('taskList');
    form = document.getElementById('taskForm');
    input = document.getElementById('taskInput');
    countBadge = document.getElementById('taskCount');

    tasks = await Store.get(STORAGE_KEY, []);

    form.addEventListener('submit', handleSubmit);
    list.addEventListener('click', handleListClick);

    // planner background toggle removed

    render();
  }

  return { init };
})();
