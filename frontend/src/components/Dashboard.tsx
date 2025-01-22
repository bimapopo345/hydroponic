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

const Dashboard = () => {
  const [userData, setUserData] = useState<DashboardProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile>(defaultProfile);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = window.location.pathname.split("/").pop();
        const response = await fetch(
          `http://localhost:5000/dashboard/${userId}`
        );
        const data = await response.json();
        if (response.ok) {
          setUserData(data);
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
      const response = await fetch(`http://localhost:5000/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedProfile),
      });

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
            <button
              onClick={handleEditToggle}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={
                    editedProfile.avatar || "https://via.placeholder.com/150"
                  }
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover mx-auto"
                />
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600">
                    <Camera className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">
                {userData.username}
              </h3>
              <p className="text-gray-600">{userData.email}</p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={editedProfile.fullName}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {editedProfile.fullName || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={editedProfile.phone}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {editedProfile.phone || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="company"
                      value={editedProfile.company}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {editedProfile.company || "Not set"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Position
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="position"
                      value={editedProfile.position}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {editedProfile.position || "Not set"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={editedProfile.address}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {editedProfile.address || "Not set"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={editedProfile.bio}
                      onChange={handleProfileChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">
                      {editedProfile.bio || "No bio added"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">
                    Social Links
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      {isEditing ? (
                        <input
                          type="url"
                          name="socialLinks.facebook"
                          value={editedProfile.socialLinks.facebook}
                          onChange={handleProfileChange}
                          placeholder="Facebook URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : editedProfile.socialLinks.facebook ? (
                        <a
                          href={editedProfile.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {editedProfile.socialLinks.facebook}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <Twitter className="h-5 w-5 text-blue-400" />
                      {isEditing ? (
                        <input
                          type="url"
                          name="socialLinks.twitter"
                          value={editedProfile.socialLinks.twitter}
                          onChange={handleProfileChange}
                          placeholder="Twitter URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : editedProfile.socialLinks.twitter ? (
                        <a
                          href={editedProfile.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {editedProfile.socialLinks.twitter}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <Linkedin className="h-5 w-5 text-blue-700" />
                      {isEditing ? (
                        <input
                          type="url"
                          name="socialLinks.linkedin"
                          value={editedProfile.socialLinks.linkedin}
                          onChange={handleProfileChange}
                          placeholder="LinkedIn URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : editedProfile.socialLinks.linkedin ? (
                        <a
                          href={editedProfile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {editedProfile.socialLinks.linkedin}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <X className="h-5 w-5 inline-block mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      saveLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Save className="h-5 w-5 inline-block mr-2" />
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WaterStats />
        </motion.div>

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

export default Dashboard;
