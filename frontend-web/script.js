// --- GANTI DENGAN URL NGROK KAMU ---
const BACKEND_URL = 'https://freddie-miffed-jowly.ngrok-free.dev'; 

const socket = io(BACKEND_URL, {
    extraHeaders: { "ngrok-skip-browser-warning": "true" }
});

const terminal = document.getElementById('terminal');
const statusText = document.getElementById('serverStatus');

// --- TABS & IP LOGIC ---
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
    document.querySelectorAll('.nav-links li').forEach(link => link.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active-tab');
    event.currentTarget.classList.add('active');
    document.getElementById('pageTitle').innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1);

    if (tabId === 'options') socket.emit('get_options');
    if (tabId === 'files') loadFiles(''); 
};

const addressInput = document.getElementById('playitAddress');
addressInput.value = localStorage.getItem('playitIP') || '';
addressInput.addEventListener('input', () => localStorage.setItem('playitIP', addressInput.value));

// --- REAL OPTIONS EDITOR LOGIC ---
socket.on('options_data', (data) => {
    if(data['max-players']) document.getElementById('opt-slots').value = data['max-players'];
    if(data['gamemode']) document.getElementById('opt-gamemode').value = data['gamemode'];
    if(data['difficulty']) document.getElementById('opt-difficulty').value = data['difficulty'];
    if(data['online-mode']) document.getElementById('opt-online').value = data['online-mode'];
});

document.getElementById('opt-ram').value = localStorage.getItem('serverRam') || '2048';

document.querySelector('.btn-save').addEventListener('click', () => {
    const ram = document.getElementById('opt-ram').value;
    if(ram) localStorage.setItem('serverRam', ram);

    const newOptions = {
        'max-players': document.getElementById('opt-slots').value,
        'gamemode': document.getElementById('opt-gamemode').value,
        'difficulty': document.getElementById('opt-difficulty').value,
        'online-mode': document.getElementById('opt-online').value
    };
    socket.emit('save_options', newOptions);
    alert('✅ Options tersimpan di server.properties! (Restart server untuk menerapkan efeknya)');
});

// --- REAL FILE MANAGER LOGIC ---
let currentDirPath = ''; 
const fileContainer = document.getElementById('fileContainer');
const pathText = document.getElementById('currentPathText');
const btnUp = document.getElementById('btnUpFolder');

function loadFiles(pathDir) {
    currentDirPath = pathDir;
    pathText.innerText = '/minecraft/' + currentDirPath;
    btnUp.style.display = currentDirPath === '' ? 'none' : 'inline-block';
    socket.emit('request_files', currentDirPath);
}

btnUp.addEventListener('click', () => {
    const parts = currentDirPath.split('/');
    parts.pop();
    loadFiles(parts.join('/'));
});

socket.on('receive_files', (data) => {
    fileContainer.innerHTML = '';
    if (data.items.length === 0) {
        fileContainer.innerHTML = '<p style="color:#666;">Folder kosong...</p>';
        return;
    }
    
    data.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        let sizeText = '';
        if(!item.isDir) {
            sizeText = item.size > 1048576 ? (item.size/1048576).toFixed(1) + ' MB' : (item.size/1024).toFixed(1) + ' KB';
        }

        div.innerHTML = `<span>${item.isDir ? '📁' : '📄'} ${item.name}</span><span>${item.isDir ? 'Folder' : sizeText}</span>`;
        
        if (item.isDir) {
            div.classList.add('clickable');
            div.onclick = () => loadFiles(currentDirPath === '' ? item.name : currentDirPath + '/' + item.name);
        }
        fileContainer.appendChild(div);
    });
});

// --- SERVER CONTROLS & TERMINAL ---
socket.on('connect', () => { statusText.textContent = 'Online (Standby)'; statusText.className = 'status-online'; });
socket.on('disconnect', () => { statusText.textContent = 'Offline'; statusText.className = 'status-offline'; });

socket.on('log', (data) => {
    terminal.textContent += data;
    terminal.scrollTop = terminal.scrollHeight;
});

socket.on('stats', (data) => document.getElementById('ramUsage').innerText = data.ram);

document.getElementById('startBtn').addEventListener('click', () => {
    socket.emit('start_server', localStorage.getItem('serverRam') || '2048');
});
document.getElementById('stopBtn').addEventListener('click', () => socket.emit('stop_server'));
document.getElementById('restartBtn').addEventListener('click', () => {
    socket.emit('send_command', 'stop');
    setTimeout(() => socket.emit('start_server', localStorage.getItem('serverRam') || '2048'), 5000);
});

document.getElementById('commandForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('cmdInput');
    if (input.value.trim()) {
        socket.emit('send_command', input.value.trim());
        input.value = '';
    }
});