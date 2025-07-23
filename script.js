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
});
