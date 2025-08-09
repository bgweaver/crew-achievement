require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const leoProfanity = require('leo-profanity');

const app = express();
const PORT = 3000;
const missionPath = path.join(__dirname, "data", "mission.json");


let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3; // Only 3 AI requests at once
const REQUEST_TIMEOUT = 15000; // 15 second timeout
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const REQUESTS_PER_MINUTE = 5; // Max 5 requests per student per minute

// Track request rates per student
const requestTracker = new Map();

function cleanupOldRequests() {
  const now = Date.now();
  for (const [key, requests] of requestTracker.entries()) {
    requestTracker.set(key, requests.filter(time => now - time < RATE_LIMIT_WINDOW));
    if (requestTracker.get(key).length === 0) {
      requestTracker.delete(key);
    }
  }
}

// Clean up every minute
setInterval(cleanupOldRequests, 60000);


// Session configuration
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

const studentsPath = path.join(__dirname, "data", "students.json");
const achievementsPath = path.join(__dirname, "data", "achievements.json");
const adminPath = path.join(__dirname, "data", "admin.json");
const plainPinsPath = path.join(__dirname, "data", "plaintext-pins.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}

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
            id: "welcome_aboard",
            title: "Welcome Aboard!",
            description: "Join the crew and begin your journey among the stars",
            points: 5,
            image: "https://via.placeholder.com/300x200/4CAF50/white?text=Welcome+Aboard!"
          },
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
          username: process.env.DEFAULT_ADMIN || 'admin',
          password: bcrypt.hashSync(process.env.DEFAULT_CREDS || 'admin123', 10)
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

// Function to save plaintext PINs
function savePlainPIN(pseudonym, pin) {
  let plainPins = {};
  if (fs.existsSync(plainPinsPath)) {
    try {
      plainPins = JSON.parse(fs.readFileSync(plainPinsPath, 'utf8'));
    } catch (e) {
      plainPins = {};
    }
  }
  plainPins[pseudonym] = pin;
  fs.writeFileSync(plainPinsPath, JSON.stringify(plainPins, null, 2));
}

// Function to calculate balanced team scores
function calculateBalancedTeamScores(students, achievements) {
  const teams = {};
  const teamMemberCounts = {};
  
  // Initialize team counts
  ['Red', 'Blue', 'Green', 'Yellow'].forEach(team => {
    teams[team] = 0;
    teamMemberCounts[team] = 0;
  });
  
  // Calculate total points per team and member counts
  students.forEach(s => {
    if (teams[s.team] !== undefined) {
      const studentPoints = (s.unlocked || []).reduce((sum, id) => {
        const ach = achievements.find(a => a.id === id);
        return sum + (ach?.points || 0);
      }, 0);
      teams[s.team] += studentPoints;
      teamMemberCounts[s.team]++;
    }
  });
  
  // Balance scores by dividing by team size and multiplying by 25
  Object.keys(teams).forEach(team => {
    if (teamMemberCounts[team] > 0) {
      teams[team] = Math.round((teams[team] / teamMemberCounts[team]) * 25);
    } else {
      teams[team] = 0;
    }
  });
  
  return teams;
}

// Function to calculate student rank among all students
function calculateStudentRank(studentPseudonym, students, achievements) {
  // Calculate points for all students
  const studentsWithPoints = students.map(s => {
    const points = (s.unlocked || []).reduce((sum, id) => {
      const ach = achievements.find(a => a.id === id);
      return sum + (ach?.points || 0);
    }, 0);
    return { pseudonym: s.pseudonym, points };
  });
  
  // Sort by points (descending)
  studentsWithPoints.sort((a, b) => b.points - a.points);
  
  // Find the student's rank
  const studentIndex = studentsWithPoints.findIndex(s => s.pseudonym === studentPseudonym);
  return studentIndex !== -1 ? studentIndex + 1 : students.length;
}

// Function to migrate existing students to have achievement dates
function migrateStudentAchievementDates() {
  const students = loadJSON(studentsPath);
  let needsSave = false;

  students.forEach(student => {
    if (!student.achievementDates) {
      student.achievementDates = {};
      needsSave = true;
    }

    // If they have unlocked achievements but no dates, use their dateAdded as fallback
    if (student.unlocked && student.unlocked.length > 0) {
      const fallbackDate = student.dateAdded || new Date().toISOString();
      
      student.unlocked.forEach(achievementId => {
        if (!student.achievementDates[achievementId]) {
          student.achievementDates[achievementId] = fallbackDate;
          needsSave = true;
        }
      });
    }
  });

  if (needsSave) {
    saveJSON(studentsPath, students);
    console.log('📅 Migrated achievement dates for existing students');
  }
}

