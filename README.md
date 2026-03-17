# INFE Greece Eurovision Poll 2026

The official Eurovision fan poll application for INFE Greece, celebrating 70 years of contest history.

## 🚀 Deployment Guide (How to go live)

To host this app at `infepoll.infegreece.com`, follow these steps carefully:

### 1. The "Blaze Plan" Requirement
To use **App Hosting** (which runs this Next.js app), Firebase requires you to switch your project to the **Blaze Plan (Pay-as-you-go)**. 
*   **Will it cost money?** For a fan poll, you will likely stay within the **Google Cloud Free Tier**, resulting in a **$0.00 monthly bill**. 
*   **Why is it needed?** Next.js requires a small server to handle your AI features and secure voting.

### 2. Connect to GitHub
1. Push this code to a new repository on your GitHub account.
2. Go to the [Firebase Console](https://console.firebase.google.com/).
3. Select your project and upgrade to **Blaze** (it will ask for a billing method but won't charge you for low usage).
4. In the left menu, click **App Hosting**.
5. Click **Get Started** and connect your GitHub repository.

### 3. Connect Your Custom Domain
Once the first deployment finishes:
1. In the **App Hosting** dashboard, click on your backend.
2. Go to the **Settings** tab.
3. Click **Connect Custom Domain**.
4. Enter `infepoll.infegreece.com`.
5. Firebase will show you **DNS Records** (Type A or CNAME).
6. Log in to your domain provider (e.g., GoDaddy, Namecheap) and add these records to your DNS settings for `infegreece.com`.

### 4. How to Embed in your Main Site
If you want to show the poll inside a page on your main WordPress or HTML site, use this code:
```html
<iframe 
  src="https://infepoll.infegreece.com" 
  width="100%" 
  height="900px" 
  style="border:none; border-radius: 12px; overflow: hidden;"
></iframe>
```

## 🛠 Admin Setup
To manage entries:
1. Sign in to the app (at `infepoll.infegreece.com/admin`).
2. Go to the Firebase Console > **Firestore Database**.
3. Create a collection named `roles_admin`.
4. Create a document where the **Document ID** is your **User UID** (found in the Authentication tab).
5. Add a field `role: "admin"` to that document.

## ✨ Features
- **Alphabetical Sorting**: All countries are automatically sorted by name.
- **Automatic Flags**: Flags are used as thumbnails if no artist photo is uploaded.
- **AI Insights**: Voters get AI-generated reasons for their scores.
- **Secure Voting**: Prevents duplicate points (12, 10, 8...) in the same year.
