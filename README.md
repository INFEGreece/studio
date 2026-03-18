
# INFE Greece Eurovision Poll 2026 - Plesk Guide

This app is optimized for **Static Hosting** so you can host it for free on your existing **Plesk** server.

## 🚀 How to get your HTML files (The "out" folder)

If you don't see the Terminal at the bottom of your screen, follow these steps:

1.  **Find the Terminal**: 
    - Look at the **very bottom edge** of this window. 
    - If there is a thin grey bar at the bottom, **click and drag it upwards** with your mouse to reveal the bottom panel.
    - Click the tab labeled **"Terminal"**. 
    - If you still don't see it, look for a small icon that looks like this: `>_` at the bottom left or right of the screen.
2.  **Run the Build Command**: 
    - Click inside the black Terminal box.
    - Type exactly: `npm run build`
    - Press the **Enter** key on your keyboard.
3.  **Download the "out" folder**: 
    - After about 60 seconds, a new folder named **`out`** will appear in the file list on the **left side** of this editor.
    - Right-click the **`out`** folder and select **"Download"**.
4.  **Upload to Plesk**: 
    - Log in to your Plesk panel.
    - Go to **File Manager** -> `httpdocs`.
    - Upload the **contents** of your downloaded `out` folder into `httpdocs`.

## ✨ Features
- **100% Free**: No Google billing account or credit card required.
- **Alphabetical Sorting**: Countries are sorted A-Z automatically.
- **Official Branding**: Official INFE Greece logo and colors.

## 🛠 Admin Setup
1. Sign in to your site once it's live.
2. Copy your **User UID** from the profile menu.
3. In your **Firebase Console**, create a collection named `roles_admin`.
4. Add a document with your UID as the ID and the field `role: "admin"`.
5. You can then access `/admin` to manage entries.

*Note: AI features are disabled in this version to ensure the app remains 100% free and static.*
