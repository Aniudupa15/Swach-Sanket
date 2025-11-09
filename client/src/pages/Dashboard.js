import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Clock,
  ArrowRight,
  ChevronRight
} from "lucide-react";

const MATERIALS = [
  { category: "Paper", items: ["News Paper", "White & colored paper", "Notebooks & other books", "Cardboard", "Plastic lined board/whiteboard"], color: "#8b5cf6" },
  { category: "Plastic", items: ["PET bottle", "LDPE/HDPE carry bags", "Milk packets", "HDPE (shampoo bottles, cleaners)", "PVC (plumbing pipes)", "PP (Food containers)", "PP carry bags", "Laminates", "Tetra paks", "Thermocol/PS", "Paper cups/plates", "MLP"], color: "#3b82f6" },
  { category: "Metal", items: ["Aluminium foils", "Aluminium/tin cans", "Other metals"], color: "#ef4444" },
  { category: "Glass", items: ["Glass"], color: "#10b981" },
  { category: "Rubber", items: ["Tyres", "Toys, gloves, others"], color: "#f59e0b" },
  { category: "Textile", items: ["Textiles (clothes, bags, rags, etc.)"], color: "#ec4899" },
  { category: "Ceramic", items: ["Ceramic (plates, cups, pots, etc.)"], color: "#14b8a6" },
  { category: "Leather", items: ["Leather (belts, bags, tyres etc.)"], color: "#a855f7" },
  { category: "Footwear", items: ["Sandals, shoes, etc."], color: "#6366f1" },
  { category: "Fibrous organic", items: ["Coconut shells and husks"], color: "#84cc16" },
  { category: "E-waste", items: ["All kinds of E-waste"], color: "#64748b" },
  { category: "Others", items: ["Rejects (silt, hair, dust)"], color: "#78716c" },
];

const flatMaterials = MATERIALS.flatMap(cat => 
  cat.items.map(item => ({ name: item, category: cat.category, color: cat.color }))
);

