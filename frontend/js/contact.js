async function sendMessage(event) {
  event.preventDefault();

  const button = event.target.querySelector('button[type="submit"]');
  button?.classList.add("btn-submitting");

  try {
    await Api.post("/api/contact", {
      name: document.getElementById("name")?.value.trim(),
      email: document.getElementById("email")?.value.trim(),
      phone: document.getElementById("phone")?.value.trim(),
      subject: document.getElementById("subject")?.value,
      message: document.getElementById("message")?.value.trim()
    });

    showToast("Message sent successfully");
    event.target.reset();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button?.classList.remove("btn-submitting");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".contact-panel-top, .contact-info-card, .contact-form-card").forEach((card, index) => {
    card.style.opacity = "0";
    card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
  });

  document.querySelectorAll(".contact-detail-copy").forEach((detail) => {
    detail.addEventListener("click", async function copyValue() {
      try {
        await navigator.clipboard.writeText(this.getAttribute("data-copy") || "");
        showToast("Copied to clipboard");
      } catch (_error) {
        showToast("Unable to copy", "error");
      }
    });
  });
});

window.sendMessage = sendMessage;
