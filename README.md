# INFE Greece Eurovision Poll 2026 - Plesk Guide

This application is optimized for **Static Export**, which is the best way to host on your **Plesk** server for free.

## 🚨 CRITICAL: DELETE PLESK DEFAULT FILES FIRST
Before uploading your app, you **MUST** delete the default files Plesk put in your folder, otherwise, you will see the "Plesk Success" page instead of your app.
1. Open your Plesk File Manager for the subdomain.
2. Delete `default.php`, `index.php`, or any existing `index.html`.
3. **Empty the `httpdocs` folder completely** before uploading your new files.

## 🚀 HOW TO GET YOUR FILES (GitHub Actions)
If you see the error `Error: kill EPERM` on Plesk, it means your server is blocking the build. **GitHub will build the files for you instead.**

1. **Push Changes**: Push your latest code to GitHub.
2. **Go to GitHub**: Open your repository on GitHub.com.
3. **Download Build**:
   - Click the **"Actions"** tab.
   - Click on the latest run (usually called "Build Static Site").
   - Scroll down to the **"Artifacts"** section.
   - Click **"out-folder"** to download the zip file.
4. **Upload to Plesk**: 
   - Extract that zip file.
   - Upload all the files inside (index.html, _next folder, etc.) directly into your `httpdocs` folder.

## 🔐 HOW TO LOG IN (Your Credentials)
The app does not come with "pre-set" passwords. You create your own:
1. Open your website.
2. Click **"Sign In"** in the top right.
3. Click the blue **"Create One"** link at the bottom of the popup.
4. Enter your email and a new password. This is now your login data.

## 👑 HOW TO BECOME AN ADMIN
To see the Management page and add songs, you must manually give yourself permission in the Firebase Console:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Authentication** and find the **User UID** for your email (e.g., `abc123xyz...`).
3. Click **Firestore Database** in the left menu.
4. Create a new collection called `roles_admin`.
5. Add a document where the **Document ID** is exactly your **User UID**.
6. You don't need any fields inside; just having the ID there makes you an Admin.

## 🛠️ FIREBASE CONSOLE CHECKLIST
Ensure your login works on your subdomain:
1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized Domains**.
2. Click "Add Domain" and type your subdomain (e.g., `infepoll.infegreece.com`).
3. Under **Authentication** > **Sign-in method**, ensure "Email/Password" is **Enabled**.

---
Created by INFE Greece. Celebrating 70 years of Eurovision history.
