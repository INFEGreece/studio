
# INFE Greece Eurovision Poll 2026 - Plesk Guide

This app is optimized for **Static Hosting** so you can host it for free on **Plesk** without needing a Google billing account.

## 🚀 How to get your HTML files for Plesk

1.  **Locate the Terminal**: Look at the very bottom of this screen. You will see a tab labeled **"Terminal"**. Click it to open the black command box.
2.  **Run the Build**: Inside that black box, type the following command exactly and press **Enter**:
    ```bash
    npm run build
    ```
3.  **Find the Output**: Wait about 1-2 minutes. When it finishes, a new folder named **`out`** will appear in the file list on the left side of this editor.
4.  **Download**: Right-click the `out` folder and select "Download" (or zip and download the files inside).
5.  **Upload to Plesk**: 
    - Log in to your **Plesk** panel.
    - Go to **File Manager**.
    - Open the `httpdocs` folder of your domain `infepoll.infegreece.com`.
    - Upload all the contents of the `out` folder directly into `httpdocs`.

## ✨ Features
- **Alphabetical Sorting**: Countries are sorted automatically by name (A-Z).
- **Dynamic Scoreboard**: Real-time results powered by Firebase Firestore.
- **Flag Fallbacks**: National flags are used automatically if no artist photo is available.
- **Branding**: Official INFE Greece logo used throughout the site.

## 🛠 Admin Setup
1. Sign in to your site using the "Sign In" button.
2. Go to your **Firebase Console** > **Authentication** and copy your **User UID**.
3. Go to **Firestore Database** > Create a collection named `roles_admin`.
4. Add a document:
   - **Document ID**: Paste your User UID here.
   - **Fields**: Add any field (e.g., `role: "admin"`).
5. You can now access the `/admin` page on your site to manage entries.

*Note: AI features are disabled in this static version to ensure it remains 100% free and requires no server-side billing.*
