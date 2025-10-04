const NIGHT_HOURS = Array.from({ length: 5 }, (_, index) => 19 + index); // 19:00 to 23:00
const EARLY_HOURS = Array.from({ length: 8 }, (_, index) => index); // 00:00 to 07:00
const HOURS = [...NIGHT_HOURS, ...EARLY_HOURS];

const INITIAL_ACTIVITIES = sortActivities([
  { id: "activity-1", name: "Drink a glass of water", duration: 2 },
  { id: "activity-2", name: "Brush your teeth", duration: 3 },
  { id: "activity-3", name: "Plan your top priorities", duration: 6 },
  { id: "activity-4", name: "Stretch or mobility routine", duration: 10 },
  { id: "activity-5", name: "Tidy up your workspace", duration: 12 },
  { id: "activity-6", name: "Cook a light meal", duration: 20 },
  { id: "activity-7", name: "Wash your car", duration: 30 },
  { id: "activity-8", name: "Grocery run", duration: 35 },
  { id: "activity-9", name: "Workout session", duration: 45 },
  { id: "activity-10", name: "Deep clean a room", duration: 50 },
  { id: "activity-11", name: "Do homework or focused study", duration: 60 },
  { id: "activity-12", name: "Meal prep for the week", duration: 80 }
]);

let activityIdCounter = INITIAL_ACTIVITIES.length;

const STATE = {
  currentView: "day",
  selectedDate: stripTime(new Date()),
  viewDate: null,
  hasManualSelection: false,
  activities: [...INITIAL_ACTIVITIES],
  selectedActivityId: null,
  allocationHint: "",
  allocations: {} // { dateKey: { hour: { id, name, duration } } }
};

const viewContainer = document.getElementById("view-container");
const viewButtons = document.querySelectorAll(".view-button");
const navButtons = document.querySelectorAll(".nav-button");
const dateIndicator = document.querySelector(".date-indicator");
const suggestionList = document.getElementById("suggestion-list");
const suggestionsCaption = document.querySelector(".suggestions-caption");
const allocationHintEl = document.getElementById("allocation-hint");
const activityForm = document.getElementById("custom-activity-form");
const activityNameInput = document.getElementById("activity-name");
const activityDurationInput = document.getElementById("activity-duration");

STATE.viewDate = getViewAnchor(STATE.selectedDate, STATE.currentView);
render();

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetView = button.dataset.view;
    if (targetView && targetView !== STATE.currentView) {
      setView(targetView);
    }
  });
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (!action) return;

    if (action === "today") {
      setSelectedDate(new Date(), { fromUser: true });
      return;
    }

    const delta = action === "prev" ? -1 : 1;
    if (STATE.currentView === "day") {
      setSelectedDate(addDays(STATE.selectedDate, delta), { fromUser: true });
    } else if (STATE.currentView === "week") {
      setSelectedDate(addDays(STATE.selectedDate, delta * 7), { fromUser: true });
    } else {
      setSelectedDate(addMonths(STATE.selectedDate, delta), { fromUser: true });
    }
  });
});

activityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = activityNameInput.value.trim();
  const duration = Number(activityDurationInput.value);

  if (!name || !Number.isFinite(duration) || duration <= 0) {
    setAllocationHint("Enter a name and a duration greater than zero minutes.");
    return;
  }

  activityIdCounter += 1;
  const newActivity = {
    id: `activity-${activityIdCounter}`,
    name,
    duration: Math.round(duration)
  };

  STATE.activities.push(newActivity);
  STATE.activities = sortActivities(STATE.activities);
  STATE.selectedActivityId = newActivity.id;
  setAllocationHint(`"${newActivity.name}" ready. Click a time slot between 19:00 and 07:00 to schedule it.`);

  activityForm.reset();
  activityNameInput.focus();
  renderSuggestions();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && STATE.selectedActivityId) {
    STATE.selectedActivityId = null;
    setAllocationHint("Selection cleared. Choose an activity to schedule or click a slot to remove an entry.");
    renderSuggestions();
  }
});

function setView(view) {
  STATE.currentView = view;
  STATE.viewDate = getViewAnchor(STATE.selectedDate, view);
  render();
}

