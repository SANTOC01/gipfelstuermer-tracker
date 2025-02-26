const sheetURL = "https://script.google.com/macros/s/AKfycbxbt57SZfghrZTx9FXgl2IkqJfkQzvK1slJDJFE_osfPfJHRXXypsOp-zXRh2d9rzPQ/exec";
let chart; // Global chart instance

async function submitData() {
  const name = document.getElementById("name").value;
  const hohenmeter = document.getElementById("hohenmeter").value;

  if (!name || !hohenmeter) {
    alert("Bitte beide Felder ausfüllen!");
    return;
  }

  await fetch(`${sheetURL}?action=add&name=${encodeURIComponent(
      name)}&hohenmeter=${encodeURIComponent(hohenmeter)}`);
  alert("Eingetragen! Danke fürs Mitmachen! 🎉");
  loadData();
}

async function deleteData(name, hohenmeter) {
  await fetch(`${sheetURL}?action=delete&name=${encodeURIComponent(
      name)}&hohenmeter=${encodeURIComponent(hohenmeter)}`);
  alert("Eintrag gelöscht!");
  loadData();
}

function validateHohenmeter() {
  const hmInput = document.getElementById("hohenmeter");
  const value = Number(hmInput.value);
  if (value > 1200) {
    alert("Sei ehrlich 🤥😏");
    // Optionally, to enforce the limit, you can reset the input:
    // hmInput.value = 1200;
  }
}

async function loadData() {
  const response = await fetch(`${sheetURL}?action=get`);
  const data = await response.json();

  const mainData = data.main.reverse(); // Main table data
  const rankingData = data.ranking.sort((a, b) => b[1] - a[1]); // Sort ranking descending

  document.getElementById(
      "dataTable").innerHTML = "<tr><th>Name</th><th>HM</th><th>Datum</th><th>Löschen</th></tr>";
  let total = 0;

  mainData.forEach((row, index) => {
    total += parseInt(row[1]);
    document.getElementById("dataTable").innerHTML += `<tr>
          <td>${row[0]}</td>
          <td>${row[1]}</td>
          <td>${new Date(row[2]).toLocaleDateString()}</td>
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

async function updateRanking(rankingData) {
  const rankingTable = document.getElementById("rankingTable");
  rankingTable.innerHTML = "<tr><th>Platz</th><th>Name</th><th>HM</th></tr>";

  rankingData.forEach((row, index) => {
    let rankEmoji = "😎"; // Default emoji
    if (index === 0) {
      rankEmoji = "🏆";
    }// First place
    else if (index === 1) {
      rankEmoji = "🔥";
    }// Second place
    else if (index === 2) {
      rankEmoji = "💪";
    } // Third place

    rankingTable.innerHTML += `<tr>
          <td>${index + 1} ${rankEmoji}</td>
          <td>${row[0]}</td>
          <td>${row[1]}</td>
        </tr>`;
  });
}

function updateProgress(total) {
  const percentage = (total / 75000) * 100;
  document.getElementById("progressBar").style.width = percentage + "%";
  document.getElementById("progressBar").textContent = Math.round(percentage)
      + "%";
  document.getElementById("totalHM").textContent = total;
}

function drawChart(total) {
  const ctx = document.getElementById("myChart").getContext("2d");
  if (chart) {
    chart.destroy();
  }

  // Fixed mountain shape data – feel free to adjust these points to tweak the mountain's form.
  const mountainData = [
    {x: 0, y: 0},
    {x: 10000, y: 8000},
    {x: 25000, y: 15000},
    {x: 50000, y: 40000},
    {x: 75000, y: 75000}
  ];

  // Build the progress (green) dataset by following the mountain line.
  const progressData = [];
  progressData.push({x: mountainData[0].x, y: mountainData[0].y}); // Always start at the base

  // Walk through each segment of the mountain.
  for (let i = 0; i < mountainData.length - 1; i++) {
    const startPoint = mountainData[i];
    const endPoint = mountainData[i + 1];
    // If the progress (total) has exceeded the end of this segment, add the full end point.
    if (total >= endPoint.y) {
      progressData.push({x: endPoint.x, y: endPoint.y});
    }
    // If total falls between the start and end, interpolate the x value.
    else if (total > startPoint.y) {
      const ratio = (total - startPoint.y) / (endPoint.y - startPoint.y);
      const interpolatedX = startPoint.x + ratio * (endPoint.x - startPoint.x);
      progressData.push({x: interpolatedX, y: total});
      break;
    } else {
      // If total isn’t even above the start of this segment, break out.
      break;
    }
  }

  const lastPoint = progressData[progressData.length - 1];
  const currentProgressData = [lastPoint];

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
          pointRadius: function (context) {
            return (context.dataIndex === context.dataset.data.length - 1) ? 10
                : 0;
          },
          pointBackgroundColor: "green",
          pointStyle: "circle",
          z: 2
        },
        {
          label: "Ziele",
          data: mountainData,
          borderColor: "saddlebrown",
          backgroundColor: "rgba(139, 69, 19, 0.2)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: function (context) {
            const xValue = context.parsed.x;
            if (xValue === 10000 || xValue === 25000 || xValue === 50000
                || xValue === 75000) {
              return 4;
            }
            return 0;
          },
          pointBackgroundColor: "saddlebrown",
          z: 1
        }
      ]
    },
    options: {
      plugins: {
        legend: {display: false}
      },
      parsing: false,
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 75000,
          ticks: {
            callback: function (value) {
              if (value === 0) {
                return "Start";
              }
              if (value === 10000) {
                return "10k";
              }
              if (value === 25000) {
                return "25k";
              }
              if (value === 50000) {
                return "50k";
              }
              if (value === 75000) {
                return "75k";
              }
              return value;
            }
          }
        },
        y: {
          min: 0,
          max: 75000,
          ticks: {
            callback: function (value) {
              return value;
            }
          }
        }
      }
    }

  });
}

function checkGoals(total) {
  const goals = [10000, 25000, 50000, 75000];
  goals.forEach((goal, index) => {
    const checkbox = document.getElementById(`goal${index + 1}Check`);
    const listItem = checkbox.parentElement;
    if (total >= goal) {
      checkbox.checked = true;
      listItem.classList.add("completed");
    } else {
      checkbox.checked = false;
      listItem.classList.remove("completed");
    }
  });
  updateGoalBanner(total);
}

function updateGoalBanner(total) {
  const goals = [10000, 25000, 50000, 75000];
  let lastGoal = "-";
  let lastReachedGoal = "";

  goals.forEach((goal, index) => {
    const goalCheck = document.getElementById(`goal${index + 1}Check`);
    if (total >= goal) {
      goalCheck.checked = true;
      lastReachedGoal = goalCheck.nextElementSibling.innerHTML; // Get the goal description
    } else {
      goalCheck.checked = false;
    }
  });

  if (lastReachedGoal === "") {
    document.getElementById(
        "goalBanner").innerHTML = "Noch kein Ziel erreicht 😮";
  } else {
    document.getElementById(
        "goalBanner").innerHTML = `🎉 Ziel erreicht: ${lastReachedGoal.replace(
        /<[^>]*>/g, '')}!`;
  }
  document.getElementById("goalBanner").style.display = "block";
}

loadData();
