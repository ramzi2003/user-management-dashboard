# Personal Dashboard - Frontend

React frontend for the Personal Dashboard application, built with Vite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

To build for production:
```bash
npm run build
```

## Features

- Modern React 18 with Vite
- Axios for API communication
- Responsive dashboard UI
- Connected to Django backend at `http://127.0.0.1:8000`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx
│   │   └── Dashboard.css
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

