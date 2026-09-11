/* ============================================================
   LIFE DASHBOARD — script.js
   ============================================================ */

/* ------------------------------------------------------------
   SECTION 1: GREETING & CLOCK
   ------------------------------------------------------------ */

/**
 * Returns a greeting string based on the given hour (0–23).
 * If a name is provided, appends it: "Good Morning, Adzra!"
 * @param {number} hour
 * @param {string} [name]
 * @returns {string}
 */
function getGreeting(hour, name) {
  let base;
  if (hour >= 5 && hour < 12)       base = 'Good Morning';
  else if (hour >= 12 && hour < 18) base = 'Good Afternoon';
  else                               base = 'Good Evening';

  return name ? `${base}, ${name}!` : `${base}!`;
}

/**
 * Formats a Date object into a 24-hour time string: HH:MM:SS
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Formats a Date object into a readable English date string.
 * Example: Friday, September 11, 2026
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

/**
 * Reads the current time, updates the DOM elements for time,
 * date, and greeting. Called once per second by setInterval.
 */
function updateClock() {
  const now  = new Date();
  const hour = now.getHours();

  // Update time display
  elCurrentTime.textContent = formatTime(now);

  // Update date display
  elCurrentDate.textContent = formatDate(now);

  // Update greeting — includes saved name when available
  const greeting = getGreeting(hour, currentName);
  if (elGreetingText.textContent !== greeting) {
    elGreetingText.textContent = greeting;
  }
}

// Cache DOM references — queried once to avoid repeated lookups
const elGreetingText = document.getElementById('greeting-text');
const elCurrentTime  = document.getElementById('current-time');
const elCurrentDate  = document.getElementById('current-date');

// Holds the user's saved name; populated by Section 6 before updateClock runs
let currentName = '';

// Run immediately so there is no blank flash on load, then tick every second
// NOTE: actual start is deferred to the bottom of the file so the saved name
// is loaded first, ensuring the very first render already includes the name.
// updateClock() and setInterval(updateClock, 1000) are called at the end.

/* ------------------------------------------------------------
   SECTION 2: FOCUS TIMER
   ------------------------------------------------------------ */

const TIMER_DURATION = 25 * 60; // 25 minutes in seconds

// Internal state
let timerSeconds   = TIMER_DURATION; // remaining time in seconds
let timerIntervalId = null;          // holds the setInterval ID, or null when stopped

// DOM references
const elTimerMinutes = document.getElementById('timer-minutes');
const elTimerSeconds = document.getElementById('timer-seconds');
const elBtnStart     = document.getElementById('btn-start');
const elBtnStop      = document.getElementById('btn-stop');
const elBtnReset     = document.getElementById('btn-reset');

/**
 * Renders the current timerSeconds value into the two display spans.
 */
function renderTimer() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  elTimerMinutes.textContent = String(mins).padStart(2, '0');
  elTimerSeconds.textContent = String(secs).padStart(2, '0');
}

/**
 * Clears the active interval, setting timerIntervalId back to null.
 * Safe to call even when no interval is running.
 */
