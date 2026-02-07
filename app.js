// State management
let currentCount = 0;
let sessions = [];
let audioContext = null;
let sessionStartTime = null;
let timerInterval = null;
let elapsedSeconds = 0;

// DOM elements
const counterScreen = document.getElementById('counterScreen');
const historyScreen = document.getElementById('historyScreen');
const reviewModal = document.getElementById('reviewModal');
const confirmModal = document.getElementById('confirmModal');

const counterNumber = document.getElementById('counterNumber');
const countBtn = document.getElementById('countBtn');
const endSessionBtn = document.getElementById('endSessionBtn');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const backBtn = document.getElementById('backBtn');

const summaryCount = document.getElementById('summaryCount');
const editCount = document.getElementById('editCount');
const acceptBtn = document.getElementById('acceptBtn');
const discardBtn = document.getElementById('discardBtn');

const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');
const timerDisplay = document.getElementById('timerDisplay');
const summaryDuration = document.getElementById('summaryDuration');

const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportBtn = document.getElementById('exportBtn');
const confirmClearBtn = document.getElementById('confirmClearBtn');
const cancelClearBtn = document.getElementById('cancelClearBtn');

// Initialize app
function init() {
    loadSessions();
    setupAudio();
    attachEventListeners();
}

// Audio setup
function setupAudio() {
    // Create AudioContext on first user interaction
    document.addEventListener('touchstart', function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        document.removeEventListener('touchstart', initAudio);
    }, { once: true });
}

function playBeep() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // 800 Hz beep
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Event listeners
function attachEventListeners() {
    countBtn.addEventListener('click', incrementCount);
    endSessionBtn.addEventListener('click', endSession);
    viewHistoryBtn.addEventListener('click', showHistory);
    backBtn.addEventListener('click', showCounter);
    acceptBtn.addEventListener('click', acceptSession);
    discardBtn.addEventListener('click', discardSession);
    clearHistoryBtn.addEventListener('click', showClearConfirmation);
    exportBtn.addEventListener('click', exportHistory);
    confirmClearBtn.addEventListener('click', clearHistory);
    cancelClearBtn.addEventListener('click', hideClearConfirmation);

    // Update accept button when edit input changes
    editCount.addEventListener('input', updateAcceptButton);
}

// Timer functions
function startTimer() {
    sessionStartTime = Date.now();
    elapsedSeconds = 0;
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

function updateTimer() {
    elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    timerDisplay.textContent = formatTime(elapsedSeconds);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    sessionStartTime = null;
    elapsedSeconds = 0;
    timerDisplay.textContent = '0:00';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Counter functions
function incrementCount() {
    // Start timer on first tap
    if (currentCount === 0) {
        startTimer();
    }

    currentCount++;
    counterNumber.textContent = currentCount;
    playBeep();

    // Add visual feedback
    counterNumber.style.transform = 'scale(1.1)';
    setTimeout(() => {
        counterNumber.style.transform = 'scale(1)';
    }, 100);
}

function endSession() {
    if (currentCount === 0) {
        return; // Don't end session if no pushups
    }

    stopTimer();
    summaryCount.textContent = currentCount;
    summaryDuration.textContent = formatTime(elapsedSeconds);
    editCount.value = currentCount;
    reviewModal.classList.add('active');
}

function acceptSession() {
    const finalCount = parseInt(editCount.value) || currentCount;

    if (finalCount > 0) {
        const session = {
            count: finalCount,
            duration: elapsedSeconds,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        sessions.unshift(session); // Add to beginning
        saveSessions();
    }

    resetCounter();
    resetTimer();
    reviewModal.classList.remove('active');
}

function discardSession() {
    resetCounter();
    resetTimer();
    reviewModal.classList.remove('active');
}

function resetCounter() {
    currentCount = 0;
    counterNumber.textContent = '0';
}

function updateAcceptButton() {
    const value = parseInt(editCount.value);
    if (value === 0 || isNaN(value)) {
        acceptBtn.textContent = '✗ Discard';
        acceptBtn.className = 'btn btn-discard';
    } else {
        acceptBtn.textContent = '✓ Accept';
        acceptBtn.className = 'btn btn-accept';
    }
}

// Navigation
function showHistory() {
    counterScreen.classList.remove('active');
    historyScreen.classList.add('active');
    renderHistory();
}

function showCounter() {
    historyScreen.classList.remove('active');
    counterScreen.classList.add('active');
}

// History functions
function renderHistory() {
    if (sessions.length === 0) {
        historyList.style.display = 'none';
        emptyHistory.style.display = 'block';
        return;
    }

    historyList.style.display = 'flex';
    emptyHistory.style.display = 'none';

    historyList.innerHTML = sessions.map((session, index) => {
        const date = new Date(session.timestamp);
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const durationStr = session.duration ? formatTime(session.duration) : '-';

        return `
            <div class="history-item">
                <div class="history-item-left">
                    <div class="history-count">${session.count}</div>
                    <div class="history-date">${dateStr}</div>
                    <div class="history-time">${timeStr}</div>
                    <div class="history-duration">${durationStr}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Storage functions
function saveSessions() {
    try {
        localStorage.setItem('pushupSessions', JSON.stringify(sessions));
    } catch (error) {
        console.error('Failed to save sessions:', error);
    }
}

function loadSessions() {
    try {
        const stored = localStorage.getItem('pushupSessions');
        if (stored) {
            sessions = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load sessions:', error);
        sessions = [];
    }
}

// History management
function showClearConfirmation() {
    if (sessions.length === 0) {
        return; // Nothing to clear
    }
    confirmModal.classList.add('active');
}

function hideClearConfirmation() {
    confirmModal.classList.remove('active');
}

function clearHistory() {
    sessions = [];
    saveSessions();
    hideClearConfirmation();
    renderHistory();
}

function exportHistory() {
    if (sessions.length === 0) {
        return; // Nothing to export
    }

    // Create TSV content
    const headers = ['Date', 'Time', 'Count', 'Duration'];
    const rows = sessions.map(session => {
        const date = new Date(session.timestamp);
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        const duration = session.duration ? formatTime(session.duration) : '0:00';

        return [dateStr, timeStr, session.count, duration].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with current date
    const now = new Date();
    const filename = `pushup-history-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.tsv`;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Initialize on load
init();
