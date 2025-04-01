


const sheetURL = "https://script.google.com/macros/s/AKfycbz7Xov1tRjkjG85YAcCzL-bfCSzIZQeDseIGn2vjLSnfRgz3sou3CYp2md16wSYALne/exec";
let chart; // Global chart instance

// Toast Notification Function
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000); // Hide after 3 seconds
}

function verifyUnlock(callback) {
  const unlockPopup = document.getElementById("unlockPopup");
  const gridButtons = document.querySelectorAll(".grid-button");
  const unlockCancel = document.getElementById("unlockCancel");
  const correctPattern = "1-4-7-8-9";
  let inputPattern = [];
  let isMouseDown = false;

  // Show the popup and lock scroll
  unlockPopup.style.display = "block";
  document.body.classList.add("lock-scroll");


  function resetGridState() {
    return new Promise(resolve => {
      gridButtons.forEach(button => {
        button.classList.remove("active");
      });
      resolve();
    });
  }
  resetGridState().then(() => console.log("Grid reset completed"));
  // Event handler to add to the pattern
  function addToPattern(button) {
    const value = button.getAttribute("data-value");
    if (!inputPattern.includes(value)) {
      inputPattern.push(value);
      button.classList.add("active");
    }
  }

  // Function to check the pattern
  function checkPattern() {
    isMouseDown = false;
    const enteredPattern = inputPattern.join("-");
    if (enteredPattern === correctPattern) {
      callback();
      cleanup();
    } else {
      showToast("Muster falsch, versuche es erneut.");
      cleanup();
    }
  }

  // Detach existing event listeners to prevent duplication
  gridButtons.forEach(button => {
    button.replaceWith(button.cloneNode(true)); // Remove all existing event listeners
  });

  // Re-select the grid buttons after cloning
  const newGridButtons = document.querySelectorAll(".grid-button");

  // Reset the grid state before adding event listeners
  resetGridState().then(() => console.log("Grid reset completed"));

  // Attach event listeners
  newGridButtons.forEach(button => {
    button.addEventListener("mousedown", () => {
      isMouseDown = true;
      addToPattern(button);
    });
    button.addEventListener("touchstart", () => {
      isMouseDown = true;
      addToPattern(button);
    });
    button.addEventListener("mouseover", () => {
      if (isMouseDown) addToPattern(button);
    });
    button.addEventListener("touchmove", (event) => {
      const touch = event.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.classList.contains("grid-button")) {
        addToPattern(target);
      }
    });
    button.addEventListener("mouseup", checkPattern);
    button.addEventListener("touchend", checkPattern);
  });

  // Cancel unlocking
  unlockCancel.onclick = cleanup;

  // Cleanup function to remove lock screen and listeners
  function cleanup() {
  // Clear the input pattern
    resetGridState().then(() => console.log("Grid reset completed")); // Clear the grid's active state
    unlockPopup.style.display = "none";
    document.body.classList.remove("lock-scroll");
  }
}



// Submit Data Function using lockscreen
async function submitData() {
  let name = document.getElementById("name").value.replace(/\s$/, '');
  const hohenmeter = document.getElementById("hohenmeter").value;

  if (!name || !hohenmeter) {
    showToast("Bitte beide Felder ausfüllen! ⚠️");
    return;
  }

  // Lock screen verification
  verifyUnlock(async () => {
    await fetch(`${sheetURL}?action=add&name=${encodeURIComponent(name)}&hohenmeter=${encodeURIComponent(hohenmeter)}`);
    loadData();
    showToast("✅ Eintrag hinzugefügt!");
  });
}



async function deleteData(name, hohenmeter) {
  // Prevent default action if triggered by a button in a form

  const deletionAction = async () => {
    showToast("🗑️ Eintrag gelöscht!");
    await fetch(`${sheetURL}?action=delete&name=${encodeURIComponent(name)}&hohenmeter=${encodeURIComponent(hohenmeter)}`);
    loadData();
  };

  verifyUnlock(deletionAction);
}

// Validate Höhenmeter Input
function validateHohenmeter() {
  const hmInput = document.getElementById("hohenmeter");
  const value = Number(hmInput.value);
  const name = document.getElementById("name").value.split(" ")[0];

  if (value > 1200) {
    showToast("Sei ehrlich 🤥😏😳");

  } else if (value > 350 && value < 1200) {
    showToast("Boaah 😨");

  } else if (value > 220 && value < 330) {
    showToast("Stark " + name + " 💪");
  }
}

