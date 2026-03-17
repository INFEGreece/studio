# INFE Greece Eurovision Poll 2026

The official Eurovision fan poll application for INFE Greece, celebrating 70 years of contest history.

## 🚀 How to Add This to Your Website (Deployment)

To host this app at `infepoll.infegreece.com`, follow these steps:

### 1. Connect to GitHub
Firebase App Hosting works by watching a GitHub repository.
1. Push this code to a new repository on your GitHub account.
2. Go to the [Firebase Console](https://console.firebase.google.com/).
3. Select your project (ensure it is on the **Spark Plan**).
4. In the left menu, click **App Hosting**.
5. Click **Get Started** and connect your GitHub repository.

### 2. Connect Your Custom Domain
Once the app is deployed for the first time:
1. In the **App Hosting** dashboard, click on your backend.
2. Go to the **Settings** tab.
3. Click **Connect Custom Domain**.
4. Enter `infepoll.infegreece.com`.
5. Firebase will provide **DNS Records** (A or CNAME). 
6. Log in to your domain provider (e.g., where you bought `infegreece.com`) and add these records to your DNS settings.

### 3. How to Embed in your Main Site
If you want to show the poll inside a page on `infegreece.com`, use this HTML code in your website editor:
```html
<iframe 
  src="https://infepoll.infegreece.com" 
  width="100%" 
  height="800px" 
  style="border:none;"
></iframe>
```

### 4. Admin Access
To manage entries:
1. Sign in to the app (create an account first).
2. Go to the Firebase Console > **Firestore Database**.
3. Create a collection named `roles_admin`.
4. Create a document where the **Document ID** is your **User UID** (found in the Authentication tab).
5. Add a field `role: "admin"` to that document.

## 💰 Staying on the Free Plan (Spark Plan)
This app is designed to stay within the **Firebase Spark Plan ($0/month)**:
- **Authentication:** Up to 50,000 users/month for free.
- **Firestore:** 50,000 reads and 20,000 writes per day for free.
- **Hosting:** 10GB storage and generous transfer limits.
- **App Hosting:** The `apphosting.yaml` file is configured with `maxInstances: 1` to ensure you don't accidentally scale into paid tiers.

### Monitoring Usage
Check the "Usage and Billing" tab in the Firebase Console daily during high-traffic periods (like the Eurovision week) to ensure you stay under the 50k/20k Firestore limits.
