# INFE Greece Eurovision Poll 2026

The official Eurovision fan poll application for INFE Greece, celebrating 70 years of contest history.

## Deployment to Custom Domain
To host this on `infepoll.infegreece.com`:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Navigate to **App Hosting** (or **Hosting** depending on your setup).
4. Click **Connect Custom Domain**.
5. Enter `infepoll.infegreece.com`.
6. Firebase will provide **DNS Records** (A or CNAME). Add these to your domain provider's DNS settings (e.g., GoDaddy, Namecheap, or Cloudflare).
7. Once verified, both your public site (`/`) and admin area (`/admin`) will be live on that domain.

## Managing Costs (Staying Free)
This app is designed to run on the **Firebase Spark Plan ($0/month)**.
- **Firestore:** Includes 50k reads and 20k writes per day.
- **Auth:** Includes 50k monthly active users.
- **Hosting:** Includes 10GB of storage.
- **App Hosting:** Uses Google Cloud resources that have a free tier. To ensure you stay within free limits, the `apphosting.yaml` is configured with `maxInstances: 1`.

## Admin Access
To manage entries:
1. Sign in to the app.
2. Go to the Firebase Console > Firestore Database.
3. Create a collection named `roles_admin`.
4. Create a document where the **Document ID** is your **User UID** (found in the Authentication tab).
5. Add a field `role: "admin"` to that document.
