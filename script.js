document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');

    // Load tasks from localStorage
    loadTasks();

    // Add task event
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        const taskId = Date.now();
        const task = {
            id: taskId,
            text: taskText,
            status: 'pending'
        };

        saveTask(task);
        renderTask(task);
        taskInput.value = '';
        taskInput.focus();
    }

    function renderTask(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;

        taskItem.innerHTML = `
            <div class="status-pill ${task.status}">
                ${task.status.replace('-', ' ')}
            </div>
            <div class="task-content">
                <span class="task-text">${task.text}</span>
            </div>
            <div class="task-actions">
                <button class="action-btn edit" title="Edit">
                    <span class="material-icons-round">edit</span>
                </button>
                <button class="action-btn delete" title="Delete">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        `;

        taskList.appendChild(taskItem);

        // Add event listeners
        const editBtn = taskItem.querySelector('.edit');
        const deleteBtn = taskItem.querySelector('.delete');
        const taskTextElement = taskItem.querySelector('.task-text');
        const statusPill = taskItem.querySelector('.status-pill');

        statusPill.addEventListener('click', function() {
            const currentStatus = task.status;
            let newStatus;
            
            if (currentStatus === 'pending') newStatus = 'in-progress';
            else if (currentStatus === 'in-progress') newStatus = 'completed';
            else newStatus = 'pending';
            
            task.status = newStatus;
            statusPill.className = `status-pill ${newStatus}`;
            statusPill.textContent = newStatus.replace('-', ' ');
            
            taskItem.classList.toggle('completed', newStatus === 'completed');
            updateTaskStatus(task.id, newStatus);
        });

        editBtn.addEventListener('click', function() {
            if (taskItem.classList.contains('editing')) {
                // Save changes
                const newText = taskTextElement.textContent.trim();
                if (newText !== '') {
                    updateTaskText(task.id, newText);
                }
                taskItem.classList.remove('editing');
                taskTextElement.contentEditable = 'false';
            } else {
                // Enable editing
                taskItem.classList.add('editing');
                taskTextElement.contentEditable = 'true';
                taskTextElement.focus();
            }
        });

        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTask(task.id);
                taskItem.remove();
            }
        });
    }

    function saveTask(task) {
        const tasks = getTasks();
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function getTasks() {
        return JSON.parse(localStorage.getItem('tasks')) || [];
    }

    function loadTasks() {
        const tasks = getTasks();
        tasks.forEach(task => renderTask(task));
    }

    function updateTaskStatus(id, newStatus) {
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id == id);
        if (taskIndex !== -1) {
            tasks[taskIndex].status = newStatus;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }

    function updateTaskText(id, newText) {
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id == id);
        if (taskIndex !== -1) {
            tasks[taskIndex].text = newText;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }

    function deleteTask(id) {
        const tasks = getTasks().filter(task => task.id != id);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
});