// Format Date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

// Load Data from Google Sheet
async function loadData() {
  const loader = document.getElementById("loading");
  loader.style.display = "block"; // Show loader

  try {
    const response = await fetch(`${sheetURL}?action=get`);
    const data = await response.json();

    loader.style.display = "none"; // Hide loader after data loads

    const mainData = data.main.reverse();
    const rankingData = data.ranking.sort((a, b) => b[1] - a[1]);

    document.getElementById("dataTable").innerHTML = "<tr><th>Name</th><th>HM</th><th>Datum</th><th>Löschen</th></tr>";
    let total = 0;

    mainData.forEach((row, index) => {
      total += parseInt(row[1]);
      document.getElementById("dataTable").innerHTML += `<tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${formatDate(row[2])}</td>
        <td>${index === 0 ? `<button onclick="deleteData('${row[0]}', '${row[1]}')">❌</button>` : ""}</td>
      </tr>`;
    });

    updateProgress(total);
    drawChart(total);
    updateRanking(rankingData);
    checkGoals(total);

  } catch (error) {
    loader.style.display = "none"; // Hide loader if there's an error
    console.error("Error loading data:", error);
    showToast("❌ Fehler beim Laden der Daten!");
  }
}

// Update Ranking Table
async function updateRanking(rankingData) {
  const rankingTable = document.getElementById("rankingTable");
  rankingTable.innerHTML = "<tr><th>Platz</th><th>Name</th><th>HM</th></tr>";

  rankingData.forEach((row, index) => {
    let rankEmoji;
    let rankText;

    if (index === 0) {
      if (row[0].toLowerCase() === "max") {
        rankText = "Max";
      } else {
        rankText = 1;
      }
      rankEmoji = "🏆";
    } else if (index === 1) {
      rankEmoji = "🔥";
      rankText = index + 1;
    } else if (index === 2) {
      rankEmoji = "💪";
      rankText = index + 1;
    } else {
      rankEmoji = "😎";
      rankText = index + 1;
    }

    rankingTable.innerHTML += `
      <tr><td>${rankText} ${rankEmoji}</td><td>${row[0]}</td><td>${row[1]}</td></tr>
    `;
  });
}

// Update Progress Bar
function updateProgress(total) {
  const percentage = (total / 100000) * 100;
  document.getElementById("progressBar").style.width = percentage + "%";
  document.getElementById("progressBar").textContent = Math.round(percentage) + "%";
  document.getElementById("totalHM").textContent = total;
}

// Draw Chart
function drawChart(total) {
  const ctx = document.getElementById("myChart").getContext("2d");
  if (chart) {
    chart.destroy();
  }

  const mountainData = [
    {x: 0, y: 0},
    {x: 10000, y: 10000},
    {x: 12500, y: 8000},

    {x: 25000, y: 25000},
    {x: 29000, y: 20000},

    {x: 50000, y: 50000},
    {x: 55000, y: 45000},

    {x: 75000, y: 75000},
    {x: 82000, y: 69000},

    {x: 100000, y: 100000},
    {x: 103000, y: 93000},

    {x: 110000, y: 70000},


  ];

  const progressData = [{x: 0, y: 0}];

  for (let i = 0; i < mountainData.length - 1; i++) {
    const start = mountainData[i];
    const end = mountainData[i + 1];

    if (total >= end.y) {
      progressData.push({x: end.x, y: end.y});
    } else if (total > start.y) {
      const ratio = (total - start.y) / (end.y - start.y);
      progressData.push({x: start.x + ratio * (end.x - start.x), y: total});
      break;
    } else {
      break;
    }
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Fortschritt",
          data: progressData,
          borderColor: "green",
          backgroundColor: "rgba(0,128,0,0.4)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointBackgroundColor: "green",
          z: 2
        },
        {
          label: "Ziele",
          data: mountainData,
          borderColor: "saddlebrown",
          backgroundColor: "rgba(139, 69, 19, 0.6)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointBackgroundColor: "saddlebrown",
          z: 2
        }
      ]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { type: "linear", min: 0, max: 110000},
        y: { min: 0, max: 120000, display: false }
      }
    }
  });
}

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Remove time for accurate comparison

