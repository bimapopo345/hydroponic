// Konfigurasi WiFi
const char* ssid = "BPSI AGROKLIMAT";
const char* password = "klimat2025";

// Konfigurasi Server
const char* serverUrl = "http://localhost:5000/api/sensor-data";
const char* userId = "your-user-id"; // Ganti dengan user ID dari database
const char* deviceId = "ESP32_01";

// Konfigurasi Pin Sensor
const int TDS_PIN = 34;     // Pin ADC untuk sensor TDS/PPM
const int PH_PIN = 35;      // Pin ADC untuk sensor pH
const int TRIG_PIN = 5;     // Pin trigger sensor ultrasonik
const int ECHO_PIN = 18;    // Pin echo sensor ultrasonik
const int TEMP_PIN = 19;    // Pin data sensor suhu DS18B20

// Konfigurasi Waktu
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200;     // GMT+7 (dalam detik)
const int daylightOffset_sec = 0;

// Konfigurasi Buffer
const int BUFFER_SIZE = 3600;         // 1 jam data (1 data/detik)
const int BATCH_SIZE = 5;             // Jumlah data yang dikirim per batch
const int SEND_INTERVAL = 5000;       // Interval pengiriman (5 detik)
const int RETRY_INTERVAL = 60000;     // Interval retry jika gagal (1 menit)
const int MAX_RETRY = 10;             // Maksimal percobaan retry

// Nama file untuk penyimpanan di SPIFFS
const char* BACKUP_FILE = "/sensor_backup.dat";

// Task Priorities
const int SENSOR_TASK_PRIORITY = 1;
const int SENDER_TASK_PRIORITY = 1;

// Task Core Assignment
const int SENSOR_TASK_CORE = 0;  // Core untuk membaca sensor
const int SENDER_TASK_CORE = 1;  // Core untuk mengirim data
