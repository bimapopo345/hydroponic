# HidroNutrient Monitoring System

Sistem monitoring hidroponik dengan ESP32-S3 dan web dashboard.

## Quick Start

1. Clone repository:

```bash
git clone https://github.com/yourusername/hidronutrient.git
cd hidronutrient
```

2. Install dependencies:

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

3. Setup development environment:

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## Using Ngrok for Remote Access

1. Install ngrok:

```bash
cd backend
npm install
```

2. Start services in order:

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Ngrok tunnel
cd backend
npm run ngrok
# Copy the https URL that appears

# Terminal 3: Update configurations
cd backend
npm run update-ngrok
```

3. Update ESP32:

- Upload kode terbaru ke ESP32 setelah URL ngrok diupdate
- ESP32 akan otomatis terhubung ke URL baru

## Folder Structure

```
/
├── backend/
│   ├── esp32/           # Kode ESP32
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── scripts/         # Utility scripts
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   └── config/      # API configuration
│   └── public/          # Static files
```

## Environment Files

1. Frontend:

- `.env.development`: Development settings
- `.env.production`: Production settings
- `.env.local`: Local overrides (diupdate otomatis)

2. Backend:

- `esp32/config.h`: ESP32 configuration
- `.env`: Server environment variables

## Development Workflow

1. Local Development:

```bash
# Start backend
npm run dev

# Start frontend
cd frontend && npm run dev
```

2. Remote Development dengan Ngrok:

```bash
# 1. Start backend
npm run dev

# 2. Start ngrok
npm run ngrok

# 3. Update konfigurasi
npm run update-ngrok

# 4. Upload ulang kode ESP32
```

## Monitoring & Troubleshooting

1. ESP32 Serial Monitor:

- Baud rate: 115200
- Output: Sensor data, WiFi status, API calls

2. Ngrok Dashboard:

- URL: http://localhost:4040
- Monitoring: Request/response, errors

3. Backend Logs:

- Server status
- Database connections
- API calls

## Production Deployment

1. Frontend:

```bash
cd frontend
npm run build
```

2. Backend:

```bash
cd backend
npm start
```

3. ESP32:

- Set `USE_NGROK` ke `false`
- Update `serverUrl` ke URL production
- Upload kode final

## Security Notes

1. Credentials:

- Jangan commit file `.env`
- Ganti password WiFi di production
- Gunakan environment variables

2. API Security:

- HTTPS untuk production
- Implement rate limiting
- Validate sensor data

3. Database:

- Backup regular
- Monitor storage usage
- Cleanup old data

## Maintainers

- [Your Name](https://github.com/yourusername)

## License

MIT License - see LICENSE file for details
