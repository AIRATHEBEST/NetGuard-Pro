# NetGuardPro - Supabase Integration Guide

## Overview

NetGuardPro now uses **Supabase** as the cloud database backend, replacing the local MySQL setup. Supabase provides:

- **PostgreSQL Database**: Powerful relational database in the cloud
- **Real-time Subscriptions**: Live updates for device changes
- **Authentication**: Built-in user management (optional)
- **REST API**: Automatic API generation from your schema
- **Scalability**: Handles millions of records efficiently

## Your Supabase Project

| Property | Value |
|----------|-------|
| **Project URL** | https://iarufylvvybhtqosohgb.supabase.co |
| **Project ID** | iarufylvvybhtqosohgb |
| **Anon Key** | sb_publishable_1esQxipw9Fi5sJUeGEONTA_W3bQTdzS |
| **Database** | PostgreSQL |
| **Region** | (Check Supabase dashboard) |

## Environment Variables

Your `.env.local` file should contain:

```env
# Supabase Configuration
SUPABASE_URL="https://iarufylvvybhtqosohgb.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_1esQxipw9Fi5sJUeGEONTA_W3bQTdzS"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Database Connection (for Drizzle ORM)
DATABASE_URL="postgresql://postgres:b.AY*y#?Q3s3y9f@iarufylvvybhtqosohgb.supabase.co:5432/postgres"
```

## Setup Steps

### Step 1: Verify Supabase Connection

```bash
# Test the connection
pnpm test server/supabase.test.ts
```

Expected output:
```
✓ server/supabase.test.ts (4 tests)
Tests  4 passed (4)
```

### Step 2: Create Database Tables

The schema is already defined in `drizzle/schema.ts`. Run migrations:

```bash
# Generate and run migrations
pnpm db:push
```

This will create all tables in your Supabase PostgreSQL database:
- `users` - User accounts
- `devices` - Network devices
- `alerts` - Security alerts
- `routerSettings` - Router configuration
- `deviceHistory` - Device connection history
- `securityRecommendations` - LLM-generated recommendations
- `alertRules` - Custom alert rules
- `networkTraffic` - Bandwidth monitoring data

### Step 3: Access Supabase Dashboard

1. Go to: https://supabase.com
2. Sign in with your account
3. Select your project: `iarufylvvybhtqosohgb`
4. Navigate to **SQL Editor** to view/manage data

### Step 4: Start the Application

```bash
pnpm dev
```

The app will now use Supabase for all database operations.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

### Devices Table
```sql
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id),
  ipAddress VARCHAR(45) NOT NULL,
  macAddress VARCHAR(17) UNIQUE NOT NULL,
  deviceName VARCHAR(255),
  deviceType VARCHAR(100),
  vendor VARCHAR(255),
  status ENUM('online', 'offline') DEFAULT 'offline',
  riskScore INT DEFAULT 0,
  riskLevel ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  isBlocked BOOLEAN DEFAULT FALSE,
  lastSeen TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id),
  deviceId INT REFERENCES devices(id),
  alertType VARCHAR(100) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

## Real-time Subscriptions

NetGuardPro supports real-time device updates using Supabase subscriptions:

```typescript
import { subscribeToDeviceChanges } from "./server/services/supabaseClient";

// Subscribe to device changes for a user
const subscription = subscribeToDeviceChanges(userId, (payload) => {
  console.log("Device changed:", payload);
  // Handle real-time updates
});

// Unsubscribe when done
await unsubscribeFromDeviceChanges(subscription);
```

## API Endpoints

Supabase automatically generates REST APIs for your tables:

```bash
# Get all devices for a user
curl "https://iarufylvvybhtqosohgb.supabase.co/rest/v1/devices?userId=eq.1" \
  -H "apikey: sb_publishable_1esQxipw9Fi5sJUeGEONTA_W3bQTdzS"

