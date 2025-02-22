import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplets, Thermometer, Ruler, Flower2, Clock } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type UpdateInterval = "second" | "minute" | "hour" | "day";

const intervalOptions = [
  { value: "second" as UpdateInterval, label: "Setiap Detik", ms: 1000 },
  { value: "minute" as UpdateInterval, label: "Setiap Menit", ms: 60000 },
  { value: "hour" as UpdateInterval, label: "Per Jam", ms: 3600000 },
  { value: "day" as UpdateInterval, label: "Per Hari", ms: 86400000 },
];

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  icon: JSX.Element;
  color: string;
  change: number;
}

function StatCard({ title, value, unit, icon, color, change }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${color}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold">
            {value}
            <span className="text-gray-500 text-lg ml-1">{unit}</span>
          </h3>
        </div>
        <div
          className={`p-2 rounded-lg ${color
            .replace("border-l", "bg")
            .replace("-500", "-100")}`}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-center">
        <span
          className={`text-sm ${
            change >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
        </span>
        <span className="text-gray-500 text-sm ml-2">vs update terakhir</span>
      </div>
    </motion.div>
  );
}

// Generate random stats
function randomTDS() {
  return Number((Math.random() * (900 - 200) + 200).toFixed(1));
}
function randomDistance() {
  return Number((Math.random() * (100 - 5) + 5).toFixed(1));
}
function randomTemperature() {
  return Number((Math.random() * (30 - 20) + 20).toFixed(1));
}
function randomPH() {
  return Number((Math.random() * (7 - 5.5) + 5.5).toFixed(1));
}
function randomChange() {
  return Number((Math.random() * 4 - 2).toFixed(1)); // -2% to +2%
}

// Generate some initial data for the chart
function generateInitialData() {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    data.push({
      time: `${i}:00`,
      tds: randomTDS(),
      distance: randomDistance(),
      temperature: randomTemperature(),
      ph: randomPH(),
    });
  }
  return data;
}

export default function WaterStats() {
  const [updateInterval, setUpdateInterval] =
    useState<UpdateInterval>("second");
  const [isUpdating, setIsUpdating] = useState(true);

  const [tds, setTDS] = useState(randomTDS());
  const [distance, setDistance] = useState(randomDistance());
  const [temperature, setTemperature] = useState(randomTemperature());
  const [ph, setPH] = useState(randomPH());

  const [tdsChange, setTDSChange] = useState(0);
  const [distanceChange, setDistanceChange] = useState(0);
  const [tempChange, setTempChange] = useState(0);
  const [phChange, setPHChange] = useState(0);

  const [chartData, setChartData] = useState(generateInitialData());

  const updateStats = () => {
    const newTDS = randomTDS();
    const newDistance = randomDistance();
    const newTemp = randomTemperature();
    const newPH = randomPH();

    setTDSChange(((newTDS - tds) / tds) * 100);
    setDistanceChange(((newDistance - distance) / distance) * 100);
    setTempChange(((newTemp - temperature) / temperature) * 100);
    setPHChange(((newPH - ph) / ph) * 100);

    setTDS(newTDS);
    setDistance(newDistance);
    setTemperature(newTemp);
    setPH(newPH);

    // Update chart data
    setChartData((prev) => {
      const updated = [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString(),
          tds: newTDS,
          distance: newDistance,
          temperature: newTemp,
          ph: newPH,
        },
      ];
      return updated;
    });
  };

  useEffect(() => {
    let intervalId: number | null = null;

    if (isUpdating) {
      const selectedInterval = intervalOptions.find(
        (opt) => opt.value === updateInterval
      );
      if (selectedInterval) {
        intervalId = window.setInterval(updateStats, selectedInterval.ms);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [updateInterval, isUpdating, tds, distance, temperature, ph]);

  const getUpdateText = () => {
    const intervalOption = intervalOptions.find(
      (opt) => opt.value === updateInterval
    );
    return intervalOption?.label.toLowerCase() || "every second";
  };

  const handleIntervalChange = (value: UpdateInterval) => {
    setUpdateInterval(value);
  };

  const handleUpdateToggle = () => {
    setIsUpdating(!isUpdating);
  };

  return (
    <div
      id="water-stats"
      className="py-20 bg-gradient-to-br from-green-50 to-emerald-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Dashboard Monitoring Nutrisi
          </h2>
          <p className="text-xl text-gray-600">
            Pemantauan Realtime Suhu, pH, Jarak, dan PPM
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Interval Update:</span>
          </div>
          {intervalOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleIntervalChange(option.value)}
              className={`px-4 py-2 rounded-lg transition-all ${
                updateInterval === option.value
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-green-50"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            onClick={handleUpdateToggle}
            className={`px-4 py-2 rounded-lg transition-all ${
              isUpdating ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {isUpdating ? "Hentikan Update" : "Mulai Update"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="PPM"
            value={tds.toString()}
            unit="ppm"
            icon={<Droplets className="w-6 h-6 text-green-600" />}
            color="border-l-green-600"
            change={tdsChange}
          />
          <StatCard
            title="Jarak Air"
            value={distance.toString()}
            unit="cm"
            icon={<Ruler className="w-6 h-6 text-emerald-500" />}
            color="border-l-emerald-500"
            change={distanceChange}
          />
          <StatCard
            title="Suhu"
            value={temperature.toString()}
            unit="°C"
            icon={<Thermometer className="w-6 h-6 text-emerald-600" />}
            color="border-l-emerald-600"
            change={tempChange}
          />
          <StatCard
            title="pH"
            value={ph.toString()}
            unit=""
            icon={<Flower2 className="w-6 h-6 text-emerald-500" />}
            color="border-l-emerald-500"
            change={phChange}
          />
        </div>

        <div className="mt-12">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Data Historis
            </h3>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tds"
                    stroke="#059669"
                    name="PPM (ppm)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="distance"
                    stroke="#0EA5E9"
                    name="Jarak Air (cm)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#047857"
                    name="Suhu (°C)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ph"
                    stroke="#10B981"
                    name="pH Level"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Update {getUpdateText()}.{!isUpdating && " (Update dihentikan)"}
          </p>
        </div>
      </div>
    </div>
  );
}
