let adminCharts = [];

function destroyAdminCharts() {
  adminCharts.forEach((chart) => chart.destroy());
  adminCharts = [];
}

function groupCounts(items, selector) {
  return items.reduce((accumulator, item) => {
    const key = selector(item) || "Unknown";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function topEntries(record, limit = 5) {
  return Object.entries(record)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

async function loadAdminDashboard() {
  const user = await syncCurrentUser();
  if (!user || user.role !== "admin") {
    showToast("Unauthorized access", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
    return;
  }

  const summary = await WorkLinkAPI.getAdminSummary();
  document.getElementById("adminName").textContent = user.name;
  document.getElementById("adminAvatar").textContent = user.avatar || user.name.charAt(0).toUpperCase();
  document.getElementById("totalUsers").textContent = summary.totalUsers;
  document.getElementById("totalJobs").textContent = summary.totalJobs;
  document.getElementById("totalWorkers").textContent = summary.totalWorkers;
  document.getElementById("completedJobs").textContent = summary.completedJobs;

  document.getElementById("recentUsersList").innerHTML = summary.recentUsers.map((entry) => `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <strong>${entry.name}</strong>
        <div class="small text-muted">${entry.email}</div>
      </div>
      <span class="badge bg-${entry.role === "admin" ? "danger" : entry.role === "worker" ? "success" : "primary"}">${entry.role}</span>
    </div>
  `).join("");

  document.getElementById("recentJobsList").innerHTML = summary.recentJobs.map((entry) => `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <strong>${entry.title}</strong>
        <div class="small text-muted">${entry.location}</div>
      </div>
      <span class="badge bg-${entry.status === "open" ? "success" : entry.status === "hired" ? "warning" : "secondary"}">${entry.status}</span>
    </div>
  `).join("");

  await Promise.all([loadUsers(), loadJobs(), loadWorkers(), loadSettings()]);
}

async function loadUsers() {
  const users = await WorkLinkAPI.getUsers();
  document.getElementById("usersTableBody").innerHTML = users.map((user) => `
    <tr>
      <td><div class="d-flex align-items-center"><div class="avatar me-2">${user.avatar || user.name.charAt(0).toUpperCase()}</div>${user.name}</div></td>
      <td>${user.email}</td>
      <td><span class="badge bg-${user.role === "admin" ? "danger" : user.role === "worker" ? "success" : "primary"}">${user.role}</span></td>
      <td>${formatDate(user.createdAt)}</td>
      <td><span class="badge bg-success">Active</span></td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>
  `).join("");
}

async function loadJobs() {
  const jobs = await WorkLinkAPI.getJobs();
  document.getElementById("jobsTableBody").innerHTML = jobs.map((job) => `
    <tr>
      <td>${job.title}</td>
      <td>${job.postedByName || "Unknown"}</td>
      <td>${job.location}</td>
      <td>${job.category || "General"}</td>
      <td><span class="badge bg-${job.status === "open" ? "success" : job.status === "hired" ? "warning" : "secondary"}">${job.status}</span></td>
      <td>${formatDate(job.createdAt)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteJob('${job.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>
  `).join("");
}

async function loadWorkers() {
  const workers = await WorkLinkAPI.getWorkers();
  document.getElementById("workersTableBody").innerHTML = workers.map((worker) => `
    <tr>
      <td><div class="d-flex align-items-center"><div class="avatar me-2">${worker.avatar || worker.name.charAt(0).toUpperCase()}</div>${worker.name}</div></td>
      <td>${(worker.skills || []).join(", ") || "N/A"}</td>
      <td>${worker.location || "N/A"}</td>
      <td>${generateRatingStars(worker.rating || 0)}</td>
      <td>${worker.completedJobs || 0}</td>
      <td><span class="badge bg-${worker.availability === "available" ? "success" : "secondary"}">${worker.availability || "available"}</span></td>
      <td><button class="btn btn-sm btn-warning" onclick="deleteWorker('${worker.id}')"><i class="fas fa-ban"></i></button></td>
    </tr>
  `).join("");
}

async function loadReports() {
  destroyAdminCharts();
  const [jobs, users, workers, settings] = await Promise.all([
    WorkLinkAPI.getAdminJobs(),
    WorkLinkAPI.getUsers(),
    WorkLinkAPI.getAdminWorkers(),
    WorkLinkAPI.getSettings()
  ]);

  const statusChart = document.getElementById("statusChart");
  const categoryChart = document.getElementById("categoryChart");
  const locationChart = document.getElementById("locationChart");
  const insightsList = document.getElementById("reportInsightsList");
  if (!statusChart || !categoryChart || !locationChart || !insightsList) {
    return;
  }

  const totalJobs = jobs.length;
  const openJobs = jobs.filter((job) => job.status === "open").length;
  const hiredJobs = jobs.filter((job) => job.status === "hired").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const closedJobs = jobs.filter((job) => job.status === "closed").length;
  const completionRate = totalJobs ? (completedJobs / totalJobs) * 100 : 0;
  const commission = Number(settings.commission || 0);
  const estimatedRevenue = jobs
    .filter((job) => job.status === "completed")
    .reduce((sum, job) => sum + ((Number(job.budget) || 0) * commission) / 100, 0);
  const availableWorkers = workers.filter((worker) => worker.availability === "available").length;
  const avgWorkerRating = workers.length
    ? workers.reduce((sum, worker) => sum + (Number(worker.rating) || 0), 0) / workers.length
    : 0;
  const jobsByCategory = groupCounts(jobs, (job) => job.category || "General");
  const jobsByLocation = groupCounts(jobs, (job) => job.location || "Unknown");
  const topCategories = topEntries(jobsByCategory, 1);
  const topLocations = topEntries(jobsByLocation, 5);
  const activeEmployers = new Set(jobs.map((job) => job.postedBy || job.postedById).filter(Boolean)).size;
  const adminUsers = users.filter((user) => user.role === "admin").length;

  document.getElementById("reportOpenJobs").textContent = openJobs;
  document.getElementById("reportHiredJobs").textContent = hiredJobs;
  document.getElementById("reportCompletionRate").textContent = formatPercent(completionRate);
  document.getElementById("reportEstimatedRevenue").textContent = formatCurrency(estimatedRevenue);
  document.getElementById("reportOpenJobsHint").textContent = `${totalJobs} total jobs tracked right now`;
  document.getElementById("reportHiredJobsHint").textContent = `${closedJobs} closed and ${completedJobs} completed`;
  document.getElementById("reportCompletionHint").textContent = `${completedJobs} of ${totalJobs || 0} jobs completed`;
  document.getElementById("reportRevenueHint").textContent = `${commission}% commission from completed job budgets`;

  insightsList.innerHTML = [
    {
      label: "Top category",
      description: "Most active job category right now",
      value: topCategories[0] ? `${topCategories[0][0]} (${topCategories[0][1]})` : "No data"
    },
    {
      label: "Top location",
      description: "City with the most posted jobs",
      value: topLocations[0] ? `${topLocations[0][0]} (${topLocations[0][1]})` : "No data"
    },
    {
      label: "Worker availability",
      description: "Workers marked available for new jobs",
      value: `${availableWorkers}/${workers.length || 0}`
    },
    {
      label: "Average worker rating",
      description: "Across all worker profiles",
      value: workers.length ? avgWorkerRating.toFixed(1) : "0.0"
    },
    {
      label: "Hiring accounts",
      description: "User accounts that have posted jobs",
      value: `${activeEmployers}`
    },
    {
      label: "Admin coverage",
      description: "Admin accounts managing the platform",
      value: `${adminUsers}`
    }
  ].map((item) => `
    <div class="report-insight-item">
      <div>
        <strong>${item.label}</strong>
        <span>${item.description}</span>
      </div>
      <b>${item.value}</b>
    </div>
  `).join("");

  adminCharts.push(new Chart(statusChart.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Open", "Hired", "Completed", "Closed"],
      datasets: [{
        data: [openJobs, hiredJobs, completedJobs, closedJobs],
        backgroundColor: ["#2563eb", "#f59e0b", "#10b981", "#64748b"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  }));

  const categoryEntries = topEntries(jobsByCategory, 6);

  adminCharts.push(new Chart(categoryChart.getContext("2d"), {
    type: "bar",
    data: {
      labels: categoryEntries.map(([label]) => label),
      datasets: [{
        label: "Jobs",
        data: categoryEntries.map(([, value]) => value),
        backgroundColor: ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  }));

  adminCharts.push(new Chart(locationChart.getContext("2d"), {
    type: "bar",
    data: {
      labels: topLocations.map(([label]) => label),
      datasets: [{
        label: "Jobs",
        data: topLocations.map(([, value]) => value),
        backgroundColor: "#1d4ed8",
        borderRadius: 10
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  }));
}

async function loadSettings() {
  const settings = await WorkLinkAPI.getSettings();
  document.getElementById("platformName").value = settings.platformName || "WorkLink";
  document.getElementById("adminEmail").value = settings.adminEmail || "";
  document.getElementById("contactPhone").value = settings.contactPhone || "";
  document.getElementById("commission").value = settings.commission || 10;
}

async function saveSettings(event) {
  event.preventDefault();
  try {
    await WorkLinkAPI.saveSettings({
      platformName: document.getElementById("platformName").value.trim(),
      adminEmail: document.getElementById("adminEmail").value.trim(),
      contactPhone: document.getElementById("contactPhone").value.trim(),
      commission: Number(document.getElementById("commission").value || 0)
    });
    showToast("Settings saved successfully!");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteUser(userId) {
  if (!confirm("Delete this user?")) {
    return;
  }
  try {
    await WorkLinkAPI.deleteUser(userId);
    showToast("User deleted successfully");
    await loadAdminDashboard();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteJob(jobId) {
  if (!confirm("Delete this job?")) {
    return;
  }
  try {
    await WorkLinkAPI.deleteJob(jobId);
    showToast("Job deleted successfully");
    await loadAdminDashboard();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteWorker(workerId) {
  if (!confirm("Suspend this worker?")) {
    return;
  }
  try {
    await WorkLinkAPI.deleteWorker(workerId);
    showToast("Worker suspended successfully");
    await loadAdminDashboard();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function showSection(section, trigger) {
  document.querySelectorAll(".admin-sidebar .nav-link").forEach((link) => link.classList.remove("active"));
  if (trigger) {
    trigger.classList.add("active");
  }
  ["dashboard", "users", "jobs", "workers", "reports", "settings"].forEach((key) => {
    document.getElementById(`${key}Section`).style.display = key === section ? "block" : "none";
  });
  document.getElementById("pageTitle").textContent = section.charAt(0).toUpperCase() + section.slice(1);
  if (section === "reports") {
    await loadReports();
  }
}

window.loadAdminDashboard = loadAdminDashboard;
window.loadUsers = loadUsers;
window.loadJobs = loadJobs;
window.loadWorkers = loadWorkers;
window.loadReports = loadReports;
window.saveSettings = saveSettings;
window.deleteUser = deleteUser;
window.deleteJob = deleteJob;
window.deleteWorker = deleteWorker;
window.showSection = showSection;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("dashboardSection")) {
    loadAdminDashboard();
  }
});
