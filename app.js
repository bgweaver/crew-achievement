const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = 3000;

// Session configuration
app.use(session({
  secret: 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

const studentsPath = path.join(__dirname, "data", "students.json");
const achievementsPath = path.join(__dirname, "data", "achievements.json");
const adminPath = path.join(__dirname, "data", "admin.json");

// Pseudonym pools for different themes
const pseudonymPools = {
  space: ["Nebula", "Quasar", "Pulsar", "Vortex", "Cosmos", "Stellar", "Orbital", "Galactic", "Quantum", "Photon", "Plasma", "Asteroid", "Comet", "Meteor", "Nova", "Supernova", "Eclipse", "Aurora", "Gravity", "Horizon"],
  ocean: ["Tsunami", "Coral", "Kelp", "Current", "Tide", "Abyss", "Reef", "Lagoon", "Dolphin", "Whale", "Octopus", "Nautilus", "Kraken", "Poseidon", "Aqua", "Marina", "Pearl", "Shell", "Wave", "Deep"],
  forest: ["Redwood", "Willow", "Oak", "Pine", "Maple", "Birch", "Cedar", "Fern", "Moss", "Ivy", "Sage", "Aspen", "Elm", "Spruce", "Cypress", "Bamboo", "Thorn", "Petal", "Branch", "Root"]
};

function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      // Create default files if they don't exist
      if (filePath.includes('students.json')) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      } else if (filePath.includes('achievements.json')) {
        const defaultAchievements = [
          {
            id: "first_mission",
            title: "First Mission",
            description: "Complete your first assignment",
            points: 10,
            image: "https://via.placeholder.com/300x200/4CAF50/white?text=First+Mission"
          },
          {
            id: "team_player",
            title: "Team Player",
            description: "Collaborate effectively with crewmates",
            points: 15,
            image: "https://via.placeholder.com/300x200/2196F3/white?text=Team+Player"
          }
        ];
        fs.writeFileSync(filePath, JSON.stringify(defaultAchievements, null, 2));
      } else if (filePath.includes('admin.json')) {
        // Default admin credentials (admin/admin123)
        const defaultAdmin = {
          username: "admin",
          password: bcrypt.hashSync("admin123", 10)
        };
        fs.writeFileSync(filePath, JSON.stringify(defaultAdmin, null, 2));
      }
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return filePath.includes('students.json') ? [] : {};
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
  }
}

function generatePseudonym(theme = 'space', existingPseudonyms = []) {
  const pool = pseudonymPools[theme] || pseudonymPools.space;
  const availableNames = pool.filter(name => !existingPseudonyms.includes(name));
  
  if (availableNames.length === 0) {
    // If all names are taken, add numbers
    const baseName = pool[Math.floor(Math.random() * pool.length)];
    let counter = 1;
    let newName = `${baseName}${counter}`;
    while (existingPseudonyms.includes(newName)) {
      counter++;
      newName = `${baseName}${counter}`;
    }
    return newName;
  }
  
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

function generatePIN() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getTeamWithLeastMembers(students) {
  const teams = ['Red', 'Blue', 'Green', 'Yellow'];
  const teamCounts = {};
  
  teams.forEach(team => teamCounts[team] = 0);
  students.forEach(student => {
    if (teamCounts[student.team] !== undefined) {
      teamCounts[student.team]++;
    }
  });
  
  return Object.keys(teamCounts).reduce((a, b) => teamCounts[a] < teamCounts[b] ? a : b);
}

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect('/admin-login');
  }
}

// Routes
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
    const teamScores = {};
    students.forEach(s => {
      const studentPoints = (s.unlocked || []).reduce((sum, id) => {
        const ach = achievements.find(a => a.id === id);
        return sum + (ach?.points || 0);
      }, 0);
      if (!teamScores[s.team]) teamScores[s.team] = 0;
      teamScores[s.team] += studentPoints;
    });
    return res.render("login", { error: "Invalid pseudonym or PIN", teamScores });
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

  res.render("dashboard", { 
    pseudonym, 
    achievements, 
    unlocked, 
    totalPoints,
    team: student.team,
    studentData: student
  });
});

// Admin login routes
app.get("/admin-login", (req, res) => {
  res.render("admin-login", { error: null });
});

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  const adminData = loadJSON(adminPath);

  if (username === adminData.username && bcrypt.compareSync(password, adminData.password)) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render("admin-login", { error: "Invalid credentials" });
  }
});