// Fetch and display events from the server
async function fetchEvents() {
  const response = await fetch(`${sheetURL}?action=getEvents`);
  const events = await response.json();

  const eventListContainer = document.getElementById('eventsList'); // Use eventsList, not eventList
  eventListContainer.innerHTML = ''; // Clear the event list before adding new items

    events.forEach(event => {
      const li = document.createElement("li");

      const [year, month, day] = event.date.split("-").map(Number);
      const eventDate = new Date(year, month - 1, day + 1); // Create date without time
      const formattedDate = eventDate.toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      li.innerHTML = `
        <div class="event-left">
          <strong>${event.name}</strong><br>
          <small>${event.dist}</small><br>
          <small>📅 ${formattedDate}</small>
        </div>
        <div class="event-right">
        </div>
          <span class="days-left">🕒 ${event.daysLeft} Tage</span>
        
      `;

      li.style.cursor = "pointer"; // Make the event clickable
      li.addEventListener('click', () => openEventModal(event)); // Handle event click

// Add 'event-row' class to the list item (li)
      li.classList.add('event-row'); // This adds the CSS class to the li element
    eventListContainer.appendChild(li); // Append each event as its own list item
  });
}

// Call the fetchEvents function when the page loads
window.onload = fetchEvents;

// Function to open the event modal
async function openEventModal(event) {
  const loader = document.getElementById("loading");
  const participantList = document.getElementById('participantList');
  const modal = document.getElementById('eventModal');

  // Show loader while fetching participants
  loader.style.display = "block";

  // Reset participant list to avoid showing stale data
  participantList.innerHTML = '';

  // Initially hide modal (it will be shown later after data is fetched)
  modal.style.display = 'none';

  try {
    // Fetch participants for the clicked event
    const response = await fetch(`${sheetURL}?action=getParticipants&eventName=${event.name}`);
    const data = await response.json();

    // Populate participant list with the new data
    participantList.innerHTML = ''; // Clear the list first
    data.participants.forEach(participant => {
      const li = document.createElement('li');
      li.textContent = participant;
      participantList.appendChild(li);
    });

// If the list is still empty, show the cricket emoji
    if (participantList.children.length === 0) {
      const li = document.createElement('li');
      li.textContent = '🦗';
      participantList.appendChild(li);
    }

    // Add event listener for the "+" button to show the participant form
    const addParticipantBtn = document.getElementById('addParticipantBtn');
    if (!addParticipantBtn.hasListener) {
      addParticipantBtn.addEventListener('click', () => {
        document.getElementById('addParticipantForm').style.display = 'block';
      });
      addParticipantBtn.hasListener = true;
    }

    // Fix: Remove any existing event listener to avoid duplicate submissions
    const submitParticipant = document.getElementById('submitParticipant');
    submitParticipant.replaceWith(submitParticipant.cloneNode(true)); // Detach old listener
    const newSubmitParticipant = document.getElementById('submitParticipant');

    // Add new event listener for form submission with the correct event context
    newSubmitParticipant.addEventListener('click', async () => {
      const participantName = document.getElementById('participantName').value;

      if (participantName) {
        // Disable the submit button to prevent multiple clicks
        newSubmitParticipant.disabled = true;
        loader.style.display = "block";

        try {
          // Use the current event name dynamically
          await fetch(`${sheetURL}?action=addParticipant&eventName=${event.name}&participantName=${participantName}`);

          // Add participant to the list
          const li = document.createElement('li');
          li.textContent = participantName;
          participantList.appendChild(li);

          // Hide the form after submitting
          document.getElementById('addParticipantForm').style.display = 'none';
          document.getElementById('participantName').value = '';
        } catch (error) {
          console.error("Error submitting participant:", error);
          showToast("❌ Fehler beim Hinzufügen des Teilnehmers!");
        } finally {
          loader.style.display = "none";

          // Re-enable the submit button after 5 seconds
          setTimeout(() => {
            newSubmitParticipant.disabled = false;
          }, 5000);
        }
      }
    });

    // Hide the loader and show the modal once the data is ready
    loader.style.display = "none";
    modal.style.display = "flex"; // Show the modal

  } catch (error) {
    loader.style.display = "none";
    console.error("Error loading participants:", error);
    showToast("❌ Fehler beim Laden der Teilnehmer!");
  }
}

