# 🎮 Easy Local Server (Minecraft Web Panel)

**Easy Local Server** is a lightweight, local Minecraft server manager equipped with a remote Web Dashboard. 

Built with Node.js and Socket.io, this tool allows you to host a server directly from your own PC, but control it entirely (Start, Stop, Console access, Properties config, and File Management) through a web browser from anywhere (like your phone or another laptop) in real-time!

## ✨ Key Features
- 🖥️ **Remote Web Dashboard:** Clean, dark-themed UI with seamless tab navigation.
- 📟 **Real-time Console:** Read server logs and send commands (op, say, etc.) directly from the web.
- ⚙️ **Visual Options Editor:** Tweak your `server.properties` (RAM, Slots, Gamemode, Difficulty, Cracked/Premium) via a web interface without manually opening text files.
- 📁 **Live File Manager:** Navigate your Minecraft directories, featuring **Upload (Click & Drag-and-Drop)** for easily adding plugins, worlds, or mods.
- 📊 **Resource Monitor:** Live tracking of your PC's RAM usage.
- 🌐 **Playit.gg Integration:** Dedicated field to save and display your public server IP.

---

## 🛠️ Requirements
Before using this tool, make sure your PC has the following installed:
1. **Node.js** (Version 16 or newer)
2. **Java** (Version 17, 21, or 25, depending on your target Minecraft version)
3. **Git** (To deploy the UI to Vercel/GitHub Pages)
4. An **Ngrok** account (For Web Panel tunneling)
5. **Playit.gg** app (For Game Server tunneling so your friends can join)

---

## 🚀 First-Time Installation & Setup

### 1. Backend Setup (Your PC)
1. Clone or download this repository.
2. Open your terminal/CMD, and navigate to the `backend-pc` folder.
3. Install the required dependencies by running:
   ```bash
   npm install express socket.io cors multer
   ```
4. Create a new folder named `minecraft` inside the `backend-pc` directory.
5. Place your `server.jar` file (PaperMC, Spigot, or Vanilla) inside the newly created `minecraft` folder.

### 2. Connect Ngrok
1. Open a new terminal window and run Ngrok on port 3001:
   ```bash
   ngrok http 3001
   ```
2. Copy the forwarding link (e.g., `https://xxxx.ngrok-free.app`).

### 3. Frontend Setup (Web Panel)
1. Open the `frontend-web/script.js` file.
2. Find the top line: `const BACKEND_URL = '...';`
3. Replace the placeholder URL with your active Ngrok link.
4. Save the file, then host/deploy the `frontend-web` folder to a static hosting service like Vercel or GitHub Pages.

---

## 🕹️ Daily Usage (SOP)
Since the free version of Ngrok changes its link every time you restart your PC, follow this routine whenever you want to host a session:

1. **Start Backend:** Open a terminal in `backend-pc` and run `node server.js`.
2. **Start Ngrok:** Open a new terminal and run `ngrok http 3001`.
3. **Update Web Link:** Copy the new Ngrok link -> Paste it into `script.js` -> Push/Update to Vercel.
4. **Open the Gate:** Run the Playit.gg app on your PC.
5. **Start the Server:** Open your Vercel web link, allocate RAM in the Options tab (if needed), and click **Start**.
6. **Done!** Share your Playit.gg IP with your friends, and manage the server from your phone while chilling.

---

## 📂 Folder Structure
* `/backend-pc` : The core Node.js engine (`server.js`) and the environment where the Minecraft server runs.
* `/backend-pc/minecraft` : The directory where your `server.jar`, worlds, plugins, etc., are stored.
* `/frontend-web` : The Web Dashboard UI (HTML, CSS, JS) meant to be hosted on Vercel.
