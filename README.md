
# INFE Greece Eurovision Poll 2026 - Plesk Guide

This app is optimized for **Static Hosting** so you can host it for free on **Plesk** without needing a Google billing account or credit card.

## 🚀 How to get your HTML files for Plesk

1.  **Locate the Terminal**:
    - Look at the **very bottom** of this screen. 
    - You should see a panel with tabs like "Preview", "Console", "Output".
    - Look for the tab labeled **"Terminal"**. 
    - *If you don't see it*, look for a small icon that looks like this: `>_` or a `+` sign at the bottom right/left of the bottom panel. Clicking this will open the black command box.
2.  **Run the Build**: 
    - Once the Terminal (the black box) is open, click inside it so you can type.
    - Type the following command exactly and press your **Enter** key:
    ```bash
    npm run build
    ```
3.  **Find the Output**: 
    - Wait about 1-2 minutes for the process to finish.
    - Once it says "Export successful", look at the file explorer on the **left side** of this editor.
    - A new folder named **`out`** will appear. This folder contains your HTML files.
4.  **Download and Upload**: 
    - Right-click the **`out`** folder and select **"Download"**.
    - Unzip the files on your computer.
    - Log in to your **Plesk** panel.
    - Go to **File Manager** for `infepoll.infegreece.com`.
    - Open the `httpdocs` folder.
    - Upload **all files and folders** from inside your local `out` folder directly into `httpdocs`.

## ✨ Features
- **100% Free**: No Google billing account required.
- **Alphabetical Sorting**: Countries are sorted automatically (A-Z) on all pages.
- **Dynamic Scoreboard**: Real-time results powered by Firebase Firestore (works even in static mode).
- **Official Branding**: Official INFE Greece logo and colors used throughout.

## 🛠 Admin Setup
1. Sign in to your site using the "Sign In" button.
2. Go to your **Firebase Console** > **Authentication** and copy your **User UID**.
3. Go to **Firestore Database** > Create a collection named `roles_admin`.
4. Add a document:
   - **Document ID**: Paste your User UID here.
   - **Fields**: Add `role: "admin"`.
5. You can now access the `/admin` page to manage entries.

*Note: AI features are disabled in this static version to ensure it remains 100% free and requires no server-side billing.*
