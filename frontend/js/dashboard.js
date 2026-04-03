function getEmptyStateHTML(icon, title, message, buttonLink = "", buttonText = "") {
  return `
    <div class="col-12">
      <div class="empty-state">
        <i class="fas fa-${icon}"></i>
        <h4>${title}</h4>
        <p>${message}</p>
        ${buttonLink ? `<a href="${buttonLink}" class="btn btn-primary">${buttonText}</a>` : ""}
      </div>
    </div>
  `;
}

function getJobStatusBadge(status) {
  const labels = {
    open: '<span class="badge bg-success">Open</span>',
    hired: '<span class="badge bg-warning text-dark">In Progress</span>',
    completed: '<span class="badge bg-secondary">Completed</span>',
    closed: '<span class="badge bg-danger">Closed</span>'
  };
  return labels[status] || '<span class="badge bg-secondary">Unknown</span>';
}

async function loadUserDashboard() {
  const user = await syncCurrentUser();
  if (!user || user.role !== "user") {
    showToast("Please login as an employer", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
    return;
  }

  const jobs = await WorkLinkAPI.getJobs({ postedBy: user.id });
  const workers = await WorkLinkAPI.getWorkers();
  const applicants = jobs.flatMap((job) => (job.applicants || []).map((applicantId) => ({
    job,
    worker: workers.find((entry) => entry.userId === applicantId || entry.id === applicantId)
  })));

  document.getElementById("userName").textContent = user.name;
  document.getElementById("userEmail").textContent = user.email;
  document.getElementById("userAvatar").textContent = user.avatar || user.name.charAt(0).toUpperCase();
  document.getElementById("totalPostedJobs").textContent = jobs.length;
  document.getElementById("openJobs").textContent = jobs.filter((job) => job.status === "open").length;
  document.getElementById("hiredJobs").textContent = jobs.filter((job) => job.status === "hired").length;
  document.getElementById("totalApplicants").textContent = applicants.length;

  document.getElementById("postedJobsContainer").innerHTML = jobs.length ? jobs.map((job) => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">${job.title}</h5>
            ${getJobStatusBadge(job.status)}
          </div>
          <p class="text-muted mb-2"><i class="fas fa-map-marker-alt me-1"></i>${job.location}</p>
          <p class="card-text small mb-3">${truncateText(job.description, 100)}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">${timeAgo(job.createdAt)}</small>
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-primary" onclick="viewJobDetails('${job.id}')">View</button>
              ${job.status === "open" ? `<button class="btn btn-sm btn-outline-danger" onclick="closeJob('${job.id}')">Close</button>` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join("") : getEmptyStateHTML("briefcase", "No Jobs Posted Yet", "Start by posting your first job!", "post-job.html", "Post a Job");

  document.getElementById("applicantsContainer").innerHTML = applicants.length ? applicants.map(({ job, worker }) => `
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <div class="avatar me-3">${worker?.avatar || worker?.name?.charAt(0) || "W"}</div>
            <div>
              <h6 class="mb-1">${worker?.name || "Unknown worker"}</h6>
              <small class="text-muted">Applied for ${job.title}</small>
            </div>
          </div>
          <div class="mb-3">${(worker?.skills || []).map((skill) => `<span class="badge badge-skill me-1">${skill}</span>`).join("")}</div>
          <div class="rating mb-3">${generateRatingStars(worker?.rating || 0)}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-success flex-grow-1" onclick="hireWorker('${job.id}', '${worker?.userId || worker?.id || ""}')">Hire</button>
            <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="viewWorkerProfile('${worker?.userId || worker?.id || ""}')">Profile</button>
          </div>
        </div>
      </div>
    </div>
  `).join("") : getEmptyStateHTML("users", "No Applicants Yet", "When workers apply to your jobs, they will appear here.");

  const hiredJobs = jobs.filter((job) => job.status === "hired");
  document.getElementById("hiredJobsContainer").innerHTML = hiredJobs.length ? hiredJobs.map((job) => {
    const worker = workers.find((entry) => entry.userId === job.hiredWorker || entry.id === job.hiredWorker);
    return `
      <div class="col-md-6">
        <div class="card border-success h-100">
          <div class="card-body">
            <h5 class="card-title">${job.title}</h5>
            <p class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${job.location}</p>
            <p><strong>Worker:</strong> ${worker?.name || "Unknown"}</p>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="viewJobDetails('${job.id}')">View</button>
              <button class="btn btn-sm btn-outline-success flex-grow-1" onclick="markJobCompleted('${job.id}')">Complete</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("") : getEmptyStateHTML("handshake", "No Hired Jobs", "When you hire workers, they will appear here.");

  document.getElementById("profileName").value = user.name || "";
  document.getElementById("profileEmail").value = user.email || "";
  document.getElementById("profilePhone").value = user.phone || "";
  document.getElementById("profileLocation").value = user.location || "";
  document.getElementById("profileCompany").value = user.company || "";
}

async function updateUserProfile(event) {
  event.preventDefault();
  const user = WorkLinkAPI.getCachedUser();
  try {
    const updatedUser = await WorkLinkAPI.updateUser(user.id, {
      name: document.getElementById("profileName").value.trim(),
      phone: document.getElementById("profilePhone").value.trim(),
      location: document.getElementById("profileLocation").value.trim(),
      company: document.getElementById("profileCompany").value.trim()
    });
    WorkLinkState.currentUser = updatedUser;
    updateNavbar();
    showToast("Profile updated successfully!");
    await loadUserDashboard();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function loadWorkerDashboard() {
  const user = await syncCurrentUser();
  if (!user || user.role !== "worker") {
    showToast("Please login as a worker", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
    return;
  }

  const workerProfile = await WorkLinkAPI.getWorker(user.id);
  const appliedJobs = await WorkLinkAPI.getJobs({ applicant: user.id });
  const availableJobs = (await WorkLinkAPI.getJobs({ status: "open" })).filter((job) => !(job.applicants || []).includes(user.id));
  const finishedJobs = (await WorkLinkAPI.getJobs({ hiredWorker: user.id })).filter((job) => job.status === "completed");

  document.getElementById("workerName").textContent = user.name;
  document.getElementById("workerEmail").textContent = user.email;
  document.getElementById("workerAvatar").textContent = workerProfile.avatar || user.avatar || user.name.charAt(0).toUpperCase();
  document.getElementById("completedJobs").textContent = workerProfile.completedJobs || 0;
  document.getElementById("pendingApplications").textContent = appliedJobs.length;
  document.getElementById("workerRating").textContent = Number(workerProfile.rating || 0).toFixed(1);
  document.getElementById("totalEarnings").textContent = formatCurrency(workerProfile.earnings || 0);
  document.getElementById("availabilityBadge").innerHTML = `<i class="fas fa-circle text-${workerProfile.availability === "available" ? "success" : "danger"} me-1"></i>${workerProfile.availability === "available" ? "Available" : "Busy"}`;

  document.getElementById("appliedJobsContainer").innerHTML = appliedJobs.length ? appliedJobs.map((job) => `
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title">${job.title}</h5>
            ${getJobStatusBadge(job.status)}
          </div>
          <p class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${job.location}</p>
          <p class="small">${truncateText(job.description, 100)}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-danger flex-grow-1" onclick="withdrawApplication('${job.id}')">Withdraw</button>
            <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="viewJobDetails('${job.id}')">View</button>
          </div>
        </div>
      </div>
    </div>
  `).join("") : getEmptyStateHTML("paper-plane", "No Applications Yet", "Start applying to jobs that match your skills.", "marketplace-jobs.html", "Browse Jobs");

  document.getElementById("availableJobsContainer").innerHTML = availableJobs.length ? availableJobs.slice(0, 6).map((job) => `
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${job.title}</h5>
          <p class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${job.location}</p>
          <p class="small">${truncateText(job.description, 100)}</p>
          <div class="mb-3">
            <span class="badge badge-skill">${job.category}</span>
            <span class="badge bg-light text-dark ms-2">${typeof job.budget === "number" ? formatCurrency(job.budget) : job.budget}</span>
          </div>
          <button class="btn btn-sm btn-success w-100" onclick="applyForJob('${job.id}')">Apply Now</button>
        </div>
      </div>
    </div>
  `).join("") : getEmptyStateHTML("briefcase", "No Jobs Available", "Check back later for new opportunities.");

  document.getElementById("workHistoryContainer").innerHTML = finishedJobs.length ? finishedJobs.map((job) => `
    <div class="col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${job.title}</h5>
          <p class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${job.location}</p>
          <p><strong>Earned:</strong> ${typeof job.budget === "number" ? formatCurrency(job.budget) : job.budget}</p>
          <small class="text-muted">Completed on ${formatDate(job.completedDate || job.createdAt)}</small>
        </div>
      </div>
    </div>
  `).join("") : getEmptyStateHTML("history", "No Work History", "Your completed jobs will appear here.");

  document.getElementById("profileName").value = user.name || "";
  document.getElementById("profileSkills").value = (workerProfile.skills || []).join(", ");
  document.getElementById("profileExperience").value = String(workerProfile.experience || "0");
  document.getElementById("profileRate").value = workerProfile.hourlyRate || "";
  document.getElementById("profileLocation").value = workerProfile.location || user.location || "";
  document.getElementById("profileAvailability").value = workerProfile.availability || "available";
  document.getElementById("profileAbout").value = workerProfile.about || "";
}

async function updateWorkerProfile(event) {
  event.preventDefault();
  const user = WorkLinkAPI.getCachedUser();
  const skills = document.getElementById("profileSkills").value.split(",").map((entry) => entry.trim()).filter(Boolean);
  try {
    await WorkLinkAPI.updateWorker(user.id, {
      name: document.getElementById("profileName").value.trim(),
      skills,
      experience: document.getElementById("profileExperience").value,
      hourlyRate: Number(document.getElementById("profileRate").value || 0),
      location: document.getElementById("profileLocation").value.trim(),
      availability: document.getElementById("profileAvailability").value,
      about: document.getElementById("profileAbout").value.trim()
    });
    WorkLinkState.currentUser = await WorkLinkAPI.loadCurrentUser();
    updateNavbar();
    showToast("Profile updated successfully!");
    await loadWorkerDashboard();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function closeJob(jobId) {
  if (!confirm("Are you sure you want to close this job posting?")) {
    return;
  }
  try {
    await WorkLinkAPI.closeJob(jobId);
    showToast("Job closed successfully");
    await window.refreshCurrentPage();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function markJobCompleted(jobId) {
  if (!confirm("Mark this job as completed?")) {
    return;
  }
  try {
    await WorkLinkAPI.completeJob(jobId);
    showToast("Job marked as completed!");
    await window.refreshCurrentPage();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function withdrawApplication(jobId) {
  if (!confirm("Are you sure you want to withdraw your application?")) {
    return;
  }
  try {
    await WorkLinkAPI.withdrawApplication(jobId);
    showToast("Application withdrawn successfully");
    await window.refreshCurrentPage();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function viewJobDetails(jobId) {
  window.location.href = `job-details.html?id=${jobId}`;
}

function viewWorkerProfile(workerId) {
  window.location.href = `worker-profile.html?id=${workerId}`;
}

window.loadUserDashboard = loadUserDashboard;
window.loadWorkerDashboard = loadWorkerDashboard;
window.updateUserProfile = updateUserProfile;
window.updateProfile = updateUserProfile;
window.updateWorkerProfile = updateWorkerProfile;
window.closeJob = closeJob;
window.markJobCompleted = markJobCompleted;
window.withdrawApplication = withdrawApplication;
window.viewJobDetails = viewJobDetails;
window.viewWorkerProfile = viewWorkerProfile;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("postedJobsContainer")) {
    window.refreshCurrentPage = loadUserDashboard;
    loadUserDashboard();
  }
  if (document.getElementById("appliedJobsContainer")) {
    window.refreshCurrentPage = loadWorkerDashboard;
    loadWorkerDashboard();
  }
});
