async function register(event) {
  event.preventDefault();

  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const role = document.querySelector('input[name="role"]:checked')?.value;
  const location = document.getElementById("location")?.value.trim() || "";
  const skills = (document.getElementById("skills")?.value || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (!name || !email || !password || !role) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  try {
    await Api.post("/api/auth/register", {
      name,
      email,
      password,
      role,
      location,
      skills
    });

    showToast("Registration successful. Please login.");
    event.target.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 600);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function login(event) {
  event.preventDefault();

  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    showToast("Please fill in all fields", "error");
    return;
  }

  try {
    const { token, user } = await Api.post("/api/auth/login", { email, password });
    setSession(token, user);
    showToast("Login successful");

    setTimeout(() => {
      window.location.href = getDashboardUrl(user);
    }, 500);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function applyForJob(jobId) {
  const user = requireUser(["worker"]);
  if (!user) {
    return;
  }

  try {
    await Api.post(`/api/jobs/${jobId}/apply`, {});
    showToast("Application submitted");
    if (typeof window.refreshCurrentPage === "function") {
      await window.refreshCurrentPage();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function hireWorker(jobId, workerId) {
  const user = requireUser(["user", "admin"]);
  if (!user) {
    return;
  }

  if (!window.confirm("Hire this worker for the job?")) {
    return;
  }

  try {
    await Api.post(`/api/jobs/${jobId}/hire`, { workerId });
    showToast("Worker hired successfully");
    if (typeof window.refreshCurrentPage === "function") {
      await window.refreshCurrentPage();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
}

function toggleWorkerFields(role) {
  const workerFields = document.querySelector(".worker-only");
  if (!workerFields) {
    return;
  }

  workerFields.style.display = role === "worker" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const roleInputs = document.querySelectorAll('input[name="role"]');
  if (!roleInputs.length) {
    return;
  }

  const initialRole = document.querySelector('input[name="role"]:checked')?.value || "user";
  toggleWorkerFields(initialRole);

  roleInputs.forEach((radio) => {
    radio.addEventListener("change", () => {
      toggleWorkerFields(radio.value);
    });
  });
});

window.register = register;
window.login = login;
window.applyForJob = applyForJob;
window.hireWorker = hireWorker;
