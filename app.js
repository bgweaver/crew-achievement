const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const studentsPath = path.join(__dirname, "data", "students.json");
const achievementsPath = path.join(__dirname, "data", "achievements.json");

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  const students = loadJSON(studentsPath);
  const achievements = loadJSON(achievementsPath);

  const teamScores = {};
  students.forEach(s => {
    const studentPoints = (s.unlocked || []).reduce((sum, id) => {
      const ach = achievements.find(a => a.id === id);
      return sum + (ach?.points || 0);
    }, 0);
    if (!teamScores[s.team]) teamScores[s.team] = 0;
    teamScores[s.team] += studentPoints;
  });

  res.render("login", { teamScores, error: null });
});

app.post("/login", (req, res) => {
  const { pseudonym, pin } = req.body;
  const students = loadJSON(studentsPath);
  const achievements = loadJSON(achievementsPath);

  const student = students.find(s => s.pseudonym === pseudonym && s.pin === pin);
  if (!student) {
    return res.render("login", { error: "Invalid pseudonym or PIN", teamScores: {} });
  }

  const unlocked = student.unlocked || [];
  const totalPoints = unlocked.reduce((sum, id) => {
    const ach = achievements.find(a => a.id === id);
    return sum + (ach?.points || 0);
  }, 0);

  // Sort achievements: unlocked first
  achievements.sort((a, b) => {
  const aUnlocked = unlocked.includes(a.id);
  const bUnlocked = unlocked.includes(b.id);
  return (aUnlocked === bUnlocked) ? 0 : aUnlocked ? -1 : 1;
});

  res.render("dashboard", { pseudonym, achievements, unlocked, totalPoints });
});

app.get("/admin123", (req, res) => {
  const students = loadJSON(studentsPath);
  const achievements = loadJSON(achievementsPath);
  const pseudonym = req.query.pseudonym;

  let selectedStudent = null;
  let unlocked = [];

  if (pseudonym) {
    selectedStudent = students.find(s => s.pseudonym === pseudonym);
    unlocked = selectedStudent?.unlocked || [];
  }

  res.render("admin", { students, achievements, selectedStudent, unlocked });
});

app.post("/admin123", (req, res) => {
  const students = loadJSON(studentsPath);

  // Bulk assign mode
  if (req.body.bulkAssign) {
    const { achievementId, team } = req.body;

    students.forEach(s => {
      const matchTeam = team === "All" || s.team === team;
      if (matchTeam) {
        if (!s.unlocked.includes(achievementId)) {
          s.unlocked.push(achievementId);
        }
      }
    });

    saveJSON(studentsPath, students);
    return res.redirect("/admin123");
  }

  // Normal single student update
  const { pseudonym, unlocked = [] } = req.body;
  const student = students.find(s => s.pseudonym === pseudonym);
  if (student) {
    student.unlocked = Array.isArray(unlocked) ? unlocked : [unlocked];
    saveJSON(studentsPath, students);
  }
  res.redirect("/admin123?pseudonym=" + pseudonym);
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));