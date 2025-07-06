# 🚀 Crew Achievements

A sci-fi-themed classroom achievement tracker built for teachers who want to gamify student participation, reward growth, and make learning more engaging — without sacrificing privacy or flexibility.

---

## 📋 What's New

### ✅ Key Features

- 🔐 **Admin login system** with bcrypt password protection  
- 👥 **Add students easily** — pseudonym generator with team auto-balancing  
- 🏆 **Create, edit, assign achievements** from the web UI (no JSON hacking required)  
- 📊 **Student overview table** — filter, search, and monitor progress at a glance  
- ⚡ **Bulk actions** — mass student creation and achievement assignment  
- 🎨 **Mobile-friendly UI** with cards, stats, and celebration effects  
- 🔄 **Auto team balancing** to keep teams evenly populated  

---

## 🎯 Why It Exists

- ✅ Simplifies classroom management — no spreadsheets, no scripting  
- ✅ Gives kids a fun, visual system to track their growth  
- ✅ Lets teachers focus on *what* to reward, not *how*  

---

## 🛠️ Setup & Installation

### 1. Clone & Install

```bash
git clone https://github.com/bgweaver/crew-achievement.git
cd crew-achievement
npm install
```

### 2. Create Data Directory

```bash
mkdir data
```

### 3. Run It

```bash
npm start
# or for dev auto-reload:
npm run dev
```

### 4. Open in Browser

- **Student Login**: http://localhost:3000  
- **Admin Panel**: http://localhost:3000/admin-login  
  - Default: `admin` / `admin123`

---

## 🔧 Configuration

### Change Admin Password

1. Generate a new bcrypt hash:

```bash
node
> const bcrypt = require('bcrypt')
> bcrypt.hashSync("newpassword", 10)
```

2. Edit `/data/admin.json` and replace the password hash.

### Environment Variables (Optional)

Create a `.env` file:

```env
SESSION_SECRET=your-super-secret-key
ADMIN_USERNAME=your-admin
ADMIN_PASSWORD=your-bcrypt-hash
NODE_ENV=production
```

---

## 📱 Usage Guide

### 👤 Managing Students (Admin Panel)

- **Add Individually** — click 🎲 to generate pseudonym and PIN  
- **Bulk Create** — choose count + theme (Space, Ocean, Forest)  
- **Auto-balance Teams** — or assign manually  
- **Delete** — directly from the Manage view  

### 🏆 Managing Achievements

- **Create/Edit/Delete** — title, description, points, optional image  
- **Assign Individually** — via student editor  
- **Assign in Bulk** — apply to entire team  

### 📊 Dashboards & Overview

- Team breakdown, progress bars, and overall stats  
- Visual progress % on the **Admin → Overview** page  
- See which achievements are most/least earned  

### For Students

- Visual Progress Bar and Unlocked Achievements  
- Team Affiliation badge with color  
- Rank System: Rookie → Novice → Intermediate → Advanced → Elite  
- 🎉 Celebration Effects on unlock  

---

## 🌐 Deployment Options

### 🔹 Option 1: DigitalOcean (Manual VPS)

```bash
sudo apt update
sudo apt install nodejs npm nginx
git clone your-repo
cd crew-achievements
npm install
npm install -g pm2
pm2 start app.js --name crew-achievements
pm2 startup
pm2 save
```

#### NGINX config

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable HTTPS:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx
```

### 🔹 Option 2: Railway (GUI Hosting)

- Connect GitHub repo  
- Set env vars in dashboard  
- Auto-deploy  

### 🔹 Option 3: Heroku

- Same flow: GitHub → Deploy  
- Note: no free tier anymore

### 🔹 Option 4: Docker

#### Dockerfile

```Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🔒 Security Best Practices

- 🧠 Change default admin credentials immediately  
- 🔐 Use HTTPS via Let’s Encrypt or reverse proxy  
- 💾 Back up `/data` regularly  
- 🛡️ Use strong session secrets  
- 🔍 Monitor access logs if public-facing  

---

## 💡 Future Ideas & Roadmap

- 👤 Student profiles with avatars  
- 🔥 Achievement streaks and milestones  
- 💪 Team challenges and co-op achievements  
- 🏅 Badges beyond raw points  
- 🧭 Story progression mode ("missions")  
- 🔊 Sound FX on achievement unlocks  
- 🖥️ Admin tools for user import/export and CSV sync  

---

## 🙌 Credits

Built by a chaotic teacher/hacker hybrid for the classroom of tomorrow.  
Contributions, forks, and weird ideas welcome.

---

## ✨ License

MIT. Share it, remix it, gamify your life.