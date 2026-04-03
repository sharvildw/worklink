const AppState = {
  token: localStorage.getItem("worklink_token") || "",
  currentUser: localStorage.getItem("worklink_user") ? JSON.parse(localStorage.getItem("worklink_user")) : null
};

const WorkLinkState = AppState;
const FOOTER_YEAR = 2026;

const API_BASE_URL = (() => {
  const configuredBase = window.WORKLINK_API_BASE || localStorage.getItem("worklink_api_base") || "";
  const defaultApiBase = "https://worklink-rtpb.onrender.com";
  if (configuredBase) {
    return configuredBase.replace(/\/$/, "");
  }

  if (window.location.protocol === "file:") {
    return defaultApiBase;
  }

  const isLocalDevHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocalDevHost) {
    return defaultApiBase;
  }

  return window.location.origin;
})();

const buildApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const Api = {
  async request(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    };

    if (AppState.token) {
      headers.Authorization = `Bearer ${AppState.token}`;
    }

    const response = await fetch(buildApiUrl(path), {
      ...options,
      headers
    });

    const text = await response.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (_error) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || data.msg || "Request failed");
    }

    return data;
  },

  get(path) {
    return this.request(path, { method: "GET" });
  },

  post(path, body) {
    return this.request(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
  },

  put(path, body) {
    return this.request(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
  },

  patch(path, body) {
    return this.request(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
  },

  delete(path) {
    return this.request(path, { method: "DELETE" });
  }
};

const WorkLinkAPI = {
  getCachedUser() {
    return AppState.currentUser;
  },

  async loadCurrentUser() {
    const { user } = await Api.get("/api/auth/me");
    if (user) {
      setSession(AppState.token, user);
    }
    return user;
  },

  async getJobs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    });

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const { jobs } = await Api.get(`/api/jobs${suffix}`);
    return jobs || [];
  },

  async getWorkers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    });

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const { workers } = await Api.get(`/api/workers${suffix}`);
    return workers || [];
  },

  async getWorker(id) {
    const { worker } = await Api.get(`/api/workers/${id}`);
    return worker;
  },

  async updateWorker(id, payload) {
    const { worker } = await Api.patch(`/api/workers/${id}`, payload);
    return worker;
  },

  async updateUser(_id, payload) {
    const { user } = await Api.patch("/api/users/profile", payload);
    if (user) {
      setSession(AppState.token, user);
    }
    return user;
  },

  async closeJob(id) {
    const { job } = await Api.post(`/api/jobs/${id}/close`, {});
    return job;
  },

  async completeJob(id) {
    const { job } = await Api.post(`/api/jobs/${id}/complete`, {});
    return job;
  },

  async withdrawApplication(id) {
    const { job } = await Api.post(`/api/jobs/${id}/withdraw`, {});
    return job;
  },

  async getAdminSummary() {
    const response = await Api.get("/api/admin/summary");
    return response.summary || response.stats || {};
  },

  async getUsers() {
    const { users } = await Api.get("/api/admin/users");
    return users || [];
  },

  async getAdminJobs() {
    const { jobs } = await Api.get("/api/admin/jobs");
    return jobs || [];
  },

  async getAdminWorkers() {
    const { workers } = await Api.get("/api/admin/workers");
    return workers || [];
  },

  async getSettings() {
    const { settings } = await Api.get("/api/admin/settings");
    return settings || {};
  },

  async saveSettings(payload) {
    const { settings } = await Api.post("/api/admin/settings", payload);
    return settings;
  },

  async deleteUser(id) {
    return Api.delete(`/api/admin/user/${id}`);
  },

  async deleteJob(id) {
    return Api.delete(`/api/jobs/${id}`);
  },

  async deleteWorker(id) {
    return Api.delete(`/api/workers/${id}`);
  }
};

function setSession(token, user) {
  AppState.token = token || "";
  AppState.currentUser = user || null;

  if (token) {
    localStorage.setItem("worklink_token", token);
  } else {
    localStorage.removeItem("worklink_token");
  }

  if (user) {
    localStorage.setItem("worklink_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("worklink_user");
  }
}

function getStoredUser() {
  const raw = localStorage.getItem("worklink_user");
  return raw ? JSON.parse(raw) : null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle"
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas ${icons[type] || icons.info} me-2"></i>
      <div>${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    if (!container.children.length) {
      container.remove();
    }
  }, 3000);
}

