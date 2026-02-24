# NetGuard Pro — Merged SaaS Edition

Advanced network security monitoring platform with **multi-tenant SaaS capabilities**. This is the merged version combining the original GitHub project with the **v2 SaaS-Ready** features (workspaces, RBAC, WebSocket agents, device blocking, and background scheduler).

> **Supabase Project**: `https://iarufylvvybhtqosohgb.supabase.co` (EU West, Active)

## 🚀 Quick Start (3 Steps)

```bash
# 1. Clone and install
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
cd NetGuard-Pro
npm install

# 2. Start the app
npm run dev

# 3. Open browser and enter credentials
# http://localhost:3000
```

That's it! 🎉 The app will ask for your credentials on first launch.

## 📋 Supabase Setup (Already Configured)

Your Supabase project is already set up with all 15 tables. The `.env` file is pre-configured. Just run `npm install && npm run dev`.

**If you need to reconfigure**, copy `.env.example` to `.env`:

```bash
cp .env.example .env
# Then edit .env with your Supabase credentials
```

**Database Tables (all created):**

| Table | Purpose |
|---|---|
| `users` | User accounts |
| `devices` | Network devices |
| `securityAlerts` | Security alerts |
| `routerSettings` | Router config |
| `workspaces` | Multi-tenant workspaces (v2) |
| `workspace_members` | RBAC membership (v2) |
| `networks` | Networks per workspace (v2) |
| + 8 more | Performance, topology, diagnostics |

## 🔧 Available Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm test          # Run tests
npm run check     # Check TypeScript
npm run format    # Format code
npm run db:push   # Run database migrations
```

## ✨ Features

- ✅ Real-time device scanning and monitoring
- ✅ Huawei & RAIN 101 router integration
- ✅ Security risk assessment and scoring
- ✅ LLM-powered threat analysis
- ✅ Multi-channel alerts (in-app & email)
- ✅ Device blocking/unblocking
- ✅ Historical data tracking
- ✅ Cloud database (Supabase)
- ✅ Real-time subscriptions
- ✅ **Multi-tenant workspaces** (v2 SaaS)
- ✅ **RBAC** — OWNER / ADMIN / TECH / VIEWER (v2)
- ✅ **WebSocket agent server** for network agents (v2)
- ✅ **Background scheduler** — auto-scan every 5 min (v2)
- ✅ **MAC-level device blocking** via iptables (v2)

## 📁 Project Structure

```
NetGuard-Pro/
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Page components
│       ├── components/  # Reusable UI
│       └── App.tsx      # Main app
├── server/              # Express backend
│   ├── services/        # Business logic
│   ├── routers.ts       # API endpoints
│   └── db.ts            # Database queries
├── drizzle/             # Database schema
├── package.json         # Dependencies
└── README.md            # This file
```

## 🔐 First Launch Setup

When you start the app, you'll see a setup wizard:

1. **Enter Supabase credentials** (URL + Key)
2. **Enter Database URL** (PostgreSQL connection)
3. **Create JWT Secret** (any 32+ character string)
4. Click **Complete Setup**

Your credentials are stored locally in your browser.

## 🛠️ Troubleshooting

**Port 3000 already in use?**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Dependencies installation fails?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors?**
```bash
npm run check
npm run format
```

## 📚 Documentation

- [GitHub Issues](https://github.com/AIRATHEBEST/NetGuard-Pro/issues)
- [Supabase Docs](https://supabase.com/docs)
- [Node.js Docs](https://nodejs.org/docs)

## 📄 License

MIT License - See LICENSE file for details

---

**Happy monitoring! 🎉**
