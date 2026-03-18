
# INFE Greece Eurovision Poll 2026 - Plesk & GitHub Guide

This app is now fully optimized for **Static Hosting**. You can host it for free on your **Plesk** server without a Google billing account.

## 🚀 Deployment to Plesk (via GitHub)
If you have deployed this code to GitHub, follow these steps to get your HTML files:

1. **Build Locally**: 
   - Open your computer's terminal (Command Prompt or PowerShell on Windows, Terminal on Mac).
   - Type `npm install` and then `npm run build`.
   - A folder named **`out`** will be created.
2. **Upload to Plesk**:
   - Log in to your Plesk panel.
   - Go to **File Manager** -> `httpdocs`.
   - Upload all files and folders inside your local **`out`** folder to `httpdocs`.

## ✨ Features
- **Alphabetical Sorting**: Countries are automatically sorted A-Z.
- **Official Branding**: Official INFE Greece logo and colors.
- **Static Export**: 100% serverless, meaning no monthly hosting fees.
- **Real-time Stats**: Scoreboard updates instantly using Firebase.

## ⚠️ Note on AI Features
To keep this app 100% free and compatible with Plesk, the "AI Feedback Suggestions" have been disabled as they require a paid Google Cloud server.
