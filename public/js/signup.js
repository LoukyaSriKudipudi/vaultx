const signupForm = document.querySelector("#signupForm");
const message = document.querySelector("#message");

signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const values = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/v1/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    console.log(data);
    message.style.color = "green";
    message.textContent = data.message || data.error;

    if (
      !(message.textContent === "Email already exists. Please use another one")
    ) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    }
  } catch (err) {
    message.style.color = "#d9534f";
    message.textContent = "Error connecting to server. Try again later.";
  }
});
