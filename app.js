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

const statsDisplay = document.getElementById('statsDisplay');
const totalPushups = document.getElementById('totalPushups');
const avgPerSession = document.getElementById('avgPerSession');
const avgPerDay = document.getElementById('avgPerDay');
const sessionsPerDay = document.getElementById('sessionsPerDay');

const chartContainer = document.getElementById('chartContainer');
const chart = document.getElementById('chart');

// Initialize app
function init() {
    loadSessions();
    setupAudio();
    attachEventListeners();
    updateStats();
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
let lastTapTime = 0;
const TAP_DEBOUNCE_MS = 500;

function attachEventListeners() {
    countBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const now = Date.now();
        if (now - lastTapTime < TAP_DEBOUNCE_MS) return;
        lastTapTime = now;
        incrementCount();
    }, { passive: false });
    countBtn.addEventListener('click', (e) => { // fallback for non-touch
        const now = Date.now();
        if (now - lastTapTime < TAP_DEBOUNCE_MS) return;
        lastTapTime = now;
        incrementCount();
    });
    endSessionBtn.addEventListener('click', endSession);
    viewHistoryBtn.addEventListener('click', showHistory);
    backBtn.addEventListener('click', showCounter);
    acceptBtn.addEventListener('click', acceptSession);
    discardBtn.addEventListener('click', discardSession);
    clearHistoryBtn.addEventListener('click', showClearConfirmation);
    exportBtn.addEventListener('click', exportHistory);
    confirmClearBtn.addEventListener('click', clearHistory);
    cancelClearBtn.addEventListener('click', hideClearConfirmation);
    document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));

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
        updateStats();
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

// Month navigation state
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0-indexed

// Navigation
function showHistory() {
    // Reset to current month each time we open history
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    counterScreen.classList.remove('active');
    historyScreen.classList.add('active');
    renderMonthView();
}

function showCounter() {
    historyScreen.classList.remove('active');
    counterScreen.classList.add('active');
}

function changeMonth(delta) {
    viewMonth += delta;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    else if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderMonthView();
}

function renderMonthView() {
    updateMonthLabel();
    renderHistory();
    renderChart();
    updateNextMonthBtn();
}

function updateMonthLabel() {
    const label = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('monthLabel').textContent = label;
}

function updateNextMonthBtn() {
    const now = new Date();
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    document.getElementById('nextMonthBtn').disabled = isCurrentMonth;
}

function getSessionsForMonth(year, month) {
    return sessions.filter(s => {
        const d = new Date(s.timestamp);
        return d.getFullYear() === year && d.getMonth() === month;
    });
}

