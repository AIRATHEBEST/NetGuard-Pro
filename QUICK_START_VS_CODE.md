# NetGuard-Pro: Quick Start Guide for VS Code

## 🚀 One-Click Setup & Run

### Step 1: Clone & Open in VS Code
```bash
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
cd NetGuard-Pro
code .
```

### Step 2: Install Dependencies
Open VS Code terminal (`Ctrl + ~`) and run:
```bash
npm install
```

### Step 3: Configure Environment
Copy `.env.example` to `.env` and add your Supabase credentials:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iarufylvvybhtqosohgb.supabase.co:5432/postgres
SUPABASE_URL=https://iarufylvvybhtqosohgb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_1esQxipw9Fi5sJUeGEONTA_W3bQTdzS
NODE_ENV=development
PORT=3000
```

### Step 4: Run the App
```bash
npm run dev
```

The app will start on `http://localhost:3000`

---

## 🎯 Router Configuration

### Huawei Router (http://192.168.0.1/#/status)
In the app, go to **Router Settings** and enter:
- **Router Type**: Huawei
- **Router IP**: `192.168.0.1`
- **Username**: `admin` (default)
- **Password**: Your router password
- **Scan Interval**: 300 seconds (5 minutes)

### RAIN 101 Router (http://192.168.8.1/html/content.html#home)
In the app, go to **Router Settings** and enter:
- **Router Type**: RAIN 101
- **Router IP**: `192.168.8.1`
- **Username**: `admin` (default)
- **Password**: Your router password
- **Scan Interval**: 300 seconds (5 minutes)

Click **Save Settings** and then **Start Scan**.

---

## 📊 Features Implemented

### ✅ Currently Available
1. **Network Device Discovery** - Scans routers for connected devices
2. **Real-Time Alerts** - Notifies when devices join/leave/go offline
3. **Device Management** - Block/unblock devices on routers
4. **Risk Assessment** - Analyzes device risk scores
5. **Security Alerts** - Creates alerts for suspicious activity
6. **Device History** - Tracks device connection/disconnection events
7. **Router Integration** - Huawei & RAIN 101 support
8. **Threat Analysis** - LLM-powered threat detection
9. **Real-Time Subscriptions** - Live updates via Supabase
10. **Background Scanning** - Continuous device monitoring

### 🔄 In Development / Coming Soon
- Network Topology Mapping
- Performance Metrics (Latency, Bandwidth, Packet Loss)
- Port Scanning
- DNS & Ping Tools
- Mobile App (React Native)
- Custom Alerts & Timers
- API Integrations
- Historical Data & Reports
- Geolocation Detection
- Pro-Level Report Generation

---

## 🛠️ Troubleshooting

### Port 3000 Already in Use?
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Supabase Connection Issues?
1. Verify `.env` file has correct credentials
2. Check Supabase dashboard for active project
3. Run SQL migration: `supabase/migrations/001_initial_schema.sql`
4. Test connection: `npm test server/supabase.test.ts`

### Router Connection Failed?
1. Ensure router is on the same network
2. Verify IP address is correct
3. Check username/password
4. Router may require specific authentication method (check router docs)

---

## 📁 Project Structure

```
NetGuard-Pro/
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Dashboard, Home, etc.
│       ├── components/  # UI components
│       └── lib/         # Utilities
├── server/              # Backend (Node.js + Express)
│   ├── _core/           # Core setup (auth, env, etc.)
│   ├── services/        # Business logic
│   │   ├── huaweiScraper.ts
│   │   ├── rainScraper.ts
│   │   ├── routerManager.ts
│   │   ├── threatAnalyzer.ts
│   │   └── ...
│   ├── db.ts            # Database queries (Supabase)
│   └── routers.ts       # API routes
├── drizzle/             # Database schema (PostgreSQL)
├── .env.example         # Environment template
└── package.json         # Dependencies
```

---

## 🔐 Security Notes

- **Never commit `.env`** - It contains sensitive credentials
- **Use strong router passwords**
- **Enable HTTPS in production**
- **Rotate Supabase keys regularly**
- **Implement Row Level Security (RLS)** in Supabase for multi-tenant support

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review router documentation for API endpoints
3. Check Supabase dashboard for database status
4. Review console logs for error messages

---

## 🎓 Next Steps

1. **Configure your routers** in the app
2. **Start scanning** to discover devices
3. **Set up alerts** for important devices
4. **Monitor in real-time** via the dashboard
5. **Export reports** (coming soon)

Happy monitoring! 🚀
