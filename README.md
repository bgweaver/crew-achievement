# 🚀 M.O.S. Valiant Inquiry - Crew Achievement System

A sci-fi-themed classroom achievement tracker that gamifies student participation and learning progress. Built for educators who want to create an engaging, space-themed environment while maintaining privacy and flexibility.

---

## 🎯 What Makes This Special

### ✨ Key Features

- 🔐 **Secure Authentication** - bcrypt-protected admin system with student PINs
- 👥 **Smart Student Management** - Auto-generates space-themed pseudonyms with team balancing
- 🏆 **Dynamic Achievement System** - Create, assign, and track custom achievements
- 📊 **Advanced Analytics** - Student rankings, playing time, and balanced team scoring
- ⚡ **Bulk Operations** - Mass student creation and achievement assignment
- 🎨 **Immersive UI** - Audiowide/Rajdhani fonts with animated space effects
- 📱 **Mobile-Responsive** - Works seamlessly across all devices
- 🌟 **Real-time Celebrations** - Achievement unlocks with confetti and animations

### 🚀 Space-Themed Features

- **Ship Name**: M.O.S. Valiant Inquiry (Mobile Observatory Station)
- **Student Roles**: Crew members with space-themed pseudonyms
- **Teams**: Red, Blue, Green, Yellow crews with balanced scoring
- **Ranks**: Rookie → Novice → Intermediate → Advanced → Elite
- **UI Elements**: Holographic effects, particle systems, shooting stars, and more

---

## 🛠️ Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/bgweaver/crew-achievement.git
cd crew-achievement

# Install dependencies
npm install

# Create data directory
mkdir data

# Start the server
npm start
# or for development with auto-reload:
npm run dev
```

### First Time Setup

1. **Access the app**: http://localhost:3000
2. **Admin login**: http://localhost:3000/admin-login
   - Default credentials: `admin` / `admin123`
3. **Add students** via the admin panel
4. **Create achievements** to track progress

---

## 📚 Complete Feature Guide

### 👤 Student Experience

#### Login & Dashboard
- Space-themed login with animated background effects
- Personal dashboard showing:
  - **Playing Time**: Days since receiving "Welcome Aboard!" achievement
  - **Overall Rank**: Position among all students by points
  - **Achievement Progress**: Visual progress circle and grid
  - **Team Affiliation**: Color-coded crew badges

#### Achievement System
- **Visual Achievement Cards**: Locked/unlocked states with animations
- **Celebration Effects**: Confetti and sparkle animations on unlock
- **Progress Tracking**: Real-time progress bars and statistics
- **Rank Progression**: Rookie → Elite based on completion percentage

### 🎯 Admin Management

#### Student Management
- **Individual Addition**: Generate pseudonyms and PINs on-demand
- **Bulk Import**: Paste lists of names for mass creation
- **Auto Team Balancing**: Distributes students evenly across crews
- **Theme Selection**: Choose from Space, Ocean, or Forest pseudonym pools
- **Welcome Achievement**: Automatically assigns "Welcome Aboard!" to new students

#### Achievement System
- **Create Achievements**: Custom titles, descriptions, points, and images
- **Individual Assignment**: Grant achievements to specific students
- **Bulk Assignment**: Apply achievements to entire teams or all students
- **Progress Analytics**: See which achievements are most/least earned
- **Automatic Tracking**: System tracks when achievements were earned

#### Analytics & Reporting
- **Student Overview**: Sortable table with search and team filters
- **Balanced Team Scores**: Points divided by team size × 25 for fairness
- **Achievement Statistics**: Completion rates and popular achievements
- **Export Functions**: Download plaintext PINs for distribution

### 🔧 Advanced Features

#### Balanced Scoring System
Team scores are calculated as: `(Total Team Points ÷ Team Size) × 25`
This ensures fair competition regardless of team size differences.

#### Student Ranking
Students are ranked by total points earned across all achievements, with real-time updates.

#### Playing Time Calculation
Tracks how long students have been active based on their "Welcome Aboard!" achievement date.

#### Security Features
- **PIN Hashing**: bcrypt protection for all authentication
- **Session Management**: Secure express-session implementation
- **Plaintext PIN Export**: Temporary storage for admin distribution only

---

## 🎨 Customization Options

### Font Scheme
- **Primary**: Audiowide (ship titles and headers)
- **Secondary**: Rajdhani (body text and UI elements)  
- **Accent**: Orbitron (technical elements and badges)

### Color Palette
```css
--space-dark: #0a0a1a
--space-accent: #4b6ef5  
--neon-cyan: #00ffff
--neon-green: #39ff14
--neon-pink: #ff006e
```

### Pseudonym Themes
- **Space**: Nebula, Quasar, Pulsar, Cosmic, Stellar...
- **Ocean**: Tsunami, Coral, Current, Abyss, Marina...
- **Forest**: Redwood, Willow, Sage, Aspen, Cedar...

---

## 🌐 Deployment Guide

### Option 1: DigitalOcean VPS
```bash
# Server setup
sudo apt update && sudo apt install nodejs npm nginx
git clone your-repo && cd crew-achievements
npm install && npm install -g pm2

