document.addEventListener('DOMContentLoaded', () => {
  const taskList = document.getElementById('taskList');
  const newTaskBtn = document.getElementById('newTaskBtn');
  const taskModal = document.getElementById('taskModal');
  const saveTaskBtn = document.getElementById('saveTaskBtn');
  const cancelTaskBtn = document.getElementById('cancelTaskBtn');
  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let tasks = JSON.parse(localStorage.getItem('taskifyTasksV2')) || [];

  // Show modal
  newTaskBtn.addEventListener('click', () => {
    taskModal.classList.remove('hidden');
    taskInput.focus();
  });

  // Close modal
  cancelTaskBtn.addEventListener('click', () => {
    taskModal.classList.add('hidden');
    taskInput.value = '';
  });

  // Save task
  saveTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    const priority = prioritySelect.value;
    if (!text) return;

    const newTask = {
      id: Date.now(),
      text,
      priority,
      completed: false,
      created: new Date().toLocaleString()
    };
    tasks.push(newTask);
    localStorage.setItem('taskifyTasksV2', JSON.stringify(tasks));

    renderTasks();
    taskInput.value = '';
    taskModal.classList.add('hidden');
  });

  // Render tasks
  function renderTasks(filter = 'all') {
    taskList.innerHTML = '';
    let filteredTasks = tasks;

    if (filter === 'completed') filteredTasks = tasks.filter(t => t.completed);
    else if (filter === 'in-progress') filteredTasks = tasks.filter(t => !t.completed);
    else if (filter === 'low' || filter === 'medium' || filter === 'high')
      filteredTasks = tasks.filter(t => t.priority === filter);

    filteredTasks.forEach(task => {
      const div = document.createElement('div');
      div.className = 'task-item';

      div.innerHTML = `
        <div class="task-left">
          <span class="priority-dot ${task.priority}"></span>
          <input type="checkbox" class="complete-check" ${task.completed ? 'checked' : ''}>
          <div class="task-text" contenteditable="false">${task.text}
            <div class="timestamp">${task.created}</div>
          </div>
        </div>
        <div class="task-actions">
          <span class="material-icons-round delete">delete</span>
        </div>
      `;

      // Complete toggle
      div.querySelector('.complete-check').addEventListener('change', (e) => {
        task.completed = e.target.checked;
        localStorage.setItem('taskifyTasksV2', JSON.stringify(tasks));
        renderTasks(filter);
      });

      // Delete
      div.querySelector('.delete').addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        localStorage.setItem('taskifyTasksV2', JSON.stringify(tasks));
        renderTasks(filter);
      });

      taskList.appendChild(div);
    });
  }

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.filter-btn.active')?.classList.remove('active');
      btn.classList.add('active');
      renderTasks(btn.dataset.filter);
    });
  });

  renderTasks();
});