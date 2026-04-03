async function loadFeaturedWorkers() {
  const container = document.getElementById("featuredWorkers");
  if (!container) {
    return;
  }

  try {
    const { workers } = await Api.get("/api/workers");
    const featuredWorkers = workers.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

    container.innerHTML = featuredWorkers.map((worker) => `
      <div class="col-md-3">
        <div class="card h-100">
          <div class="card-body text-center">
            <div class="avatar avatar-large mx-auto mb-3">${escapeHtml(worker.avatar || worker.name.charAt(0))}</div>
            <h5 class="card-title">${escapeHtml(worker.name)}</h5>
            <div class="rating mb-2">${generateRatingStars(worker.rating || 0)} <span class="ms-1">(${worker.reviews || 0})</span></div>
            <p class="card-text">${(worker.skills || []).map((skill) => `<span class="badge badge-skill me-1">${escapeHtml(skill)}</span>`).join("")}</p>
            <p class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${escapeHtml(worker.location || "N/A")}</p>
            <button class="btn btn-outline-primary btn-sm" onclick="viewWorkerProfile('${worker.userId || worker.id}')">View Profile</button>
          </div>
        </div>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = '<div class="col-12"><p class="text-center text-muted mb-0">Unable to load workers right now.</p></div>';
  }
}

function viewWorkerProfile(workerId) {
  window.location.href = `worker-profile.html?id=${workerId}`;
}

window.viewWorkerProfile = viewWorkerProfile;
document.addEventListener("DOMContentLoaded", loadFeaturedWorkers);
