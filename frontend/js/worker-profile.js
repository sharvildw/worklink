async function loadWorkerProfilePage() {
  const params = new URLSearchParams(window.location.search);
  const workerId = params.get("id");

  if (!workerId) {
    showToast("Worker not found", "error");
    window.location.href = "marketplace-workers.html";
    return;
  }

  try {
    const { worker } = await Api.get(`/api/workers/${workerId}`);
    renderWorkerProfile(worker);
  } catch (error) {
    showToast(error.message, "error");
    setTimeout(() => {
      window.location.href = "marketplace-workers.html";
    }, 600);
  }
}

function renderWorkerProfile(worker) {
  document.getElementById("workerName").textContent = worker.name || "Worker";
  document.getElementById("workerProfession").textContent = (worker.skills || []).slice(0, 2).join(" • ") || "Professional";
  document.getElementById("profileAvatar").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name || "W")}&size=120&background=667eea&color=fff`;
  document.getElementById("workerLocation").innerHTML = `<i class="fas fa-map-marker-alt me-1"></i>${escapeHtml(worker.location || "Not specified")}`;
  document.getElementById("workerExperience").innerHTML = `<i class="fas fa-briefcase me-1"></i>${escapeHtml(worker.experience || 0)} years`;
  document.getElementById("completedJobs").textContent = worker.completedJobs || 0;
  document.getElementById("successRate").textContent = `${worker.completedJobs ? 98 : 90}%`;
  document.getElementById("responseTime").textContent = "2h";
  document.getElementById("hourlyRate").textContent = formatCurrency(worker.hourlyRate || 0);
  document.getElementById("workerBio").textContent = worker.about || "No bio provided yet.";
  document.getElementById("ratingStars").innerHTML = generateRatingStars(worker.rating || 0);
  document.getElementById("reviewCount").textContent = `(${worker.reviews || 0} reviews)`;
  document.getElementById("rateDisplay").textContent = `${formatCurrency(worker.hourlyRate || 0)}/hr`;

  const badge = document.getElementById("availabilityBadge");
  const isAvailable = worker.availability === "available";
  badge.className = `availability-badge bg-${isAvailable ? "success" : "secondary"} text-white`;
  badge.innerHTML = `<i class="fas fa-circle me-2"></i>${isAvailable ? "Available" : "Busy"}`;

  document.getElementById("skillsContainer").innerHTML = (worker.skills || [])
    .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
    .join("") || '<p class="text-muted mb-0">No skills listed.</p>';

  document.getElementById("languagesContainer").innerHTML = (worker.languages || [])
    .map((lang) => `<span class="badge bg-light text-dark me-2 p-2">${escapeHtml(lang)}</span>`)
    .join("") || '<p class="text-muted mb-0">Not specified.</p>';
}

function contactWorkerProfile() {
  const user = requireUser(["user", "admin"]);
  if (!user) return;
  showToast("Contact flow is not implemented yet", "info");
}

function inviteToJob() {
  const user = requireUser(["user", "admin"]);
  if (!user) return;
  const workerId = new URLSearchParams(window.location.search).get("id");
  window.location.href = `post-job.html?invite=${workerId}`;
}

function shareProfile(platform) {
  const url = encodeURIComponent(window.location.href);
  const name = encodeURIComponent(document.getElementById("workerName").textContent);
  const urls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${name}&url=${url}`,
    whatsapp: `https://wa.me/?text=${name}%20${url}`
  };
  window.open(urls[platform], "_blank", "width=600,height=400");
}

window.contactWorker = contactWorkerProfile;
window.inviteToJob = inviteToJob;
window.shareProfile = shareProfile;
document.addEventListener("DOMContentLoaded", loadWorkerProfilePage);
