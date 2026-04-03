async function loadJobDetailsPage() {
  const jobId = new URLSearchParams(window.location.search).get("id");
  if (!jobId) {
    showToast("Job not found", "error");
    window.location.href = "marketplace-jobs.html";
    return;
  }

  try {
    const { job } = await Api.get(`/api/jobs/${jobId}`);
    renderJob(job);
  } catch (error) {
    showToast(error.message, "error");
    setTimeout(() => {
      window.location.href = "marketplace-jobs.html";
    }, 600);
  }
}

function renderJob(job) {
  document.getElementById("jobTitle").textContent = job.title;
  document.getElementById("jobCategory").textContent = job.category || "General";
  document.getElementById("jobStatus").innerHTML = `<span class="badge bg-${job.status === "open" ? "success" : job.status === "hired" ? "warning text-dark" : "secondary"}">${escapeHtml(job.status)}</span>`;
  document.getElementById("jobLocation").textContent = job.location;
  document.getElementById("jobBudget").textContent = formatCurrency(job.budget);
  document.getElementById("jobDuration").textContent = job.duration || "Not specified";
  document.getElementById("jobPostedBy").textContent = job.postedByName || "Unknown";
  document.getElementById("jobCreatedAt").textContent = formatDate(job.createdAt);
  document.getElementById("jobApplicants").textContent = (job.applicants || []).length;
  document.getElementById("jobDescription").textContent = job.description || "";
  document.getElementById("jobRequirements").textContent = job.requirements || "No special requirements listed.";
  document.getElementById("jobContactPhone").textContent = job.contactPhone || "Not provided";

  const actionContainer = document.getElementById("jobActions");
  const user = AppState.currentUser;
  let html = "";

  if (!user) {
    html = '<a href="login.html" class="btn btn-primary">Login to continue</a>';
  } else if (user.role === "worker") {
    const hasApplied = (job.applicants || []).includes(user.id);
    html = hasApplied
      ? `<button class="btn btn-outline-danger" onclick="withdrawApplication('${job.id}')">Withdraw Application</button>`
      : `<button class="btn btn-primary" onclick="applyForJob('${job.id}')">Apply for this Job</button>`;
  } else if ((user.role === "user" || user.role === "admin") && job.postedBy === user.id) {
    html = `
      <a href="dashboard-user.html" class="btn btn-outline-primary">Open Dashboard</a>
      ${job.status === "open" ? `<button class="btn btn-outline-danger" onclick="closeJob('${job.id}')">Close Job</button>` : ""}
    `;
  }

  actionContainer.innerHTML = html;
}

window.refreshCurrentPage = loadJobDetailsPage;
document.addEventListener("DOMContentLoaded", loadJobDetailsPage);
