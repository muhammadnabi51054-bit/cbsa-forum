# Cox's Bazar Student Association (CBSA) Forum

A dynamic web forum built for the Cox's Bazar Student Association, where members can
register, log in, start discussion threads, comment, and where administrators can
moderate the community.

## Tech Stack

| Layer            | Technology                              |
|-------------------|------------------------------------------|
| Backend           | Node.js + Express.js                     |
| Templating        | EJS (server-side rendering, dynamic)     |
| Database          | SQLite via `node:sqlite` (Node's built-in module) |
| Auth / Sessions   | `express-session`                        |
| Password security | `bcryptjs` (salted hashing)               |

SQLite was chosen so the whole project runs from a single file with **zero external
database server setup**. It uses Node.js's own **built-in** `node:sqlite` module
(no `better-sqlite3` / `sqlite3` npm package) — this means `npm install` never needs
to compile native code or download prebuilt binaries, so it works the same way on
any computer with Node.js v22.5+ installed, with no Visual Studio / build tools
required. The same code would work with MySQL/Postgres with only the
`config/database.js` file changed, if a "real" DB server is required by your
instructor.

> **Requires Node.js v22.5.0 or newer** (the `node:sqlite` module was added in that
> version). Check your version with `node -v`. If you have an older Node, download
> the latest from nodejs.org.

## Forum-Standard Features

Beyond the 5 required criteria, the UI follows conventions from real forum
platforms (Discourse, phpBB, vBulletin):
- A forum index with **Topics / Posts / Last Post** columns per category
- Per-thread **reply and view counters**
- Forum-wide **statistics strip** (members, topics, posts, newest member)
- **Initials-based colored avatars** generated per name (no image upload needed)
- **Relative timestamps** ("3 hours ago") instead of raw dates
- A two-column thread view (avatar sidebar + post body) like classic forum software

## How the 5 Required Criteria Are Met

1. **Authentication (registration + login)**
   `routes/auth.js` — `/register` and `/login` routes. Sessions are created with
   `express-session` and stored server-side in `req.session.user`.

2. **At least two user types (Admin, User)**
   `users.role` column (`admin` / `user`). `middleware/auth.js` has `requireAdmin`
   which blocks any non-admin from `/admin/*` routes with a 403 page.

3. **Dynamic application**
   Every page (home, categories, posts, comments, admin panels) queries the SQLite
   database live via the models in `models/`. Nothing is hardcoded HTML — content
   changes as users register, post, and comment.

4. **Password encryption**
   `models/User.js` hashes passwords with `bcrypt.hashSync(password, 10)` before
   ever touching the database. Login compares with `bcrypt.compareSync`. The raw
   password is never stored or logged.

5. **Database**
   `db/cbsa.sqlite` (created automatically on first run) with tables: `users`,
   `categories`, `posts`, `comments`. Uses Node's built-in `node:sqlite` module.

## Troubleshooting

- **`Cannot find module 'express'`** → you ran `npm start` before `npm install`.
  Run `npm install` first.
- **`node -v` shows a version below 22.5.0** → update Node.js from nodejs.org
  (download the latest installer, not an old one) since `node:sqlite` needs 22.5+.
- **Command run from the wrong folder** (e.g. `npm error path ...package.json`
  pointing to your user folder instead of the project) → make sure your terminal's
  current folder is the `cbsa-forum` folder itself (open the folder in File
  Explorer, click the address bar, type `cmd`, press Enter — this opens a terminal
  already inside the right folder).
- **Port 3000 already in use** → edit `.env` and change `PORT=3000` to another
  number, e.g. `3001`, then restart with `npm start`.
- **`ExperimentalWarning: SQLite is an experimental feature...`** → this is just a
  notice, not an error. The app works fine; it's printed because `node:sqlite` is
  still marked experimental in this Node.js version.

## Project Structure

```
cbsa-forum/
├── server.js              # App entry point
├── config/database.js     # SQLite connection + schema (auto-creates tables)
├── db/seed.js             # Creates default admin/user + sample categories
├── middleware/auth.js     # requireLogin, requireAdmin, attachUser
├── models/                # User.js, Forum.js (Category/Post/Comment)
├── routes/                # auth.js, forum.js, admin.js
├── views/                 # EJS templates (+ views/admin/ for admin panel)
└── public/css/style.css   # Styling
```

## Setup Instructions

1. **Install dependencies**
   ```bash
   cd cbsa-forum
   npm install
   ```

2. **Seed the database** (creates tables + a default admin & demo user + categories)
   ```bash
   npm run seed
   ```
   This prints the demo login credentials:
   - Admin: `admin@cbsa.com` / `Admin@123`
   - User: `rafiul@example.com` / `User@123`

   > ⚠️ Change these credentials (or delete the seeded accounts) before any real
   > deployment. `db/seed.js` only creates them if the `users` table is empty, so
   > it's safe to re-run.

3. **Start the server**
   ```bash
   npm start
   ```
   Visit **http://localhost:3000**

4. **(Optional) Change the port / session secret**
   Edit `.env`:
   ```
   PORT=3000
   SESSION_SECRET=replace-with-a-long-random-string
   ```

## User Roles & What They Can Do

| Action                          | Guest | User | Admin |
|----------------------------------|:---:|:---:|:---:|
| Browse categories & posts        | ✅  | ✅  | ✅  |
| Register / Login                 | ✅  | –   | –   |
| Create posts & comments          | ❌  | ✅  | ✅  |
| Delete own post                  | ❌  | ✅  | ✅  |
| Delete **any** post               | ❌  | ❌  | ✅  |
| View `/admin` dashboard          | ❌  | ❌  | ✅  |
| Promote/demote/delete users      | ❌  | ❌  | ✅  |
| Add/delete categories            | ❌  | ❌  | ✅  |

## Suggested Ways to Extend (if you want to go further for extra marks)

- Add email verification on registration
- Add "like"/upvote on posts
- Add search across posts
- Add pagination for posts/comments
- Switch SQLite → MySQL/PostgreSQL for a "production-style" DB
- Add profile picture upload
- Rate-limit login attempts to prevent brute force

## Notes for Your Report/Presentation

- **Encryption**: bcrypt uses a salted one-way hash (10 salt rounds), so even if the
  database were leaked, raw passwords can't be recovered — this is industry standard
  (same approach used by most production web apps).
- **Dynamic vs static**: this is a genuinely dynamic, database-driven multi-user app —
  every category, post, and comment is generated from live SQL queries, not fixed HTML.
- **Two-tier RBAC** (admin/user) is enforced at the route level via middleware, not
  just hidden in the UI — so a user can't access `/admin/*` even by typing the URL
  directly.
