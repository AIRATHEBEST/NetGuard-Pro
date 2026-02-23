# NetGuardPro - Quick Start Guide (5 Minutes)

## ⚡ Super Quick Start (Copy & Paste)

### For Windows (PowerShell):
```powershell
# 1. Clone repository
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
cd NetGuard-Pro

# 2. Run startup script
.\start-dev.bat
```

### For Mac/Linux (Terminal):
```bash
# 1. Clone repository
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
cd NetGuard-Pro

# 2. Run startup script
chmod +x start-dev.sh
./start-dev.sh
```

**That's it! Your app will be running at `http://localhost:3000`**

---

## 📋 Step-by-Step Setup in VS Code

### Step 1: Open VS Code

1. Launch VS Code
2. Press `Ctrl+` ` (backtick) to open terminal
3. Or go to: **View → Terminal**

### Step 2: Clone the Repository

In the VS Code terminal, paste:

```bash
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
cd NetGuard-Pro
```

**Expected:**
```
Cloning into 'NetGuard-Pro'...
remote: Enumerating objects: 150, done.
...
```

### Step 3: Install Dependencies

```bash
npm install -g pnpm
pnpm install
```

**This will take 2-3 minutes. You should see:**
```
✓ Packages in scope: netguardpro
✓ Lockfile is up-to-date
✓ 500+ packages installed
```

### Step 4: Create Environment File

1. In VS Code, right-click on the root folder
2. Select **New File**
3. Name it: `.env.local`
4. Paste this content:

```env
DATABASE_URL="mysql://root:password@localhost:3306/netguardpro"
JWT_SECRET="your-secret-key-min-32-characters-long"
VITE_APP_ID="dev"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://oauth.manus.im"
OWNER_NAME="Your Name"
OWNER_OPEN_ID="dev-user"
```

### Step 5: Set Up Database

#### Option A: Using Docker (Easiest)

```bash
# Install Docker from: https://www.docker.com/products/docker-desktop

# Run MySQL in Docker
docker run --name netguardpro-db \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=netguardpro \
  -p 3306:3306 \
  -d mysql:8.0

# Wait 10 seconds for MySQL to start, then:
pnpm db:push
```

#### Option B: Using Local MySQL

```bash
# If MySQL is already installed and running:
mysql -u root -p -e "CREATE DATABASE netguardpro;"
pnpm db:push
```

### Step 6: Start Development Server

```bash
pnpm dev
```

**You should see:**
```
[tsx] watching for file changes
[Vite] ✨ new dependencies optimized
Server running on http://localhost:3000/
```

### Step 7: Open in Browser

1. Click the link: `http://localhost:3000`
2. Or open browser and type: `http://localhost:3000`
3. You should see the NetGuardPro dashboard!

---

## 🎯 Configure Your Router

Once the app is running:

1. Click **Settings** tab
2. Click **Configure Router**
3. Enter your router details:
   - **Router Type**: Huawei or RAIN 101
   - **Router IP**: `192.168.8.1` (for Huawei) or `192.168.1.1` (for RAIN)
   - **Username**: `admin`
   - **Password**: Your router password
4. Click **Save Settings**
5. Click **Scan Network** to discover devices

---

## 🧪 Run Tests

```bash
pnpm test
```

You should see:
```
✓ server/auth.logout.test.ts (1 test)
✓ server/services.test.ts (10 tests)
Test Files  2 passed (2)
Tests  11 passed (11)
```

---

## 🛑 Stop the Server

Press `Ctrl+C` in the terminal

---

## 🔧 Useful Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm test` | Run all tests |
| `pnpm build` | Build for production |
| `pnpm format` | Format code |
| `pnpm check` | Check TypeScript errors |
| `pnpm db:push` | Run database migrations |

---

## ❌ Troubleshooting

### "Command not found: node"
- Install Node.js: https://nodejs.org/
- Restart VS Code

### "Cannot connect to database"
- Make sure MySQL is running
- Check DATABASE_URL in .env.local
- Run: `pnpm db:push`

### "Port 3000 already in use"
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### "Module not found"
```bash
# Clear and reinstall
pnpm store prune
pnpm install
```

---

## 📁 Project Structure

```
NetGuard-Pro/
├── client/              # Frontend (React)
│   └── src/
│       ├── pages/       # Page components
│       ├── components/  # Reusable components
│       └── App.tsx      # Main app
├── server/              # Backend (Express)
│   ├── services/        # Business logic
│   ├── routers.ts       # API endpoints
│   └── db.ts            # Database
├── drizzle/             # Database schema
├── .env.local           # Environment (create this)
├── package.json         # Dependencies
└── start-dev.sh/bat     # Quick start script
```

---

## 🚀 What's Next?

1. ✅ App is running
2. ✅ Configure router settings
3. ✅ Scan your network
4. ✅ View connected devices
5. ⏭️ Set up alerts
6. ⏭️ Enable real-time monitoring
7. ⏭️ Customize device names

---

## 💡 Tips

- **Auto-reload**: Changes to code automatically reload in browser
- **Debug**: Open browser DevTools with F12
- **Logs**: Check terminal for server logs
- **Database**: Use MySQL Workbench to view database

---

## 📚 Full Documentation

- **Detailed Setup**: See `VSCODE_SETUP.md`
- **Router Setup**: See `ROUTER_SETUP.md`
- **API Docs**: See `README.md`

---

## 🆘 Need Help?

1. Check this guide
2. Review error messages in terminal
3. Check browser console (F12)
4. Visit: https://github.com/AIRATHEBEST/NetGuard-Pro/issues

**Happy monitoring! 🎉**
