const forgotPassword = document.querySelector("#forgotPassword");
const message = document.querySelector("#message");
forgotPassword.addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = this.email.value;
  try {
    const res = await fetch("/v1/users/forgotPassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    console.log(data);

    message.style.color = "#d9534f";
    message.textContent = data.message || data.error;
  } catch (err) {
    message.style.color = "#d9534f";
    message.textContent = "Error connecting to server. Try again later.";
  }
});
