import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  push, 
  onValue, 
  remove, 
  update 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvCQRDfvdu47lNCvXnndJXfZ81btgmUhY",
  authDomain: "track-work-bd526.firebaseapp.com",
  databaseURL: "https://track-work-bd526-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "track-work-bd526",
  storageBucket: "track-work-bd526.firebasestorage.app",
  messagingSenderId: "212090415578",
  appId: "1:212090415578:web:60ba96e8b0db889d8738e3",
  measurementId: "G-5MJT59VZKL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const userAvatar = document.getElementById("userAvatar");
const userAvatarFallback = document.getElementById("userAvatarFallback");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");

const totalCount = document.getElementById("totalCount");
const todoCount = document.getElementById("todoCount");
const progressCount = document.getElementById("progressCount");
const completedCount = document.getElementById("completedCount");
const missingCount = document.getElementById("missingCount");

const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskModal = document.getElementById("taskModal");
const openTaskBtn = document.getElementById("openTaskBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const navItems = document.querySelectorAll(".nav-item");

const toast = document.getElementById("notificationToast");
const toastMessage = document.getElementById("toastMessage");
const closeToast = document.getElementById("closeToast");

let currentUser = null;
let tasks = [];
let activeFilter = "all";

// Toast Notification Function
function showNotification(msg) {
  if (toast && toastMessage) {
    toastMessage.textContent = msg;
    toast.classList.remove("hidden");
  }
}

if (closeToast) {
  closeToast.addEventListener("click", () => toast.classList.add("hidden"));
}

// Check missing tasks logic
function isTaskMissing(task) {
  if (task.status === "completed") return false;
  if (!task.deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.deadline);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

// Authentication & Profile Fetching
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    
    // Display Gmail Name and Email
    if (userName) userName.textContent = user.displayName || "Google User";
    if (userEmail) userEmail.textContent = user.email || "";

    // Display Gmail Profile Picture
    if (user.photoURL && userAvatar) {
      userAvatar.src = user.photoURL;
      userAvatar.style.display = "block";
      if (userAvatarFallback) userAvatarFallback.style.display = "none";
    } else if (userAvatarFallback) {
      userAvatarFallback.textContent = (user.displayName || "U").charAt(0).toUpperCase();
      userAvatarFallback.style.display = "flex";
      if (userAvatar) userAvatar.style.display = "none";
    }

    loadTasks();
  } else {
    window.location.replace("index.html");
  }
});

// Logout Action
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => window.location.replace("index.html"));
  });
}

// Load tasks from Firebase
function loadTasks() {
  if (!currentUser) return;

  const userTasksRef = ref(db, `tasks/${currentUser.uid}`);
  onValue(userTasksRef, (snapshot) => {
    const data = snapshot.val();
    tasks = [];
    let missingCounter = 0;

    if (data) {
      Object.keys(data).forEach((key) => {
        const task = { id: key, ...data[key] };
        if (isTaskMissing(task)) missingCounter++;
        tasks.push(task);
      });
    }

    if (missingCounter > 0) {
      showNotification(
        missingCounter === 1 
          ? "You missed a task today!" 
          : `You missed ${missingCounter} tasks today!`
      );
    }

    renderTasks();
    updateStats();
  });
}

function updateStats() {
  const total = tasks.length;
  const todo = tasks.filter(t => t.status === "todo" && !isTaskMissing(t)).length;
  const progress = tasks.filter(t => t.status === "progress" && !isTaskMissing(t)).length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const missing = tasks.filter(t => isTaskMissing(t)).length;

  if (totalCount) totalCount.textContent = total;
  if (todoCount) todoCount.textContent = todo;
  if (progressCount) progressCount.textContent = progress;
  if (completedCount) completedCount.textContent = completed;
  if (missingCount) missingCount.textContent = missing;
}

function renderTasks() {
  if (!taskList) return;
  taskList.innerHTML = "";

  let filtered = tasks.filter((t) => {
    if (activeFilter === "missing") return isTaskMissing(t);
    if (activeFilter === "all") return true;
    return t.status === activeFilter && !isTaskMissing(t);
  });

  if (filtered.length === 0) {
    taskList.innerHTML = `<p class="empty-msg">No tasks found.</p>`;
    return;
  }

  filtered.forEach((task) => {
    const missing = isTaskMissing(task);
    const card = document.createElement("div");
    card.className = `task-card ${missing ? "missing" : ""}`;

    card.innerHTML = `
      <div class="task-header">
        <h3>${task.title}</h3>
        <span class="${missing ? "badge-missing" : "badge-" + (task.priority ? task.priority.toLowerCase() : "medium")}">
          ${missing ? "MISSING" : task.priority}
        </span>
      </div>
      <p>${task.description || "No description."}</p>
      <div class="task-meta">
        <small>Due: ${task.deadline}</small>
        <small>Status: <strong>${missing ? "Missing" : task.status}</strong></small>
      </div>
      <div class="task-actions">
        ${task.status !== "completed" ? `<button class="complete-btn" data-id="${task.id}">Mark Done</button>` : ''}
        <button class="delete-btn" data-id="${task.id}">Delete</button>
      </div>
    `;

    taskList.appendChild(card);
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => deleteTask(e.target.dataset.id));
  });

  document.querySelectorAll(".complete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => markCompleted(e.target.dataset.id));
  });
}

function deleteTask(id) {
  if (currentUser) remove(ref(db, `tasks/${currentUser.uid}/${id}`));
}

function markCompleted(id) {
  if (currentUser) update(ref(db, `tasks/${currentUser.uid}/${id}`), { status: "completed" });
}

// Modal Toggle Handlers
if (openTaskBtn) openTaskBtn.addEventListener("click", () => taskModal.classList.remove("hidden"));
if (closeModalBtn) closeModalBtn.addEventListener("click", () => taskModal.classList.add("hidden"));
if (cancelBtn) cancelBtn.addEventListener("click", () => taskModal.classList.add("hidden"));

// Submit Form Task
if (taskForm) {
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value;
    const description = document.getElementById("taskDescription").value;
    const deadline = document.getElementById("taskDeadline").value;
    const priority = document.getElementById("taskPriority").value;
    const status = document.getElementById("taskStatus").value;

    const newTask = {
      title,
      description,
      deadline,
      priority,
      status,
      createdAt: new Date().toISOString()
    };

    if (currentUser) {
      push(ref(db, `tasks/${currentUser.uid}`), newTask).then(() => {
        taskModal.classList.add("hidden");
        taskForm.reset();

        if (isTaskMissing(newTask)) {
          showNotification("You missed a task today!");
        }
      });
    }
  });
}

// Navigation Tabs
navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    navItems.forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderTasks();
  });
});