export default function Dashboard() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  
  const [view, setView] = useState("dashboard");
  const [entries, setEntries] = useState({});
  const [data, setData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "" });
  const [mode, setMode] = useState("easy");
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");

  // Load data on mount
  useEffect(() => {
    const stored = localStorage.getItem("mrf_data");
    if (stored) {
      const parsed = JSON.parse(stored);
      setEntries(parsed);
      setData(parsed[today] || {});
    }
  }, [today]);

  // Auto-save helper
  const autoSave = useCallback((newData) => {
    const updated = { ...entries, [today]: newData };
    localStorage.setItem("mrf_data", JSON.stringify(updated));
    setEntries(updated);
  }, [entries, today]);

  // Notifications
  const notify = useCallback((message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: "" }), 2500);
  }, []);

  // Handle value change
  const updateValue = useCallback((name, value) => {
    setData(prev => {
      const updated = { ...prev, [name]: value };
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  // Easy mode navigation
  const nextItem = useCallback(() => {
    const currentCategory = MATERIALS[categoryIdx];
    if (itemIdx < currentCategory.items.length - 1) {
      setItemIdx(itemIdx + 1);
    } else if (categoryIdx < MATERIALS.length - 1) {
      setCategoryIdx(categoryIdx + 1);
      setItemIdx(0);
      notify(`✅ ${currentCategory.category} completed!`);
    } else {
      notify("🎉 All materials completed!");
    }
    setInputValue("");
  }, [categoryIdx, itemIdx, notify]);

  const saveAndNext = useCallback(() => {
    const currentMaterial = MATERIALS[categoryIdx].items[itemIdx];
    if (inputValue) {
      updateValue(currentMaterial, inputValue);
    }
    nextItem();
  }, [categoryIdx, itemIdx, inputValue, updateValue, nextItem]);

  const skipItem = useCallback(() => {
    nextItem();
  }, [nextItem]);

  // Delete entry
  const deleteEntry = useCallback((date) => {
    const updated = { ...entries };
    delete updated[date];
    localStorage.setItem("mrf_data", JSON.stringify(updated));
    setEntries(updated);
    notify("🗑️ Entry deleted");
  }, [entries, notify]);

  // Computed values
  const stats = useMemo(() => {
    const categoryTotals = {};
    flatMaterials.forEach(({ name, category, color }) => {
      const weight = parseFloat(data[name]) || 0;
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, color };
      }
      categoryTotals[category].total += weight;
    });
    const chartData = Object.entries(categoryTotals).map(([category, { total, color }]) => ({
      category, total, color
    }));
    const totalWeight = chartData.reduce((sum, item) => sum + item.total, 0);
    const filledCount = Object.values(data).filter(v => v && parseFloat(v) > 0).length;
    return { chartData, totalWeight, filledCount };
  }, [data]);

  const historyData = useMemo(() => 
    Object.keys(entries)
      .sort()
      .slice(-7)
      .map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: Object.values(entries[date]).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
      }))
  , [entries]);

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return flatMaterials;
    const term = searchTerm.toLowerCase();
    return flatMaterials.filter(m =>
      m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Views
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label="Today's Total" 
          value={stats.totalWeight.toFixed(2)} 
          unit="kg"
          gradient="from-purple-500 to-indigo-600"
        />
        <StatCard 
          label="Materials Logged" 
          value={stats.filledCount} 
          unit={`of ${flatMaterials.length}`}
          gradient="from-pink-500 to-rose-600"
        />
        <StatCard 
          label="Total Entries" 
          value={Object.keys(entries).length} 
          unit="days"
          gradient="from-cyan-500 to-blue-600"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Category Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {stats.chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {historyData.length > 1 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">7-Day Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historyData}>
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

  const EntryView = () => {
    const currentCategory = MATERIALS[categoryIdx];
    const currentItem = currentCategory?.items[itemIdx];
    const progress = categoryIdx === MATERIALS.length - 1 && itemIdx === currentCategory.items.length - 1
      ? 100
      : ((categoryIdx * 100 + (itemIdx / currentCategory.items.length) * 100) / MATERIALS.length);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Recording for</div>
              <div className="text-2xl md:text-3xl font-bold">
                {new Date(today).toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </div>
            </div>
            <Calendar size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("easy")}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                mode === "easy" ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              ⚡ Easy Entry
            </button>
            <button
              onClick={() => setMode("all")}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                mode === "all" ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              📝 View All
            </button>
          </div>
        </div>

        {mode === "easy" ? (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">{currentCategory.category}</span>
                <span>{categoryIdx + 1} of {MATERIALS.length} categories</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: currentCategory.color }}
                >
                  {itemIdx + 1}
                </div>
                <div className="text-sm text-gray-500 mb-1">{currentCategory.category}</div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{currentItem}</h2>
              </div>

              <div className="max-w-md mx-auto mb-6">
                <div className="relative">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveAndNext()}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    autoFocus
                    className="w-full text-4xl md:text-5xl font-bold text-center border-4 border-purple-200 rounded-2xl px-6 py-6 focus:outline-none focus:border-purple-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">kg</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 max-w-md mx-auto mb-6">
                {[0.5, 1, 2, 5, 10, 20, 50, 100].map(num => (
                  <button
                    key={num}
                    onClick={() => setInputValue(num.toString())}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 rounded-xl transition"
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 max-w-md mx-auto">
                <button
                  onClick={skipItem}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition"
                >
                  Skip
                </button>
                <button
                  onClick={saveAndNext}
                  className="flex-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-xl transition flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white shadow-md"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                  <X size={20} className="text-gray-400" />
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map(({ name, category, color }) => (
                  <div key={name} className="bg-gray-50 p-4 rounded-xl" style={{ borderLeft: `4px solid ${color}` }}>
                    <div className="text-xs text-gray-500 mb-1">{category}</div>
                    <label className="block text-sm font-semibold mb-2">{name}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={data[name] || ""}
                        onChange={(e) => updateValue(name, e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="flex-1 text-lg font-semibold border-2 border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-sm text-gray-500">kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const HistoryView = () => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6">Saved Entries</h3>
      {Object.keys(entries).length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl text-gray-500 mb-4">No entries yet</p>
          <button
            onClick={() => setView("entry")}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700"
          >
            Start Entering Data
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(entries).sort((a, b) => b.localeCompare(a)).map((date) => {
            const total = Object.values(entries[date]).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            const count = Object.values(entries[date]).filter(v => v && parseFloat(v) > 0).length;
            return (
              <div key={date} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl transition">
                <div className="text-sm text-gray-500 mb-2">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold">{total.toFixed(2)}</span>
                  <span className="text-lg text-gray-500">kg</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{count} materials</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setView("entry"); }}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => deleteEntry(date)}
                    className="bg-red-50 text-red-600 px-4 rounded-xl hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">MRF Dashboard</h1>
              <p className="text-purple-100 text-xs md:text-sm">Zilla Panchayat Material Recovery</p>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-md sticky top-[72px] md:top-[88px] z-40">
        <div className="container mx-auto px-4 md:px-6 flex">
          {[
            { id: "dashboard", icon: Home, label: "Dashboard" },
            { id: "entry", icon: Plus, label: "Entry" },
            { id: "history", icon: Clock, label: "History" }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex-1 py-3 md:py-4 font-semibold transition flex items-center justify-center gap-2 ${
                view === id ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-600'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm md:text-base">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {view === "dashboard" && <DashboardView />}
        {view === "entry" && <EntryView />}
        {view === "history" && <HistoryView />}
      </main>

      {notification.show && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 animate-fade-in">
          {notification.message}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, unit, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} text-white rounded-2xl shadow-lg p-6`}>
    <div className="text-sm opacity-90 mb-2">{label}</div>
    <div className="text-4xl md:text-5xl font-bold mb-1">{value}</div>
    <div className="text-sm opacity-75">{unit}</div>
  </div>
);