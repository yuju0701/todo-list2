// 상수 정의
const SELECTORS = {
  userInput: ".task-input",
  addButton: ".button-add",
  tabs: ".tab-type div",
  underLine: "tab-underline",
  dueDateModal: "dueDateModal",
  dueDateInput: "dueDateInput",
  saveDueDateButton: "saveDueDate",
  reminderModal: "reminderModal",
  reminderInput: "reminderInput",
  saveReminderButton: "saveReminder",
  alertSound: "alertSound",
  taskBoard: "task-board",
  menuIcon: "menu-icon",
  sidebar: "sidebar",
  menuItems: ".menu-item",
  clearReminder: "clearReminder",
  clearDueDate: "clearDueDate",
  calendarIcon: ".fa-calendar-day",
  calendarContainer: "calendarContainer",
  mainContainer: ".container",
  closeCalendarButton: "closeCalendar",
  deletedIcon: "deleted-icon",
  deletedContainer: "deletedContainer",
  closeDeletedButton: "closeDeleted",
  deletedTasksContainer: ".my-deleted"
};

let currentTaskId = null;
let currentTaskReminderId = null;
let scheduledReminders = {};
let taskList = [];
let mode = "all";
let filterList = [];

const userInput = document.querySelector(SELECTORS.userInput);
const addButton = document.querySelector(SELECTORS.addButton);
const tabs = document.querySelectorAll(SELECTORS.tabs);
const underLine = document.getElementById(SELECTORS.underLine);
const dueDateModal = new bootstrap.Modal(document.getElementById(SELECTORS.dueDateModal), {});
const dueDateInput = document.getElementById(SELECTORS.dueDateInput);
const saveDueDateButton = document.getElementById(SELECTORS.saveDueDateButton);
const reminderModal = new bootstrap.Modal(document.getElementById(SELECTORS.reminderModal), {});
const reminderInput = document.getElementById(SELECTORS.reminderInput);
const saveReminderButton = document.getElementById(SELECTORS.saveReminderButton);
const alertSound = document.getElementById(SELECTORS.alertSound);

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  addButton.addEventListener("mousedown", addTask);
  document.getElementById(SELECTORS.clearReminder).addEventListener('click', () => reminderInput.value = '');
  document.getElementById(SELECTORS.clearDueDate).addEventListener('click', () => dueDateInput.value = '');
  userInput.addEventListener("keydown", event => { if (event.keyCode === 13) addTask(event); });
  tabs.forEach(tab => tab.addEventListener("click", filter));
  saveDueDateButton.addEventListener("click", saveDueDate);
  saveReminderButton.addEventListener("click", saveReminder);

  initializeSidebar();
  initializeCalendar();
  initializeReminders();
  initializeDeletedContainer();
}

function initializeSidebar() {
  const menuIcon = document.getElementById(SELECTORS.menuIcon);
  const sidebar = document.getElementById(SELECTORS.sidebar);
  const menuItems = document.querySelectorAll(SELECTORS.menuItems);

  menuIcon.addEventListener("click", () => sidebar.classList.toggle("expanded"));
  menuItems.forEach(item => item.addEventListener("click", () => sidebar.classList.add("expanded")));
}

function addTask(event) {
  event.preventDefault();
  const taskValue = userInput.value.trim();
  if (taskValue === "") return alert("할일을 입력해주세요");

  taskList.push({ content: taskValue, isComplete: false, isPriority: false, id: randomIDGenerator() });
  userInput.value = "";
  render();
}

function render() {
  const list = (mode === "all") ? taskList : filterList;
  const tasksHtml = list.map(task => createTaskHtml(task)).join("");
  document.getElementById(SELECTORS.taskBoard).innerHTML = tasksHtml;
}

function createTaskHtml(task) {
  const starClass = task.isPriority ? 'fas fa-star' : 'far fa-star';
  const bellClass = task.isReminderSet ? 'fas fa-bell' : 'far fa-bell';
  const dueDateText = task.dueDate ? ` (마감일: ${task.dueDate})` : '';

  return `
    <div class="task ${task.isComplete ? 'task-done' : ''}" id="${task.id}">
      <span>${task.content}</span>
      <div class="button-box">
        <button onclick="toggleDone('${task.id}')"><i class="fas ${task.isComplete ? 'fa-redo' : 'fa-check'}"></i></button>
        <button onclick="togglePriority('${task.id}')"><i class="${starClass}"></i></button>
        <button onclick="editTask('${task.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="openDueDateModal('${task.id}')"><i class="fa fa-calendar-alt"></i></button>
        <button onclick="openReminderModal('${task.id}')"><i class="fa fa-bell"></i></button>
        <button onclick="deleteTask('${task.id}')"><i class="fa-solid fa-trash-arrow-up"></i></button>
      </div>
    </div>`;
}

