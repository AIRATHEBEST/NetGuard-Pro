# NetGuardPro - Network Security Monitoring

Advanced network security monitoring application with real-time device scanning, threat detection, and intelligent alerts.

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

## 📋 What You'll Need

When the app starts, have these ready:

1. **Supabase URL** - From your Supabase dashboard
2. **Supabase Anon Key** - From your Supabase dashboard  
3. **Database URL** - Your PostgreSQL connection string
4. **JWT Secret** - Any random string (min 32 characters)

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
