document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const taskList = document.getElementById('taskList');
  const newTaskBtn = document.getElementById('newTaskBtn');
  const taskModal = document.getElementById('taskModal');
  const modalBackdrop = document.querySelector('.modal-backdrop');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const saveTaskBtn = document.getElementById('saveTaskBtn');
  const cancelTaskBtn = document.getElementById('cancelTaskBtn');
  const taskInput = document.getElementById('taskInput');
  const priorityOptions = document.querySelectorAll('.priority-option');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const themeToggle = document.getElementById('themeToggle');

  // State
  let tasks = JSON.parse(localStorage.getItem('taskifyTasksV2')) || [];
  let currentFilter = 'all';
  let selectedPriority = 'medium';
  let currentTheme = localStorage.getItem('taskifyTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Mobile keyboard handling
  if ('virtualKeyboard' in navigator) {
    navigator.virtualKeyboard.overlaysContent = true;
  }

  // Initialize
  renderTasks();

  // Event Listeners
  newTaskBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  cancelTaskBtn.addEventListener('click', closeModal);
  saveTaskBtn.addEventListener('click', saveTask);
  themeToggle.addEventListener('click', toggleTheme);

  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveTask();
  });

  priorityOptions.forEach(option => {
    option.addEventListener('click', () => {
      priorityOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      selectedPriority = option.dataset.priority;
    });
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  // Functions
  function openModal() {
    taskModal.classList.remove('hidden');
    taskInput.value = '';
    priorityOptions.forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.priority-option.medium').classList.add('selected');
    selectedPriority = 'medium';
    taskInput.focus();
  }

  function closeModal() {
    taskModal.classList.add('hidden');
  }

  function saveTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
      id: Date.now(),
      text,
      priority: selectedPriority,
      completed: false,
      created: new Date().toLocaleString()
    };

    tasks.push(newTask);
    localStorage.setItem('taskifyTasksV2', JSON.stringify(tasks));
    renderTasks();
    closeModal();
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('taskifyTheme', currentTheme);

    // Animate the toggle
    themeToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
      themeToggle.style.transform = 'scale(1)';
    }, 100);
  }

  function renderTasks() {
    taskList.innerHTML = '';
    let filteredTasks = tasks;

    if (currentFilter === 'completed') {
      filteredTasks = tasks.filter(t => t.completed);
    } else if (currentFilter === 'in-progress') {
      filteredTasks = tasks.filter(t => !t.completed);
    } else if (['low', 'medium', 'high'].includes(currentFilter)) {
      filteredTasks = tasks.filter(t => t.priority === currentFilter);
    }

    if (filteredTasks.length === 0) {
      taskList.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-round">inbox</span>
          <p>No tasks found</p>
        </div>
      `;
      return;
    }

    filteredTasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;

      taskItem.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
          <div class="task-text ${task.completed ? 'completed' : ''}">
            ${task.text}
            <div class="timestamp">${task.created}</div>
          </div>
        </div>
        <div class="task-actions">
          <span class="material-icons-round delete">delete</span>
        </div>
      `;

      // Complete toggle
      const checkbox = taskItem.querySelector('.task-checkbox');
      const taskText = taskItem.querySelector('.task-text');

      checkbox.addEventListener('change', (e) => {
        task.completed = e.target.checked;
        taskItem.classList.toggle('completed', task.completed);
        taskText.classList.toggle('completed', task.completed);
        localStorage.setItem('taskifyTasksV2', JSON.stringify(tasks));
      });

      // Delete task
      taskItem.querySelector('.delete').addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        localStorage.setItem('taskifyTasksV2', JSON.stringify(tasks));
        renderTasks();
      });

      taskList.appendChild(taskItem);
    });
  }

  // Pomodoro Timer Implementation
  class PomodoroTimer {
    constructor() {
      this.isRunning = false;
      this.currentPhase = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
      this.remainingTime = 25 * 60; // in seconds
      this.durations = {
        pomodoro: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 10 * 60
      };
      this.interval = null;

      this.domElements = {
        launcher: document.getElementById('pomodoroLauncher'),
        drawer: document.getElementById('pomodoroDrawer'),
        timeDisplay: document.querySelector('.time-display'),
        phaseLabel: document.querySelector('.phase-label'),
        progressCircle: document.querySelector('.progress-ring-circle'),
        playPauseBtn: document.querySelector('.play-pause'),
        skipBtn: document.querySelector('.skip'),
        resetBtn: document.querySelector('.reset'),
        focusInput: document.querySelector('.focus-duration'),
        shortBreakInput: document.querySelector('.short-break-duration'),
        longBreakInput: document.querySelector('.long-break-duration'),
        closeBtn: document.querySelector('.close-drawer'),
        drawerBackdrop: document.querySelector('.drawer-backdrop'),
        phaseButtons: {
          pomodoro: document.querySelector('.phase-pomodoro'),
          shortBreak: document.querySelector('.phase-short-break'),
          longBreak: document.querySelector('.phase-long-break')
        },
        settingsPanel: document.querySelector('.pomodoro-settings'),
        settingsHeader: document.querySelector('.settings-header')
      };

      this.init();
    }

    init() {
      const radius = this.domElements.progressCircle.r.baseVal.value;
      this.circumference = radius * 2 * Math.PI;
      this.domElements.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;

      this.domElements.launcher.addEventListener('click', () => this.openDrawer());
      this.domElements.closeBtn.addEventListener('click', () => this.closeDrawer());
      this.domElements.drawerBackdrop.addEventListener('click', () => this.closeDrawer());
      this.domElements.playPauseBtn.addEventListener('click', () => this.toggleTimer());
      this.domElements.skipBtn.addEventListener('click', () => this.skipPhase());
      this.domElements.resetBtn.addEventListener('click', () => this.resetTimer());
      
      // Corrected: Event listener for settings toggle is now here
      this.domElements.settingsHeader.addEventListener('click', () => this.toggleSettings());

      Object.keys(this.domElements.phaseButtons).forEach(phase => {
        this.domElements.phaseButtons[phase].addEventListener('click', () => {
          this.switchPhase(phase);
        });
      });

      this.domElements.focusInput.addEventListener('change', (e) => {
        this.durations.pomodoro = (parseInt(e.target.value) || 25) * 60;
        if (!this.isRunning && this.currentPhase === 'pomodoro') {
          this.resetTimer();
        }
      });

      this.domElements.shortBreakInput.addEventListener('change', (e) => {
        this.durations.shortBreak = (parseInt(e.target.value) || 5) * 60;
        if (!this.isRunning && this.currentPhase === 'shortBreak') {
          this.resetTimer();
        }
      });

      this.domElements.longBreakInput.addEventListener('change', (e) => {
        this.durations.longBreak = (parseInt(e.target.value) || 10) * 60;
        if (!this.isRunning && this.currentPhase === 'longBreak') {
          this.resetTimer();
        }
      });

      this.updateDisplay();
    }

    openDrawer() {
      this.domElements.drawer.classList.remove('hidden');
      setTimeout(() => {
        this.domElements.drawer.classList.add('visible');
      }, 10);
    }

    closeDrawer() {
      this.domElements.drawer.classList.remove('visible');
      this.domElements.drawer.addEventListener('transitionend', () => {
        if (!this.domElements.drawer.classList.contains('visible')) {
          this.domElements.drawer.classList.add('hidden');
        }
      }, {
        once: true
      });
    }
    
    toggleSettings() {
      this.domElements.settingsPanel.classList.toggle('expanded');
    }

    toggleTimer() {
      if (this.isRunning) {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    }

    startTimer() {
      if (this.remainingTime <= 0) return;

      this.isRunning = true;
      this.domElements.playPauseBtn.innerHTML = '<span class="material-icons-round">pause</span>';

      const startTime = Date.now();
      const endTime = startTime + (this.remainingTime * 1000);

      this.interval = setInterval(() => {
        const now = Date.now();
        this.remainingTime = Math.max(0, Math.floor((endTime - now) / 1000));

        this.updateDisplay();

        if (this.remainingTime <= 0) {
          this.handlePhaseComplete();
        }
      }, 1000);
    }

    pauseTimer() {
      this.isRunning = false;
      clearInterval(this.interval);
      this.domElements.playPauseBtn.innerHTML = '<span class="material-icons-round">play_arrow</span>';
    }

    skipPhase() {
      this.handlePhaseComplete();
    }

    resetTimer() {
      this.pauseTimer();
      this.remainingTime = this.durations[this.currentPhase];
      this.updateDisplay();
    }

    switchPhase(phase) {
      this.currentPhase = phase;
      this.resetTimer();

      Object.keys(this.domElements.phaseButtons).forEach(key => {
        this.domElements.phaseButtons[key].classList.toggle('active', key === phase);
      });

      this.domElements.phaseLabel.textContent = this.getPhaseName(phase);
      this.domElements.progressCircle.style.stroke = this.getPhaseColor(phase);
    }

    handlePhaseComplete() {
      this.pauseTimer();

      const alarm = new Audio('https://www.freespecialeffects.co.uk/soundfx/scifi/electronic.wav');
      alarm.play();

      const phaseName = this.getPhaseName(this.currentPhase);
      let nextPhase = 'shortBreak';
      // Logic for long break after 4 pomodoros would go here
      const nextPhaseName = this.getPhaseName(nextPhase);

      if (Notification.permission === 'granted') {
        new Notification(`${phaseName} completed!`, {
          body: `Time for ${nextPhaseName.toLowerCase()}`
        });
      }

      this.switchPhase(nextPhase);
    }

    updateDisplay() {
      const minutes = Math.floor(this.remainingTime / 60);
      const seconds = this.remainingTime % 60;
      this.domElements.timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      const totalSeconds = this.durations[this.currentPhase];
      const offset = this.circumference - (this.remainingTime / totalSeconds) * this.circumference;
      this.domElements.progressCircle.style.strokeDashoffset = offset;
    }

    getPhaseName(phase) {
      const names = {
        pomodoro: 'Focus',
        shortBreak: 'Short Break',
        longBreak: 'Long Break'
      };
      return names[phase] || phase;
    }

    getPhaseColor(phase) {
      const colors = {
        pomodoro: 'var(--primary)',
        shortBreak: 'var(--low)',
        longBreak: 'var(--medium)'
      };
      return colors[phase] || 'var(--primary)';
    }
  }

  // Initialize Pomodoro Timer
  new PomodoroTimer();
});