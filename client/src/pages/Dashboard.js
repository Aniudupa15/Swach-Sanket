import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { 
  Calendar, 
  TrendingUp, 
  Save, 
  Trash2, 
  Search, 
  X, 
  LogOut, 
  Plus,
  Edit3,
  Home,
  BarChart3,
  Clock
} from "lucide-react";

const materialList = [
  { category: "Paper", name: "News Paper", color: "#8b5cf6" },
  { category: "Paper", name: "White & colored paper", color: "#8b5cf6" },
  { category: "Paper", name: "Notebooks & other books", color: "#8b5cf6" },
  { category: "Paper", name: "Cardboard", color: "#8b5cf6" },
  { category: "Paper", name: "Plastic lined board/whiteboard", color: "#8b5cf6" },
  { category: "Plastic", name: "PET bottle", color: "#3b82f6" },
  { category: "Plastic", name: "LDPE/HDPE carry bags", color: "#3b82f6" },
  { category: "Plastic", name: "Milk packets", color: "#3b82f6" },
  { category: "Plastic", name: "HDPE (shampoo bottles, cleaners)", color: "#3b82f6" },
  { category: "Plastic", name: "PVC (plumbing pipes)", color: "#3b82f6" },
  { category: "Plastic", name: "PP (Food containers)", color: "#3b82f6" },
  { category: "Plastic", name: "PP carry bags", color: "#3b82f6" },
  { category: "Plastic", name: "Laminates", color: "#3b82f6" },
  { category: "Plastic", name: "Tetra paks", color: "#3b82f6" },
  { category: "Plastic", name: "Thermocol/PS", color: "#3b82f6" },
  { category: "Plastic", name: "Paper cups/plates", color: "#3b82f6" },
  { category: "Plastic", name: "MLP", color: "#3b82f6" },
  { category: "Metal", name: "Aluminium foils", color: "#ef4444" },
  { category: "Metal", name: "Aluminium/tin cans", color: "#ef4444" },
  { category: "Metal", name: "Other metals", color: "#ef4444" },
  { category: "Glass", name: "Glass", color: "#10b981" },
  { category: "Rubber", name: "Tyres", color: "#f59e0b" },
  { category: "Rubber", name: "Toys, gloves, others", color: "#f59e0b" },
  { category: "Textile", name: "Textiles (clothes, bags, rags, etc.)", color: "#ec4899" },
  { category: "Ceramic", name: "Ceramic (plates, cups, pots, etc.)", color: "#14b8a6" },
  { category: "Leather", name: "Leather (belts, bags, tyres etc.)", color: "#a855f7" },
  { category: "Footwear", name: "Sandals, shoes, etc.", color: "#6366f1" },
  { category: "Fibrous organic", name: "Coconut shells and husks", color: "#84cc16" },
  { category: "E-waste", name: "All kinds of E-waste", color: "#64748b" },
  { category: "Others", name: "Rejects (silt, hair, dust)", color: "#78716c" },
];

