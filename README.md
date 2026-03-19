# INFE Greece Eurovision Poll 2026 - Plesk Guide

This application is optimized for **Static Export**, which is the best way to host on your **Plesk** server for free.

## 🚀 WHERE TO PUSH TO GITHUB
1. Look at the bottom-left or bottom-right of your **Firebase Studio** editor.
2. Click the button that says **"Push"** or **"Sync"**.
3. This sends your code to your GitHub repository automatically.

## 📦 HOW TO GET YOUR FILES (GitHub Actions)
Once you have pushed your code:
1. Open your repository on **GitHub.com**.
2. Click the **"Actions"** tab at the top.
3. Click on the latest run (usually called "Build Static Site").
4. Scroll down to the **"Artifacts"** section at the bottom.
5. Click **"out-folder"** to download the zip file.
6. **Upload to Plesk**: Extract that zip and upload all the files inside directly into your `httpdocs` folder.

## 🔐 GOOGLE SIGN-IN SETUP
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication** > **Sign-in method**.
3. Enable **Google**.
4. **CRITICAL**: Go to **Authentication** > **Settings** > **Authorized Domains**.
5. Click **"Add Domain"** and enter your subdomain (e.g., `infepoll.infegreece.com`). **Google login will fail without this.**

## 👑 HOW TO BECOME AN ADMIN
1. Log in to your website.
2. Go to the **Management** page. It will show you your **User UID** (e.g., `abc123xyz...`).
3. **Copy your UID**.
4. In Firebase Console, go to **Firestore Database**.
5. Create a collection called `roles_admin`.
6. Add a document where the **Document ID** is your **UID**. Leave it empty. You are now an Admin!

## 🚨 PLESK CLEANUP
Before uploading, delete `default.php`, `index.php`, or any existing `index.html` that Plesk created automatically.
