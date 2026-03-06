const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] } // Di tahap produksi, ganti "*" dengan URL Vercel-mu
});

let minecraftProcess = null;
const MINECRAFT_DIR = path.join(__dirname, 'minecraft');
const JAR_FILE = 'server.jar'; // Pastikan nama file jar-mu benar

io.on('connection', (socket) => {
    console.log('Web Panel Terhubung!');
    socket.emit('log', 'Terhubung ke Easy Local Server Backend.\n');

    // Menyalakan Server
    socket.on('start_server', () => {
        if (minecraftProcess) {
            socket.emit('log', 'Server sudah berjalan!\n');
            return;
        }

        socket.emit('log', 'Memulai Minecraft Server...\n');
        // Pastikan RAM sesuai kebutuhanmu (misal -Xmx2G)
        minecraftProcess = spawn('java', ['-Xmx2G', '-Xms2G', '-jar', JAR_FILE, 'nogui'], { cwd: MINECRAFT_DIR });

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

    // Menerima command dari Web (misal: /say Halo)
    socket.on('send_command', (cmd) => {
        if (minecraftProcess) {
            minecraftProcess.stdin.write(cmd + '\n');
            io.emit('log', `> ${cmd}\n`);
        } else {
            socket.emit('log', 'Gagal: Server belum menyala.\n');
        }
    });

    // Menghentikan Server dengan aman
    socket.on('stop_server', () => {
        if (minecraftProcess) {
            minecraftProcess.stdin.write('stop\n');
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Backend berjalan di port ${PORT}`);
    console.log(`Gunakan Ngrok: ngrok http ${PORT}`);
});