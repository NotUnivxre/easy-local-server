const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const os = require('os'); // Modul bawaan Node.js untuk mengecek RAM

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let minecraftProcess = null;
const MINECRAFT_DIR = path.join(__dirname, 'minecraft');
const JAR_FILE = 'server.jar'; 

io.on('connection', (socket) => {
    console.log('Web Panel Terhubung!');
    socket.emit('log', 'Terhubung ke Easy Local Server Backend.\n');

    // --- MENGIRIM STATISTIK RAM PC KE WEB (Setiap 3 Detik) ---
    setInterval(() => {
        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const usedRam = totalRam - freeRam;
        
        socket.emit('stats', {
            ram: `${(usedRam / 1024 / 1024 / 1024).toFixed(1)} GB / ${(totalRam / 1024 / 1024 / 1024).toFixed(1)} GB`
        });
    }, 3000);

    // --- MENYALAKAN SERVER ---
    // Menerima parameter ramMb dari web panel
    socket.on('start_server', (ramMb) => {
        if (minecraftProcess) {
            socket.emit('log', 'Server sudah berjalan!\n');
            return;
        }

        const ram = ramMb ? ramMb : 2048; // Fallback ke 2GB kalau kosong
        
        socket.emit('log', `Memulai Minecraft Server dengan RAM ${ram} MB...\n`);
        
        // Memasukkan alokasi RAM yang diminta ke argumen Java
        minecraftProcess = spawn('java', [`-Xmx${ram}M`, `-Xms${ram}M`, '-jar', JAR_FILE, 'nogui'], { cwd: MINECRAFT_DIR });

        minecraftProcess.stdout.on('data', (data) => {
            io.emit('log', data.toString());
        });

        minecraftProcess.stderr.on('data', (data) => {
            io.emit('log', `ERROR: ${data.toString()}`);
        });

        minecraftProcess.on('close', (code) => {
            io.emit('log', `Server berhenti dengan kode ${code}.\n`);
            minecraftProcess = null;
        });
    });

    // --- MENGIRIM COMMAND ---
    socket.on('send_command', (cmd) => {
        if (minecraftProcess) {
            minecraftProcess.stdin.write(cmd + '\n');
            io.emit('log', `> ${cmd}\n`);
        } else {
            socket.emit('log', 'Gagal: Server belum menyala.\n');
        }
    });

    // --- MENGHENTIKAN SERVER ---
    socket.on('stop_server', () => {
        if (minecraftProcess) {
            minecraftProcess.stdin.write('stop\n');
        } else {
            socket.emit('log', 'Server sudah dalam keadaan mati.\n');
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Backend berjalan di port ${PORT}`);
    console.log(`Gunakan Ngrok: ngrok http ${PORT}`);
});