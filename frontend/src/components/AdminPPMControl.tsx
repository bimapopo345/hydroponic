import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sprout, Calendar, CheckCircle } from "lucide-react";

const PPM_VALUES: Record<string, number[]> = {
  selada: [100, 400, 800],
  pakcoy: [100, 400, 800],
};

interface AdminPPMControlProps {
  isAdmin: boolean;
}

const AdminPPMControl: React.FC<AdminPPMControlProps> = ({ isAdmin }) => {
  // Jika bukan admin, tidak tampilkan komponen
  if (!isAdmin) return null;

  const [selectedPlant, setSelectedPlant] = useState<
    "selada" | "pakcoy" | null
  >(null);
  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handlePlantSelect = (plant: "selada" | "pakcoy") => {
    setSelectedPlant(plant);
    setSelectedWeek(null);
  };

  const handleWeekSelect = (week: 1 | 2 | 3) => {
    setSelectedWeek(week);
  };

  const handleConfirm = async () => {
    if (!selectedPlant || !selectedWeek) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/update-ppm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceId: "ESP32_01",
            plantType: selectedPlant,
            weekNumber: selectedWeek,
            ppmThreshold: PPM_VALUES[selectedPlant][selectedWeek - 1],
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "PPM threshold berhasil diupdate!",
        });
      } else {
        throw new Error(data.error || "Gagal mengupdate PPM threshold");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Gagal mengupdate PPM threshold. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Kontrol PPM (Admin Only)
      </h2>

      {/* Plant Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Pilih Tanaman:
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {["selada", "pakcoy"].map((plant) => (
            <button
              key={plant}
              onClick={() => handlePlantSelect(plant as "selada" | "pakcoy")}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedPlant === plant
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-green-200"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sprout
                  className={`w-6 h-6 ${
                    selectedPlant === plant ? "text-green-500" : "text-gray-400"
                  }`}
                />
                <span
                  className={`font-medium ${
                    selectedPlant === plant ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  {plant.charAt(0).toUpperCase() + plant.slice(1)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Week Selection */}
      {selectedPlant && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Pilih Minggu:
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((week) => (
              <button
                key={week}
                onClick={() => handleWeekSelect(week as 1 | 2 | 3)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedWeek === week
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Calendar
                    className={`w-6 h-6 ${
                      selectedWeek === week ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      selectedWeek === week ? "text-blue-700" : "text-gray-600"
                    }`}
                  >
                    Minggu {week}
                  </span>
                  <span className="text-sm text-gray-500">
                    {PPM_VALUES[selectedPlant][week - 1]} PPM
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confirm Button */}
      {selectedPlant && selectedWeek && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>
                {loading ? "Memperbarui..." : "Konfirmasi & Update PPM"}
              </span>
            </div>
          </button>

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Current Settings Display */}
      {selectedPlant && selectedWeek && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 p-4 bg-gray-50 rounded-lg"
        >
          <h4 className="font-medium text-gray-700 mb-2">
            Pengaturan yang akan diterapkan:
          </h4>
          <ul className="space-y-2 text-gray-600">
            <li>
              • Tanaman:{" "}
              {selectedPlant.charAt(0).toUpperCase() + selectedPlant.slice(1)}
            </li>
            <li>• Minggu ke-{selectedWeek}</li>
            <li>• Target PPM: {PPM_VALUES[selectedPlant][selectedWeek - 1]}</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default AdminPPMControl;