# Create a new device
curl -X POST "https://iarufylvvybhtqosohgb.supabase.co/rest/v1/devices" \
  -H "apikey: sb_publishable_1esQxipw9Fi5sJUeGEONTA_W3bQTdzS" \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"ipAddress":"192.168.1.100","macAddress":"AA:BB:CC:DD:EE:FF"}'
```

## Backup & Data Management

### Export Data

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run: `SELECT * FROM devices;`
4. Click **Download** to export as CSV

### Backup Database

```bash
# Using pg_dump (requires PostgreSQL client)
pg_dump postgresql://postgres:PASSWORD@iarufylvvybhtqosohgb.supabase.co:5432/postgres > backup.sql

# Restore from backup
psql postgresql://postgres:PASSWORD@iarufylvvybhtqosohgb.supabase.co:5432/postgres < backup.sql
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Supabase
```
Error: connect ECONNREFUSED
```

**Solution**:
1. Verify DATABASE_URL in `.env.local`
2. Check Supabase project is active
3. Verify credentials are correct
4. Test connection: `pnpm test server/supabase.test.ts`

### Migration Failures

**Problem**: `pnpm db:push` fails
```
Error: relation "users" already exists
```

**Solution**:
1. Check if tables already exist in Supabase
2. Use Supabase SQL Editor to view existing tables
3. Drop and recreate if needed (be careful with production data!)

### Real-time Subscriptions Not Working

**Problem**: Changes not reflected in real-time
```
Subscription failed to connect
```

**Solution**:
1. Verify SUPABASE_ANON_KEY is correct
2. Check Supabase project settings
3. Enable real-time for the table:
   - Go to Supabase Dashboard
   - Select table
   - Enable "Realtime" toggle

## Performance Optimization

### Indexing

Create indexes for frequently queried columns:

```sql
-- Index on userId for faster queries
CREATE INDEX idx_devices_userId ON devices(userId);

-- Index on MAC address for device lookup
CREATE INDEX idx_devices_macAddress ON devices(macAddress);

-- Index on IP address
CREATE INDEX idx_devices_ipAddress ON devices(ipAddress);
```

### Connection Pooling

Supabase handles connection pooling automatically. No configuration needed.

### Query Optimization

Use Drizzle ORM for optimized queries:

```typescript
// Good: Filtered query
const devices = await db
  .select()
  .from(devices)
  .where(eq(devices.userId, userId))
  .limit(100);

// Avoid: Full table scans
const allDevices = await db.select().from(devices);
```

## Scaling Considerations

### Database Limits

- **Storage**: Supabase Free tier has 500MB, Pro tier has 8GB
- **Connections**: Up to 100 concurrent connections
- **Rows**: Unlimited (depends on storage)
- **Real-time**: Up to 200 concurrent subscriptions

### When to Upgrade

- Approaching storage limits
- Need more concurrent connections
- Require advanced features (backups, monitoring)

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` in `.gitignore`
2. **Use service role key carefully**: Only on server-side code
3. **Enable Row Level Security (RLS)**: Restrict data access
4. **Rotate keys regularly**: Generate new keys periodically
5. **Monitor access logs**: Check Supabase dashboard for suspicious activity

## Monitoring

### Check Database Health

```bash
# View database size
SELECT pg_size_pretty(pg_database_size('postgres'));

# View table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Connections

In Supabase Dashboard:
1. Go to **Database** → **Connections**
2. View active connections
3. Monitor connection usage

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Supabase Dashboard**: https://app.supabase.com

## Support

For Supabase issues:
1. Check Supabase status: https://status.supabase.com
2. Review Supabase docs: https://supabase.com/docs
3. Contact Supabase support: https://supabase.com/support

For NetGuardPro issues:
1. Check GitHub issues: https://github.com/AIRATHEBEST/NetGuard-Pro/issues
2. Review application logs
3. Test connection: `pnpm test server/supabase.test.ts`
