function renderJobsGrid(jobs) {
  const grid = document.getElementById("jobsGrid");
  if (!grid) return;

  if (!jobs.length) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h4>No Jobs Found</h4>
          <p>Try adjusting your search criteria.</p>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = jobs.map((job) => `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h5 class="card-title mb-0">${escapeHtml(job.title)}</h5>
            <span class="badge bg-success">Open</span>
          </div>
          <p class="text-muted mb-2"><i class="fas fa-map-marker-alt me-2"></i>${escapeHtml(job.location)}</p>
          <p class="card-text mb-3">${escapeHtml(truncateText(job.description, 110))}</p>
          <div class="mb-3">
            <span class="badge badge-skill">${escapeHtml(job.category || "General")}</span>
            <span class="badge bg-light text-dark ms-2">${escapeHtml(formatCurrency(job.budget))}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">${formatDate(job.createdAt)}</small>
            <div class="btn-group">
              <button class="btn btn-outline-primary btn-sm" onclick="window.location.href='job-details.html?id=${job.id}'">Details</button>
              <button class="btn btn-primary btn-sm" onclick="applyForJob('${job.id}')">Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadJobs() {
  const params = new URLSearchParams();
  const query = document.getElementById("searchQuery")?.value.trim();
  const location = document.getElementById("locationFilter")?.value.trim();
  const category = document.getElementById("categoryFilter")?.value;

  if (query) params.set("q", query);
  if (location) params.set("location", location);
  if (category) params.set("category", category);
  params.set("status", "open");

  try {
    const { jobs } = await Api.get(`/api/jobs?${params.toString()}`);
    renderJobsGrid(jobs);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function renderWorkersGrid(workers) {
  const grid = document.getElementById("workersGrid");
  if (!grid) return;

  if (!workers.length) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <h4>No Workers Found</h4>
          <p>Try adjusting your search criteria.</p>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = workers.map((worker) => `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <div class="avatar avatar-large me-3">${escapeHtml(worker.avatar || worker.name.charAt(0))}</div>
            <div>
              <h5 class="card-title mb-1">${escapeHtml(worker.name)}</h5>
              <span class="badge ${worker.availability === "available" ? "badge-available" : "badge-busy"}">${escapeHtml(worker.availability || "available")}</span>
            </div>
          </div>
          <div class="rating mb-2">${generateRatingStars(worker.rating || 0)} <span class="text-muted ms-2">(${worker.reviews || 0} reviews)</span></div>
          <p class="mb-2"><i class="fas fa-map-marker-alt text-muted me-2"></i>${escapeHtml(worker.location || "N/A")}</p>
          <p class="mb-2"><i class="fas fa-briefcase text-muted me-2"></i>${escapeHtml(worker.experience || 0)} years experience</p>
          <div class="mb-3">${(worker.skills || []).map((skill) => `<span class="badge badge-skill me-1">${escapeHtml(skill)}</span>`).join("")}</div>
          <div class="d-flex justify-content-between align-items-center">
            <div><strong>${escapeHtml(formatCurrency(worker.hourlyRate || 0))}</strong><small class="text-muted">/hour</small></div>
            <button class="btn btn-primary btn-sm" onclick="window.location.href='worker-profile.html?id=${worker.userId || worker.id}'">View Profile</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadWorkers() {
  const params = new URLSearchParams();
  const query = document.getElementById("searchQuery")?.value.trim();
  const location = document.getElementById("locationFilter")?.value.trim();
  const skill = document.getElementById("skillFilter")?.value;

  if (query) params.set("q", query);
  if (location) params.set("location", location);
  if (skill) params.set("skill", skill);

  try {
    const { workers } = await Api.get(`/api/workers?${params.toString()}`);
    renderWorkersGrid(workers);
  } catch (error) {
    showToast(error.message, "error");
  }
}

window.searchJobs = loadJobs;
window.searchWorkers = loadWorkers;
window.refreshCurrentPage = async function refreshCurrentPage() {
  if (document.getElementById("jobsGrid")) {
    await loadJobs();
  }
  if (document.getElementById("workersGrid")) {
    await loadWorkers();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("jobsGrid")) {
    loadJobs();
  }
  if (document.getElementById("workersGrid")) {
    loadWorkers();
  }
});
