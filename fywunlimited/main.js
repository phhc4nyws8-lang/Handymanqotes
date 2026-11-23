// Progressive enhancement: forms still POST normally without JS.
// With JS, submit via fetch and show inline status instead of leaving the page.
(() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  document.querySelectorAll("form.signup").forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".form-status");

    const setStatus = (msg, state) => {
      status.textContent = msg;
      status.dataset.state = state || "";
    };

    input.addEventListener("input", () => {
      input.removeAttribute("aria-invalid");
      setStatus("");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = input.value.trim();

      if (!EMAIL_RE.test(email)) {
        input.setAttribute("aria-invalid", "true");
        setStatus("Enter a valid email address.", "error");
        input.focus();
        return;
      }

      if (form.action.includes("YOUR_FORM_ID")) {
        console.warn("Signup form endpoint not configured. Set the form action in index.html.");
        setStatus("Signups open soon. Check back shortly.", "error");
        return;
      }

      button.disabled = true;
      setStatus("Sending…");

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        setStatus("You're on the list. Watch your inbox.", "success");
      } catch (err) {
        console.error("Signup failed:", err);
        setStatus("Something went wrong. Please try again.", "error");
      } finally {
        button.disabled = false;
      }
    });
  });
})();
