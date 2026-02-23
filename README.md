# NetGuardPro - Network Security Monitoring

Advanced network security monitoring application with real-time device scanning, threat detection, and intelligent alerts.

## Quick Start

### Prerequisites
- Node.js 18+ (https://nodejs.org/)
- Git (https://git-scm.com/)
- Supabase account (https://supabase.com)

### Setup (2 minutes)

```bash
# 1. Clone repository
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
cd NetGuard-Pro

# 2. Install dependencies
npm install

# 3. Create .env.local file
cat > .env.local << EOF
SUPABASE_URL=https://iarufylvvybhtqosohgb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_1esQxipw9Fi5sJUeGEONTA_W3bQTdzS
DATABASE_URL=postgresql://postgres:b.AY*y#?Q3s3y9f@iarufylvvybhtqosohgb.supabase.co:5432/postgres
JWT_SECRET=your-secret-key-here-min-32-characters
VITE_APP_ID=dev
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_NAME=Your Name
OWNER_OPEN_ID=dev-user
EOF

# 4. Setup database
npm run db:push

# 5. Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm test          # Run tests
npm run check     # Check TypeScript
npm run format    # Format code
npm run db:push   # Run database migrations
```

## Features

✅ Real-time device scanning and monitoring  
✅ Huawei & RAIN 101 router integration  
✅ Security risk assessment and scoring  
✅ LLM-powered threat analysis  
✅ Multi-channel alerts (in-app & email)  
✅ Device blocking/unblocking  
✅ Historical data tracking  
✅ Supabase cloud database  
✅ Real-time subscriptions  

## Configuration

### Router Setup

1. Go to **Settings** tab
2. Click **Configure Router**
3. Enter your router details:
   - Router Type: Huawei or RAIN 101
   - Router IP: 192.168.8.1 (Huawei) or 192.168.1.1 (RAIN)
   - Username: admin
   - Password: Your router password
4. Click **Save Settings**
5. Click **Scan Network**

### Environment Variables

Required variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_ANON_KEY | Supabase anonymous key |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Session secret (min 32 chars) |
| VITE_APP_ID | OAuth app ID |
| OAUTH_SERVER_URL | OAuth server URL |
| OWNER_NAME | Your name |
| OWNER_OPEN_ID | Your user ID |

## Project Structure

```
NetGuard-Pro/
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Page components
│       ├── components/  # Reusable components
│       └── App.tsx      # Main app
├── server/              # Express backend
│   ├── services/        # Business logic
│   ├── routers.ts       # API endpoints
│   └── db.ts            # Database queries
├── drizzle/             # Database schema
├── .env.local           # Environment variables (create this)
└── package.json         # Dependencies
```

## Database

Uses **Supabase PostgreSQL** with the following tables:

- **users** - User accounts
- **devices** - Network devices
- **alerts** - Security alerts
- **routerSettings** - Router configuration
- **deviceHistory** - Device connection history
- **securityRecommendations** - LLM recommendations
- **alertRules** - Custom alert rules
- **networkTraffic** - Bandwidth data

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test server/supabase.test.ts
```

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

### Database connection error
- Verify DATABASE_URL in .env.local
- Check Supabase project is active
- Verify credentials are correct
- Run: `npm run db:push`

### Dependencies installation error
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Deployment

1. Create production build:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## Support

- GitHub Issues: https://github.com/AIRATHEBEST/NetGuard-Pro/issues
- Supabase Docs: https://supabase.com/docs
- Node.js Docs: https://nodejs.org/docs

## License

MIT License - See LICENSE file for details

---

**Happy monitoring! 🎉**