function setSelectedDate(date, options = {}) {
  const normalized = stripTime(date);
  if (Number.isNaN(normalized.getTime())) return;

  STATE.selectedDate = normalized;
  STATE.viewDate = getViewAnchor(normalized, STATE.currentView);

  if (options.fromUser) {
    STATE.hasManualSelection = true;
    if (!options.preserveHint) {
      STATE.allocationHint = "";
      allocationHintEl.textContent = "";
    }
  }

  render();
}

function render() {
  viewContainer.innerHTML = "";

  if (STATE.currentView === "day") {
    viewContainer.appendChild(renderDayView());
  } else if (STATE.currentView === "week") {
    viewContainer.appendChild(renderWeekView());
  } else {
    viewContainer.appendChild(renderMonthView());
  }

  dateIndicator.textContent = formatIndicator();
  updateViewButtons();
  renderSuggestions();
}

function renderDayView() {
  const wrapper = document.createElement("div");
  wrapper.className = "day-view";

  const header = document.createElement("div");
  header.className = "day-header";

  const headerLeft = document.createElement("div");
  headerLeft.className = "day-header-left";
  headerLeft.innerHTML = `
    <span>${formatWeekdayLong(STATE.selectedDate)}</span>
    <span>${formatDateWithoutWeekday(STATE.selectedDate)}</span>
  `;

  const picker = document.createElement("label");
  picker.className = "date-picker";
  picker.innerHTML = `
    <span class="visually-hidden">Pick a day</span>
    <input type="date" value="${formatForInput(STATE.selectedDate)}" aria-label="Select a day">
  `;

  const input = picker.querySelector("input");
  input.addEventListener("change", (event) => {
    if (event.target.value) {
      setSelectedDate(new Date(event.target.value), { fromUser: true });
    }
  });

  header.append(headerLeft, picker);
  wrapper.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "day-grid";

  const allocations = getAllocationsForDate(STATE.selectedDate);

  HOURS.forEach((hour) => {
    const label = document.createElement("div");
    label.className = "time-label";
    label.textContent = formatHour(hour);

    const slot = document.createElement("div");
    slot.className = "slot-content";
    slot.dataset.hour = String(hour);
    populateDaySlot(slot, allocations[String(hour)], hour, STATE.selectedDate);

    slot.addEventListener("click", () => handleSlotSelection(STATE.selectedDate, hour));

    grid.append(label, slot);
  });

  wrapper.appendChild(grid);
  return wrapper;
}

function renderWeekView() {
  const wrapper = document.createElement("div");
  wrapper.className = "week-view";
  const weekStart = getViewAnchor(STATE.viewDate, "week");

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = addDays(weekStart, dayOffset);
    const dateKey = formatDateKey(date);
    const allocations = STATE.allocations[dateKey] || {};

    const column = document.createElement("div");
    column.className = "week-day";

    const header = document.createElement("div");
    header.className = "week-day-header";
    header.dataset.date = dateKey;
    header.innerHTML = `
      <strong ${isToday(date) ? 'class="is-today"' : ""}>${formatWeekdayShort(date)}</strong>
      <span>${formatDayAndMonth(date)}</span>
    `;

    if (isSameDay(date, STATE.selectedDate)) {
      header.classList.add("is-selected");
    }

    header.addEventListener("click", () => setSelectedDate(date, { fromUser: true }));
    column.appendChild(header);

    const hours = document.createElement("div");
    hours.className = "week-hours";

    HOURS.forEach((hour) => {
      const slot = document.createElement("div");
      slot.className = "week-hour-slot";
      slot.dataset.hour = String(hour);

      const activity = allocations[String(hour)];
      populateWeekSlot(slot, activity, hour);

      slot.addEventListener("click", () => {
        setSelectedDate(date, { fromUser: true, preserveHint: true });
        handleSlotSelection(date, hour);
      });

      hours.appendChild(slot);
    });

    column.appendChild(hours);
    wrapper.appendChild(column);
  }

  return wrapper;
}

