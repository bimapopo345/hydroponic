const fs = require("fs");
const path = require("path");
const http = require("http");

// Paths yang perlu diupdate
const CONFIG_PATHS = {
  esp32: path.join(__dirname, "../esp32/config.h"),
  envLocal: path.join(__dirname, "../../frontend/.env.local"),
};

// Ambil URL ngrok dari API lokal
const getNgrokUrl = () => {
  return new Promise((resolve, reject) => {
    http
      .get("http://localhost:4040/api/tunnels", (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const tunnels = JSON.parse(data).tunnels;
            const httpsUrl = tunnels.find(
              (t) => t.proto === "https"
            ).public_url;
            resolve(httpsUrl);
          } catch (err) {
            reject(
              new Error(
                "Tidak dapat menemukan URL ngrok. Pastikan ngrok sudah berjalan."
              )
            );
          }
        });
      })
      .on("error", reject);
  });
};

// Update file ESP32 config.h
const updateEsp32Config = (ngrokUrl) => {
  try {
    let content = fs.readFileSync(CONFIG_PATHS.esp32, "utf8");
    content = content.replace(
      /(const char\* serverUrl = ")[^"]+(")/,
      `$1${ngrokUrl}/api/sensor-data$2`
    );
    fs.writeFileSync(CONFIG_PATHS.esp32, content);
    console.log("✅ Updated ESP32 config.h");
  } catch (err) {
    console.error("❌ Error updating ESP32 config:", err.message);
  }
};

// Update file .env.local
const updateEnvLocal = (ngrokUrl) => {
  try {
    const envContent = `# Local overrides - jangan commit file ini
# Update otomatis oleh script update-ngrok.js
VITE_API_URL=${ngrokUrl}
`;
    fs.writeFileSync(CONFIG_PATHS.envLocal, envContent);
    console.log("✅ Updated frontend .env.local");
  } catch (err) {
    console.error("❌ Error updating .env.local:", err.message);
  }
};

// Main function
const main = async () => {
  console.log("🔍 Mencari URL ngrok...");

  try {
    const ngrokUrl = await getNgrokUrl();
    console.log(`📡 Ditemukan URL ngrok: ${ngrokUrl}`);

    updateEsp32Config(ngrokUrl);
    updateEnvLocal(ngrokUrl);

    console.log("\n✨ Update selesai! Langkah selanjutnya:");
    console.log("1. Upload ulang kode ke ESP32");
    console.log("2. Restart frontend development server");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    console.log("\n💡 Pastikan:");
    console.log("1. Ngrok sudah berjalan (ngrok http 5000)");
    console.log("2. Dashboard ngrok dapat diakses di localhost:4040");
  }
};

// Jalankan script
main();
