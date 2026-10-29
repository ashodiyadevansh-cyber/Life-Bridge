const API_BASE_URL = "http://127.0.0.1:8000/api/accounts/";
const DESTINATION_EMAIL = "lifebridge302@gmail.com";

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const getStartedButton = document.getElementById("getStartedButton");

const loginPhone = document.getElementById("loginPhone");
const loginOTP = document.getElementById("loginOTP");
const otpSection = document.getElementById("otpSection");

const requestOtpButton = document.getElementById("requestOtpButton");
const verifyOtpButton = document.getElementById("verifyOtpButton");
const loginMessage = document.getElementById("loginMessage");

const contactForm = document.getElementById("contactForm");
const loginStatus = document.getElementById("loginStatus");
const formMessage = document.getElementById("formMessage");

let otpRequested = false;


// ------------------------------
// Navigation menu
// ------------------------------

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );

    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");

      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      menuToggle.textContent = "☰";
    });
  });
}


// ------------------------------
// User session - frontend demo
// ------------------------------

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("lifeBridgeUser") || "null");
  } catch {
    return null;
  }
}


function saveLoggedInUser(user) {
  localStorage.setItem("lifeBridgeUser", JSON.stringify(user));
}


function clearLoggedInUser() {
  localStorage.removeItem("lifeBridgeUser");
}


function updateLoginUI() {
  const user = getLoggedInUser();

  if (loginStatus) {
    loginStatus.textContent = user
      ? `Logged in as ${user.username} (${user.mobile}).`
      : "You are not logged in. Log in before sending a message.";
  }

  if (loginButton) {
    loginButton.textContent = user ? "My account" : "Log in";
  }
}


// ------------------------------
// Login modal
// ------------------------------

function openLoginModal() {
  if (!loginModal) return;

  loginModal.hidden = false;
  document.body.classList.add("modal-open");

  const user = getLoggedInUser();

  if (loginPhone) {
    loginPhone.value = user?.mobile || "";
    loginPhone.focus();
  }
}


function closeLoginModal() {
  if (!loginModal) return;

  loginModal.hidden = true;
  document.body.classList.remove("modal-open");
}


if (loginButton) {
  loginButton.addEventListener("click", openLoginModal);
}


if (getStartedButton) {
  getStartedButton.addEventListener("click", () => {
    if (getLoggedInUser()) {
      document.getElementById("contact")?.scrollIntoView({
        behavior: "smooth"
      });
    } else {
      openLoginModal();
    }
  });
}


document.getElementById("closeLoginModal")?.addEventListener(
  "click",
  closeLoginModal
);


if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModal();
    }
  });
}


document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && loginModal && !loginModal.hidden) {
    closeLoginModal();
  }
});


// ------------------------------
// Mobile and OTP input validation
// ------------------------------

if (loginPhone) {
  loginPhone.addEventListener("input", () => {
    loginPhone.value = loginPhone.value.replace(/\D/g, "").slice(0, 10);
  });
}


if (loginOTP) {
  loginOTP.addEventListener("input", () => {
    loginOTP.value = loginOTP.value.replace(/\D/g, "").slice(0, 6);
  });
}


const contactPhoneInput = document.getElementById("phone");

if (contactPhoneInput) {
  contactPhoneInput.addEventListener("input", () => {
    contactPhoneInput.value = contactPhoneInput.value
      .replace(/\D/g, "")
      .slice(0, 10);
  });
}


// ------------------------------
// Step 1: Request OTP
// ------------------------------

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mobile = loginPhone.value.trim();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      loginMessage.textContent =
        "Enter a valid 10-digit Indian mobile number.";

      return;
    }

    requestOtpButton.disabled = true;
    requestOtpButton.textContent = "Requesting OTP...";
    loginMessage.textContent = "";

    try {
      const response = await fetch(
        `${API_BASE_URL}request-otp/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ mobile })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to request OTP.");
      }

      otpRequested = true;
      otpSection.hidden = false;

      loginOTP.required = true;
      loginOTP.value = "";

      loginMessage.textContent =
        `${data.message} Development testing OTP: ${data.test_otp}. ` +
        `It expires in ${data.expires_in_seconds} seconds.`;

      loginOTP.focus();

    } catch (error) {
      loginMessage.textContent =
        error.message ||
        "Could not connect to the backend. Check whether Django is running.";
    } finally {
      requestOtpButton.disabled = false;
      requestOtpButton.textContent = "Get OTP";
    }
  });
}


// ------------------------------
// Step 2: Verify OTP
// ------------------------------

if (verifyOtpButton) {
  verifyOtpButton.addEventListener("click", async () => {
    const mobile = loginPhone.value.trim();
    const otp = loginOTP.value.trim();

    if (!otpRequested) {
      loginMessage.textContent = "Please request an OTP first.";
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      loginMessage.textContent = "Enter a valid mobile number.";
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      loginMessage.textContent = "Enter the 6-digit OTP.";
      return;
    }

    verifyOtpButton.disabled = true;
    verifyOtpButton.textContent = "Verifying...";
    loginMessage.textContent = "";

    try {
      const response = await fetch(
        `${API_BASE_URL}verify-otp/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ mobile, otp })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed.");
      }

      // Store only the user information returned by the backend.
      // This is frontend state, not secure authentication.
      saveLoggedInUser({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        mobile: data.user.mobile
      });

      otpRequested = false;

      loginMessage.textContent = "OTP verified successfully!";

      updateLoginUI();

      window.setTimeout(() => {
        closeLoginModal();

        document.getElementById("contact")?.scrollIntoView({
          behavior: "smooth"
        });
      }, 700);

    } catch (error) {
      loginMessage.textContent =
        error.message ||
        "Could not connect to the backend.";
    } finally {
      verifyOtpButton.disabled = false;
      verifyOtpButton.textContent = "Verify OTP";
    }
  });
}


// ------------------------------
// Contact form and Gmail compose
// ------------------------------

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const user = getLoggedInUser();

    if (!user) {
      formMessage.textContent =
        "Please log in first to send a message.";

      openLoginModal();
      return;
    }

    const data = new FormData(contactForm);

    const contactPhone = String(data.get("phone") || "").trim();

    if (!/^[6-9]\d{9}$/.test(contactPhone)) {
      formMessage.textContent =
        "Enter a valid 10-digit Indian mobile number.";

      contactPhoneInput?.focus();
      return;
    }

    const subject = `Life Bridge message: ${data.get("topic")}`;

    const body = [
      `Account username: ${user.username}`,
      `Account email: ${user.email}`,
      `Account mobile: ${user.mobile}`,
      "",
      `Contact name: ${data.get("fullName")}`,
      `Contact email: ${data.get("email")}`,
      `Contact mobile: ${contactPhone}`,
      `Topic: ${data.get("topic")}`,
      "",
      "Message:",
      data.get("message")
    ].join("\n");

    const gmailCompose =
      "https://mail.google.com/mail/?view=cm&fs=1" +
      `&to=${encodeURIComponent(DESTINATION_EMAIL)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    formMessage.textContent =
      "Opening Gmail. Review your message and click Send.";

    const composeWindow = window.open(
      gmailCompose,
      "_blank"
    );

    if (!composeWindow) {
      formMessage.textContent =
        "Your browser blocked the new tab. Allow pop-ups and try again.";
    }
  });
}


// ------------------------------
// Initial page state
// ------------------------------

updateLoginUI();