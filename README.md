# TaskFlow — Team Task Manager

A team task management web app built with Django REST Framework and React. Supports role-based access control (Admin/Member), project management, task tracking with priorities and due dates, and a real-time dashboard.

## Features

- **Authentication** — Signup/Login with JWT tokens, auto token refresh
- **Projects** — Create, update, delete projects with descriptions
- **Team Management** — Add/remove team members, assign Admin or Member roles
- **Tasks** — Full CRUD with status (To Do / In Progress / Done), priority (Low / Medium / High), due dates, and assignments
- **Dashboard** — Overview stats, task breakdown, overdue alerts, recent activity
- **Role-Based Access** — Admins get full control, Members can view and update task status

## Tech Stack

- **Backend:** Python 3.12, Django 5, Django REST Framework, SimpleJWT
- **Frontend:** React 18, Vite, React Router, Axios
- **Database:** SQLite (development), PostgreSQL (production)
- **Styling:** Custom CSS with dark mode
- **Deployment:** Railway (backend) + Vercel (frontend)

## Project Structure

```
├── backend/
│   ├── config/          # settings, urls, wsgi
│   ├── accounts/        # user auth, signup, login
│   ├── projects/        # project & member management
│   ├── tasks/           # task CRUD, dashboard stats
│   ├── requirements.txt
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── api/         # axios setup with JWT
│   │   ├── context/     # auth state
│   │   ├── components/  # sidebar, protected routes
│   │   └── pages/       # all app pages
│   └── package.json
└── README.md
```

## Setup (Local Development)

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend API at `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup/` | Register |
| POST | `/api/auth/login/` | Login (JWT) |
| POST | `/api/auth/token/refresh/` | Refresh token |
| GET | `/api/auth/me/` | My profile |
| GET | `/api/auth/users/search/?q=` | Search users |
| GET/POST | `/api/projects/` | List / Create projects |
| GET/PUT/DELETE | `/api/projects/:id/` | Project detail |
| GET/POST | `/api/projects/:id/members/` | Members |
| DELETE | `/api/projects/:id/members/:uid/` | Remove member |
| GET/POST | `/api/projects/:id/tasks/` | Tasks |
| GET/PUT/PATCH/DELETE | `/api/tasks/:id/` | Task detail |
| GET | `/api/dashboard/` | Dashboard stats |

## Deployment

### Backend (Railway)
1. Push to GitHub
2. Create a Railway project with PostgreSQL
3. Deploy from GitHub, set environment variables:
   - `DJANGO_SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
4. `DATABASE_URL` is auto-configured by Railway

### Frontend (Vercel)
1. Import the `frontend` folder from GitHub
2. Set `VITE_API_URL` to your Railway backend URL
3. Deploy

## License

Built for educational purposes.