function formatDate(dateString) {
  if (!dateString) {
    return "N/A";
  }

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function timeAgo(dateString) {
  if (!dateString) {
    return "N/A";
  }

  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(dateString);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

function formatCurrency(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return amount || "Negotiable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0
  }).format(value);
}

function generateRatingStars(rating = 0) {
  const fullStars = Math.floor(Number(rating) || 0);
  const halfStar = (Number(rating) || 0) % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let html = "";
  for (let index = 0; index < fullStars; index += 1) {
    html += '<i class="fas fa-star text-warning"></i>';
  }
  if (halfStar) {
    html += '<i class="fas fa-star-half-alt text-warning"></i>';
  }
  for (let index = 0; index < emptyStars; index += 1) {
    html += '<i class="far fa-star text-warning"></i>';
  }

  return html;
}

function truncateText(text, maxLength) {
  const value = String(text || "");
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function getDashboardUrl(user) {
  if (!user) {
    return "login.html";
  }
  if (user.role === "admin") return "admin-panel.html";
  if (user.role === "worker") return "dashboard-worker.html";
  return "dashboard-user.html";
}

function getPageTitleLabel(page) {
  const labels = {
    "index.html": "Home",
    "about.html": "About",
    "contact.html": "Contact",
    "marketplace-workers.html": "Workers",
    "marketplace-jobs.html": "Jobs",
    "post-job.html": "Post Job",
    "worker-profile.html": "Profile",
    "job-details.html": "Job Details",
    "dashboard-user.html": "Employer Dashboard",
    "dashboard-worker.html": "Worker Dashboard",
    "login.html": "Login",
    "register.html": "Register",
    "terms.html": "Terms",
    "privacy.html": "Privacy"
  };

  return labels[page] || "WorkLink";
}

function renderCompactNavbarLinks(currentPage) {
  const links = [
    { href: "index.html", label: "Home" },
    { href: "about.html", label: "About" },
    { href: "contact.html", label: "Contact" }
  ];

  return `
    <div class="nav-quick-links">
      ${links.map((link) => `<a class="nav-link ${currentPage === link.href ? "active" : ""}" href="${link.href}">${link.label}</a>`).join("")}
      <a class="btn btn-primary btn-sm nav-quick-cta" href="${currentPage === "login.html" ? "register.html" : "login.html"}">${currentPage === "login.html" ? "Register" : "Login"}</a>
    </div>
  `;
}

function enhanceNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) {
    return;
  }

  const shell = navbar.querySelector(".container");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (shell) {
    shell.classList.add("site-navbar-shell");
  }

  const brand = navbar.querySelector(".navbar-brand");
  if (brand && shell && !shell.querySelector(".nav-project-chip")) {
    brand.insertAdjacentHTML(
      "afterend",
      `
        <div class="nav-project-chip">
          <span class="nav-project-dot"></span>
          <span>${getPageTitleLabel(currentPage)}</span>
          <span class="nav-project-separator"></span>
          <span>Project 2026</span>
        </div>
      `
    );
  }

  const toggler = navbar.querySelector(".navbar-toggler");
  if (toggler) {
    toggler.classList.add("site-navbar-toggle");
  }

  const collapse = navbar.querySelector(".navbar-collapse");
  if (collapse) {
    collapse.classList.add("site-navbar-collapse");
  }

  const navList = navbar.querySelector(".navbar-nav");
  if (navList) {
    navList.classList.add("site-nav-list");
  } else if (shell && !shell.querySelector(".nav-quick-links")) {
    shell.insertAdjacentHTML("beforeend", renderCompactNavbarLinks(currentPage));
  }
}

