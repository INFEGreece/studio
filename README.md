# INFE Greece Eurovision Poll 2026 - Plesk & GitHub Guide

This app is now fully optimized for **Static Hosting** on your **Plesk** server without needing a Google billing account or Node.js installed on your computer.

## 🚀 How to get your HTML files (via GitHub)
Since you have deployed this code to GitHub, follow these simple steps:

1. **Push Changes**: Push the latest code to your GitHub `main` branch.
2. **Go to GitHub Actions**: 
   - Open your repository on GitHub.com.
   - Click the **"Actions"** tab at the top.
3. **Download the Build**:
   - You will see a workflow named **"Build Static Site"**.
   - Once it finishes (shows a green checkmark), click on it.
   - Scroll down to the **"Artifacts"** section.
   - Click **"out-folder"** to download the zip file.
4. **Upload to Plesk**:
   - Extract the downloaded zip file on your computer.
   - Log in to your **Plesk** panel.
   - Go to **File Manager** -> `httpdocs`.
   - Upload all files and folders from the extracted zip directly into `httpdocs`.

## ✨ Features
- **100% Free**: No monthly hosting fees or credit cards required.
- **Alphabetical Sorting**: Countries are automatically sorted A-Z for easy voting.
- **Official Branding**: Features official INFE Greece logo and colors.
- **Real-time Stats**: Scoreboard updates instantly using your Firebase project.

## ⚠️ AI Features Note
To keep this app 100% free and compatible with Plesk, the "AI Feedback Suggestions" have been disabled as they require a paid server.
