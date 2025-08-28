const token = localStorage.getItem("token");
const logout = document.querySelector("#logout");
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("search");
const selectAllCheckbox = document.querySelector(
  "thead input[type='checkbox']"
);

const deleteSelectedBtn = document.getElementById("deleteSelected");

deleteSelectedBtn.style.display = "none";

let searchQuery = "";

function isTokenValid(token) {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (err) {
    return false;
  }
}

if (!isTokenValid(token)) {
  window.location.href = "/login.html";
}

// Logout
logout.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
});

async function getSecrets() {
  const url = searchQuery
    ? `/v1/data/vault?search=${encodeURIComponent(searchQuery)}`
    : "/v1/data/vault";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  const data = await res.json();

  // Update welcome message
  const welcomeMessage = document.querySelector("#welcomeMessage");
  if (data.username) {
    welcomeMessage.textContent = `Welcome back, ${data.username} 👋`;
  }

  return data.results || [];
}

function renderSecrets(secrets) {
  tableBody.innerHTML = "";

  if (!secrets.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" style="text-align:center; color:#aaa">No secrets found</td>`;
    tableBody.appendChild(row);
    return;
  }

  secrets.forEach((secret, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input id="checkbox" class="rowCheckbox" type="checkbox" data-id="${
        secret._id
      }" /></td>
      <td class="sNo">${index + 1}</td>
      <td class="viewBtn" data-id="${secret._id}" >${secret.title}</td>
    `;
    tableBody.appendChild(row);
  });
}

async function loadAndRenderSecrets() {
  const secrets = await getSecrets();
  renderSecrets(secrets);
  updateSelectAllCheckbox();
}

// async function deleteSecret(secretId) {
//   if (!confirm("Are you sure you want to delete this secret?")) return;

//   await fetch(`/v1/data/vault/${secretId}`, {
//     method: "DELETE",
//     headers: {
//       Authorization: "Bearer " + token,
//     },
//   });

//   loadAndRenderSecrets();
// }

// Delete multiple secrets

deleteSelectedBtn.addEventListener("click", async () => {
  const selectedCheckboxes = document.querySelectorAll(".rowCheckbox:checked");
  if (selectedCheckboxes.length === 0) {
    alert("Please select at least one item to delete");
    return;
  }

  if (!confirm(`Delete ${selectedCheckboxes.length} selected item(s)?`)) return;

  const itemIds = Array.from(selectedCheckboxes).map((cb) => cb.dataset.id);
  const res = await fetch("/v1/data/vault/deleteMultiple", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ itemIds }),
  });

  const data = await res.json();
  alert(data.message || "Items deleted successfully");
  deleteSelectedBtn.style.display = "none";

  loadAndRenderSecrets();
});

tableBody.addEventListener("click", (e) => {
  const target = e.target;

  // // Delete
  // if (target.classList.contains("deleteBtn")) {
  //   const secretId = target.dataset.id;
  //   deleteSecret(secretId);
  // }

  // View
  if (target.classList.contains("viewBtn")) {
    const secretId = target.dataset.id;
    window.location.href = `/secret.html#${secretId}`;
  }
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim();
  loadAndRenderSecrets();
});

selectAllCheckbox.addEventListener("change", () => {
  deleteSelectedBtn.style.display = "flex";

  const checkboxes = document.querySelectorAll(".rowCheckbox");
  checkboxes.forEach((cb) => (cb.checked = selectAllCheckbox.checked));
});

function updateSelectAllCheckbox() {
  const checkboxes = document.querySelectorAll(".rowCheckbox");
  if (!checkboxes.length) {
    selectAllCheckbox.checked = false;
    return;
  }
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
  selectAllCheckbox.checked = allChecked;
}

// Update select all when a row checkbox changes
tableBody.addEventListener("change", (e) => {
  if (e.target.classList.contains("rowCheckbox")) {
    deleteSelectedBtn.style.display = "flex";

    updateSelectAllCheckbox();
  }
});

loadAndRenderSecrets();