function toggleDone(id) {
  const task = taskList.find(task => task.id === id);
  if (task) {
    task.isComplete = !task.isComplete;
    filter();
  }
}

function deleteTask(id) {
  const index = taskList.findIndex(task => task.id === id);
  if (index !== -1) {
    const deletedTask = taskList.splice(index, 1)[0];
    if (scheduledReminders[id]) clearTimeout(scheduledReminders[id]);
    delete scheduledReminders[id];

    const deletedTaskElement = document.createElement('div');
    deletedTaskElement.classList.add('task');
    deletedTaskElement.id = `deleted-${deletedTask.id}`;
    deletedTaskElement.innerHTML = `
      <span>${deletedTask.content}</span>
      <div class="button-box">
        <button onclick="restoreTask('${deletedTask.id}')"><i class="fas fa-undo"></i></button>
        <button onclick="removeTask('${deletedTask.id}')"><i class="fas fa-trash"></i></button>
      </div>`;
    document.querySelector(SELECTORS.deletedTasksContainer).appendChild(deletedTaskElement);

    filter();
  }
}

function restoreTask(id) {
  const deletedTaskElement = document.getElementById(`deleted-${id}`);
  if (deletedTaskElement) {
    const taskContent = deletedTaskElement.querySelector('span').textContent;
    taskList.push({ content: taskContent, isComplete: false, isPriority: false, id });
    deletedTaskElement.remove();
    render();
  }
}

function removeTask(id) {
  const deletedTaskElement = document.getElementById(`deleted-${id}`);
  if (deletedTaskElement) {
    deletedTaskElement.remove();
  }
}

function togglePriority(id) {
  const task = taskList.find(task => task.id === id);
  if (task) {
    task.isPriority = !task.isPriority;
    render();
  }
}

function editTask(id) {
  const task = taskList.find(task => task.id === id);
  if (task) {
    const newContent = prompt("수정할 내용을 입력하세요:", task.content);
    if (newContent) {
      task.content = newContent;
      render();
    }
  }
}

function openDueDateModal(id) {
  currentTaskId = id;
  const task = taskList.find(task => task.id === id);
  dueDateInput.value = task.dueDate || "";
  dueDateModal.show();
}

function saveDueDate() {
  if (currentTaskId) {
    const task = taskList.find(task => task.id === currentTaskId);
    task.dueDate = dueDateInput.value;
    render();
    dueDateModal.hide();
  }
}

function openReminderModal(id) {
  currentTaskReminderId = id;
  const task = taskList.find(task => task.id === id);
  reminderInput.value = task.reminder || "";
  reminderModal.show();
}

function saveReminder() {
  if (currentTaskReminderId) {
    const task = taskList.find(task => task.id === currentTaskReminderId);
    const reminder = reminderInput.value;

    if (reminder === '' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(reminder)) {
      task.reminder = reminder;
      if (reminder) {
        scheduleReminder(task);
      } else {
        if (scheduledReminders[task.id]) {
          clearTimeout(scheduledReminders[task.id]);
          delete scheduledReminders[task.id];
        }
      }
      render();
      reminderModal.hide();
    } else {
      alert("날짜 및 시간 형식이 올바르지 않습니다. (YYYY-MM-DDTHH:MM)");
    }
  }
}

function scheduleReminder(task) {
  const reminderTime = new Date(task.reminder).getTime();
  const currentTime = new Date().getTime();
  const timeDifference = reminderTime - currentTime;

  if (scheduledReminders[task.id]) {
    clearTimeout(scheduledReminders[task.id]);
  }

  if (timeDifference > 0) {
    scheduledReminders[task.id] = setTimeout(() => {
      alertSound.play();
      alert(`알림: ${task.content}`);
    }, timeDifference);
  }
}

function initializeReminders() {
  taskList.forEach(task => {
    if (task.reminder) scheduleReminder(task);
  });
}

function filter(e) {
  if (e) {
    mode = e.target.id;
    underLine.style.width = `${e.target.offsetWidth}px`;
    underLine.style.left = `${e.target.offsetLeft}px`;
    underLine.style.top = `${e.target.offsetTop + e.target.offsetHeight - 4}px`;
  }

  filterList = [];
  if (mode === "ongoing") {
    filterList = taskList.filter(task => !task.isComplete);
  } else if (mode === "done") {
    filterList = taskList.filter(task => task.isComplete);
  }

  render();
}

function randomIDGenerator() {
  return `_${Math.random().toString(36).substr(2, 9)}`;
}

