const sheetURL = "https://script.google.com/macros/s/AKfycbxbt57SZfghrZTx9FXgl2IkqJfkQzvK1slJDJFE_osfPfJHRXXypsOp-zXRh2d9rzPQ/exec";
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

// Submit Data Function
async function submitData() {
  let name = document.getElementById("name").value.trim().replace(' ', '');
  const hohenmeter = document.getElementById("hohenmeter").value;

  if (!name || !hohenmeter) {
    showToast("Bitte beide Felder ausfüllen! ⚠️");
    return;
  }

  await fetch(`${sheetURL}?action=add&name=${encodeURIComponent(name)}&hohenmeter=${encodeURIComponent(hohenmeter)}`);

  showToast("✅ Eingetragen! Danke fürs Mitmachen! 🎉");
  loadData();
}

// Delete Data Function
async function deleteData(name, hohenmeter) {
  await fetch(`${sheetURL}?action=delete&name=${encodeURIComponent(name)}&hohenmeter=${encodeURIComponent(hohenmeter)}`);

  showToast("🗑️ Eintrag gelöscht!");
  loadData();
}

// Validate Höhenmeter Input
function validateHohenmeter() {
  const hmInput = document.getElementById("hohenmeter");
  const value = Number(hmInput.value);
  if (value > 1200) {
    showToast("Sei ehrlich 🤥😏");
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
  const response = await fetch(`${sheetURL}?action=get`);
  const data = await response.json();

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
      <td>${index === 0
        ? `<button onclick="deleteData('${row[0]}', '${row[1]}')">❌</button>`
        : ""}</td>
    </tr>`;
  });

  updateProgress(total);
  drawChart(total);
  updateRanking(rankingData);
  checkGoals(total);
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
  const percentage = (total / 75000) * 100;
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
    {x: 15000, y: 8000},

    {x: 25000, y: 25000},
    {x: 33000, y: 20000},

    {x: 50000, y: 50000},
    {x: 55000, y: 45000},

    {x: 75000, y: 75000},
    {x: 79000, y: 70000},

    {x: 90000, y: 50000},

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
        x: { type: "linear", min: 0, max: 90000 },
        y: { min: 0, max: 90000, display: false }
      }
    }
  });
}
function showUpcomingEvents() {
  const events = [
    { name: "Frankfurter Mainova Halbmarathon", date: "2025-03-16" },
    { name: "Hemsbacher Altstadtlauf", date: "2025-04-05" },
    { name: "SOPREMA Neckar Run Mannheim", date: "2025-04-06" },
    { name: "Turmbergrennen", date: "2025-05-24" },
    { name: "Mörlenbacher-Volkslauf", date: "2025-05-04" },
    { name: "Altstadtlauf Heppenheim", date: "2025-06-13" },
    { name: "BAUHAUS Firmenlauf", date: "2025-06-26" },
    { name: "Altstadtlauf Weinheim", date: "2025-05-11" },
    { name: "Weinheimtrails", date: "2025-07-27" },
    { name: "Trail Marathon Heidelberg", date: "2025-09-21" },
    { name: "Herbstlauf Weinheim", date: "2025-09-29" },
    { name: "Frankfurt Marathon", date: "2025-10-26" }
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Remove time for accurate comparison

  const upcoming = events
  .map(event => {
    event.dateObj = new Date(event.date);
    event.dateObj.setHours(0, 0, 0, 0); // Ensure event date is also at midnight
    return event;
  })
  .filter(event => event.dateObj >= today)
  .sort((a, b) => a.dateObj - b.dateObj);

  const list = document.getElementById("eventList");
  list.innerHTML = ""; // Clear previous entries

  upcoming.forEach(event => {
    const li = document.createElement("li");

    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    const formattedDate = event.dateObj.toLocaleDateString("de-DE", options);

    // Calculate daysLeft without time component
    const daysLeft = Math.round((event.dateObj - today) / (1000 * 60 * 60 * 24));

    li.innerHTML = `
        <div class="event-left">
          <strong>${event.name}</strong><br>
          <small>📅 ${formattedDate}</small>
        </div>
        <div class="event-right">
          <span class="days-left">🕒 ${daysLeft} Tage</span>
        </div>
      `;
    li.classList.add("event-row");
    list.appendChild(li);
  });
}

// Run after page is ready
document.addEventListener("DOMContentLoaded", showUpcomingEvents);

// Check Goals
function checkGoals(total) {
  const goals = [10000, 25000, 50000, 75000];
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
  const goals = [10000, 25000, 50000, 75000];
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

// Load Data on Page Load
loadData();