function clearTimer() {
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

/**
 * Starts the countdown. Ignored if the timer is already running,
 * preventing duplicate intervals from multiple Start clicks.
 */
function startTimer() {
  // Already running — do nothing
  if (timerIntervalId !== null) return;

  // Already at zero — do nothing
  if (timerSeconds <= 0) return;

  timerIntervalId = setInterval(() => {
    timerSeconds -= 1;
    renderTimer();

    // Auto-stop when countdown reaches zero
    if (timerSeconds <= 0) {
      clearTimer();
    }
  }, 1000);
}

/**
 * Pauses the countdown at its current time.
 */
function stopTimer() {
  clearTimer();
}

/**
 * Stops the countdown and resets the display back to 25:00.
 */
function resetTimer() {
  clearTimer();
  timerSeconds = TIMER_DURATION;
  renderTimer();
}

// Wire up button events
elBtnStart.addEventListener('click', startTimer);
elBtnStop.addEventListener('click', stopTimer);
elBtnReset.addEventListener('click', resetTimer);

// Render the initial 25:00 display on page load
renderTimer();

/* ------------------------------------------------------------
   SECTION 3: TO-DO LIST
   ------------------------------------------------------------ */

const TODO_STORAGE_KEY = 'lifedashboard_todos';

// DOM references
const elTodoForm  = document.getElementById('todo-form');
const elTodoInput = document.getElementById('todo-input');
const elTodoList  = document.getElementById('todo-list');
const elTodoSort  = document.getElementById('todo-sort');

/* ---------- Storage helpers --------------------------------- */

/**
 * Reads the tasks array from Local Storage.
 * Returns an empty array if nothing is stored yet.
 * @returns {Array<{id: string, text: string, done: boolean}>}
 */
function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Persists the given tasks array to Local Storage.
 * @param {Array<{id: string, text: string, done: boolean}>} todos
 */
function saveTodos(todos) {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

/* ---------- ID generator ------------------------------------ */

/**
 * Generates a simple unique ID using the current timestamp
 * combined with a random number.
 * @returns {string}
 */
function generateId() {
  return `todo-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/* ---------- Rendering --------------------------------------- */

/**
 * Builds and returns a <li> element for a single task object.
 * All interactivity is handled via event delegation on #todo-list,
 * but each element carries a data-id attribute for look-up.
 *
 * @param {{id: string, text: string, done: boolean}} todo
 * @returns {HTMLLIElement}
 */
function createTodoItem(todo) {
  const li = document.createElement('li');
  li.className = 'todo-item' + (todo.done ? ' done' : '');
  li.dataset.id = todo.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked = todo.done;
  checkbox.setAttribute('aria-label', 'Mark task as done');

  // Task text
  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text;

  // Edit button
  const btnEdit = document.createElement('button');
  btnEdit.type = 'button';
  btnEdit.className = 'btn-edit-todo';
  btnEdit.textContent = 'Edit';

  // Delete button
  const btnDelete = document.createElement('button');
  btnDelete.type = 'button';
  btnDelete.className = 'btn-delete-todo';
  btnDelete.textContent = 'Delete';

  li.append(checkbox, span, btnEdit, btnDelete);
  return li;
}

/**
 * Returns a sorted copy of the todos array based on the current
 * value of #todo-sort. The original array is never mutated so
 * storage order is always preserved.
 * @param {Array<{id: string, text: string, done: boolean}>} todos
 * @returns {Array<{id: string, text: string, done: boolean}>}
 */
function getSortedTodos(todos) {
  const order = elTodoSort.value;
  const copy  = [...todos];   // shallow copy — do not sort in place

  if (order === 'az') {
    copy.sort((a, b) => a.text.localeCompare(b.text));
  } else if (order === 'za') {
    copy.sort((a, b) => b.text.localeCompare(a.text));
  } else if (order === 'done') {
    // Completed (done === true) floats to the top
    copy.sort((a, b) => Number(b.done) - Number(a.done));
  }
  // 'default' — no sort, original order kept

  return copy;
}

/**
 * Clears #todo-list and re-renders every task from the given array,
 * applying the currently selected sort order.
 * @param {Array<{id: string, text: string, done: boolean}>} todos
 */
function renderTodos(todos) {
  elTodoList.innerHTML = '';
  getSortedTodos(todos).forEach(todo => elTodoList.appendChild(createTodoItem(todo)));
}

/* ---------- Task operations --------------------------------- */

/**
 * Adds a new task, saves it, and re-renders the list.
 * @param {string} text
 */
function addTodo(text) {
  const todos = loadTodos();
  todos.push({ id: generateId(), text, done: false });
  saveTodos(todos);
  renderTodos(todos);
}

/**
 * Toggles the done state for the task with the given ID.
 * @param {string} id
 */
function toggleTodo(id) {
  const todos = loadTodos();
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos(todos);
    renderTodos(todos);
  }
}

/**
 * Prompts the user to enter new text for the task with the given ID.
 * Ignores the edit if the user cancels or submits an empty string.
 * @param {string} id
 */
function editTodo(id) {
  const todos = loadTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const newText = prompt('Edit task:', todo.text);
  if (newText === null) return;          // user cancelled
  const trimmed = newText.trim();
  if (trimmed === '') return;            // empty input — ignore

  todo.text = trimmed;
  saveTodos(todos);
  renderTodos(todos);
}

/**
 * Removes the task with the given ID from storage and re-renders.
 * @param {string} id
 */
function deleteTodo(id) {
  const todos = loadTodos().filter(t => t.id !== id);
  saveTodos(todos);
  renderTodos(todos);
}

/* ---------- Event listeners --------------------------------- */

// Submit form → add task
elTodoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = elTodoInput.value.trim();
  if (text === '') return;    // prevent empty tasks
  addTodo(text);
  elTodoInput.value = '';
  elTodoInput.focus();
});

// Event delegation on the list for checkbox, edit, and delete
elTodoList.addEventListener('click', (e) => {
  const li = e.target.closest('.todo-item');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('.todo-checkbox')) {
    toggleTodo(id);
  } else if (e.target.matches('.btn-edit-todo')) {
    editTodo(id);
  } else if (e.target.matches('.btn-delete-todo')) {
    deleteTodo(id);
  }
});

// Re-render when the sort option changes (storage is untouched)
elTodoSort.addEventListener('change', () => {
  renderTodos(loadTodos());
});

/* ---------- Init -------------------------------------------- */

// Load and render saved tasks when the page first opens
renderTodos(loadTodos());

/* ------------------------------------------------------------
   SECTION 4: QUICK LINKS
   ------------------------------------------------------------ */

const LINKS_STORAGE_KEY = 'lifedashboard_links';

// DOM references
const elQuicklinksForm   = document.getElementById('quicklinks-form');
const elLinkLabelInput   = document.getElementById('link-label-input');
const elLinkUrlInput     = document.getElementById('link-url-input');
const elQuicklinksList   = document.getElementById('quicklinks-list');

/* ---------- Storage helpers --------------------------------- */

/**
 * Reads the links array from Local Storage.
 * Returns an empty array if nothing is stored yet.
 * @returns {Array<{id: string, label: string, url: string}>}
 */
function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem(LINKS_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Persists the given links array to Local Storage.
 * @param {Array<{id: string, label: string, url: string}>} links
 */
function saveLinks(links) {
  localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
}

/* ---------- ID generator ------------------------------------ */

/**
 * Generates a unique ID for a quick link.
 * @returns {string}
 */
function generateLinkId() {
  return `link-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/* ---------- Rendering --------------------------------------- */

/**
 * Builds and returns a <li> element for a single link object.
 * @param {{id: string, label: string, url: string}} link
 * @returns {HTMLLIElement}
 */
function createLinkItem(link) {
  const li = document.createElement('li');
  li.className = 'quicklink-item';
  li.dataset.id = link.id;

  // Anchor — opens in a new tab, safe with noopener noreferrer
  const anchor = document.createElement('a');
  anchor.className = 'quicklink-anchor';
  anchor.href = link.url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.textContent = link.label;

  // Delete button
  const btnDelete = document.createElement('button');
  btnDelete.type = 'button';
  btnDelete.className = 'btn-delete-link';
  btnDelete.textContent = '✕';
  btnDelete.setAttribute('aria-label', `Delete link: ${link.label}`);

  li.append(anchor, btnDelete);
  return li;
}

/**
 * Clears #quicklinks-list and re-renders every link from the given array.
 * @param {Array<{id: string, label: string, url: string}>} links
 */
function renderLinks(links) {
  elQuicklinksList.innerHTML = '';
  links.forEach(link => elQuicklinksList.appendChild(createLinkItem(link)));
}

/* ---------- Link operations --------------------------------- */

/**
 * Adds a new quick link, saves it, and re-renders the list.
 * @param {string} label
 * @param {string} url
 */
function addLink(label, url) {
  const links = loadLinks();
  links.push({ id: generateLinkId(), label, url });
  saveLinks(links);
  renderLinks(links);
}

/**
 * Removes the link with the given ID from storage and re-renders.
 * @param {string} id
 */
function deleteLink(id) {
  const links = loadLinks().filter(l => l.id !== id);
  saveLinks(links);
  renderLinks(links);
}

/* ---------- Event listeners --------------------------------- */

// Submit form → add link
elQuicklinksForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const label = elLinkLabelInput.value.trim();
  const url   = elLinkUrlInput.value.trim();

  // Prevent empty label or URL (type="url" handles URL format validation)
  if (label === '' || url === '') return;

  addLink(label, url);

  // Clear inputs and return focus to the label field
  elLinkLabelInput.value = '';
  elLinkUrlInput.value   = '';
  elLinkLabelInput.focus();
});

// Event delegation on the list for the delete button
elQuicklinksList.addEventListener('click', (e) => {
  if (!e.target.matches('.btn-delete-link')) return;
  const li = e.target.closest('.quicklink-item');
  if (!li) return;
  deleteLink(li.dataset.id);
});

/* ---------- Init -------------------------------------------- */

// Load and render saved links when the page first opens
renderLinks(loadLinks());

/* ------------------------------------------------------------
   SECTION 5: LIGHT / DARK MODE TOGGLE
   ------------------------------------------------------------ */

const THEME_STORAGE_KEY = 'lifedashboard_theme';
const DARK_CLASS        = 'dark-mode';

// DOM reference
const elThemeToggle = document.getElementById('theme-toggle');

/**
 * Updates the toggle button's visible label and aria-label
 * to reflect the CURRENT active theme.
 * @param {boolean} isDark
 */
function updateToggleButton(isDark) {
  if (isDark) {
    elThemeToggle.textContent  = '☀️ Light';
    elThemeToggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    elThemeToggle.textContent  = '🌙 Dark';
    elThemeToggle.setAttribute('aria-label', 'Switch to dark mode');
  }
}

/**
 * Applies the given theme to the document and persists it.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle(DARK_CLASS, isDark);
  updateToggleButton(isDark);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Reads the saved theme from Local Storage and applies it.
 * Defaults to 'light' if nothing is stored.
 */
function loadTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  applyTheme(saved);
}

