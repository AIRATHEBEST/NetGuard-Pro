# NetGuardPro - Router Setup Guide

## Overview

NetGuardPro is a comprehensive network security monitoring application that supports real-time device scanning and management for Huawei and RAIN 101 routers.

## Supported Routers

### Huawei Routers
- **Models**: B535, B715, B818, and other Huawei router models
- **Access URL**: `http://192.168.8.1/html/content.html#home`
- **Default Credentials**: admin / (varies by model)
- **Features**:
  - Real-time device discovery
  - Device blocking/unblocking
  - Router statistics
  - DHCP client management

### RAIN 101 Router
- **South African mobile router**
- **Default Access**: `http://192.168.1.1` (varies)
- **Features**:
  - Device discovery
  - Bandwidth monitoring
  - Signal strength tracking
  - Device management

## Initial Setup

### 1. Configure Router Settings

1. Open NetGuardPro dashboard
2. Navigate to **Settings** tab
3. Click **Configure Router**
4. Select your router type (Huawei or RAIN 101)
5. Enter router credentials:
   - **Router IP**: e.g., `192.168.8.1`
   - **Username**: admin
   - **Password**: Your router password
6. Click **Save Settings**

### 2. First Device Scan

1. Go to **Devices** tab
2. Click **Scan Network**
3. Select your router type and credentials
4. Wait for scan to complete
5. All connected devices will be displayed

### 3. Enable Real-Time Monitoring

1. Go to **Settings**
2. Enable **Real-Time Monitoring**
3. Set scan interval (default: 300 seconds / 5 minutes)
4. Click **Start Monitoring**

## Security Features

### Device Risk Assessment
- **Automatic Risk Scoring**: Each device gets a risk score (0-100)
- **Risk Levels**: Low, Medium, High, Critical
- **LLM Analysis**: AI-powered threat detection

### Device Management
- **Block/Unblock**: Control device access via router
- **Custom Naming**: Rename devices for easy identification
- **History Tracking**: View all device events and changes

### Alerts & Notifications
- **New Device Alert**: Notified when new devices connect
- **High-Risk Alert**: Alerted to suspicious devices
- **Offline Alert**: Notified when devices go offline
- **Multi-Channel**: In-app and email notifications

## API Endpoints

### Router Scanning
```
POST /api/trpc/router.scan
Input: {
  routerType: "huawei" | "rain101",
  routerIp: "192.168.8.1",
  username: "admin",
  password: "password"
}
```

### Device Management
```
POST /api/trpc/router.blockDevice
POST /api/trpc/router.unblockDevice
```

### Device List
```
GET /api/trpc/devices.list
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to router
- Check router IP address is correct
- Verify router is powered on and connected
- Ensure credentials are correct
- Check firewall isn't blocking access

**Solution**:
1. Test router access manually: `http://192.168.8.1`
2. Verify credentials in router admin panel
3. Check network connectivity

### No Devices Found

**Problem**: Scan completes but no devices shown
- Router may not have devices connected
- Credentials might be incorrect
- API endpoints may have changed

**Solution**:
1. Manually check router admin panel for connected devices
2. Verify credentials are correct
3. Try manual scan again
4. Check application logs for errors

### Device Blocking Not Working

**Problem**: Cannot block devices
- Router may not support blocking via API
- Credentials may lack required permissions
- Device may already be blocked

**Solution**:
1. Check if router admin account has full permissions
2. Try blocking device manually in router admin
3. Check device MAC address is correct

## Advanced Configuration

### Custom Scan Intervals

```javascript
// Set scan interval in seconds
scanInterval: 300 // 5 minutes
```

### Encryption

Credentials are encrypted using AES-256-GCM:
- Encryption key: Derived from environment variable `ENCRYPTION_KEY`
- Storage: Encrypted in database
- Never logged in plaintext

### Multiple Router Support

NetGuardPro supports managing multiple routers:
1. Configure primary router (Huawei)
2. Add secondary router (RAIN 101)
3. Scans run on all configured routers
4. Devices from all routers displayed in unified dashboard

## Performance Optimization

### Recommended Settings

- **Scan Interval**: 300-600 seconds (5-10 minutes)
- **Max Devices**: 100+ devices supported
- **Database**: Optimized for 10,000+ historical records
- **Memory**: ~100MB for active scanning

### Scaling Considerations

- Use database indexing on MAC address and IP
- Implement caching for device lists
- Archive old history records (>90 days)
- Use connection pooling for database

## Security Best Practices

1. **Change Default Credentials**: Update router password immediately
2. **Use HTTPS**: Always access NetGuardPro over HTTPS
3. **Firewall Rules**: Restrict router access to trusted networks
4. **Regular Updates**: Keep NetGuardPro updated
5. **Monitor Alerts**: Review security alerts regularly
6. **Backup Data**: Regular database backups

## Support & Debugging

### Enable Debug Logging

Set environment variable:
```bash
DEBUG=netguardpro:*
```

### Check Logs

- Server logs: `/var/log/netguardpro/server.log`
- Database logs: Check database connection logs
- Browser console: F12 → Console tab

### Contact Support

For issues:
1. Check this documentation
2. Review application logs
3. Test router access manually
4. Contact support with logs attached

## Updates & Changelog

### Version 1.0
- Initial release
- Huawei router support
- RAIN 101 router support
- Real-time device monitoring
- LLM-powered threat analysis
- Multi-channel alerts

## License

NetGuardPro - Network Security Monitoring
Copyright © 2026. All rights reserved.
