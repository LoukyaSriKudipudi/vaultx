const loginForm = document.querySelector("#loginForm");
const message = document.querySelector("#message");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = this.email.value;
  const password = this.password.value;

  try {
    const res = await fetch("/v1/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = "green";
      message.textContent = "Login successful! Redirecting...";
      const token = data.token;
      localStorage.setItem("token", token);
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 900);
    } else {
      message.style.color = "#d9534f";
      message.textContent =
        data.message || "Login failed. Check your credentials.";
    }
  } catch (err) {
    message.style.color = "#d9534f";
    message.textContent = "Error connecting to server. Try again later.";
  }
});