app.get("/admin-logout", (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin route
app.get("/admin", requireAdmin, (req, res) => {
  const students = loadJSON(studentsPath);
  const achievements = loadJSON(achievementsPath);
  const pseudonym = req.query.pseudonym;

  let selectedStudent = null;
  let unlocked = [];

  if (pseudonym) {
    selectedStudent = students.find(s => s.pseudonym === pseudonym);
    unlocked = selectedStudent?.unlocked || [];
  }

  // Calculate student stats
  const studentsWithStats = students.map(student => {
    const studentPoints = (student.unlocked || []).reduce((sum, id) => {
      const ach = achievements.find(a => a.id === id);
      return sum + (ach?.points || 0);
    }, 0);
    return {
      ...student,
      totalPoints: studentPoints,
      achievementCount: (student.unlocked || []).length
    };
  });

  // Calculate achievement stats (how many students have unlocked each achievement)
  const achievementStats = achievements.map(achievement => {
    const unlockedCount = students.filter(student => 
      (student.unlocked || []).includes(achievement.id)
    ).length;
    return {
      ...achievement,
      unlockedCount
    };
  });

  res.render("admin", { 
    students: studentsWithStats, 
    achievements: achievementStats,
    selectedStudent, 
    unlocked,
    view: req.query.view || 'manage'
  });
});

app.post("/admin", requireAdmin, (req, res) => {
  const students = loadJSON(studentsPath);

  // Bulk assign mode
  if (req.body.bulkAssign) {
    const { achievementId, team } = req.body;

    students.forEach(s => {
      const matchTeam = team === "All" || s.team === team;
      if (matchTeam) {
        if (!s.unlocked) s.unlocked = [];
        if (!s.unlocked.includes(achievementId)) {
          s.unlocked.push(achievementId);
        }
      }
    });

    saveJSON(studentsPath, students);
    return res.redirect("/admin");
  }

  // Normal single student update
  const { pseudonym, unlocked = [] } = req.body;
  const student = students.find(s => s.pseudonym === pseudonym);
  if (student) {
    student.unlocked = Array.isArray(unlocked) ? unlocked : [unlocked];
    saveJSON(studentsPath, students);
  }
  res.redirect("/admin?pseudonym=" + pseudonym);
});

// Student management routes
app.post("/admin/add-student", requireAdmin, (req, res) => {
  const students = loadJSON(studentsPath);
  const { pseudonym, pin, team, customPseudonym } = req.body;
  
  const existingPseudonyms = students.map(s => s.pseudonym);
  const finalPseudonym = customPseudonym || generatePseudonym('space', existingPseudonyms);
  const finalPIN = pin || generatePIN();
  const finalTeam = team || getTeamWithLeastMembers(students);

  // Check if pseudonym already exists
  if (existingPseudonyms.includes(finalPseudonym)) {
    return res.json({ success: false, error: "Pseudonym already exists" });
  }

  const newStudent = {
    pseudonym: finalPseudonym,
    pin: finalPIN,
    team: finalTeam,
    unlocked: [],
    dateAdded: new Date().toISOString()
  };

  students.push(newStudent);
  saveJSON(studentsPath, students);
  
  res.json({ success: true, student: newStudent });
});

app.post("/admin/delete-student", requireAdmin, (req, res) => {
  const students = loadJSON(studentsPath);
  const { pseudonym } = req.body;
  
  const filteredStudents = students.filter(s => s.pseudonym !== pseudonym);
  saveJSON(studentsPath, filteredStudents);
  
  res.json({ success: true });
});

// Achievement management routes
app.post("/admin/add-achievement", requireAdmin, (req, res) => {
  const achievements = loadJSON(achievementsPath);
  const { title, description, points, image } = req.body;
  
  const newAchievement = {
    id: title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    title,
    description,
    points: parseInt(points),
    image: image || `https://via.placeholder.com/300x200/4CAF50/white?text=${encodeURIComponent(title)}`,
    dateAdded: new Date().toISOString()
  };

  achievements.push(newAchievement);
  saveJSON(achievementsPath, achievements);
  
  res.json({ success: true, achievement: newAchievement });
});

app.post("/admin/delete-achievement", requireAdmin, (req, res) => {
  const achievements = loadJSON(achievementsPath);
  const students = loadJSON(studentsPath);
  const { id } = req.body;
  
  // Remove achievement from all students
  students.forEach(student => {
    if (student.unlocked) {
      student.unlocked = student.unlocked.filter(achievementId => achievementId !== id);
    }
  });
  
  // Remove achievement from achievements list
  const filteredAchievements = achievements.filter(a => a.id !== id);
  
  saveJSON(achievementsPath, filteredAchievements);
  saveJSON(studentsPath, students);
  
  res.json({ success: true });
});

// API routes for dynamic updates
app.get("/api/generate-pseudonym", requireAdmin, (req, res) => {
  const students = loadJSON(studentsPath);
  const existingPseudonyms = students.map(s => s.pseudonym);
  const theme = req.query.theme || 'space';
  
  res.json({ pseudonym: generatePseudonym(theme, existingPseudonyms) });
});

app.get("/api/generate-pin", requireAdmin, (req, res) => {
  res.json({ pin: generatePIN() });
});

app.listen(PORT, () => {
  console.log(`🚀 Crew Achievements Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔐 Default admin credentials: admin / admin123`);
});