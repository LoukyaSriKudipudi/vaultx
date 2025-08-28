const SecretForm = document.querySelector("#SecretForm");
const fileInput = document.querySelector("#file");
const titleInput = document.getElementById("title");
const secretInput = document.getElementById("secret");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");
const uploadedFilesFilenames = document.getElementById(
  "uploadedFilesFilenames"
);
const hideContainer = document.querySelector("#hideContainer");

const token = localStorage.getItem("token");

// Redirect if no token
if (!token) window.location.href = "/login.html";

// Get secret id from URL hash
const secretId = window.location.hash.substring(1);

// Hide container by default if no secretId
if (!secretId) {
  hideContainer.style.display = "none";
}

// Load existing secret if editing
async function loadSecret(id) {
  if (!id) return;
  try {
    const res = await fetch(`/v1/data/vault/${id}`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Failed to fetch secret");

    const data = await res.json();
    titleInput.value = data.title || "";
    secretInput.value = data.value || "";

    uploadedFilesFilenames.innerHTML = ""; // Clear previous entries

    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        const filenameEl = document.createElement("p");
        filenameEl.textContent = file.filename || "Unnamed file";
        filenameEl.setAttribute("data-id", file.key);
        filenameEl.classList.add("attachedFile");
        uploadedFilesFilenames.append(filenameEl);
      });
      hideContainer.style.display = "block";
    } else {
      uploadedFilesFilenames.textContent = "No attachments";
      hideContainer.style.display = "block";
    }

    formTitle.textContent = "Edit Secret";
    submitBtn.textContent = "Update Secret";
  } catch (err) {
    console.error("Failed to load secret:", err);
    message.style.color = "red";
    message.textContent = "Failed to load secret.";
  }
}

// Handle form submission
SecretForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const value = secretInput.value.trim();
  const files = fileInput.files;

  if (!title || !value) {
    message.style.color = "red";
    message.textContent = "Title and Secret cannot be empty!";
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("value", value);

  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }

  const method = secretId ? "PATCH" : "POST";
  const url = secretId ? `/v1/data/vault/${secretId}` : "/v1/data/vault";

  try {
    const res = await fetch(url, {
      method,
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = "green";
      message.textContent = data.message || "Secret saved successfully!";
      setTimeout(() => (message.textContent = ""), 3000);

      if (!secretId) {
        SecretForm.reset();
        hideContainer.style.display = "none";
      }
    } else {
      message.style.color = "red";
      message.textContent =
        data.message || data.error || "Something went wrong!";
    }
  } catch (err) {
    console.error(err);
    message.style.color = "red";
    message.textContent = "Network error. Please try again.";
  }
});

// // Download file by key
// async function getFile(key) {
//   try {
//     const res = await fetch(`/v1/data/vault/file/${key}`, {
//       method: "GET",
//       headers: { Authorization: "Bearer " + token },
//     });

//     if (!res.ok) throw new Error("Failed to download file");

//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);

//     // Trigger download
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = key;
//     document.body.appendChild(a);
//     a.click();
//     a.remove();

//     URL.revokeObjectURL(url);
//   } catch (err) {
//     console.error(err);
//     alert("Failed to download file.");
//   }
// }

async function getFile(key) {
  try {
    const res = await fetch(`/v1/data/vault/file/${encodeURIComponent(key)}`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("Failed to get file URL");

    const { url, filename } = await res.json();
    // window.open(url, "_blank");

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error(err);
    alert("Failed to download file.");
  }
}

// Event delegation for attached files
uploadedFilesFilenames.addEventListener("click", (e) => {
  if (e.target.classList.contains("attachedFile")) {
    const key = e.target.dataset.id;
    if (key) getFile(key);
  }
});

// Initialize
loadSecret(secretId);

const sorry = document.querySelector("#sorry");
for (let i = 0; i < 1001; i++) {
  console.log(`${i} Sorry`);

  sorry.textContent += `${i} Sorry\n`;
}