function renderFooter() {
  const footer = document.querySelector(".footer");
  if (!footer) {
    return;
  }

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h5><i class="fas fa-briefcase me-2"></i>WorkLink</h5>
          <p>Modern local hiring for skilled workers, fast-moving job requests, and trusted neighbourhood opportunities.</p>
        </div>
        <div>
          <div class="footer-title">Explore</div>
          <ul class="footer-list">
            <li><a href="index.html">Home</a></li>
            <li><a href="marketplace-workers.html">Find Workers</a></li>
            <li><a href="marketplace-jobs.html">Find Jobs</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-title">Company</div>
          <ul class="footer-list">
            <li><a href="about.html">About</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="terms.html">Terms</a></li>
            <li><a href="privacy.html">Privacy</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-title">Connect</div>
          <ul class="footer-list">
            <li><i class="fas fa-envelope me-2"></i>support@worklink.com</li>
            <li><i class="fas fa-phone me-2"></i>+91 1234567890</li>
            <li><i class="fas fa-location-dot me-2"></i>Mumbai, India</li>
          </ul>
          <div class="footer-social mt-3">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>
      <div class="footer-bottom d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <div class="footer-copy">&copy; ${FOOTER_YEAR} WorkLink. All rights reserved.</div>
      </div>
    </div>
  `;
}

function updateNavbar() {
  const navLinks = document.querySelector(".navbar-nav");
  if (!navLinks) {
    return;
  }

  const user = AppState.currentUser;
  const baseItems = Array.from(navLinks.children).filter((item) => !item.classList.contains("auth-slot"));
  navLinks.innerHTML = "";
  baseItems.forEach((item) => navLinks.appendChild(item));

  if (user) {
    navLinks.insertAdjacentHTML(
      "beforeend",
      `
        <li class="nav-item dropdown auth-slot">
          <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
            <div class="avatar" style="width:30px;height:30px;font-size:.9rem;display:inline-flex;align-items:center;justify-content:center;margin-right:5px;">
              ${escapeHtml(user.avatar || user.name?.charAt(0) || "U")}
            </div>
            ${escapeHtml(user.name)}
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="${getDashboardUrl(user)}">Dashboard</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
          </ul>
        </li>
      `
    );
  } else {
    navLinks.insertAdjacentHTML(
      "beforeend",
      `
        <li class="nav-item auth-slot"><a class="nav-link" href="login.html">Login</a></li>
        <li class="nav-item auth-slot"><a class="nav-link btn btn-primary text-white px-4" href="register.html">Register</a></li>
      `
    );
  }
}

async function hydrateSession() {
  const storedUser = getStoredUser();
  if (storedUser) {
    AppState.currentUser = storedUser;
  }

  if (!AppState.token) {
    updateNavbar();
    return;
  }

  try {
    const user = await WorkLinkAPI.loadCurrentUser();
    if (!user) {
      setSession("", null);
    }
  } catch (_error) {
    setSession("", null);
  }

  updateNavbar();
}

async function syncCurrentUser() {
  if (!AppState.token) {
    return null;
  }

  try {
    return await WorkLinkAPI.loadCurrentUser();
  } catch (_error) {
    return AppState.currentUser;
  }
}

async function logout() {
  try {
    if (AppState.token) {
      await Api.post("/api/auth/logout", {});
    }
  } catch (_error) {
    // Ignore logout failures and clear client session anyway.
  }

  setSession("", null);
  showToast("Logged out successfully");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}

function requireUser(roles) {
  const user = AppState.currentUser;
  if (!user) {
    showToast("Please login first", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 600);
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    showToast("You are not allowed to access this page", "error");
    setTimeout(() => {
      window.location.href = getDashboardUrl(user);
    }, 600);
    return null;
  }

  return user;
}

document.addEventListener("DOMContentLoaded", async () => {
  await hydrateSession();
  enhanceNavbar();
  renderFooter();

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });

  document.querySelectorAll("[data-bs-toggle='tooltip']").forEach((tooltip) => {
    if (window.bootstrap?.Tooltip) {
      new bootstrap.Tooltip(tooltip);
    }
  });
});

window.Api = Api;
window.AppState = AppState;
window.WorkLinkState = WorkLinkState;
window.WorkLinkAPI = WorkLinkAPI;
window.setSession = setSession;
window.showToast = showToast;
window.formatDate = formatDate;
window.timeAgo = timeAgo;
window.formatCurrency = formatCurrency;
window.generateRatingStars = generateRatingStars;
window.truncateText = truncateText;
window.escapeHtml = escapeHtml;
window.requireUser = requireUser;
window.logout = logout;
window.getDashboardUrl = getDashboardUrl;
window.syncCurrentUser = syncCurrentUser;
window.API_BASE_URL = API_BASE_URL;
window.buildApiUrl = buildApiUrl;
