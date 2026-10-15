// Life Bridge front-end interactions. Demo login is stored only in this browser.
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const getStartedButton = document.getElementById("getStartedButton");
const contactForm = document.getElementById("contactForm");
const loginStatus = document.getElementById("loginStatus");
const formMessage = document.getElementById("formMessage");

// Change this to the email address where you want to receive Life Bridge messages.
const DESTINATION_EMAIL = "lifebridge302@gmail.com";

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    menuToggle.textContent = isOpen ? "×" : "☰";
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });
}

function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem("lifeBridgeDemoUser") || "null"); }
  catch { return null; }
}
function updateLoginUI() {
  const user = getLoggedInUser();
  if (loginStatus) loginStatus.textContent = user ? `Logged in as ${user.name} (${user.phone}).` : "You are not logged in. Log in before sending a message.";
  if (loginButton) loginButton.textContent = user ? "My account" : "Log in";
}
function openLoginModal() {
  if (!loginModal) return;
  loginModal.hidden = false;
  document.body.classList.add("modal-open");
  const user = getLoggedInUser();
  if (user) {
    document.getElementById("loginName").value = user.name || "";
    document.getElementById("loginEmail").value = user.email || "";
    document.getElementById("loginPhone").value = user.phone || "";
  }
  document.getElementById("loginName").focus();
}
function closeLoginModal() {
  loginModal.hidden = true;
  document.body.classList.remove("modal-open");
}
if (loginButton) loginButton.addEventListener("click", openLoginModal);
if (getStartedButton) getStartedButton.addEventListener("click", () => {
  if (getLoggedInUser()) document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  else openLoginModal();
});
document.getElementById("closeLoginModal").addEventListener("click", closeLoginModal);
loginModal.addEventListener("click", (event) => { if (event.target === loginModal) closeLoginModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !loginModal.hidden) closeLoginModal(); });

// Accept exactly 10 digits for Indian mobile numbers in both forms.
["loginPhone", "phone"].forEach((id) => {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 10);
  });
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const enteredPhone = document.getElementById("loginPhone").value.trim();
  if (!/^[6-9]\d{9}$/.test(enteredPhone)) {
    document.getElementById("loginMessage").textContent = "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.";
    return;
  }
  const user = {
    name: document.getElementById("loginName").value.trim(),
    email: document.getElementById("loginEmail").value.trim(),
    phone: document.getElementById("loginPhone").value.trim()
  };
  localStorage.setItem("lifeBridgeDemoUser", JSON.stringify(user));
  document.getElementById("loginMessage").textContent = "Demo login successful.";
  updateLoginUI();
  window.setTimeout(() => {
    closeLoginModal();
    document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  }, 350);
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = getLoggedInUser();
  if (!user) {
    formMessage.textContent = "Please log in first to send a message.";
    openLoginModal();
    return;
  }
  const data = new FormData(contactForm);
  const contactPhone = String(data.get("phone") || "").trim();
  if (!/^[6-9]\d{9}$/.test(contactPhone)) {
    formMessage.textContent = "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.";
    document.getElementById("phone").focus();
    return;
  }
  const subject = `Life Bridge message: ${data.get("topic")}`;
  const body = [
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    `Mobile: ${user.phone}`,
    `Topic: ${data.get("topic")}`,
    "",
    "Message:",
    data.get("message")
  ].join("\n");
  // Open Gmail's compose window in the browser with the recipient, subject and message prefilled.
  // This avoids relying on a desktop mail app being configured for mailto: links.
  const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(DESTINATION_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  formMessage.textContent = "Opening Gmail with your message filled in. Review it and click Send in Gmail.";
  const composeWindow = window.open(gmailCompose, "_blank", "noopener,noreferrer");
  if (!composeWindow) {
    formMessage.textContent = "Your browser blocked the new tab. Allow pop-ups for this site, then click Send message again.";
  }
});

updateLoginUI();
