# Email Configuration Setup

To enable email sending via Gmail, follow these steps:

## Step 1: Enable 2-Step Verification on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** section
3. Enable **2-Step Verification** if not already enabled

## Step 2: Generate an App Password

1. In your Google Account Security settings, find **App passwords**
2. Click **App passwords** (you may need to verify your identity)
3. Select **Mail** as the app and **Other (Custom name)** as the device
4. Enter "Life Dashboard" as the name
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

## Step 3: Create .env file

Create a file named `.env` in the `backend/` directory with the following content:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
DEFAULT_FROM_EMAIL=noreply@lifedashboard.com
```

Replace:
- `your-email@gmail.com` with your Gmail address
- `your-16-character-app-password` with the App Password you generated (remove spaces)

## Step 4: Load environment variables

The settings.py file will automatically read from environment variables. If you're using a `.env` file, you can use `python-dotenv` to load it automatically, or set the environment variables manually.

### Option A: Using python-dotenv (Recommended)

1. Install python-dotenv:
   ```bash
   pip install python-dotenv
   ```

2. Add to `backend/requirements.txt`:
   ```
   python-dotenv==1.0.0
   ```

3. The settings.py will automatically load the .env file

### Option B: Set environment variables manually

**Windows (PowerShell):**
```powershell
$env:EMAIL_HOST_USER="your-email@gmail.com"
$env:EMAIL_HOST_PASSWORD="your-app-password"
```

**Windows (Command Prompt):**
```cmd
set EMAIL_HOST_USER=your-email@gmail.com
set EMAIL_HOST_PASSWORD=your-app-password
```

**Linux/Mac:**
```bash
export EMAIL_HOST_USER="your-email@gmail.com"
export EMAIL_HOST_PASSWORD="your-app-password"
```

## Testing

After setup, restart your Django server and try signing up. You should receive verification emails in your Gmail inbox.

## Troubleshooting

- **"Authentication failed"**: Make sure you're using an App Password, not your regular Gmail password
- **"Connection refused"**: Check your internet connection and firewall settings
- **"Email not received"**: Check your spam folder, and verify the email address is correct



