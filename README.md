
# INFE Greece Eurovision Poll 2026

The official fan poll for INFE Greece. This app is designed to run on **Firebase App Hosting** to support dynamic features like real-time voting and AI-powered feedback suggestions.

## 🚀 Deployment Guide (Custom Domain)

To get your app live on **infepoll.infegreece.com**:

1. **GitHub Connection**:
   - Push this code to a GitHub repository.
   - Go to the **Firebase Console** > **App Hosting**.
   - Click "Get Started" and connect your GitHub repo.

2. **Pricing Plan**:
   - App Hosting requires the **Blaze (Pay-as-you-go) Plan**. 
   - **Important**: You still have a generous free tier. For a fan poll, you will likely pay **$0.00/month** unless you have extreme traffic.

3. **Custom Domain**:
   - Once the app is deployed, go to the **App Hosting** dashboard.
   - Click the **Settings** tab > **Custom Domains**.
   - Enter `infepoll.infegreece.com`.
   - Add the provided DNS records to your domain provider (where you manage `infegreece.com`).

## 🛠 Admin Setup
1. Sign in to your site at `infepoll.infegreece.com`.
2. Go to your **Firebase Console** > **Authentication** and find your **User UID**.
3. Go to **Firestore Database** > Create a collection named `roles_admin`.
4. Add a document:
   - **ID**: Paste your User UID here.
   - **Fields**: Any field (e.g., `role: "admin"`).
5. You can now access the `/admin` page to manage entries.

## ✨ Features
- **AI Feedback**: Users can click "Suggest with AI" while voting to get descriptive reasons for their score.
- **Alphabetical Sorting**: Countries are sorted automatically by name.
- **Dynamic Scoreboard**: Real-time results with interactive charts.
- **Flag Fallbacks**: National flags are used automatically if no artist photo is uploaded.