export default function Dashboard() {
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, entry, history
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState({});
  const [data, setData] = useState(() =>
    materialList.reduce((acc, item) => {
      acc[item.name] = "";
      return acc;
    }, {})
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("mrf_data") || "{}");
    setEntries(stored);
    if (stored[selectedDate]) {
      setData(stored[selectedDate]);
    } else {
      setData(
        materialList.reduce((acc, item) => {
          acc[item.name] = "";
          return acc;
        }, {})
      );
    }
  }, [selectedDate]);

  const handleChange = (name, value) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updated = { ...entries, [selectedDate]: data };
    localStorage.setItem("mrf_data", JSON.stringify(updated));
    setEntries(updated);
    showNotif(`✅ Data saved successfully for ${selectedDate}`);
  };

  const handleDeleteEntry = (date) => {
    const updated = { ...entries };
    delete updated[date];
    localStorage.setItem("mrf_data", JSON.stringify(updated));
    setEntries(updated);
    showNotif(`🗑️ Deleted entry for ${date}`);
  };

  const showNotif = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
    window.location.href = "/login";
  };

  const chartData = useMemo(() => {
    const categoryTotals = {};
    materialList.forEach((item) => {
      const weight = parseFloat(data[item.name]) || 0;
      categoryTotals[item.category] = {
        total: (categoryTotals[item.category]?.total || 0) + weight,
        color: item.color
      };
    });
    return Object.entries(categoryTotals).map(([category, { total, color }]) => ({
      category,
      total,
      color,
    }));
  }, [data]);

  const totalWeight = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.total, 0);
  }, [chartData]);

  const materialsByCategory = useMemo(() => {
    const grouped = {};
    materialList.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    return grouped;
  }, []);

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return materialList;
    return materialList.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const historicalData = useMemo(() => {
    return Object.keys(entries)
      .sort()
      .slice(-7)
      .map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: Object.values(entries[date]).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
      }));
  }, [entries]);

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-xl p-6">
          <div className="text-sm opacity-90 mb-2">Total Weight Today</div>
          <div className="text-5xl font-bold mb-1">{totalWeight.toFixed(2)}</div>
          <div className="text-sm opacity-75">Kilograms</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl shadow-xl p-6">
          <div className="text-sm opacity-90 mb-2">Materials Recorded</div>
          <div className="text-5xl font-bold mb-1">
            {Object.values(data).filter(v => v && parseFloat(v) > 0).length}
          </div>
          <div className="text-sm opacity-75">of {materialList.length} items</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl shadow-xl p-6">
          <div className="text-sm opacity-90 mb-2">Total Entries</div>
          <div className="text-5xl font-bold mb-1">{Object.keys(entries).length}</div>
          <div className="text-sm opacity-75">Days recorded</div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-6">Today's Category Distribution</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {historicalData.length > 1 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-6">7-Day Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  // Quick Entry View
  const EntryView = () => (
    <div className="space-y-6">
      {/* Date & Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-purple-600" size={28} />
            <div>
              <label className="text-sm text-gray-500 block mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xl font-semibold border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition flex items-center gap-3"
          >
            <Save size={24} />
            Save Entry
          </button>
        </div>
      </div>

      {/* Entry Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setQuickAddMode(false)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              !quickAddMode
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📝 All Materials
          </button>
          <button
            onClick={() => setQuickAddMode(true)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
              quickAddMode
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚡ Quick Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
        <input
          type="text"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-purple-500 bg-white shadow-md"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Quick Add Mode */}
      {quickAddMode ? (
        <div className="space-y-4">
          {/* Category Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.keys(materialsByCategory).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`p-4 rounded-xl font-semibold transition ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
                }`}
                style={{
                  borderLeft: selectedCategory === category ? 'none' : `4px solid ${materialsByCategory[category][0].color}`
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Materials in Selected Category */}
          {selectedCategory && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: materialsByCategory[selectedCategory][0].color }}
                />
                {selectedCategory}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materialsByCategory[selectedCategory].map((item) => (
                  <div key={item.name} className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {item.name}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={data[item.name]}
                        onChange={(e) => handleChange(item.name, e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="flex-1 text-xl font-semibold border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-lg font-semibold text-gray-500">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // All Materials Mode
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((item) => (
            <div 
              key={item.name} 
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
              style={{ borderLeft: `4px solid ${item.color}` }}
            >
              <div className="text-xs text-gray-500 mb-1">{item.category}</div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                {item.name}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={data[item.name]}
                  onChange={(e) => handleChange(item.name, e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 text-lg font-semibold border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                />
                <span className="text-sm font-semibold text-gray-500">kg</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // History View
  const HistoryView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-6">Saved Entries</h3>
        {Object.keys(entries).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-4">📊</div>
            <p className="text-xl text-gray-500">No data saved yet</p>
            <button
              onClick={() => setCurrentView("entry")}
              className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
            >
              Start Entering Data
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(entries)
              .sort((a, b) => b.localeCompare(a))
              .map((date) => {
                const dateTotal = Object.entries(entries[date])
                  .reduce((sum, [, value]) => sum + (parseFloat(value) || 0), 0);
                return (
                  <div key={date} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl transition">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="text-green-500" size={24} />
                      <span className="text-4xl font-bold">{dateTotal.toFixed(2)}</span>
                      <span className="text-lg text-gray-500">kg</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {Object.entries(entries[date]).filter(
                        ([, value]) => value && parseFloat(value) > 0
                      ).length} materials recorded
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDate(date);
                          setCurrentView("entry");
                        }}
                        className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                      >
                        <Edit3 size={18} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(date)}
                        className="bg-red-50 text-red-600 px-4 py-3 rounded-xl hover:bg-red-100 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">MRF Dashboard</h1>
              <p className="text-purple-100 text-sm">Zilla Panchayat Material Recovery Facility</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-white/20 px-4 py-2 rounded-lg text-sm hidden md:block">
                {localStorage.getItem("user_email") || "user@example.com"}
              </span>
              <button 
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white shadow-md sticky top-[88px] z-40">
        <div className="container mx-auto px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`flex-1 md:flex-none py-4 px-6 font-semibold transition flex items-center justify-center gap-2 ${
                currentView === "dashboard"
                  ? 'text-purple-600 border-b-4 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home size={20} />
              <span className="hidden md:inline">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView("entry")}
              className={`flex-1 md:flex-none py-4 px-6 font-semibold transition flex items-center justify-center gap-2 ${
                currentView === "entry"
                  ? 'text-purple-600 border-b-4 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Plus size={20} />
              <span className="hidden md:inline">Data Entry</span>
            </button>
            <button
              onClick={() => setCurrentView("history")}
              className={`flex-1 md:flex-none py-4 px-6 font-semibold transition flex items-center justify-center gap-2 ${
                currentView === "history"
                  ? 'text-purple-600 border-b-4 border-purple-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock size={20} />
              <span className="hidden md:inline">History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "entry" && <EntryView />}
        {currentView === "history" && <HistoryView />}
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl animate-fade-in z-50">
          <div className="text-lg font-semibold">{notificationMessage}</div>
        </div>
      )}
    </div>
  );
}