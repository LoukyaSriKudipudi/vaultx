const token = localStorage.getItem("token");
const dashboardButton = document.querySelector("#dashboard");
if (token) {
  dashboardButton.textContent = "Go to Dashboard";
  dashboardButton.href = "/dashboard.html";
}
