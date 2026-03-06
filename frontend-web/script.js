// PENTING: Jangan lupa ganti link ini dengan URL Ngrok kamu yang baru!
const BACKEND_URL = 'https://link-ngrok-kamu-disini.ngrok-free.app'; 

const socket = io(BACKEND_URL, {
    extraHeaders: {
        "ngrok-skip-browser-warning": "true"
    }
});

const terminal = document.getElementById('terminal');
const commandForm = document.getElementById('commandForm');
const cmdInput = document.getElementById('cmdInput');
const statusText = document.getElementById('serverStatus');

// --- LOGIKA GANTI TAB SIDEBAR ---
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
    document.querySelectorAll('.nav-links li').forEach(link => link.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active-tab');
    event.currentTarget.classList.add('active');
    
    document.getElementById('pageTitle').innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1);
};

// --- LOGIKA SIMPAN IP PLAYIT.GG ---
const addressInput = document.getElementById('playitAddress');
addressInput.value = localStorage.getItem('playitIP') || '';
addressInput.addEventListener('input', () => {
    localStorage.setItem('playitIP', addressInput.value);
});

// --- LOGIKA SIMPAN OPTIONS (RAM) ---
const ramInput = document.getElementById('opt-ram');
ramInput.value = localStorage.getItem('serverRam') || '2048'; // Default 2GB

document.querySelector('.btn-save').addEventListener('click', () => {
    const newRam = ramInput.value.trim();
    if (newRam) {
        localStorage.setItem('serverRam', newRam);
        alert(`Options tersimpan! Server akan menggunakan RAM ${newRam} MB pada Start berikutnya.`);
    }
});

// --- LOGIKA TERMINAL & SOCKET ---
function appendLog(text) {
    terminal.textContent += text;
    terminal.scrollTop = terminal.scrollHeight;
}

socket.on('connect', () => {
    statusText.textContent = 'Online (Standby)';
    statusText.className = 'status-online';
});

socket.on('disconnect', () => {
    statusText.textContent = 'Offline';
    statusText.className = 'status-offline';
});

socket.on('log', (data) => {
    appendLog(data);
});

// Menerima data RAM komputermu dari backend
socket.on('stats', (data) => {
    document.getElementById('ramUsage').innerText = data.ram;
});

// --- LOGIKA TOMBOL KONTROL ---
document.getElementById('startBtn').addEventListener('click', () => {
    // Ambil nilai RAM dari storage lalu kirim ke backend
    const currentRam = localStorage.getItem('serverRam') || '2048';
    socket.emit('start_server', currentRam);
});

document.getElementById('stopBtn').addEventListener('click', () => {
    socket.emit('stop_server');
});

document.getElementById('restartBtn').addEventListener('click', () => {
    socket.emit('send_command', 'stop');
    setTimeout(() => {
        const currentRam = localStorage.getItem('serverRam') || '2048';
        socket.emit('start_server', currentRam);
    }, 5000); // Start otomatis setelah 5 detik
});

commandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cmd = cmdInput.value.trim();
    if (cmd) {
        socket.emit('send_command', cmd);
        cmdInput.value = '';
    }
});