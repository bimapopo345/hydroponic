import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  LogOut,
  Camera,
  Facebook,
  Twitter,
  Linkedin,
  Save,
  X,
  Sprout,
} from "lucide-react";
import WaterStats from "./WaterStats";
import AdminPPMControl from "./AdminPPMControl";

interface Profile {
  fullName: string;
  avatar: string;
  bio: string;
  phone: string;
  address: string;
  company: string;
  position: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
  };
}

interface DashboardProps {
  username: string;
  email: string;
  profile: Profile;
  dashboardData: {
    lastLogin: string;
    stats: {
      tds: number;
      ec: number;
      temperature: number;
      ph: number;
    };
    history: any[];
  };
}

const defaultProfile: Profile = {
  fullName: "",
  avatar: "",
  bio: "",
  phone: "",
  address: "",
  company: "",
  position: "",
  socialLinks: {
    facebook: "",
    twitter: "",
    linkedin: "",
  },
};

const DashboardWithAdmin = () => {
  const [userData, setUserData] = useState<DashboardProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile>(defaultProfile);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const currentUserId = window.location.pathname.split("/").pop() || "";
    setUserId(currentUserId);

    const fetchUserData = async () => {
      try {
        if (!currentUserId) {
          console.error("No userId found in URL");
          return;
        }
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/dashboard/${currentUserId}`
        );
        const data = await response.json();

        if (response.ok) {
          setUserData(data);
          // Set isAdmin jika username adalah Bima Prawang Saputra
          setIsAdmin(data.username === "Bima Prawang Saputra");
          setEditedProfile(data.profile || defaultProfile);
        } else {
          setError(data.error || "Failed to load user data");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    window.location.href = "/login";
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedProfile(userData?.profile || defaultProfile);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      if (parent === "socialLinks") {
        setEditedProfile({
          ...editedProfile,
          socialLinks: {
            ...editedProfile.socialLinks,
            [child]: value,
          },
        });
      }
    } else {
      setEditedProfile({
        ...editedProfile,
        [name]: value,
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setEditedProfile({
            ...editedProfile,
            avatar: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setError("");
    setMessage("");

    try {
      const userId = window.location.pathname.split("/").pop();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/profile/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedProfile),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Profile updated successfully!");
        setUserData((prev) =>
          prev ? { ...prev, profile: editedProfile } : null
        );
        setIsEditing(false);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError("An error occurred while saving the profile");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sprout size={48} className="text-blue-500" />
          </motion.div>
          <p className="mt-4 text-gray-600">Loading your hydroponic data...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Failed to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sprout className="h-8 w-8 text-green-500" />
              <span className="ml-2 text-xl font-semibold text-gray-800">
                HidroNutrient
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-500" />
                <span className="ml-2 text-gray-700">{userData.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          {/* ... (Profile Section Content - sama seperti di Dashboard.tsx) ... */}
        </motion.div>

        {/* Water Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WaterStats useDummyData={false} userId={userId} />
        </motion.div>

        {/* Admin PPM Control Section - Hanya muncul untuk admin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AdminPPMControl isAdmin={isAdmin} />
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6 mt-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Hydroponic Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-700">TDS Levels</h3>
              <p className="text-gray-600 mt-2">
                Keep TDS in the right range for your specific crops.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-700">EC Monitoring</h3>
              <p className="text-gray-600 mt-2">
                Proper EC ensures balanced nutrient uptake.
              </p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg">
              <h3 className="font-semibold text-cyan-700">Temperature</h3>
              <p className="text-gray-600 mt-2">
                Stable root-zone temperatures boost plant vitality.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardWithAdmin;