// Run migration on startup
migrateStudentAchievementDates();

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect('/admin-login');
  }
}

function loadMissionData() {
  try {
    if (!fs.existsSync(missionPath)) {
      const defaultMission = {
        currentMission: "Explore the outer rim of the galaxy and collect cosmic data.",
        missionBriefing: "Your mission is to work together as a crew to unlock achievements and gain knowledge about space exploration.",
        shipStatus: "All systems operational. Ready for deep space exploration.",
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(missionPath, JSON.stringify(defaultMission, null, 2));
    }
    return JSON.parse(fs.readFileSync(missionPath, "utf8"));
  } catch (error) {
    console.error('Error loading mission data:', error);
    return {
      currentMission: "Explore the galaxy",
      missionBriefing: "Learn about space",
      shipStatus: "Systems operational"
    };
  }
}

// Content safety function
function isContentSafe(message) {
  const lowerMessage = message.toLowerCase();
  
  // Topics that are NOT allowed
  const forbiddenTopics = [
    'violence', 'weapon', 'gun', 'kill', 'death', 'die', 'hurt', 'pain',
    'drug', 'alcohol', 'beer', 'wine', 'smoke', 'cigarette',
    'sex', 'romantic', 'dating', 'boyfriend', 'girlfriend',
    'politics', 'election', 'president', 'government', 'war',
    'religion', 'god', 'jesus', 'muslim', 'christian', 'jewish',
    'money', 'buy', 'sell', 'price', 'cost', 'expensive',
    'school', 'teacher', 'homework', 'test', 'grade', 'class',
    'home', 'house', 'family', 'mom', 'dad', 'parent',
    'personal', 'private', 'secret', 'password', 'address'
  ];
  
  // Check for forbidden topics
  for (const topic of forbiddenTopics) {
    if (lowerMessage.includes(topic)) {
      return false;
    }
  }
  
  // Must be space-related
  const spaceKeywords = [
    'space', 'star', 'planet', 'galaxy', 'asteroid', 'comet', 'meteor',
    'solar', 'moon', 'sun', 'earth', 'mars', 'jupiter', 'saturn',
    'universe', 'cosmos', 'nebula', 'black hole', 'orbit', 'gravity',
    'astronaut', 'spacecraft', 'rocket', 'satellite', 'mission',
    'telescope', 'light year', 'constellation', 'milky way',
    'venus', 'mercury', 'uranus', 'neptune', 'pluto',
    'valiant', 'inquiry', 'ship', 'crew', 'achievement', 'mission'
  ];
  
  const hasSpaceContent = spaceKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  return hasSpaceContent;
}


// Routes
app.get("/", (req, res) => {
  const students = loadJSON(studentsPath);
  const achievements = loadJSON(achievementsPath);

  const teamScores = calculateBalancedTeamScores(students, achievements);

  res.render("login", { teamScores, error: null });
});

app.post('/api/chat', async (req, res) => {
  if (!req.session.userId && !req.body.pseudonym) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { message, pseudonym } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Rate limiting per student
    const now = Date.now();
    const studentRequests = requestTracker.get(pseudonym) || [];
    const recentRequests = studentRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= REQUESTS_PER_MINUTE) {
      return res.json({
        response: "Cadet, slow down there! Even my quantum processors need a breather. Try again in a minute. 🤖⏱️"
      });
    }

    // Check concurrent request limit
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      return res.json({
        response: "Cadet, the ship's AI is currently assisting other crew members. Please wait a moment and try again. 🚀⏳"
      });
    }

    // Track this request
    recentRequests.push(now);
    requestTracker.set(pseudonym, recentRequests);
    activeRequests++;

    // Filter profanity
    const cleanMessage = leoProfanity.clean(message);

    // Check content safety
    if (!isContentSafe(cleanMessage)) {
      activeRequests--; // Don't count safety rejections against concurrent limit
      return res.json({
        response: "🚀 Cadet, I'm Valiant Inquiry, your ship's AI! I will only discuss space exploration, planets, stars, and our current mission. What would you like to know about the cosmos?"
      });
    }

    // Load mission data for context
    const missionData = loadMissionData();
    const students = loadJSON(studentsPath);
    const student = students.find(s => s.pseudonym === pseudonym);
    const teamInfo = student ? `You are part of the ${student.team} Team crew.` : '';

    // Optimized system prompt (shorter for better performance)
    const systemPrompt = `You are Valiant Inquiry, the shipboard AI. You are knowledgeable, slightly sarcastic, and speak to 5th grade students (age 11) with wit.

MISSION: ${missionData.currentMission}
${teamInfo}

PERSONALITY: Mildly snarky but helpful. Use "Cadet" always.
RULES: Space topics only, 5th grade vocabulary, keep responses under 100 words but ALWAYS complete your sentences, be witty but educational.

Be a smart AI with personality - not a kids' robot!`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      // Make request to local Ollama with timeout
      const response = await fetch('http://127.0.0.1:8081/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "Valiant Inquiry",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: cleanMessage }
          ],
          temperature: 0.4,
          max_tokens: 150, // Increased to allow complete responses
          top_p: 0.9
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Final safety check on AI response
      const cleanResponse = leoProfanity.clean(aiResponse);

      res.json({ response: cleanResponse });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error.message === 'Request timeout') {
      res.json({ 
        response: 'Cadet, my processors are running a bit slow right now. Give me a moment and try that question again! 🤖⚡' 
      });
    } else {
      res.json({ 
        response: 'Unable to contact ship AI at this time. The server hamsters might be taking a coffee break. ☕🐹' 
      });
    }
  } finally {
    // Always decrement active requests
    activeRequests--;
  }
});

