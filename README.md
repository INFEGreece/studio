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

## 🔐 GOOGLE SIGN-IN SETUP
To use the "Continue with Google" button on your site:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication** > **Sign-in method**.
3. Click **"Add new provider"** and select **Google**. Enable it and save.
4. Go to **Authentication** > **Settings** > **Authorized Domains**.
5. Click **"Add Domain"** and enter your subdomain (e.g., `infepoll.infegreece.com`). **Without this, Google login will fail.**

## 👑 HOW TO BECOME AN ADMIN
To see the Management page and add songs:
1. Log in to your website (using Google or Email).
2. Go to the [Firebase Console](https://console.firebase.google.com/).
3. Click **Authentication** and find the **User UID** for your account (e.g., `abc123xyz...`).
4. Click **Firestore Database** in the left menu.
5. Create a new collection called `roles_admin`.
6. Add a document where the **Document ID** is exactly your **User UID**.
7. You don't need any fields inside; just having the ID there makes you an Admin.

---
Created by INFE Greece. Celebrating 70 years of Eurovision history.
