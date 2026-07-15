/**
 * Calendar: a compact month view. Events are stored as
 * { 'YYYY-MM-DD': ['event text', ...] }. Clicking a day opens a
 * small modal to view/add/remove events for that date.
 */
const Calendar = (() => {
  const STORAGE_KEY = 'homebase_events';
  const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  let events = {};
  let viewYear, viewMonth; // month is 0-indexed
  let weekStart = 0;
  let selectedKey = null;

  let grid, weekdayRow, title, prevBtn, nextBtn;
  let modal, modalTitle, eventsList, emptyNote, eventForm, eventInput, closeBtn;

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async function persist() {
    await Store.set(STORAGE_KEY, events);
  }

  function buildCells(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const startDow = firstOfMonth.getDay();
    const leadBlanks = (startDow - weekStart + 7) % 7;

    const cells = [];
    for (let i = leadBlanks; i > 0; i--) {
      cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i + 1), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }

  function renderWeekdayRow() {
    const rotated = WEEKDAY_LABELS.slice(weekStart).concat(WEEKDAY_LABELS.slice(0, weekStart));
    weekdayRow.innerHTML = rotated.map((l) => `<span>${l}</span>`).join('');
  }

  function render() {
    title.textContent = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    renderWeekdayRow();

    const todayKey = dateKey(new Date());
    const cells = buildCells(viewYear, viewMonth);

    grid.innerHTML = '';
    cells.forEach(({ date, inMonth }) => {
      const key = dateKey(date);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day-cell' + (inMonth ? '' : ' other-month') + (key === todayKey ? ' today' : '');
      btn.setAttribute('aria-label', date.toDateString());

      const num = document.createElement('span');
      num.textContent = date.getDate();
      btn.appendChild(num);

      if (events[key] && events[key].length) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        btn.appendChild(dot);
      }

      btn.addEventListener('click', () => openDay(key, date));
      grid.appendChild(btn);
    });
  }

  function openDay(key, date) {
    selectedKey = key;
    modalTitle.textContent = date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
    renderDayEvents();
    eventInput.value = '';
    modal.classList.add('open');
    setTimeout(() => eventInput.focus(), 50);
  }

  function renderDayEvents() {
    const dayEvents = events[selectedKey] || [];
    eventsList.innerHTML = '';
    dayEvents.forEach((text, index) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = text;
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = '×';
      del.setAttribute('aria-label', 'Remove event');
      del.addEventListener('click', () => removeEvent(index));
      li.appendChild(span);
      li.appendChild(del);
      eventsList.appendChild(li);
    });
    emptyNote.style.display = dayEvents.length ? 'none' : 'block';
  }

  function removeEvent(index) {
    events[selectedKey].splice(index, 1);
    if (!events[selectedKey].length) delete events[selectedKey];
    persist();
    renderDayEvents();
    render();
  }

  function handleEventSubmit(e) {
    e.preventDefault();
    const text = eventInput.value.trim();
    if (!text) return;
    if (!events[selectedKey]) events[selectedKey] = [];
    events[selectedKey].push(text);
    eventInput.value = '';
    persist();
    renderDayEvents();
    render();
  }

  function closeModal() {
    modal.classList.remove('open');
  }

  function setWeekStart(value) {
    weekStart = Number(value) || 0;
    render();
  }

  function goToToday() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
  }

  async function init(initialWeekStart) {
    grid = document.getElementById('calendarGrid');
    weekdayRow = document.getElementById('weekdayRow');
    title = document.getElementById('calendarTitle');
    prevBtn = document.getElementById('prevMonth');
    nextBtn = document.getElementById('nextMonth');

    modal = document.getElementById('dayModal');
    modalTitle = document.getElementById('dayModalTitle');
    eventsList = document.getElementById('dayEventsList');
    emptyNote = document.getElementById('dayEmptyNote');
    eventForm = document.getElementById('dayEventForm');
    eventInput = document.getElementById('dayEventInput');
    closeBtn = document.getElementById('closeDayModal');

    weekStart = Number(initialWeekStart) || 0;
    events = await Store.get(STORAGE_KEY, {});
    goToToday();

    prevBtn.addEventListener('click', () => {
      viewMonth -= 1;
      if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
      render();
    });
    nextBtn.addEventListener('click', () => {
      viewMonth += 1;
      if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
      render();
    });

    eventForm.addEventListener('submit', handleEventSubmit);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    render();
  }

  return { init, setWeekStart };
})();
