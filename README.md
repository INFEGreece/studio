# INFE Greece Eurovision Poll 2026 - Plesk Git & Node.js Guide

This application is configured for **Static Export**, making it ideal for hosting on your **Plesk** server using either GitHub Actions or the Plesk Git Tool.

## 🚀 Option 1: Using GitHub Actions (Easiest & Most Reliable)
If your Plesk server gives you "EPERM" or "Permission" errors during build, use this method. GitHub builds the files for you so your server doesn't have to.

1. **Push Changes**: Push your latest code to GitHub.
2. **Download Build**:
   - Go to the **"Actions"** tab in your GitHub repository.
   - Click the latest "Build Static Site" workflow run.
   - Scroll down to the **"Artifacts"** section.
   - Click and download the **"out-folder"** zip.
3. **Upload to Plesk**: Extract that zip on your computer. Upload all the files inside it directly to your Plesk `httpdocs` folder using the File Manager.

## 🛠️ Option 2: Using the Plesk Git Tool
Use this if your server allows running build scripts.

1. **Add Repository**: In Plesk, click the **"Git"** icon and paste your GitHub repository URL.
2. **Pull Code**: Click "Pull" to bring your code into the server.
3. **Open Node.js**: Click the **"Node.js"** icon in your Plesk domain dashboard.
4. **Install Dependencies**: Click the **"NPM Install"** button.
5. **Build the Site**: Click "Run script" and run: `build`
6. **Set Document Root**: 
   - Go to "Hosting Settings" for your domain.
   - Change the **Document Root** from `httpdocs` to `httpdocs/out`.

## 🛑 Troubleshooting: Error "kill EPERM"
If you see an error like `Error: kill EPERM` when running the build on Plesk, it means your hosting provider restricts process management. 
**Fix:** Switch to **Option 1 (GitHub Actions)**. It bypasses this server restriction entirely.

## ✨ Features
- **Alphabetical Sorting**: Countries are automatically sorted A-Z for a better user experience.
- **Static Compatibility**: No billing account required.
- **Firebase Integration**: Secure real-time voting and global scoreboard.

---
Created by INFE Greece. Celebrating 70 years of Eurovision history.
