async function postJob(event) {
  event.preventDefault();

  const user = requireUser(["user", "admin"]);
  if (!user) {
    return;
  }

  const payload = {
    title: document.getElementById("jobTitle")?.value.trim(),
    category: document.getElementById("category")?.value,
    location: document.getElementById("location")?.value.trim(),
    budget: document.getElementById("budget")?.value.trim(),
    duration: document.getElementById("duration")?.value,
    description: document.getElementById("description")?.value.trim(),
    requirements: document.getElementById("requirements")?.value.trim(),
    contactPhone: document.getElementById("contactPhone")?.value.trim()
  };

  if ((payload.description || "").length < 20) {
    showToast("Description must be at least 20 characters", "error");
    return;
  }

  try {
    await Api.post("/api/jobs", payload);
    showToast("Job posted successfully");
    setTimeout(() => {
      window.location.href = "dashboard-user.html";
    }, 500);
  } catch (error) {
    showToast(error.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = requireUser(["user", "admin"]);
  if (!user) {
    return;
  }

  const phone = document.getElementById("contactPhone");
  if (phone && user.phone) {
    phone.value = user.phone;
  }
});

window.postJob = postJob;
