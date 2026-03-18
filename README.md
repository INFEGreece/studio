# INFE Greece Eurovision Poll 2026 - Plesk Guide

This application is optimized for **Static Export**, which is the only way to host it for free on your **Plesk** server without a billing account.

## 🚀 THE ONLY WORKING METHOD FOR PLESK (GitHub Actions)
If you see the error `Error: kill EPERM` on Plesk, it means your server is blocking the build. **GitHub will build the files for you instead.**

1. **Push Changes**: Push your latest code to GitHub.
2. **Go to GitHub**: Open your repository on GitHub.com in your browser.
3. **Download Build**:
   - Click the **"Actions"** tab at the top of GitHub.
   - Click on the latest run (usually called "Build Static Site").
   - Scroll down to the **"Artifacts"** section at the very bottom.
   - Click **"out-folder"** to download the zip file.
4. **Upload to Plesk**: 
   - Extract that zip file on your computer.
   - Open Plesk File Manager.
   - Upload all the files inside the zip directly into your `httpdocs` folder.

## 🛠️ ALTERNATIVE: Using Plesk Git Tool
Only use this if your server allows background processes.

1. **Add Repository**: In Plesk, click the **"Git"** icon and paste your GitHub URL.
2. **Pull Code**: Click "Pull" to bring your code into Plesk.
3. **Open Node.js**: Click the **"Node.js"** icon in Plesk.
4. **Install**: Click **"NPM Install"**.
5. **Build**: Click "Run script" and run: `build`
6. **Set Root**: Change your domain's "Document Root" to `httpdocs/out`.

## ✨ Features
- **Alphabetical Sorting**: All countries are sorted A-Z automatically.
- **Static Export Ready**: No expensive server required.
- **Firebase Integration**: Real-time voting data.

---
Created by INFE Greece. Celebrating 70 years of Eurovision history.