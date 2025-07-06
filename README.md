# 🚀 Crew Achievements

A sci-fi-themed class achievement tracker built for teachers, by a teacher.  
Each student is a crewmate aboard a spacefaring science vessel — earning achievements, scoring points, and competing as part of their color-coded team.

This app was built to gamify classroom engagement in a fun, FERPA-compliant way without relying on expensive third-party platforms.

---

## ✨ Features

- 🔐 **Secure Student Login** via pseudonym + PIN (no real names used)
- 🏆 **Achievement Dashboard** with:
  - Colorful images for unlocked achievements
  - Greyed-out locked ones
  - Point values and a total counter
  - Progress summary: `X / Y achievements earned`
- 📊 **Team Scores** — tracks point totals for each team (Red, Blue, Green, Yellow)
- 🛠 **Admin Panel**:
  - Award achievements individually or in bulk
  - Bulk assign by team or entire class
- 💾 **JSON-Based Backend** for simplicity and local hosting
- 🎨 **Bootstrap styling** with room for custom flair

---

## 🧠 Tech Stack

- Node.js + Express
- EJS templating
- Bootstrap 5
- Plain JSON for data storage (`/data/students.json` and `/data/achievements.json`)

---

## 🚧 Setup Instructions

1. Clone the repo:

```bash
git clone https://github.com/YOUR_USERNAME/crew-achievements.git
cd crew-achievements
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
node app.js
```

4. Visit http://localhost:3000

---

## 🗃 File Structure

```
├── app.js                 # Main server
├── views/                # EJS templates
├── public/               # Static files (CSS, images)
├── data/
│   ├── students.json     # Student data (pseudonym, pin, team, unlocked)
│   └── achievements.json # Achievements (id, title, description, image, points)
├── .gitignore
└── README.md
```

---

## 🔐 FERPA Compliance Notes

- No student names or personal info are stored
- Login uses pseudonyms and PINs only
- All student-facing data is strictly anonymized
- You are responsible for protecting your server if hosted externally

---

## 🧩 Future Features (Wishlist)

- Admin login with password
- Add/edit achievements from the admin panel
- Add students (and auto-generate PINs/pseudonyms) from admin panel
- Export student progress as CSV
- Upload custom icons/images
- Dark mode (because... space)

---

## 📸 Screenshots

Coming soon — or drop your own!

---

## 🧪 Built By

A nerdy 5th grade science teacher with a home lab, a stubborn dog, and a low tolerance for expensive education software that stops working mid-year.

If you fork this or improve it, feel free to tag me in — I'd love to see how others use it.

---

## 🛰 License

MIT — use, share, improve, or turn it into a space lizard cult. I won't stop you.