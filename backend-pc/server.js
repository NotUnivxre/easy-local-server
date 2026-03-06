const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer'); // Tambahan Modul Multer

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

let minecraftProcess = null;
const MINECRAFT_DIR = path.join(__dirname, 'minecraft');
const JAR_FILE = 'server.jar'; 

// --- KONFIGURASI KURIR UPLOAD (MULTER) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Membaca path folder tujuan dari request web
        const safePath = (req.body.targetPath || '').replace(/\.\./g, '');
        const targetDir = path.join(MINECRAFT_DIR, safePath);
        // Buat foldernya kalau belum ada
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Gunakan nama file asli
    }
});
const upload = multer({ storage: storage });

// API Endpoint untuk menerima upload file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload gagal.' });
    res.json({ success: true, message: `File ${req.file.originalname} sukses diupload!` });
});

io.on('connection', (socket) => {
    socket.emit('log', 'Terhubung ke Easy Local Server Backend.\n');

    // MENGIRIM RAM STATS
    setInterval(() => {
        const total = os.totalmem();
        const free = os.freemem();
        socket.emit('stats', { ram: `${((total - free) / 1024 / 1024 / 1024).toFixed(1)} GB / ${(total / 1024 / 1024 / 1024).toFixed(1)} GB` });
    }, 3000);

    // MENGAMBIL & MENYIMPAN DATA SERVER.PROPERTIES
    const propsPath = path.join(MINECRAFT_DIR, 'server.properties');
    socket.on('get_options', () => {
        if (fs.existsSync(propsPath)) {
            const content = fs.readFileSync(propsPath, 'utf8');
            const options = {};
            content.split('\n').forEach(line => {
                if (line.includes('=') && !line.startsWith('#')) {
                    const [key, val] = line.split('=');
                    options[key.trim()] = val.trim();
                }
            });
            socket.emit('options_data', options);
        }
    });

    socket.on('save_options', (newOptions) => {
        if (fs.existsSync(propsPath)) {
            let content = fs.readFileSync(propsPath, 'utf8');
            for (const [key, val] of Object.entries(newOptions)) {
                const regex = new RegExp(`^${key}=.*$`, 'm');
                if (regex.test(content)) content = content.replace(regex, `${key}=${val}`);
                else content += `\n${key}=${val}`;
            }
            fs.writeFileSync(propsPath, content, 'utf8');
            socket.emit('log', 'INFO: server.properties berhasil diperbarui!\n');
        }
    });

    // SISTEM BACA FILE MANAGER
    socket.on('request_files', (currentPath) => {
        const safePath = currentPath.replace(/\.\./g, '');
        const targetDir = path.join(MINECRAFT_DIR, safePath);
        if (fs.existsSync(targetDir)) {
            try {
                const files = fs.readdirSync(targetDir, { withFileTypes: true });
                const items = files.map(file => {
                    let size = 0;
                    if (!file.isDirectory()) {
                        try { size = fs.statSync(path.join(targetDir, file.name)).size; } catch(e) {}
                    }
                    return { name: file.name, isDir: file.isDirectory(), size: size };
                }).sort((a, b) => b.isDir - a.isDir || a.name.localeCompare(b.name));
                socket.emit('receive_files', { currentPath: safePath, items });
            } catch (err) {}
        }
    });

    // KONTROL SERVER
    socket.on('start_server', (ramMb) => {
        if (minecraftProcess) return socket.emit('log', 'Server sudah berjalan!\n');
        const ram = ramMb ? ramMb : 2048; 
        socket.emit('log', `Memulai Minecraft Server dengan RAM ${ram} MB...\n`);
        
        minecraftProcess = spawn('java', [`-Xmx${ram}M`, `-Xms${ram}M`, '-jar', JAR_FILE, 'nogui'], { cwd: MINECRAFT_DIR });
        minecraftProcess.stdout.on('data', (data) => io.emit('log', data.toString()));
        minecraftProcess.stderr.on('data', (data) => io.emit('log', `ERROR: ${data.toString()}`));
        minecraftProcess.on('close', (code) => {
            io.emit('log', `Server berhenti.\n`);
            minecraftProcess = null;
        });
    });

    socket.on('send_command', (cmd) => {
        if (minecraftProcess) { minecraftProcess.stdin.write(cmd + '\n'); io.emit('log', `> ${cmd}\n`); }
    });
    socket.on('stop_server', () => {
        if (minecraftProcess) minecraftProcess.stdin.write('stop\n');
    });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Backend siap di port ${PORT}`));