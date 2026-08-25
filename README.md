# CampusFix — Campus Complaint Management System

A full-stack web app for reporting, tracking, and resolving campus maintenance
issues (electrical, plumbing, furniture, Wi-Fi, cleaning, etc.), built for a
Software Engineering & Project Management CIA project.

Three roles: **Student** (report & track issues), **Admin** (triage & assign),
**Staff** (resolve assigned issues).

---

## 1. Tech stack

| Layer     | Technology                                   |
|-----------|-----------------------------------------------|
| Frontend  | Plain HTML, CSS, JavaScript (no framework/build step) |
| Backend   | Node.js + Express                            |
| Database  | SQLite (via `better-sqlite3`) — a single file, no DB server to install |
| Auth      | JWT (JSON Web Tokens) + bcrypt password hashing |
| Uploads   | Multer (complaint photos, max 5MB, jpg/png/webp) |

A plain-stack, single-file database was chosen deliberately: it needs **zero
external setup** (no MongoDB/Postgres server, no cloud account) so it runs
identically on any evaluator's laptop with just Node.js installed — important
for a live demo.

## 2. Prerequisites

- [Node.js](https://nodejs.org) v18 or later (comes with npm)

## 3. Setup & run

```bash
# 1. Install dependencies
npm install

# 2. Seed the database with demo Admin/Staff/Student accounts + a sample complaint
npm run seed

# 3. Start the server
npm start
```

Then open **http://localhost:4000** in your browser.

### Demo logins (created by `npm run seed`)

| Role    | Email                    | Password   |
|---------|---------------------------|------------|
| Admin   | admin@campusfix.edu       | admin123   |
| Staff   | staff1@campusfix.edu      | staff123   |
| Staff   | staff2@campusfix.edu      | staff123   |
| Student | student@campusfix.edu     | student123 |

New students can also self-register from the login page.

> The database is a single file, `campusfix.db`, created automatically in the
> project folder. Delete it (and re-run `npm run seed`) any time to reset the
> demo data.

## 4. Project structure

```
campusfix/
├── server.js              # Express app entry point
├── db.js                  # SQLite connection + schema (CREATE TABLE ...)
├── seed.js                # Creates demo accounts + one sample complaint
├── middleware/
│   └── auth.js             # JWT verification + role-based access control
├── routes/
│   ├── auth.js              # POST /register, /login, GET /me
│   ├── student.js           # complaint CRUD, notifications, feedback
│   ├── admin.js              # complaint list/filter, assign, priority, stats
│   └── staff.js               # assigned complaints, status updates, resolve
├── utils/
│   └── notify.js             # small helpers to create in-app notifications
├── uploads/                 # complaint photos land here (gitignored)
└── public/                  # the frontend (plain HTML/CSS/JS)
    ├── index.html             # login
    ├── register.html          # student sign-up
    ├── css/style.css          # shared design system
    ├── js/api.js              # fetch wrapper + auth/session helpers
    ├── student/                # dashboard, submit, track, notifications
    ├── admin/                    # dashboard (stats, filters, assign)
    └── staff/                      # dashboard (assigned complaints, resolve)
```

## 5. How each feature maps to a route

| Feature                          | Endpoint                                       |
|-----------------------------------|-------------------------------------------------|
| Register / Login                 | `POST /api/auth/register`, `POST /api/auth/login` |
| Submit complaint (+ image)       | `POST /api/student/complaints`                 |
| Track / complaint history        | `GET /api/student/complaints`, `GET /api/student/complaints/:id` |
| Notifications                    | `GET /api/student/notifications`               |
| Feedback after resolution        | `POST /api/student/complaints/:id/feedback`    |
| Admin: view all + filter         | `GET /api/admin/complaints?status=&priority=&category=` |
| Admin: assign to staff           | `PATCH /api/admin/complaints/:id/assign`       |
| Admin: change priority           | `PATCH /api/admin/complaints/:id/priority`     |
| Admin: dashboard statistics      | `GET /api/admin/stats`                         |
| Staff: view assigned             | `GET /api/staff/complaints`                    |
| Staff: update status             | `PATCH /api/staff/complaints/:id/status`       |
| Staff: resolve + note            | `PATCH /api/staff/complaints/:id/resolve`      |

## 6. Notes for the project report

These map straight onto typical CIA-3 deliverables for a Software Engineering
course:

- **Process model**: this was built incrementally (an Incremental/Agile
  process model — Unit 3 of the syllabus) — auth → student flow → admin flow
  → staff flow → notifications/feedback, each a working, demoable increment.
- **Requirements engineering (Unit 2)**: the three roles above are your three
  actors. Each bullet in "What we're building" is a use case; the route table
  above is the traceability between requirements and implementation.
- **Data model**: see `db.js` for the schema (Users, Complaints,
  Notifications, Feedback) — good source for an ER diagram.
- **Quality (Unit 5)**: input validation happens both client-side (HTML
  `required`) and server-side (every route checks required fields, valid
  enums, and ownership before touching the database).

## 7. Possible extensions (if you want to go further)

- Email notifications (currently in-app only, by design, to keep the demo simple)
- Password reset flow
- Bulk CSV export of complaints for admin
- A "reopen complaint" action if a student is unsatisfied
