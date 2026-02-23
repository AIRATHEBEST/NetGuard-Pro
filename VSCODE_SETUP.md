# NetGuardPro - VS Code Setup & Running Guide

## Prerequisites

Before you start, ensure you have installed:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

3. **VS Code**
   - Download: https://code.visualstudio.com/
   - Recommended extensions (see below)

4. **MySQL/MariaDB** (for database)
   - Download: https://www.mysql.com/downloads/
   - Or use: Docker with MySQL image

## Step 1: Clone the Repository

### Option A: Using Git Command Line

```bash
# Clone the repository
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git

# Navigate to project directory
cd NetGuard-Pro
```

### Option B: Using VS Code Git Integration

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type: `Git: Clone`
4. Enter: `https://github.com/AIRATHEBEST/NetGuard-Pro.git`
5. Select a folder to clone into
6. Open the cloned folder in VS Code

## Step 2: Install Dependencies

### Using Terminal in VS Code

1. Open terminal in VS Code: `Ctrl+` ` (backtick)
2. Run the following commands:

```bash
# Install pnpm (package manager)
npm install -g pnpm

# Install project dependencies
pnpm install

# This will install all packages from pnpm-lock.yaml
```

**Expected output:**
```
✓ Packages in scope: netguardpro
✓ Lockfile is up-to-date
✓ 500+ packages installed
```

## Step 3: Configure Environment Variables

### Create .env.local file

1. In VS Code, create a new file: `.env.local` in the root directory
2. Add the following environment variables:

```env
# Database Configuration
DATABASE_URL="mysql://user:password@localhost:3306/netguardpro"

# OAuth Configuration (provided by Manus)
VITE_APP_ID="your_app_id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://oauth.manus.im"

# JWT Secret (generate a random string)
JWT_SECRET="your-secret-key-here-min-32-chars"

# Encryption Key (optional, for credential encryption)
ENCRYPTION_KEY="your-encryption-key-here"

# Owner Information
OWNER_NAME="Your Name"
OWNER_OPEN_ID="your_open_id"
```

### Get Your Configuration

- **For local development**: Use default values
- **For Manus integration**: Contact Manus support for credentials
- **For local database**: Use `mysql://root:password@localhost:3306/netguardpro`

## Step 4: Set Up Database

### Option A: Using Local MySQL

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE netguardpro;"

# Run migrations
pnpm db:push
```

### Option B: Using Docker

```bash
# Pull MySQL image
docker pull mysql:8.0

# Run MySQL container
docker run --name netguardpro-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=netguardpro \
  -p 3306:3306 \
  -d mysql:8.0

# Run migrations
pnpm db:push
```

### Verify Database Connection

```bash
# Test connection
pnpm check
```

## Step 5: Recommended VS Code Extensions

Install these extensions for better development experience:

1. **ES7+ React/Redux/React-Native snippets**
   - ID: `dsznajder.es7-react-js-snippets`

2. **Tailwind CSS IntelliSense**
   - ID: `bradlc.vscode-tailwindcss`

3. **TypeScript Vue Plugin**
   - ID: `Vue.vscode-typescript-vue-plugin`

4. **Prettier - Code formatter**
   - ID: `esbenp.prettier-vscode`

5. **ESLint**
   - ID: `dbaeumer.vscode-eslint`

6. **Thunder Client** (for API testing)
   - ID: `rangav.vscode-thunder-client`

7. **MySQL**
   - ID: `cweijan.vscode-mysql`

### Install Extensions

```bash
# Via command line
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
```

## Step 6: Run the Development Server

### Start Development Mode

```bash
# In VS Code terminal
pnpm dev
```

**Expected output:**
```
[tsx] watching for file changes
[Vite] ✨ new dependencies optimized
Server running on http://localhost:3000/
```

### Access the Application

1. Open your browser
2. Navigate to: `http://localhost:3000`
3. You should see the NetGuardPro dashboard

## Step 7: Running Tests

### Run All Tests

```bash
pnpm test
```

**Expected output:**
```
✓ server/auth.logout.test.ts (1 test)
✓ server/services.test.ts (10 tests)
Test Files  2 passed (2)
Tests  11 passed (11)
```

### Run Tests in Watch Mode

```bash
pnpm test -- --watch
```

## Step 8: Build for Production

### Create Production Build

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

## Common Tasks in VS Code

### Format Code

```bash
pnpm format
```

Or use keyboard shortcut: `Shift+Alt+F`

### Type Check

```bash
pnpm check
```

### Database Migrations

```bash
# Generate new migration
pnpm db:push

# View schema
cat drizzle/schema.ts
```

## Debugging in VS Code

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/server/_core/index.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Set Breakpoints

1. Click on the line number where you want to break
2. A red dot will appear
3. Press F5 to start debugging
4. Code will pause at breakpoints

## Project Structure in VS Code

```
NetGuard-Pro/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── public/            # Static assets
├── server/                # Backend Express app
│   ├── services/          # Business logic
│   │   ├── huaweiScraper.ts
│   │   ├── rainScraper.ts
│   │   ├── routerManager.ts
│   │   └── ...
│   ├── routers.ts         # API endpoints
│   └── db.ts              # Database queries
├── drizzle/               # Database schema
│   └── schema.ts
├── .env.local             # Environment variables (create this)
├── package.json           # Project dependencies
└── README.md              # Documentation
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
1. Verify MySQL is running
2. Check DATABASE_URL in .env.local
3. Verify credentials are correct
4. Create database if it doesn't exist

### Dependencies Installation Error

```bash
# Clear cache and reinstall
pnpm store prune
pnpm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
pnpm check

# Or restart VS Code
```

## Development Workflow

### 1. Start Development Server
```bash
pnpm dev
```

### 2. Make Changes
- Edit files in `client/src` for frontend
- Edit files in `server` for backend
- Changes auto-reload (HMR)

### 3. Test Changes
- Open `http://localhost:3000` in browser
- Check console for errors (F12)
- Run tests: `pnpm test`

### 4. Commit Changes
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Performance Tips

1. **Use VS Code Extensions**: Tailwind CSS and TypeScript extensions improve performance
2. **Enable Format on Save**: Settings → Format on Save
3. **Use Prettier**: Automatic code formatting
4. **Monitor Bundle Size**: Check build output for warnings

## Next Steps

1. ✅ Clone repository
2. ✅ Install dependencies
3. ✅ Configure environment
4. ✅ Set up database
5. ✅ Run development server
6. ✅ Configure router settings in app
7. ✅ Start scanning devices

## Additional Resources

- **VS Code Docs**: https://code.visualstudio.com/docs
- **Node.js Docs**: https://nodejs.org/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Express.js**: https://expressjs.com

## Getting Help

If you encounter issues:

1. Check this guide
2. Review error messages in terminal
3. Check VS Code Output panel (View → Output)
4. Review application logs
5. Check GitHub Issues: https://github.com/AIRATHEBEST/NetGuard-Pro/issues

## Quick Start Command

Copy and paste to get started quickly:

```bash
# Clone, install, and run
git clone https://github.com/AIRATHEBEST/NetGuard-Pro.git
cd NetGuard-Pro
npm install -g pnpm
pnpm install
pnpm db:push
pnpm dev
```

Then open `http://localhost:3000` in your browser!