// Close event modal when the close button is clicked
const closeParticipantModal = document.getElementById('closeParticipantModal');
closeParticipantModal.addEventListener('click', () => {
  const modal = document.getElementById('eventModal');
  modal.style.display = 'none';
});


// Check Goals
function checkGoals(total) {
  const goals = [10000, 25000, 50000, 75000, 100000];
  goals.forEach((goal, index) => {
    const checkbox = document.getElementById(`goal${index + 1}Check`);
    const listItem = checkbox.parentElement;
    checkbox.checked = total >= goal;
    listItem.classList.toggle("completed", total >= goal);
  });
  updateGoalBanner(total);
}

// Update Goal Banner
function updateGoalBanner(total) {
  const goals = [10000, 25000, 50000, 75000, 100000];
  let lastReachedGoal = "";

  goals.forEach((goal, index) => {
    const goalCheck = document.getElementById(`goal${index + 1}Check`);
    if (total >= goal) {
      goalCheck.checked = true;
      lastReachedGoal = goalCheck.nextElementSibling.innerHTML;
    }
  });

  document.getElementById("goalBanner").innerHTML = lastReachedGoal
      ? `🎉 Ziel erreicht: ${lastReachedGoal.replace(/<[^>]*>/g, '')}!`
      : "Noch kein Ziel erreicht 😮";
  document.getElementById("goalBanner").style.display = "block";
}

async function showNextTraining() {
  try {
    const res = await fetch(`${sheetURL}?action=training`);
    const trainings = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the next upcoming training
    const next = trainings
    .map(t => {
      const date = new Date(t.date);
      date.setHours(0, 0, 0, 0);
      return { ...t, dateObj: date };
    })
    .filter(t => t.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj)[0];

    if (!next) return; // No future training found

    const popup = document.getElementById("trainingPopup");
    const dateText = next.dateObj.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

    document.getElementById("trainingDate").innerText = `${dateText}`;
    document.getElementById("trainingDescription").innerText = next.description;

    // Set background image based on type
    let bgImage = "url('images/dauerlauf.png')";
    if (next.type === "Dauerlauf") bgImage = "url('images/dauerlauf.png')";
    else if (next.type === "Pyramiden") bgImage = "url('images/pyramiden.png')";
    else if (next.type === "Intervalle") bgImage = "url('images/intervalle.png')";
    else if (next.type === "Trail") bgImage = "url('images/trail.png')";
    else if (next.type === "ABC") bgImage = "url('images/ABC.png')";
    else if (next.type === "Dauerlauf2") bgImage = "url('images/dauerlauf2.png')";
    else if (next.type === "Dauerlauf3") bgImage = "url('images/dauerlauf3.png')";
    else if (next.type === "Intervalle2") bgImage = "url('images/intervalle2.png')";
    else if (next.type === "Sprints") bgImage = "url('images/sprints.png')";

    popup.style.backgroundImage = bgImage;
    popup.style.display = "block";

    // ⏱️ Fade out after 8.5 seconds
    setTimeout(() => {
      popup.classList.add("fade-out");
    }, 9000);

    // ⏳ Fully hide after 10 seconds
    setTimeout(() => {
      popup.style.display = "none";
    }, 13000);

  } catch (err) {
    console.error("Failed to load training data:", err);
  }
}



// Check if the popup has been shown before using localStorage
let popupShown = localStorage.getItem("popupShown") === "true"; // Use "true" string for comparison

document.addEventListener("DOMContentLoaded", function() {
  // Hide the popup initially
  document.getElementById("trainingPopup").style.display = "none";

  // After 5 seconds, show the popup only if it hasn't been shown yet
  if (!popupShown) {
    setTimeout(function() {
      document.getElementById("trainingPopup").style.display = "block";
      localStorage.setItem("popupShown", "true"); // Save flag to localStorage so it persists
    }, 5000); // 5000 milliseconds (5 seconds)
  }
});

document.addEventListener("DOMContentLoaded", showNextTraining);

// Close function
function closeTrainingPopup() {
  document.getElementById("trainingPopup").style.display = "none";
}

// Load Data on Page Load
loadData();



