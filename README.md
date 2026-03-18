
# INFE Greece Eurovision Poll 2026 - Plesk Guide

This app is optimized for **Static Hosting** so you can host it for free on **Plesk** without needing a Google billing account.

## 🚀 How to get your HTML files for Plesk

1. **Open the Terminal**: Click the "Terminal" tab at the bottom of this editor window.
2. **Run the Build**: Type the following command and press Enter:
   ```bash
   npm run build
   ```
3. **Locate the Output**: Once the build finishes, a folder named `out` will appear in your project files on the left.
4. **Download**: Right-click the `out` folder and select "Download" (or download the files inside it).
5. **Upload to Plesk**: 
   - Log in to your Plesk panel.
   - Go to **File Manager**.
   - Navigate to the `httpdocs` folder of `infepoll.infegreece.com`.
   - Upload all the contents of the `out` folder directly into `httpdocs`.

## ✨ Features
- **Alphabetical Sorting**: Countries are sorted automatically by name.
- **Dynamic Scoreboard**: Real-time results powered by Firebase.
- **Flag Fallbacks**: National flags are used automatically if no artist photo is uploaded.
- **Branding**: Official INFE Greece logo used throughout the site.

## 🛠 Admin Setup
1. Sign in to your site.
2. Go to your **Firebase Console** > **Authentication** and find your **User UID**.
3. Go to **Firestore Database** > Create a collection named `roles_admin`.
4. Add a document:
   - **ID**: Paste your User UID here.
   - **Fields**: Any field (e.g., `role: "admin"`).
5. You can now access the `/admin` page on your site to manage entries.

*Note: AI suggestions are disabled in the static version to remain 100% free and serverless.*