function initializeCalendar() {
  const calendarIcon = document.querySelector(SELECTORS.calendarIcon).parentElement;
  const calendarContainer = document.getElementById(SELECTORS.calendarContainer);
  const mainContainer = document.querySelector(SELECTORS.mainContainer);
  const closeCalendarButton = document.getElementById(SELECTORS.closeCalendarButton);
  const deletedContainer = document.getElementById(SELECTORS.deletedContainer);

  calendarIcon.addEventListener("click", () => {
    deletedContainer.style.display = "none";
    mainContainer.style.display = "none";
    calendarContainer.style.display = "block";
  });

  closeCalendarButton.addEventListener("click", () => {
    calendarContainer.style.display = "none";
    mainContainer.style.display = "block";
  });

  const init = {
    monList: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    dayList: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    today: new Date(),
    monForChange: new Date().getMonth(),
    activeDate: new Date(),
    getFirstDay: (yy, mm) => new Date(yy, mm, 1),
    getLastDay: (yy, mm) => new Date(yy, mm + 1, 0),
    nextMonth() {
      const d = new Date();
      d.setDate(1);
      d.setMonth(++this.monForChange);
      this.activeDate = d;
      return d;
    },
    prevMonth() {
      const d = new Date();
      d.setDate(1);
      d.setMonth(--this.monForChange);
      this.activeDate = d;
      return d;
    },
    addZero: num => (num < 10) ? `0${num}` : num,
    activeDTag: null,
  };

  const $calBody = document.querySelector('.cal-body');
  const $btnNext = document.querySelector('.btn-cal.next');
  const $btnPrev = document.querySelector('.btn-cal.prev');

  const loadDate = (date, dayIn) => {
    document.querySelector('.cal-date').textContent = date;
    document.querySelector('.cal-day').textContent = init.dayList[dayIn];
  };

  const loadYYMM = (fullDate) => {
    const yy = fullDate.getFullYear();
    const mm = fullDate.getMonth();
    const firstDay = init.getFirstDay(yy, mm);
    const lastDay = init.getLastDay(yy, mm);
    let markToday;

    if (mm === init.today.getMonth() && yy === init.today.getFullYear()) {
      markToday = init.today.getDate();
    }

    document.querySelector('.cal-month').textContent = init.monList[mm];
    document.querySelector('.cal-year').textContent = yy;

    let trtd = '';
    let startCount;
    let countDay = 0;
    for (let i = 0; i < 6; i++) {
      trtd += '<tr>';
      for (let j = 0; j < 7; j++) {
        if (i === 0 && !startCount && j === firstDay.getDay()) {
          startCount = 1;
        }
        if (!startCount) {
          trtd += '<td>';
        } else {
          const fullDate = `${yy}.${init.addZero(mm + 1)}.${init.addZero(countDay + 1)}`;
          trtd += '<td class="day';
          trtd += (markToday && markToday === countDay + 1) ? ' today"' : '"';
          trtd += ` data-date="${countDay + 1}" data-fdate="${fullDate}">`;
        }
        trtd += (startCount) ? ++countDay : '';
        if (countDay === lastDay.getDate()) {
          startCount = 0;
        }
        trtd += '</td>';
      }
      trtd += '</tr>';
    }
    $calBody.innerHTML = trtd;
  };

  loadYYMM(init.today);
  loadDate(init.today.getDate(), init.today.getDay());

  $btnNext.addEventListener('click', () => loadYYMM(init.nextMonth()));
  $btnPrev.addEventListener('click', () => loadYYMM(init.prevMonth()));

  $calBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('day')) {
      if (init.activeDTag) {
        init.activeDTag.classList.remove('day-active');
      }
      const day = Number(e.target.textContent);
      loadDate(day, e.target.cellIndex);
      e.target.classList.add('day-active');
      init.activeDTag = e.target;
      init.activeDate.setDate(day);
    }
  });
}

function initializeDeletedContainer() {
  const deletedIcon = document.getElementById(SELECTORS.deletedIcon);
  const deletedContainer = document.getElementById(SELECTORS.deletedContainer);
  const mainContainer = document.querySelector(SELECTORS.mainContainer);
  const closeDeletedButton = document.getElementById(SELECTORS.closeDeletedButton);
  const calendarContainer = document.getElementById(SELECTORS.calendarContainer);

  deletedIcon.addEventListener("click", () => {
    calendarContainer.style.display = "none";
    mainContainer.style.display = "none";
    deletedContainer.style.display = "block";
  });

  closeDeletedButton.addEventListener("click", () => {
    deletedContainer.style.display = "none";
    mainContainer.style.display = "block";
  });
}