function renderMonthView() {
  const wrapper = document.createElement("div");
  wrapper.className = "month-view";

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  dayNames.forEach((name) => {
    const dayNameEl = document.createElement("div");
    dayNameEl.className = "month-day-name";
    dayNameEl.textContent = name;
    wrapper.appendChild(dayNameEl);
  });

  const firstOfMonth = getViewAnchor(STATE.viewDate, "month");
  const month = firstOfMonth.getMonth();
  const year = firstOfMonth.getFullYear();

  const leadingEmptyDays = (firstOfMonth.getDay() + 6) % 7; // Monday first
  for (let i = 0; i < leadingEmptyDays; i += 1) {
    wrapper.appendChild(document.createElement("div"));
  }

  const daysInCurrentMonth = daysInMonth(year, month);

  for (let day = 1; day <= daysInCurrentMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);

    const cell = document.createElement("div");
    cell.className = "month-day";
    cell.dataset.date = dateKey;

    if (isSameDay(date, STATE.selectedDate)) {
      cell.classList.add("is-selected");
    }

    const dayNumber = document.createElement("span");
    dayNumber.className = `month-day-number ${isToday(date) ? "is-today" : ""}`;
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);

    cell.addEventListener("click", () => setSelectedDate(date, { fromUser: true }));
    wrapper.appendChild(cell);
  }

  return wrapper;
}

function populateDaySlot(slot, activity, hour, date) {
  const label = formatHour(hour);
  if (activity) {
    slot.classList.add("is-filled");
    slot.textContent = "";
    const nameEl = document.createElement("span");
    nameEl.className = "scheduled-name";
    nameEl.textContent = activity.name;

    const durationEl = document.createElement("span");
    durationEl.className = "scheduled-duration";
    durationEl.textContent = formatDuration(activity.duration);

    slot.append(nameEl, durationEl);
    slot.title = `${activity.name} at ${label} on ${formatFullDate(date)}`;
  } else {
    slot.classList.remove("is-filled");
    slot.textContent = "";
    const placeholder = document.createElement("span");
    placeholder.className = "slot-placeholder";
    placeholder.textContent = "Available";
    slot.appendChild(placeholder);
    slot.title = `Available slot at ${label}`;
  }
}

function populateWeekSlot(slot, activity, hour) {
  const label = formatHour(hour);
  if (activity) {
    slot.classList.add("is-filled");
    slot.textContent = "";
    const timeEl = document.createElement("span");
    timeEl.className = "week-slot-time";
    timeEl.textContent = label;

    const nameEl = document.createElement("span");
    nameEl.className = "week-slot-name";
    nameEl.textContent = activity.name;

    slot.append(timeEl, nameEl);
    slot.title = `${activity.name} at ${label}`;
  } else {
    slot.classList.remove("is-filled");
    slot.textContent = label;
    slot.title = `Available slot at ${label}`;
  }
}

function updateViewButtons() {
  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === STATE.currentView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function renderSuggestions() {
  suggestionList.innerHTML = "";

  if (!STATE.hasManualSelection) {
    suggestionsCaption.textContent = "Select a day to see ideas sorted from quickest to longest.";
    const idle = document.createElement("li");
    idle.className = "empty-state";
    idle.textContent = "Choose a day in the agenda to get started.";
    suggestionList.appendChild(idle);
    if (!STATE.allocationHint) {
      setAllocationHint("Pick any day to explore evening activities.");
    }
    return;
  }

  const friendlyDate = formatFullDate(STATE.selectedDate);
  suggestionsCaption.textContent = `Ideas for ${friendlyDate} (shortest to longest).`;

  STATE.activities.forEach((activity) => {
    const item = document.createElement("li");
    item.dataset.activityId = activity.id;
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    if (STATE.selectedActivityId === activity.id) {
      item.classList.add("is-active");
    }
    item.setAttribute("aria-pressed", STATE.selectedActivityId === activity.id ? "true" : "false");

    const name = document.createElement("span");
    name.className = "activity-name";
    name.textContent = activity.name;

    const duration = document.createElement("span");
    duration.className = "activity-duration";
    duration.textContent = formatDuration(activity.duration);

    item.append(name, duration);

    item.addEventListener("click", () => toggleActivitySelection(activity.id));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleActivitySelection(activity.id);
      }
    });

    suggestionList.appendChild(item);
  });

  if (!STATE.allocationHint) {
    setAllocationHint("Select an activity, then click a time slot between 19:00 and 07:00 to schedule it.");
  }
}

