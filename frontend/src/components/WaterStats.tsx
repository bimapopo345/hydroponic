import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Droplets, Thermometer, Activity, Filter, Clock } from "lucide-react";
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

interface StatCardProps {
  title: string;
  value: string;
  unit: string;
  icon: JSX.Element;
  color: string;
  change: number;
}

type UpdateInterval = "second" | "minute" | "hour" | "day";

// Generate random data within acceptable ranges
const generateRandomValue = (min: number, max: number) => {
  return Number((Math.random() * (max - min) + min).toFixed(1));
};

const getRandomChange = () => {
  return Number((Math.random() * 4 - 2).toFixed(1)); // Random change between -2 and 2
};

// Generate historical data with more randomization
const generateHistoricalData = () => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    data.push({
      time: `${i}:00`,
      ph: generateRandomValue(6.5, 7.5),
      temperature: generateRandomValue(23, 27),
      oxygen: generateRandomValue(7, 9),
      turbidity: generateRandomValue(4, 6),
    });
  }
  return data;
};

const StatCard = ({
  title,
  value,
  unit,
  icon,
  color,
  change,
}: StatCardProps) => (
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
        className={`text-sm ${change >= 0 ? "text-green-500" : "text-red-500"}`}
      >
        {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
      </span>
      <span className="text-gray-500 text-sm ml-2">vs last update</span>
    </div>
  </motion.div>
);

const intervalOptions = [
  { value: "second" as UpdateInterval, label: "Every Second", ms: 1000 },
  { value: "minute" as UpdateInterval, label: "Every Minute", ms: 60000 },
  { value: "hour" as UpdateInterval, label: "Hourly", ms: 3600000 },
  { value: "day" as UpdateInterval, label: "Daily", ms: 86400000 },
];

interface Stat {
  value: number;
  change: number;
}

interface Stats {
  ph: Stat;
  temperature: Stat;
  oxygen: Stat;
  turbidity: Stat;
}

export default function WaterStats() {
  const [updateInterval, setUpdateInterval] =
    useState<UpdateInterval>("second");
  const [isUpdating, setIsUpdating] = useState(true);

  const [stats, setStats] = useState<Stats>({
    ph: { value: 7.0, change: 0 },
    temperature: { value: 25.0, change: 0 },
    oxygen: { value: 8.0, change: 0 },
    turbidity: { value: 5.0, change: 0 },
  });

  const [historicalData, setHistoricalData] = useState(
    generateHistoricalData()
  );

  const updateStats = () => {
    const newStats = {
      ph: {
        value: generateRandomValue(6.5, 7.5),
        change: getRandomChange(),
      },
      temperature: {
        value: generateRandomValue(23, 27),
        change: getRandomChange(),
      },
      oxygen: {
        value: generateRandomValue(7, 9),
        change: getRandomChange(),
      },
      turbidity: {
        value: generateRandomValue(4, 6),
        change: getRandomChange(),
      },
    };

    setStats(newStats);

    setHistoricalData((currentData) => [
      ...currentData.slice(1),
      {
        time: new Date().toLocaleTimeString(),
        ph: newStats.ph.value,
        temperature: newStats.temperature.value,
        oxygen: newStats.oxygen.value,
        turbidity: newStats.turbidity.value,
      },
    ]);
  };

  useEffect(() => {
    let intervalId: number | null = null;

    if (isUpdating) {
      const currentInterval = intervalOptions.find(
        (opt) => opt.value === updateInterval
      );
      if (currentInterval) {
        // Clear any existing interval before setting a new one
        if (intervalId) {
          clearInterval(intervalId);
        }

        // Set new interval with the correct timing
        intervalId = window.setInterval(updateStats, currentInterval.ms);
      }
    }

    // Cleanup function to clear interval when component unmounts or dependencies change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [updateInterval, isUpdating]); // Dependencies array includes both updateInterval and isUpdating

  const handleIntervalChange = (newInterval: UpdateInterval) => {
    setUpdateInterval(newInterval);
  };

  const handleUpdateToggle = () => {
    setIsUpdating(!isUpdating);
  };

  const getUpdateText = () => {
    const intervalOption = intervalOptions.find(
      (opt) => opt.value === updateInterval
    );
    return intervalOption?.label.toLowerCase() || "every second";
  };

  return (
    <div
      id="water-stats"
      className="py-20 bg-gradient-to-br from-blue-50 to-teal-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Water Quality Dashboard
          </h2>
          <p className="text-xl text-gray-600">
            Real-time monitoring of key water parameters
          </p>
        </div>

        {/* Update Interval Controls */}
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
            title="pH Level"
            value={stats.ph.value.toString()}
            unit="pH"
            icon={<Droplets className="w-6 h-6 text-blue-500" />}
            color="border-l-blue-500"
            change={stats.ph.change}
          />
          <StatCard
            title="Temperature"
            value={stats.temperature.value.toString()}
            unit="°C"
            icon={<Thermometer className="w-6 h-6 text-red-500" />}
            color="border-l-red-500"
            change={stats.temperature.change}
          />
          <StatCard
            title="Dissolved Oxygen"
            value={stats.oxygen.value.toString()}
            unit="mg/L"
            icon={<Activity className="w-6 h-6 text-green-500" />}
            color="border-l-green-500"
            change={stats.oxygen.change}
          />
          <StatCard
            title="Turbidity"
            value={stats.turbidity.value.toString()}
            unit="NTU"
            icon={<Filter className="w-6 h-6 text-amber-500" />}
            color="border-l-amber-500"
            change={stats.turbidity.change}
          />
        </div>

        {/* Historical Data Charts */}
        <div className="mt-12 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Historical Data
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ph"
                  stroke="#3B82F6"
                  name="pH Level"
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
                  dataKey="oxygen"
                  stroke="#10B981"
                  name="Dissolved Oxygen (mg/L)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="turbidity"
                  stroke="#F59E0B"
                  name="Turbidity (NTU)"
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
