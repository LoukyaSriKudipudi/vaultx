const token = localStorage.getItem("token");

// Fetch and show user data
async function showNameandEmail() {
  const form = document.querySelector("#nameandEmailUpdateForm");

  try {
    const res = await fetch("/v1/users/user", {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json();

    if (res.ok) {
      // adjust field names depending on your DB
      form.elements["name"].value = data.user.username;
      form.elements["email"].value = data.user.email;
    } else {
      console.error("Failed:", data.message || data.error);
    }
  } catch (err) {
    console.error("Error fetching user data", err);
  }
}

showNameandEmail();

const nameandEmailUpdateFormMessage = document.querySelector(
  "#nameandEmailUpdateFormMessage"
);
// Update user data
document
  .querySelector("#nameandEmailUpdateForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const values = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/v1/users/editUserNameAndEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (res.ok) {
        nameandEmailUpdateFormMessage.textContent = data.message;
        setTimeout(() => {
          nameandEmailUpdateFormMessage.textContent = "";
        }, 2000);
        showNameandEmail();
      } else {
        console.error("Update failed:", data.message || data.error);
      }
    } catch (err) {
      console.error("Error updating user data", err);
    }
  });

//  update password
const passwordUpdateForm = document.querySelector("#passwordUpdateForm");
const passwordUpdateMessage = document.querySelector("#passwordUpdateMessage");

passwordUpdateForm.addEventListener("submit", async function (e) {
  e.preventDefault(); // prevent form reload

  const formData = new FormData(this);
  const values = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("/v1/users/changePassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    passwordUpdateMessage.textContent = data.message;

    if (res.ok && data.token) {
      localStorage.setItem("token", data.token); // only update if success
    }
  } catch (err) {
    passwordUpdateMessage.textContent = "Network error. Try again later.";
    console.error(err);
  }
});

const deleteUserForm = document.querySelector("#deleteUserForm");
const userDeleteMessage = document.querySelector("#userDeleteMessage");
const userNameMessage = document.querySelector("#userNameMessage");
const userDeleteConfirmContainer = document.querySelector(
  "#userDeleteConfirmContainer"
);

// First step: Show counts before deleting
deleteUserForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  try {
    const res = await fetch("/v1/users/deleteUserConfirm", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      // Show user info
      userNameMessage.textContent = `User: ${data.username}`;
      userDeleteMessage.textContent = `Note: ${data.message}`;

      // Create buttons
      const confirmBtns = document.createElement("div");
      confirmBtns.innerHTML = `
        <button id="permanentlyDelete">Yes, Permanently Delete</button>
        <button id="cancelDelete">Cancel</button>
      `;

      // Clear previous buttons if any
      userDeleteConfirmContainer.innerHTML = "";
      userDeleteConfirmContainer.append(confirmBtns);

      // Attach events
      document
        .querySelector("#permanentlyDelete")
        .addEventListener("click", async () => {
          try {
            const delRes = await fetch("/v1/users/deleteUser", {
              method: "DELETE",
              headers: {
                Authorization: "Bearer " + token,
              },
            });

            const delData = await delRes.json();
            userDeleteMessage.textContent = delData.message;

            if (delRes.ok) {
              localStorage.removeItem("token");
              setTimeout(() => {
                window.location.href = "/signup.html";
              }, 1500);
            }
          } catch (err) {
            userDeleteMessage.textContent = "Error deleting account.";
            console.error(err);
          }
        });

      document.querySelector("#cancelDelete").addEventListener("click", () => {
        userDeleteConfirmContainer.innerHTML = "";
        userDeleteMessage.textContent = "Account deletion canceled.";
      });
    }
  } catch (err) {
    userDeleteMessage.textContent = "Something went wrong. Try again.";
    console.error(err);
  }
});
