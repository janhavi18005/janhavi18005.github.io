const taskInput = document.getElementById("taskInput");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const addBtn = document.getElementById("addBtn");

const todayTaskList = document.getElementById("todayTaskList");
const scheduledTaskList = document.getElementById("scheduledTaskList");

const todayCanvas = document.getElementById("todayProgress");
const scheduledCanvas = document.getElementById("scheduledProgress");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];


flatpickr("#dateInput", { dateFormat: "Y-m-d", allowInput: true });
flatpickr("#timeInput", { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true });


function saveTasks() { localStorage.setItem("tasks", JSON.stringify(tasks)); }


function addTask() {
  const text = taskInput.value.trim();
  let date = dateInput.value;
  const time = timeInput.value;

  if (!text) return;

 
  if (!date) {
    date = new Date().toISOString().split("T")[0];
  }

  tasks.push({ text, date, time, completed: false, reminded: false });
  saveTasks();
  renderTasks();

  taskInput.value = "";
  dateInput.value = "";
  timeInput.value = "";
}


function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}


function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}


addBtn.addEventListener("click", addTask);


[taskInput, dateInput, timeInput].forEach(input => {
  input.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
});


function checkReminders() {
  const now = new Date();
  tasks.forEach((task, index) => {
    if (!task.completed && !task.reminded && task.date && task.time) {
      const [hours, minutes] = task.time.split(":").map(Number);
      const taskDateTime = new Date(task.date);
      taskDateTime.setHours(hours, minutes, 0, 0);

      if (now >= taskDateTime) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Task Reminder", { body: task.text });
        } else { alert("Reminder: " + task.text); }

        tasks[index].reminded = true;
        saveTasks();
      }
    }
  });
}
checkReminders();
setInterval(checkReminders, 60000);


if ("Notification" in window) Notification.requestPermission();


function drawProgress(canvas, percent) {
  const ctx = canvas.getContext("2d");
  const radius = canvas.width / 2 - 5;
  const center = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fill();

  
  ctx.beginPath();
  ctx.arc(center, center, radius, -0.5 * Math.PI, -0.5 * Math.PI + 2 * Math.PI * percent);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#b882e5";
  ctx.stroke();

  
  ctx.fillStyle = "#fff";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(Math.round(percent * 100) + "%", center, center);
}


function renderTasks() {
  todayTaskList.innerHTML = "";
  scheduledTaskList.innerHTML = "";

  const todayStr = new Date().toISOString().split("T")[0];

  
  const todayTasks = tasks.filter(t => !t.date || t.date === todayStr);

  
  const scheduledTasks = tasks.filter(t => t.date && t.date !== todayStr);

  
  const todayCompleted = todayTasks.filter(t => t.completed).length / (todayTasks.length || 1);
  const scheduledCompleted = scheduledTasks.filter(t => t.completed).length / (scheduledTasks.length || 1);
  drawProgress(todayCanvas, todayCompleted);
  drawProgress(scheduledCanvas, scheduledCompleted);

  todayTasks.forEach((task, index) => renderTaskItem(task, index, todayTaskList, tasks.indexOf(task)));
  scheduledTasks.forEach((task, index) => renderTaskItem(task, index, scheduledTaskList, tasks.indexOf(task)));
}

function renderTaskItem(task, index, parent, taskIndex) {
  const li = document.createElement("li");

  const taskInfo = document.createElement("div");
  taskInfo.className = "task-info";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.onclick = () => toggleTask(taskIndex);

  const text = document.createElement("span");
  text.textContent = task.text;
  if (task.completed) text.classList.add("completed");

  const date = document.createElement("div");
  date.className = "date";
  date.textContent =
    (task.date ? "📅 " + task.date : "") +
    (task.time ? " ⏰ " + task.time : "");

  taskInfo.appendChild(checkbox);
  taskInfo.appendChild(text);

  const right = document.createElement("div");
  right.appendChild(date);

  const delBtn = document.createElement("button");
  delBtn.className = "delete";
  delBtn.textContent = "Delete";
  delBtn.onclick = () => deleteTask(taskIndex);

  li.appendChild(taskInfo);
  li.appendChild(right);
  li.appendChild(delBtn);

  parent.appendChild(li);
}


renderTasks();