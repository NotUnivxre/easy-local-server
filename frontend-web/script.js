// PENTING: Ganti URL ini dengan URL Ngrok / Cloudflare Tunnel kamu nanti!
// Contoh: const BACKEND_URL = 'https://1234-abcd.ngrok-free.app';
const BACKEND_URL = 'https://freddie-miffed-jowly.ngrok-free.dev'; 

const socket = io(BACKEND_URL);
const terminal = document.getElementById('terminal');
const commandForm = document.getElementById('commandForm');
const cmdInput = document.getElementById('cmdInput');

// Fungsi auto-scroll ke bawah saat ada log baru
function appendLog(text) {
    terminal.textContent += text;
    terminal.scrollTop = terminal.scrollHeight;
}

socket.on('log', (data) => {
    appendLog(data);
});

document.getElementById('startBtn').addEventListener('click', () => {
    socket.emit('start_server');
});

document.getElementById('stopBtn').addEventListener('click', () => {
    socket.emit('stop_server');
});

commandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cmd = cmdInput.value.trim();
    if (cmd) {
        socket.emit('send_command', cmd);
        cmdInput.value = '';
    }
});