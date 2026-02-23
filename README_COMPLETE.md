# NetGuard-Pro: Advanced Network Device Management Platform

![Status](https://img.shields.io/badge/status-active-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-blue)

## 🎯 Overview

NetGuard-Pro is a comprehensive network management and security monitoring platform designed to give administrators complete visibility and control over their network devices. It combines real-time device discovery, threat analysis, and intelligent alerting to protect your network infrastructure.

**Key Capabilities:**
- 🔍 Real-time device discovery from Huawei & RAIN routers
- 🚨 Intelligent threat detection and risk assessment
- 🎛️ Device control (block/unblock)
- 📊 Performance monitoring and analytics
- 🔐 Security-first architecture with Supabase
- ⚡ Real-time updates via WebSocket subscriptions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account (free tier available)
- Access to your router(s)
- VS Code (recommended)

### Installation (5 minutes)

1. **Clone the repository**
   ```bash
   git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
   cd NetGuard-Pro
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start the app**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

**See [QUICK_START_VS_CODE.md](./QUICK_START_VS_CODE.md) for detailed setup instructions.**

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + TailwindCSS | User interface |
| **Backend** | Node.js + Express + tRPC | API server |
| **Database** | Supabase (PostgreSQL) | Data persistence |
| **Real-time** | Supabase Realtime | Live updates |
| **Auth** | Manus OAuth | User authentication |
| **Router Integration** | Axios + Web Scraping | Device discovery |

### Project Structure

```
NetGuard-Pro/
├── client/                      # React frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # Utilities & helpers
│   │   └── styles/             # Global styles
│   └── index.html
├── server/                      # Node.js backend
│   ├── _core/                  # Core setup
│   │   ├── env.ts              # Environment validation
│   │   ├── auth.ts             # Authentication
│   │   └── index.ts            # Server startup
│   ├── services/               # Business logic
│   │   ├── huaweiScraper.ts    # Huawei router integration
│   │   ├── rainScraper.ts      # RAIN 101 router integration
│   │   ├── routerManager.ts    # Unified router interface
│   │   ├── threatAnalyzer.ts   # Threat detection
│   │   ├── deviceScanner.ts    # Device discovery
│   │   └── ...
│   ├── db.ts                   # Database queries
│   ├── routers.ts              # API route definitions
│   └── supabase.test.ts        # Tests
├── drizzle/                     # Database schema
│   ├── schema.ts               # Table definitions
│   ├── relations.ts            # Table relationships
│   └── migrations/             # SQL migrations
├── shared/                      # Shared types
│   └── types.ts                # TypeScript interfaces
├── .env.example                # Environment template
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript config
```

---

## 🔧 Configuration

### Router Setup

#### Huawei Router (http://192.168.0.1)
```
Router Type: Huawei
IP Address: 192.168.0.1
Username: admin
Password: [your router password]
Scan Interval: 300 seconds
```

#### RAIN 101 Router (http://192.168.8.1)
```
Router Type: RAIN 101
IP Address: 192.168.8.1
Username: admin
Password: [your router password]
Scan Interval: 300 seconds
```

### Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Get your credentials from **Settings → API**
3. Run the SQL migration: `supabase/migrations/001_initial_schema.sql`
4. Add credentials to `.env`

---

## 📊 Features

### ✅ Implemented
- [x] Network device discovery
- [x] Real-time alerts
- [x] Device blocking/unblocking
- [x] Risk assessment
- [x] Threat analysis
- [x] Device history tracking
- [x] Multi-router support
- [x] Real-time subscriptions
- [x] Background scanning

### 🔄 In Development
- [ ] Network topology visualization
- [ ] Performance metrics
- [ ] Port scanning
- [ ] DNS/Ping tools
- [ ] Mobile app
- [ ] Report generation
- [ ] Geolocation detection

**See [FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md) for complete roadmap.**

---

## 🔐 Security

### Best Practices
- ✅ Encrypted password storage
- ✅ Session-based authentication
- ✅ HTTPS-ready
- ✅ Environment variable protection
- ✅ Database row-level security (RLS)
- ✅ Input validation & sanitization

### Security Considerations
- Never commit `.env` files
- Use strong router passwords
- Rotate Supabase keys regularly
- Enable HTTPS in production
- Implement firewall rules

---

## 📱 API Reference

### Device Management
```typescript
// Get all devices
GET /api/trpc/device.list

// Block a device
POST /api/trpc/device.block
{ id: number }

// Unblock a device
POST /api/trpc/device.unblock
{ id: number }

// Get device details
GET /api/trpc/device.getById
{ id: number }
```

### Router Management
```typescript
// Get router settings
GET /api/trpc/router.settings

// Save router settings
POST /api/trpc/router.saveSettings
{ routerIp, username, password, scanInterval }

// Scan router
POST /api/trpc/router.scan
{ routerType, routerIp, username, password }
```

### Statistics
```typescript
// Get network overview
GET /api/trpc/stats.overview

// Get device statistics
GET /api/trpc/stats.devices

// Get security alerts
GET /api/trpc/stats.alerts
```

---

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Run Specific Test
```bash
pnpm test server/supabase.test.ts
```

### Test Coverage
```bash
pnpm test -- --coverage
```

---

## 🚀 Deployment

### Docker Deployment
```bash
docker build -t netguard-pro .
docker run -p 3000:3000 --env-file .env netguard-pro
```

### Vercel Deployment
```bash
vercel --prod
```

### Self-Hosted
1. Install Node.js 18+
2. Clone repository
3. Install dependencies: `pnpm install`
4. Build: `pnpm build`
5. Start: `pnpm start`

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to router"
**Solution:**
- Verify router IP address
- Check username/password
- Ensure device is on same network
- Check router firewall settings

### Issue: "Supabase connection failed"
**Solution:**
- Verify `.env` credentials
- Check Supabase project status
- Run SQL migration
- Test connection: `pnpm test server/supabase.test.ts`

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

---

## 📚 Documentation

- [Quick Start Guide](./QUICK_START_VS_CODE.md)
- [Features Roadmap](./FEATURES_ROADMAP.md)
- [Migration Guide](./MIGRATION_PRESENTATION_SCRIPT.md)
- [Environment Setup](./.env.example)

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Write TypeScript for type safety
- Follow existing code style
- Add tests for new features
- Update documentation
- Use meaningful commit messages

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev)
- Backend powered by [Node.js](https://nodejs.org)
- Database by [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Styling with [TailwindCSS](https://tailwindcss.com)

---

## 📞 Support

For issues or questions:
- 📧 Email: support@netguard-pro.dev
- 🐛 GitHub Issues: [Report a bug](https://github.com/AIRATHEBEST/NetGuard-Pro/issues)
- 💬 Discussions: [Ask a question](https://github.com/AIRATHEBEST/NetGuard-Pro/discussions)

---

## 🗺️ Roadmap

### Q1 2024
- Network topology visualization
- Performance metrics dashboard
- Port scanning capability

### Q2 2024
- Mobile app (React Native)
- Advanced reporting
- API integrations

### Q3 2024
- Enterprise features
- Multi-tenant support
- Advanced security features

---

**Made with ❤️ by the NetGuard-Pro Team**

Last Updated: February 23, 2024