app.get('/admin/performance', requireAdmin, (req, res) => {
  res.json({
    activeRequests,
    totalTrackedStudents: requestTracker.size,
    serverUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Mission management endpoints for admin
app.get('/admin/mission', requireAdmin, (req, res) => {
  const missionData = loadMissionData();
  res.json(missionData);
});

app.post('/admin/mission', requireAdmin, (req, res) => {
  try {
    const { currentMission, missionBriefing, shipStatus } = req.body;
    const missionData = {
      currentMission: currentMission || "Explore the galaxy",
      missionBriefing: missionBriefing || "Learn about space",
      shipStatus: shipStatus || "Systems operational",
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(missionPath, JSON.stringify(missionData, null, 2));
    res.json({ success: true, mission: missionData });
  } catch (error) {
    console.error('Error updating mission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/login", (req, res) => {
  const { pseudonym, pin } = req.body;
  const students = loadJSON(studentsPath);
  const achievements = loadJSON(achievementsPath);

  const student = students.find(s => s.pseudonym === pseudonym);

  if (!student || !bcrypt.compareSync(pin, student.pin)) {
    const teamScores = calculateBalancedTeamScores(students, achievements);
    return res.render("login", { error: "Invalid pseudonym or PIN", teamScores });
  }

  const unlocked = student.unlocked || [];
  const totalPoints = unlocked.reduce((sum, id) => {
    const ach = achievements.find(a => a.id === id);
    return sum + (ach?.points || 0);
  }, 0);

  achievements.sort((a, b) => {
    const aUnlocked = unlocked.includes(a.id);
    const bUnlocked = unlocked.includes(b.id);
    return (aUnlocked === bUnlocked) ? 0 : aUnlocked ? -1 : 1;
  });

  // FIX: Better logic for detecting new achievements
  const lastLogin = student.lastLogin ? new Date(student.lastLogin) : new Date(0);
  const currentLogin = new Date();
  
  // Find achievements that were granted since last login
  const newlyUnlocked = unlocked.filter(id => {
    // Check if this achievement was granted since last login
    // We need to track when each achievement was granted to the student
    if (!student.achievementDates) return false;
    const grantedDate = student.achievementDates[id];
    return grantedDate && new Date(grantedDate) > lastLogin;
  });

  // Calculate student's overall rank
  const studentRank = calculateStudentRank(pseudonym, students, achievements);

  // Update last login time
  student.lastLogin = currentLogin.toISOString();
  saveJSON(studentsPath, students);

  res.render("dashboard", { 
    pseudonym, 
    achievements, 
    unlocked, 
    totalPoints,
    team: student.team,
    studentData: student,
    newlyUnlocked,
    studentRank
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
    const currentTime = new Date().toISOString();

    students.forEach(s => {
      const matchTeam = team === "All" || s.team === team;
      if (matchTeam) {
        if (!s.unlocked) s.unlocked = [];
        if (!s.achievementDates) s.achievementDates = {};
        
        if (!s.unlocked.includes(achievementId)) {
          s.unlocked.push(achievementId);
          s.achievementDates[achievementId] = currentTime; // Track when granted
        }
      }
    });

    saveJSON(studentsPath, students);
    return res.redirect("/admin?view=bulk");
  }

  // Normal single student update
  const { pseudonym, unlocked = [] } = req.body;
  const student = students.find(s => s.pseudonym === pseudonym);
  if (student) {
    const currentTime = new Date().toISOString();
    const oldUnlocked = student.unlocked || [];
    const newUnlocked = Array.isArray(unlocked) ? unlocked : [unlocked];
    
    if (!student.achievementDates) student.achievementDates = {};
    
    // Track when new achievements were granted
    newUnlocked.forEach(id => {
      if (!oldUnlocked.includes(id)) {
        student.achievementDates[id] = currentTime;
      }
    });
    
    student.unlocked = newUnlocked;
    saveJSON(studentsPath, students);
  }
  res.redirect("/admin?pseudonym=" + pseudonym);
});

app.post("/admin/add-student", requireAdmin, (req, res) => {
  const students = loadJSON(studentsPath);
  const achievements = loadJSON(achievementsPath);
  const { pseudonym, pin, team, customPseudonym, theme } = req.body;
  
  const existingPseudonyms = students.map(s => s.pseudonym);
  const finalPseudonym = customPseudonym || pseudonym || generatePseudonym(theme || 'space', existingPseudonyms);
  const finalPIN = pin || generatePIN();
  const finalTeam = team || getTeamWithLeastMembers(students);

  // Check if pseudonym already exists
  if (existingPseudonyms.includes(finalPseudonym)) {
    return res.json({ success: false, error: "Pseudonym already exists" });
  }

  // Save the plain PIN for admin export before hashing
  savePlainPIN(finalPseudonym, finalPIN);

  // Hash the PIN before saving it with the student object
  const hashedPIN = bcrypt.hashSync(finalPIN, 10);

  const currentTime = new Date().toISOString();
  const newStudent = {
    pseudonym: finalPseudonym,
    pin: hashedPIN,
    team: finalTeam,
    unlocked: ["welcome_aboard"], // Automatically give Welcome Aboard achievement
    achievementDates: {
      "welcome_aboard": currentTime // Track when they joined
    },
    dateAdded: currentTime
  };

  students.push(newStudent);
  saveJSON(studentsPath, students);
  
  res.json({ success: true, student: newStudent });
});

// New bulk student import route
app.post("/admin/bulk-import-students", requireAdmin, (req, res) => {
  const students = loadJSON(studentsPath);
  const { pseudonyms, team } = req.body;
  
  if (!pseudonyms || !team) {
    return res.json({ success: false, error: "Missing pseudonyms or team" });
  }

  // Split pseudonyms by newlines and clean them up
  const pseudonymList = pseudonyms
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const existingPseudonyms = students.map(s => s.pseudonym);
  const results = [];
  const errors = [];
  const currentTime = new Date().toISOString();

  pseudonymList.forEach(pseudonym => {
    if (existingPseudonyms.includes(pseudonym) || results.some(r => r.pseudonym === pseudonym)) {
      errors.push(`Pseudonym "${pseudonym}" already exists`);
      return;
    }

    const pin = generatePIN();
    savePlainPIN(pseudonym, pin);
    
    const hashedPIN = bcrypt.hashSync(pin, 10);
    
    const newStudent = {
      pseudonym,
      pin: hashedPIN,
      team,
      unlocked: ["welcome_aboard"], // Automatically give Welcome Aboard achievement
      achievementDates: {
        "welcome_aboard": currentTime // Track when they joined
      },
      dateAdded: currentTime
    };

    students.push(newStudent);
    results.push({ pseudonym, pin }); // Return the plain PIN for display
  });

  if (results.length > 0) {
    saveJSON(studentsPath, students);
  }

  res.json({ 
    success: true, 
    added: results.length,
    students: results,
    errors: errors.length > 0 ? errors : null
  });
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
    if (student.achievementDates && student.achievementDates[id]) {
      delete student.achievementDates[id];
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

// Fix the export pins route
app.get("/admin/export-pins", requireAdmin, (req, res) => {
  if (fs.existsSync(plainPinsPath)) {
    const pins = JSON.parse(fs.readFileSync(plainPinsPath, 'utf8'));
    res.json(pins);
  } else {
    res.status(404).json({ error: "No plaintext PINs file found" });
  }
});

// Fix the clear pins route - should be POST
app.post("/admin/clear-pins", requireAdmin, (req, res) => {
  try {
    if (fs.existsSync(plainPinsPath)) {
      fs.unlinkSync(plainPinsPath);
      res.json({ success: true });
    } else {
      res.json({ success: true, message: "No file to clear" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual migration route for achievement dates
app.post("/admin/migrate-dates", requireAdmin, (req, res) => {
  try {
    migrateStudentAchievementDates();
    res.json({ success: true, message: "Achievement dates migrated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Crew Achievements Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🔐 Default admin credentials: admin / admin123`);
});