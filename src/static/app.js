document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        activitiesList.appendChild(createActivityCard(name, details));

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function createActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const spotsLeft = details.max_participants - details.participants.length;

    activityCard.innerHTML = `
      <div class="activity-title-wrapper">
        <h4 class="activity-title">${name}</h4>
        <div class="activity-tooltip">
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        </div>
      </div>
      <div class="participants">
        <strong>Participants</strong>
        <ul class="participant-list"></ul>
      </div>
    `;

    const participantList = activityCard.querySelector(".participant-list");
    if (details.participants.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "No participants yet.";
      emptyItem.className = "participant-item";
      participantList.appendChild(emptyItem);
    } else {
      details.participants.forEach((email) => {
        participantList.appendChild(createParticipantItem(email, name));
      });
    }

    return activityCard;
  }

  function createParticipantItem(email, activityName) {
    const participantItem = document.createElement("li");
    participantItem.className = "participant-item";

    const nameSpan = document.createElement("span");
    nameSpan.className = "participant-email";
    nameSpan.textContent = email;

    const deleteButton = document.createElement("button");
    deleteButton.className = "participant-delete";
    deleteButton.type = "button";
    deleteButton.title = `Unregister ${email}`;
    deleteButton.textContent = "✕";
    deleteButton.addEventListener("click", () => {
      unregisterParticipant(activityName, email);
    });

    participantItem.appendChild(nameSpan);
    participantItem.appendChild(deleteButton);

    return participantItem;
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        displayMessage(result.message, "success");
        await fetchActivities();
      } else {
        displayMessage(result.detail || "Unable to unregister participant.", "error");
      }
    } catch (error) {
      displayMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  }

  function displayMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    if (!activity) {
      displayMessage("Please select an activity.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        displayMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        displayMessage(result.detail || "An error occurred.", "error");
      }
    } catch (error) {
      displayMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
