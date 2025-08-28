const resetForm = document.querySelector("#resetForm");
const message = document.querySelector("#message");

resetForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const newPassword = this.newPassword.value;
  const newPasswordConfirm = this.newPasswordConfirm.value;
  const token = window.location.pathname.split("/").pop();

  try {
    const res = await fetch(`/v1/users/resetPassword/${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newPassword, newPasswordConfirm }),
    });

    const data = await res.json();

    message.style.color = "#d9534f";
    message.textContent = data.message || data.error;
  } catch (err) {
    message.style.color = "#d9534f";
    message.textContent = "Error connecting to server. Try again later.";
  }
});
