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
  { value: "second" as UpdateInterval, label: "Every Second", ms: 1000 },
  { value: "minute" as UpdateInterval, label: "Every Minute", ms: 60000 },
  { value: "hour" as UpdateInterval, label: "Hourly", ms: 3600000 },
  { value: "day" as UpdateInterval, label: "Daily", ms: 86400000 },
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
        <span className="text-gray-500 text-sm ml-2">vs last update</span>
      </div>
    </motion.div>
  );
}

// Generate random stats
function randomTDS() {
  return Number((Math.random() * (900 - 200) + 200).toFixed(1));
}
function randomEC() {
  return Number((Math.random() * (1500 - 500) + 500).toFixed(1));
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
      ec: randomEC(),
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
  const [ec, setEC] = useState(randomEC());
  const [temperature, setTemperature] = useState(randomTemperature());
  const [ph, setPH] = useState(randomPH());

  const [tdsChange, setTDSChange] = useState(0);
  const [ecChange, setECChange] = useState(0);
  const [tempChange, setTempChange] = useState(0);
  const [phChange, setPHChange] = useState(0);

  const [chartData, setChartData] = useState(generateInitialData());

  const updateStats = () => {
    const newTDS = randomTDS();
    const newEC = randomEC();
    const newTemp = randomTemperature();
    const newPH = randomPH();

    setTDSChange(((newTDS - tds) / tds) * 100);
    setECChange(((newEC - ec) / ec) * 100);
    setTempChange(((newTemp - temperature) / temperature) * 100);
    setPHChange(((newPH - ph) / ph) * 100);

    setTDS(newTDS);
    setEC(newEC);
    setTemperature(newTemp);
    setPH(newPH);

    // Update chart data
    setChartData((prev) => {
      const updated = [
        ...prev.slice(1),
        {
          time: new Date().toLocaleTimeString(),
          tds: newTDS,
          ec: newEC,
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
  }, [updateInterval, isUpdating, tds, ec, temperature, ph]);

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
      className="py-20 bg-gradient-to-br from-blue-50 to-teal-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Nutrient Solution Dashboard
          </h2>
          <p className="text-xl text-gray-600">
            Real-time monitoring of TDS, EC, pH, and temperature
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Update Interval:</span>
          </div>
          {intervalOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleIntervalChange(option.value)}
              className={`px-4 py-2 rounded-lg transition-all ${
                updateInterval === option.value
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-blue-50"
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
            {isUpdating ? "Pause Updates" : "Resume Updates"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="TDS"
            value={tds.toString()}
            unit="ppm"
            icon={<Droplets className="w-6 h-6 text-blue-500" />}
            color="border-l-blue-500"
            change={tdsChange}
          />
          <StatCard
            title="EC"
            value={ec.toString()}
            unit="µS/cm"
            icon={<Ruler className="w-6 h-6 text-orange-500" />}
            color="border-l-orange-500"
            change={ecChange}
          />
          <StatCard
            title="Temperature"
            value={temperature.toString()}
            unit="°C"
            icon={<Thermometer className="w-6 h-6 text-red-500" />}
            color="border-l-red-500"
            change={tempChange}
          />
          <StatCard
            title="pH"
            value={ph.toString()}
            unit=""
            icon={<Flower2 className="w-6 h-6 text-green-500" />}
            color="border-l-green-500"
            change={phChange}
          />
        </div>

        <div className="mt-12 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Historical Data
          </h3>
          <div className="h-[400px]">
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
                  stroke="#3B82F6"
                  name="TDS (ppm)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ec"
                  stroke="#F97316"
                  name="EC (µS/cm)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#EF4444"
                  name="Temperature (°C)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ph"
                  stroke="#10B981"
                  name="pH"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Updates {getUpdateText()}.{!isUpdating && " (Updates paused)"}
          </p>
        </div>
      </div>
    </div>
  );
}