# Process management
pm2 start app.js --name crew-achievements
pm2 startup && pm2 save

# NGINX reverse proxy
sudo nano /etc/nginx/sites-available/crew-achievements
# Configure SSL with certbot
sudo certbot --nginx
```

### Option 2: Railway (Recommended for beginners)
1. Connect GitHub repository to Railway
2. Set environment variables in dashboard
3. Auto-deploy with zero configuration

### Option 3: Heroku
```bash
# Heroku CLI deployment
heroku create your-app-name
git push heroku main
heroku config:set NODE_ENV=production
```

### Environment Variables
```env
SESSION_SECRET=your-super-secret-key-here
DEFAULT_ADMIN=admin
DEFAULT_CREDS=your-admin-password
NODE_ENV=production
PORT=3000
```

---

## 🔒 Security Best Practices

- 🔑 **Change default admin credentials immediately**
- 🌐 **Use HTTPS in production** (Let's Encrypt recommended)
- 💾 **Regular backups** of the `/data` directory
- 🔐 **Strong session secrets** in production
- 🛡️ **Monitor access logs** for unusual activity

---

## 📊 Data Structure

### Student Data
```json
{
  "pseudonym": "Nebula",
  "pin": "$2b$10$hashed_pin_here",
  "team": "Blue",
  "unlocked": ["welcome_aboard", "first_mission"],
  "achievementDates": {
    "welcome_aboard": "2024-01-15T10:30:00.000Z",
    "first_mission": "2024-01-16T14:20:00.000Z"
  },
  "dateAdded": "2024-01-15T10:30:00.000Z",
  "lastLogin": "2024-01-20T09:15:00.000Z"
}
```

### Achievement Data
```json
{
  "id": "welcome_aboard",
  "title": "Welcome Aboard!",
  "description": "Join the crew and begin your journey among the stars",
  "points": 5,
  "image": "https://example.com/image.jpg",
  "dateAdded": "2024-01-10T00:00:00.000Z"
}
```

---

## 🔮 Future Roadmap

### Planned Features
- 👤 **Student Profiles**: Avatar customization and personal stats
- 🔥 **Achievement Streaks**: Consecutive day bonuses and milestones  
- 💪 **Team Challenges**: Collaborative multi-student achievements
- 🏅 **Badge Categories**: Different achievement types and rarities
- 🧭 **Story Mode**: Sequential "mission" progression paths
- 🔊 **Sound Effects**: Audio feedback for achievement unlocks
- 📈 **Advanced Analytics**: Detailed progress reports and insights
- 🌐 **Multi-Language**: Internationalization support

### Community Features
- 📤 **CSV Import/Export**: Integration with existing gradebooks
- 🔗 **API Access**: Third-party integrations and webhooks
- 📝 **Custom Themes**: User-created visual themes
- 🎮 **Mini-Games**: Interactive achievement challenges

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation for any changes
- Test thoroughly across different devices

---

## 📄 License

MIT License - feel free to use, modify, and distribute as needed.

---

## 🙏 Credits

Built by educators, for educators. Special thanks to all the teachers who provided feedback and testing (which is currently just me... but you should try it too!).

**"The cosmos is within us. We are made of star-stuff."** - Carl Sagan

---

## 📞 Support

- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Start a discussion thread  
- 📚 **Documentation**: Check the wiki for detailed guides
- 💬 **Community**: Join our Discord for real-time support

---

*Ready to launch your classroom into the cosmos? Let's explore the universe of learning together!* 🚀✨