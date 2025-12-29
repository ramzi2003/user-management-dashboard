# User Management Dashboard

A full-stack web application for user management built with React and Django.

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Django 6.0
- Django REST Framework
- SQLite
- Google OAuth Authentication

## Features

- User authentication with Google OAuth
- Modern, responsive dashboard UI
- Dark mode support
- RESTful API backend

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv ../venv
```

3. Activate the virtual environment:
```bash
# Windows
../venv/Scripts/activate

# macOS/Linux
source ../venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Start the development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
.
├── backend/          # Django backend application
│   ├── api/         # API app
│   ├── backend/     # Django project settings
│   └── manage.py
├── frontend/        # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── contexts/
│   └── package.json
└── README.md
```

## License

MIT

