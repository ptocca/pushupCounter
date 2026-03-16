# Pushup Counter 💪

A mobile-optimized static web app for tracking pushup sessions with audio feedback and persistent history.

## 🌐 Live Demo

**Try it now:** [https://ptocca.github.io/pushupCounter/](https://ptocca.github.io/pushupCounter/)

## ✨ Features

### Core Functionality
- **Tap Counter** - Large central button to count each pushup
- **Audio Feedback** - Beep sound on every tap
- **Session Timer** - Automatic timing from first tap to session end
- **Real-time Display** - Live counter and timer in mm:ss format

### Session Management
- **Review & Edit** - Modify count before saving
- **Accept/Discard** - Choose to save or cancel sessions
- **Persistent Storage** - All sessions saved locally using LocalStorage

### History & Export
- **Session History** - View all past workouts with date, time, count, and duration
- **Export to TSV** - Download history as tab-separated values (Excel/Sheets compatible)
- **Clear History** - Remove all data with confirmation dialog

## 🚀 How to Use

1. **Start Workout** - Tap the large red button at the bottom of each pushup
2. **Watch Timer** - Timer starts automatically on first tap
3. **End Session** - Press "End Session" button (top right) when done
4. **Review** - Edit count if needed, then Accept or Discard
5. **View History** - Check past sessions with 📊 History button
6. **Export Data** - Download TSV file with 💾 Export button

## 🛠️ Technologies

- **HTML5** - Semantic markup
- **CSS3** - Mobile-first responsive design with CSS Grid/Flexbox
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **Web Audio API** - Beep sound generation
- **LocalStorage API** - Client-side data persistence
- **Blob API** - TSV file export
- **Service Worker** - Offline caching and PWA support
- **Web App Manifest** - Installable on home screen

## 📱 Mobile Optimized

- Touch-friendly large buttons
- No zoom/scroll interference
- Works fully offline (service worker caches all assets)
- Installable as PWA — "Add to Home Screen" on Android/iOS
- Timer positioned to avoid Android navigation buttons

## 🔧 Installation

### Option 1: Use GitHub Pages
Just visit the live demo link above!

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/ptocca/pushupCounter.git
cd pushupCounter

# Serve with any HTTP server
python3 -m http.server 8000

# Open http://localhost:8000
```

### Option 3: Direct Open
Simply open `index.html` in your browser - no server needed!

## 📊 Export Format

The TSV export includes:
- **Date** - Session date (MM/DD/YYYY)
- **Time** - Session time (HH:MM:SS, 24-hour)
- **Count** - Number of pushups
- **Duration** - Session length (mm:ss)

## 🎯 Future Features

- Voice command to end session ("STOP!")
- Multi-exercise support
- Custom beep sounds

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit pull requests.

---

Built with 💪 and ☕ | [View Source](https://github.com/ptocca/pushupCounter)
