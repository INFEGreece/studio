# INFE Greece Eurovision Poll 2026 - Plesk & GitHub Guide

This app is optimized for **Static Hosting** on your **Plesk** server. Since you have Node.js on Plesk, you have two easy ways to get your site live.

## 🚀 Option 1: Using GitHub Actions (Easiest)
GitHub will build the files for you so you don't have to do anything technical.

1. **Push Changes**: Push your latest code to GitHub.
2. **Go to GitHub Actions**: Click the **"Actions"** tab in your repository.
3. **Download the Build**:
   - Click on the **"Build Static Site"** workflow.
   - Once it shows a green checkmark, scroll down to **"Artifacts"**.
   - Click **"out-folder"** to download the zip.
4. **Upload to Plesk**:
   - Extract the zip on your computer.
   - Upload all files from the `out` folder directly into your Plesk `httpdocs`.

## 🛠️ Option 2: Using Node.js on Plesk
If you prefer to build directly on your server:

1. **Upload Code**: Upload all your project files to your Plesk `httpdocs` folder.
2. **Open Node.js**: In Plesk, click on the **"Node.js"** icon for your domain.
3. **Install Dependencies**: Click the **"NPM Install"** button in the Plesk UI.
4. **Build the Site**: 
   - Look for the "Run script" option or use the terminal in Plesk.
   - Run: `npm run build`
5. **Set Document Root**: Ensure your domain's "Document Root" in Plesk points to the **`out`** folder created by the build.

## ✨ Features
- **Alphabetical Sorting**: All countries are sorted A-Z automatically.
- **Official Branding**: Features the official INFE Greece logo and theme.
- **Real-time Stats**: Connects to your Firebase project for live scores.
