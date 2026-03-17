
# INFE Greece Eurovision Poll 2026 (Free Static Version)

This version is optimized for **100% Free Hosting**. You can host it on your existing **Plesk** server or use the **Firebase Spark Plan ($0/mo)** without a credit card.

## 🚀 How to Build your Website (Do this first)
Before uploading to Plesk, you must turn the code into actual website files.

1. **Find the Terminal**: Look at the bottom of this editor window for a tab named **"Terminal"**.
2. **Run the build command**: Click inside that terminal, type the following, and press Enter:
   `npm run build`
3. **The Result**: A new folder named `out` will appear in your file list on the left. This folder contains your entire website.

---

## 📂 Option 1: Hosting on your Plesk (Recommended)
If you already have a Plesk server for `infegreece.com`:

1. Build the files using the instructions above.
2. Open your **Plesk File Manager**.
3. Go to the folder for your subdomain (e.g., `infepoll.infegreece.com`).
4. **Upload**: Drag and drop all the files and folders found **inside** the `out` folder directly into your server's root folder (usually `httpdocs`).
5. **Done**: Your poll is live on your server!

---

## 🔥 Option 2: Hosting on Firebase (Spark Plan)
If you prefer to use Firebase's free hosting:

1. In the terminal below, run: `firebase login` (follow the link in your browser).
2. Run: `firebase init hosting`.
   - Select your project.
   - For "public directory", type: `out`.
   - For "single-page app", choose: **Yes**.
3. Run: `firebase deploy`.

---

## 🛠 Admin Setup
1. Go to your live site at `infepoll.infegreece.com/admin`.
2. Sign in (or create an account).
3. To give yourself permission to manage entries:
   - Go to **Firebase Console** > **Firestore Database**.
   - Create a collection: `roles_admin`.
   - Create a document with **ID** set to your **User UID** (found in the Authentication tab after you sign in).
   - Add any field, e.g., `role: "admin"`.

## ✨ Features
- **$0 Cost**: No billing account or credit card required.
- **Alphabetical Sorting**: Countries sorted by name automatically everywhere.
- **Flag Fallbacks**: If you don't upload an artist photo, the country's flag is used automatically.