// Clicking the button toggles between light and dark
elThemeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains(DARK_CLASS);
  applyTheme(isDark ? 'light' : 'dark');
});

/* ---------- Init -------------------------------------------- */

// Apply saved (or default) theme before the first paint
loadTheme();

/* ------------------------------------------------------------
   SECTION 6: CUSTOM NAME IN GREETING
   ------------------------------------------------------------ */

const NAME_STORAGE_KEY = 'lifedashboard_name';

// DOM references
const elNameInput = document.getElementById('name-input');
const elSaveName  = document.getElementById('save-name');

/**
 * Persists the name, updates the module-level currentName variable,
 * and forces an immediate greeting refresh.
 * @param {string} name  — already trimmed
 */
function applyName(name) {
  currentName = name;
  localStorage.setItem(NAME_STORAGE_KEY, name);
  // Force greeting to re-render right away (don't wait for next tick)
  elGreetingText.textContent = getGreeting(new Date().getHours(), currentName);
}

/**
 * Reads the saved name from Local Storage.
 * If a name exists, pre-fills the input and applies it to the greeting.
 */
function loadName() {
  const saved = localStorage.getItem(NAME_STORAGE_KEY) || '';
  if (saved) {
    currentName       = saved;
    elNameInput.value = saved;
    // updateClock will pick it up on the next tick; set greeting now too
    elGreetingText.textContent = getGreeting(new Date().getHours(), currentName);
  }
}

// Save name on button click
elSaveName.addEventListener('click', () => {
  const trimmed = elNameInput.value.trim();
  if (trimmed === '') return;   // reject blank / spaces-only
  applyName(trimmed);
});

// Also allow pressing Enter inside the input
elNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const trimmed = elNameInput.value.trim();
    if (trimmed === '') return;
    applyName(trimmed);
  }
});

/* ---------- Init -------------------------------------------- */

// Load name BEFORE starting the clock so the very first render
// already includes the saved name — no one-second blank/wrong greeting.
loadName();
updateClock();
setInterval(updateClock, 1000);
