
# INFE Greece Eurovision Poll 2026 (Free Spark Plan Version)

This version is optimized for the **Firebase Spark Plan ($0/month)**. It does not require a billing account or credit card.

## 🚀 How to Deploy for FREE

To avoid the Blaze plan requirement, we use **Classic Firebase Hosting** with a Static Export.

### 1. Install Firebase Tools
Open your terminal and run:
`npm install -g firebase-tools`

### 2. Login and Initialize
1. Run `firebase login` and follow the browser instructions.
2. Run `firebase init hosting`.
3. Choose **"Use an existing project"** and select your project.
4. Set the public directory to `out`.
5. Configure as a single-page app? **Yes**.
6. Set up automatic builds/deploys with GitHub? **Optional (recommended)**.

### 3. Build and Deploy
Run these commands every time you want to update your site:
1. `npm run build`
2. `firebase deploy`

### 4. Connect Your Custom Domain
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select **Hosting** from the left menu.
3. Click **Add Custom Domain**.
4. Enter `infepoll.infegreece.com`.
5. Add the provided DNS records to your domain provider.

## 🛠 Admin Setup
1. Sign in to your app (at `infepoll.infegreece.com/admin`).
2. Go to Firebase Console > Firestore Database.
3. Create a collection `roles_admin`.
4. Create a document where the **ID** is your **User UID**.
5. Add a field `role: "admin"`.

## ✨ Features
- **$0 Cost**: Runs entirely on the free Spark tier.
- **Static Export**: Fast loading and secure.
- **Alphabetical Sorting**: Countries sorted by name automatically.
- **Flag Fallbacks**: Flags show automatically if no photo is uploaded.