// History functions
function renderHistory() {
    const monthSessions = getSessionsForMonth(viewYear, viewMonth);
    const monthSummary = document.getElementById('monthSummary');

    if (monthSessions.length === 0) {
        historyList.style.display = 'none';
        emptyHistory.style.display = 'block';
        monthSummary.style.display = 'none';
        return;
    }

    historyList.style.display = 'flex';
    emptyHistory.style.display = 'none';

    const monthTotal = monthSessions.reduce((sum, s) => sum + s.count, 0);
    const now = new Date();
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    const numDaysInPeriod = isCurrentMonth ? now.getDate() : new Date(viewYear, viewMonth + 1, 0).getDate();

    monthSummary.style.display = 'flex';
    monthSummary.innerHTML = `
        <div class="stat-item"><div class="stat-label">Pushups</div><div class="stat-value">${monthTotal}</div></div>
        <div class="stat-item"><div class="stat-label">Sessions</div><div class="stat-value">${monthSessions.length}</div></div>
        <div class="stat-item"><div class="stat-label">Avg/Session</div><div class="stat-value">${(monthTotal / monthSessions.length).toFixed(1)}</div></div>
        <div class="stat-item"><div class="stat-label">Sessions/Day</div><div class="stat-value">${(monthSessions.length / numDaysInPeriod).toFixed(1)}</div></div>
        <div class="stat-item"><div class="stat-label">Avg/Day</div><div class="stat-value">${(monthTotal / numDaysInPeriod).toFixed(1)}</div></div>
    `;

    historyList.innerHTML = monthSessions.map(session => {
        const date = new Date(session.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const durationStr = session.duration ? formatTime(session.duration) : '-';

        return `
            <div class="history-item">
                <span class="history-count">${session.count}</span>
                <span class="history-date">${dateStr}</span>
                <span class="history-time">${timeStr}</span>
                <span class="history-duration">${durationStr}</span>
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
    renderMonthView();
    updateStats();
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

// Stats functions
function updateStats() {
    if (sessions.length === 0) {
        totalPushups.textContent = '0';
        avgPerSession.textContent = '0';
        avgPerDay.textContent = '0';
        sessionsPerDay.textContent = '0';
        return;
    }

    // Calculate total pushups
    const total = sessions.reduce((sum, session) => sum + session.count, 0);
    totalPushups.textContent = total;

    // Calculate average per session
    const avgSession = (total / sessions.length).toFixed(1);
    avgPerSession.textContent = avgSession;

    // Days elapsed since first session (inclusive of today), using UTC to avoid DST skew
    const firstSession = new Date(sessions[sessions.length - 1].timestamp);
    const today = new Date();
    const firstDayUTC = Date.UTC(firstSession.getFullYear(), firstSession.getMonth(), firstSession.getDate());
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const numDays = Math.round((todayUTC - firstDayUTC) / 86400000) + 1;

    // Calculate average per day
    const avgDay = (total / numDays).toFixed(1);
    avgPerDay.textContent = avgDay;

    // Calculate sessions per day
    const sessDay = (sessions.length / numDays).toFixed(1);
    sessionsPerDay.textContent = sessDay;
}

function getDailySessionsForMonth(year, month) {
    const monthSessions = getSessionsForMonth(year, month);

    const dailyMap = new Map();
    monthSessions.forEach(session => {
        const day = new Date(session.timestamp).getDate();
        if (!dailyMap.has(day)) dailyMap.set(day, []);
        dailyMap.get(day).push(session.count);
    });

    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const lastDay = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();

    const result = [];
    for (let d = 1; d <= lastDay; d++) {
        result.push({ day: d, sessions: dailyMap.get(d) || [] });
    }
    return result;
}

function renderChart() {
    const dailyData = getDailySessionsForMonth(viewYear, viewMonth);
    const monthSessions = getSessionsForMonth(viewYear, viewMonth);

    if (monthSessions.length === 0) {
        chartContainer.style.display = 'none';
        return;
    }

    chartContainer.style.display = 'block';
    const maxCount = Math.max(...dailyData.map(d => d.sessions.reduce((s, c) => s + c, 0)), 1);

    chart.innerHTML = dailyData.map(({ day, sessions }) => {
        const total = sessions.reduce((s, c) => s + c, 0);
        const isEmpty = sessions.length === 0;
        const spacerFlex = isEmpty ? maxCount : maxCount - total;

        let barHtml;
        if (isEmpty) {
            barHtml = `<div class="chart-bar chart-bar-empty"></div>`;
        } else if (sessions.length === 1) {
            barHtml = `<div class="chart-bar" style="flex: ${total} 0 0"></div>`;
        } else {
            const segments = [...sessions].reverse().map(count =>
                `<div class="chart-bar-segment" style="flex: ${count} 0 0"></div>`
            ).join('');
            barHtml = `<div class="chart-bar-stack" style="flex: ${total} 0 0">${segments}</div>`;
        }

        return `
            <div class="chart-bar-container">
                <div class="chart-value">${total || ''}</div>
                <div class="chart-spacer" style="flex: ${spacerFlex} 1 0"></div>
                ${barHtml}
                <div class="chart-label">${day}</div>
            </div>
        `;
    }).join('');
}

// Initialize on load
init();
