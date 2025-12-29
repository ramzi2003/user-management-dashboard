# Google OAuth Setup Instructions

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - Choose **External** user type
   - Fill in required information
   - Add scopes: `email`, `profile`
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **Life Dashboard**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
7. Copy the **Client ID**

## Step 2: Configure Frontend

1. Create a `.env` file in the `frontend` directory:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

2. Replace `your_client_id_here` with your actual Google Client ID

3. Restart the development server:
```bash
cd frontend
npm run dev
```

## Step 3: Test

1. Navigate to the signup page
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected to the dashboard

## Notes

- Google OAuth users are automatically verified (no email verification needed)
- User information (name, email) is automatically retrieved from Google
- The backend creates a new user account if one doesn't exist, or logs in existing users