function toggleActivitySelection(activityId) {
  if (STATE.selectedActivityId === activityId) {
    STATE.selectedActivityId = null;
    setAllocationHint("Selection cleared. Choose another activity or click a scheduled slot to remove it.");
  } else {
    STATE.selectedActivityId = activityId;
    const activity = findActivity(activityId);
    if (activity) {
      setAllocationHint(`Click a time slot between 19:00 and 07:00 to schedule "${activity.name}".`);
    }
  }
  renderSuggestions();
}

function handleSlotSelection(date, hour) {
  const dateKey = formatDateKey(date);
  if (!STATE.allocations[dateKey]) {
    STATE.allocations[dateKey] = {};
  }
  const allocations = STATE.allocations[dateKey];
  const hourKey = String(hour);

  if (STATE.selectedActivityId) {
    const activity = findActivity(STATE.selectedActivityId);
    if (!activity) {
      setAllocationHint("Activity unavailable. Please choose another option.");
      return;
    }
    allocations[hourKey] = { id: activity.id, name: activity.name, duration: activity.duration };
    setAllocationHint(`"${activity.name}" scheduled at ${formatHour(hour)}.`);
    STATE.selectedActivityId = null;
    render();
    return;
  }

  if (allocations[hourKey]) {
    const removed = allocations[hourKey];
    delete allocations[hourKey];
    setAllocationHint(`Removed "${removed.name}" from ${formatHour(hour)}.`);
    render();
    return;
  }

  setAllocationHint("Select an activity first, then choose a time slot between 19:00 and 07:00.");
}

function setAllocationHint(message) {
  if (STATE.allocationHint === message) return;
  STATE.allocationHint = message;
  allocationHintEl.textContent = message;
}

function findActivity(activityId) {
  return STATE.activities.find((activity) => activity.id === activityId) || null;
}

function getAllocationsForDate(date) {
  const dateKey = formatDateKey(date);
  return STATE.allocations[dateKey] || {};
}

function formatIndicator() {
  if (STATE.currentView === "day") {
    return formatFullDate(STATE.selectedDate);
  }
  if (STATE.currentView === "week") {
    const start = getViewAnchor(STATE.viewDate, "week");
    const end = addDays(start, 6);
    if (start.getFullYear() === end.getFullYear()) {
      if (start.getMonth() === end.getMonth()) {
        return `${formatDayAndMonth(start)} – ${formatDayNumber(end)}, ${start.getFullYear()}`;
      }
      return `${formatDayAndMonth(start)} – ${formatDayAndMonth(end)}, ${start.getFullYear()}`;
    }
    return `${formatDayAndMonth(start)}, ${start.getFullYear()} – ${formatDayAndMonth(end)}, ${end.getFullYear()}`;
  }
  const monthAnchor = getViewAnchor(STATE.viewDate, "month");
  return `${formatMonthName(monthAnchor)} ${monthAnchor.getFullYear()}`;
}

function getViewAnchor(date, view) {
  if (view === "day") {
    return stripTime(date);
  }
  if (view === "week") {
    return startOfWeek(date);
  }
  if (view === "month") {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  return stripTime(date);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return stripTime(result);
}

function addMonths(date, months) {
  const result = new Date(date);
  const currentDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = daysInMonth(result.getFullYear(), result.getMonth());
  result.setDate(Math.min(currentDay, lastDay));
  return stripTime(result);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function startOfWeek(date) {
  const result = stripTime(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday first
  result.setDate(result.getDate() + diff);
  return result;
}

function formatWeekdayLong(date) {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function formatWeekdayShort(date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatFullDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateWithoutWeekday(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function formatDayAndMonth(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDayNumber(date) {
  return date.toLocaleDateString(undefined, { day: "numeric" });
}

function formatMonthName(date) {
  return date.toLocaleDateString(undefined, { month: "long" });
}

function formatForInput(date) {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
}

function formatDateKey(date) {
  return formatForInput(date);
}

function formatHour(hour) {
  const normalizedHour = hour < 0 ? (24 + (hour % 24)) % 24 : hour % 24;
  return `${pad(normalizedHour)}:00`;
}

function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }
  return `${hours} hr ${remaining} min`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function sortActivities(list) {
  return [...list].sort((a, b) => {
    if (a.duration !== b.duration) {
      return a.duration - b.duration;
    }
    return a.name.localeCompare(b.name);
  });
}

function isToday(date) {
  return isSameDay(date, stripTime(new Date()));
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
