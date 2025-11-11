import React, { useState, useEffect ,useCallback, useRef, useMemo} from 'react';
import { Plus, Trash2, MapPin, AlertCircle, CheckCircle, Mail, Copy, Check, RefreshCw,LogOut, Download, FileText, Users, DollarSign, Package, Activity, BarChart3} from 'lucide-react';
import { useI18n } from "../i18n/I18nProvider";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


export default function MRFDashboard() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMRF, setShowAddMRF] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('month'); // Default to month to show more data
  const [collections, setCollections] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactionsSummary, setTransactionsSummary] = useState({ total: 0, totalRevenue: 0, totalQuantity: 0 });
  const [overallStats, setOverallStats] = useState({
    totalWaste: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    activeOperators: 0
  });

  const [newMRF, setNewMRF] = useState({
    name: '',
    email: '',
    location: '',
    capacity: ''
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [formStep, setFormStep] = useState(1);

  const fetchPlantData = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const API_BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";
    let url = `${API_BASE_URL}/api/entries/aggregate`;

    const params = new URLSearchParams();
    params.append('plants', 'yedapadavu,narikombu,ujire,kedambadi');
    
    // Add date range based on selectedDateRange
    if (selectedDateRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      params.append('dateKey', today);
    } else if (selectedDateRange === 'week') {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      params.append('from', weekAgo.toISOString().split('T')[0]);
      params.append('to', today.toISOString().split('T')[0]);
    } else if (selectedDateRange === 'month') {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      params.append('from', monthAgo.toISOString().split('T')[0]);
      params.append('to', today.toISOString().split('T')[0]);
    }
    
    console.log("🌐 Fetching:", `${url}?${params.toString()}`);

    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`,
      },
    });

    console.log("🔍 Response Status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch (status ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Aggregate Data:", data);
    console.log("✅ Entries Count:", data.meta?.entriesCount || 0);
    console.log("✅ Per Plant Data:", data.counts?.perPlant);
    console.log("✅ Overall Data:", data.counts?.overall);
    setApiData(data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [selectedDateRange]);


  const [mrfOperators, setMrfOperators] = useState([]);
  const plantIdToName = useMemo(
    () => ({
      'yedapadavu': 'Yedapadavu MRF',
      'narikombu': 'Narikombu MRF',
      'ujire': 'Ujire MRF',
      'kedambadi': 'Kedambadi MRF'
    }),
    []
  );
  
  const plantIdToLocation = useMemo(
    () => ({
      'yedapadavu': 'Yedapadavu, Karnataka',
      'narikombu': 'Narikombu, Karnataka',
      'ujire': 'Ujire, Karnataka',
      'kedambadi': 'Kedambadi, Karnataka'
    }),
    []
  );
  
  const getPlantIdFromEmail = useCallback(
    (email) => {
      const emailLower = email.toLowerCase();
      for (const plantId of Object.keys(plantIdToName)) {
        if (emailLower.includes(plantId)) {
          return plantId;
        }
      }
      return null;
    },
    [plantIdToName] // ✅ depends on this object only
  );  
  const facilities = useMemo(() => {
    return mrfOperators.map((operator) => {
      const plantId = getPlantIdFromEmail(operator.email) || 'unknown';
      const plantData = apiData?.counts?.perPlant?.[plantId] || {};
      const currentLoad = Object.values(plantData).reduce((sum, val) => sum + (Number(val) || 0), 0);
      const collectionsCount = Object.keys(plantData).length;

      return {
        id: operator.id,
        name: plantIdToName[plantId] || operator.name || `${plantId.charAt(0).toUpperCase() + plantId.slice(1)} MRF`,
        plantId,
        email: operator.email,
        location: plantIdToLocation[plantId] || operator.email.split('@')[0] || 'Unknown',
        capacity: 50000,
        currentLoad,
        status: operator.isActive ? 'operational' : 'offline',
        collections: collectionsCount,
        lastCollection: collectionsCount > 0 ? 'Recent' : 'Never',
        createdDate: operator.createdAt ? new Date(operator.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        operatorId: operator.id,
        operatorName: operator.name
      };
    });
  }, [mrfOperators, apiData, getPlantIdFromEmail, plantIdToName, plantIdToLocation]);

  // Plant ID to facility name mapping (defined outside to be accessible everywhere)


  

  const fetchMRFOperators = useCallback(async () => {
    // This will be called after apiData is fetched, so we can use it
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/api/auth/users/role/mrf_operator`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const operators = data.users || [];
        setMrfOperators(operators);
      }
    } catch (err) {
      console.error("❌ Error fetching MRF operators:", err);
    }
  }, [apiData]); // Re-fetch when apiData changes to update load/collections

  const fetchCollections = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      
      // Build date range for history
      let historyUrl = `${API_BASE_URL}/api/entries/history?limit=200`;
      if (selectedDateRange === 'week') {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        // Note: history endpoint doesn't support date filtering, but we'll filter client-side
      }
      
      const response = await fetch(historyUrl, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const entries = data.entries || [];
        
        // Filter by date range if needed
        let filteredEntries = entries;
        if (selectedDateRange === 'today') {
          const today = new Date().toISOString().split('T')[0];
          filteredEntries = entries.filter(e => e.dateKey === today);
        } else if (selectedDateRange === 'week') {
          const today = new Date();
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          const todayStr = today.toISOString().split('T')[0];
          filteredEntries = entries.filter(e => e.dateKey >= weekAgoStr && e.dateKey <= todayStr);
        } else if (selectedDateRange === 'month') {
          const today = new Date();
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          const monthAgoStr = monthAgo.toISOString().split('T')[0];
          const todayStr = today.toISOString().split('T')[0];
          filteredEntries = entries.filter(e => e.dateKey >= monthAgoStr && e.dateKey <= todayStr);
        }
        
        // Transform entries to collections format
        const collectionsList = [];
        filteredEntries.forEach((entry, index) => {
          if (entry.data && Object.keys(entry.data).length > 0) {
            // Extract plantId: use entry.plantId or extract from user email
            let plantId = entry.plantId;
            if (!plantId && entry.user) {
              // If plantId is missing, try to extract from user email
              // entry.user might be an object (populated) or an ObjectId string
              const userEmail = typeof entry.user === 'object' && entry.user.email 
                ? entry.user.email 
                : (typeof entry.user === 'string' ? null : null);
              if (userEmail) {
                plantId = getPlantIdFromEmail(userEmail);
              }
            }
            if (!plantId) {
              plantId = 'unknown';
            }
            
            const mrfName = plantIdToName[plantId] || `${plantId.charAt(0).toUpperCase() + plantId.slice(1)} MRF`;
            const entryDate = entry.dateKey || new Date().toISOString().split('T')[0];
            const entryTime = entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '00:00';
            
            Object.entries(entry.data).forEach(([materialName, weight]) => {
              collectionsList.push({
                id: `${entry._id || index}-${materialName}`,
                mrfName: mrfName,
                type: materialName,
                weight: weight,
                date: entryDate,
                time: entryTime,
                plantId: plantId
              });
            });
          }
        });

        // Sort by date and time (newest first)
        collectionsList.sort((a, b) => {
          const dateCompare = new Date(b.date) - new Date(a.date);
          if (dateCompare !== 0) return dateCompare;
          return b.time.localeCompare(a.time);
        });

        setCollections(collectionsList);
      }
    } catch (err) {
      console.error("❌ Error fetching collections:", err);
    }
  }, [selectedDateRange, getPlantIdFromEmail, plantIdToName]); // Add selectedDateRange as dependency

  const fetchTransactions = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";
      // Fetch all transactions - transactions are overall, not filtered by date
      let url = `${API_BASE_URL}/api/transactions/all?limit=500`;
      
      // Note: Transactions are fetched overall, not filtered by date range
      // If you want to filter by date in the future, you can add query params here
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTransactionsSummary(data.summary || { total: 0, totalRevenue: 0, totalQuantity: 0 });
      }
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setError(`Error fetching transactions: ${err.message}`);
    }
  }, []); // No dependencies - fetch all transactions on mount (transactions are overall, not date-filtered)

  // Calculate overall statistics
  useEffect(() => {
    if (apiData && transactions.length >= 0 && mrfOperators.length >= 0) {
      const totalWaste = Object.values(apiData.counts?.overall || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
      const activeOperators = mrfOperators.filter(op => op.isActive).length;
      
      setOverallStats({
        totalWaste,
        totalRevenue: transactionsSummary.totalRevenue,
        totalTransactions: transactionsSummary.total,
        activeOperators
      });
    }
  }, [apiData, transactionsSummary, mrfOperators, transactions.length]);

// Fetch data from API
  useEffect(() => {
    fetchPlantData();
    fetchCollections();
    fetchTransactions();
  }, [fetchPlantData, fetchCollections, fetchTransactions]);

  // Fetch operators after apiData is available to calculate load/collections
  useEffect(() => {
    if (apiData) {
      fetchMRFOperators();
    }
  }, [apiData, fetchMRFOperators]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = 'MRF#';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const totalCapacity = facilities.reduce((sum, mrf) => sum + (mrf.capacity || 0), 0);
  const totalLoad = facilities.reduce((sum, mrf) => sum + (mrf.currentLoad || 0), 0);
  const totalCollections = collections.length;
  const operationalMRFs = facilities.filter(m => m.status === 'operational').length;
  
  // Calculate individual MRF statistics
  const getMRFStats = (plantId) => {
    const plantData = apiData?.counts?.perPlant?.[plantId] || {};
    const totalWeight = Object.values(plantData).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const categories = Object.keys(plantData).length;
    const mrfCollections = collections.filter(c => c.plantId === plantId).length;
    const mrfTransactions = transactions.filter(t => {
      // Try to match by user email or plantId in notes
      const userEmail = t.user?.email || '';
      return getPlantIdFromEmail(userEmail) === plantId;
    });
    const mrfRevenue = mrfTransactions.reduce((sum, t) => sum + (t.cost || 0), 0);
    
    return {
      totalWeight,
      categories,
      collections: mrfCollections,
      transactions: mrfTransactions.length,
      revenue: mrfRevenue
    };
  };

  const handleNextStep = () => {
    if (newMRF.name && newMRF.email && newMRF.location && newMRF.capacity) {
      const password = generatePassword();
      setGeneratedPassword(password);
      setFormStep(2);
    }
  };

  const handleAddMRF = async () => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";
    console.log("📡 Sending registration to:", `${API_BASE_URL}/api/auth/register`);

    // Validate email contains plantId or extract from location
    let plantId = getPlantIdFromEmail(newMRF.email);
    if (!plantId && newMRF.location) {
      // Try to extract from location
      const locationLower = newMRF.location.toLowerCase();
      for (const pid of Object.keys(plantIdToName)) {
        if (locationLower.includes(pid)) {
          plantId = pid;
          break;
        }
      }
    }

    // Build payload for registration
    const registerPayload = {
      email: newMRF.email,
      name: newMRF.name,
      role: "mrf_operator", // ✅ required role
      password: generatedPassword,
    };

    // 1️⃣ Send registration request
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerPayload),
    });

    // 2️⃣ Check for success
    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || JSON.stringify(errorData);
      } catch {
        errorMessage = await response.text();
      }
      throw new Error(`Registration failed (${response.status}): ${errorMessage}`);
    }

    const result = await response.json();
    console.log("✅ MRF operator registered successfully!", result);

    // 3️⃣ Refresh MRF operators and facilities
    await fetchMRFOperators();

    // 4️⃣ Reset modal form
    setNewMRF({ name: "", email: "", location: "", capacity: "" });
    setGeneratedPassword("");
    setFormStep(1);
    setShowAddMRF(false);

    alert(`✅ ${result.user?.name || newMRF.name} registered successfully as MRF Operator!\n\nEmail: ${result.user?.email || newMRF.email}\nPassword: ${generatedPassword}\n\nPlease save these credentials.`);
    
    // Refresh all data after adding new MRF
    fetchCollections();
    fetchTransactions();
  } catch (error) {
    console.error("❌ Error registering MRF:", error);
    alert(`Error registering MRF: ${error.message}`);
  }
};


  const handleCloseModal = () => {
    setShowAddMRF(false);
    setNewMRF({ name: '', email: '', location: '', capacity: '' });
    setGeneratedPassword('');
    setFormStep(1);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(id);
    setTimeout(() => setCopiedPassword(null), 2000);
  };

  const handleDeleteMRF = async (id) => {
    if (window.confirm('Are you sure you want to delete this MRF facility?')) {
      // Note: In a real implementation, you would call an API to delete the operator
      // For now, just remove from local state
      setMrfOperators(prev => prev.filter(op => op.id !== id));
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'operational': return 'bg-emerald-100 text-emerald-700';
      case 'maintenance': return 'bg-amber-100 text-amber-700';
      case 'offline': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getLoadPercentage = (current, capacity) => {
    if (!capacity || capacity === 0) return 0;
    const percentage = (current / capacity) * 100;
    // Cap at 100% for display purposes
    return Math.min(percentage, 100).toFixed(1);
  };

  const getLoadColor = (percentage) => {
    if (percentage >= 80) return 'bg-rose-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getWasteTypeColor = (type) => {
    const colors = {
      'Plastic': 'bg-blue-100 text-blue-700',
      'Paper': 'bg-amber-100 text-amber-700',
      'Metal': 'bg-slate-100 text-slate-700',
      'Glass': 'bg-cyan-100 text-cyan-700',
      'Organic': 'bg-green-100 text-green-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // Helpers for chart labels
  const RADIAN = Math.PI / 180;
  const renderCategoryLabel = ({ name, percent, cx, cy, midAngle, outerRadius }) => {
    if (!percent || percent < 0.07) return null; // Only show labels for slices >= 7%
    const radius = outerRadius + 12;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const shortName = String(name).length > 18 ? `${String(name).slice(0, 18)}…` : String(name);
    return (
      <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
        {`${shortName}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const chartsExportRef = useRef(null);

  const addChartsToPdf = async (pdf) => {
    try {
      const container = chartsExportRef.current;
      if (!container) return;
      // Give charts some time to render offscreen
      await new Promise((r) => setTimeout(r, 400));
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let y = 20;
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Charts & Visualizations", 20, y);
      y += 10;

      const cards = container.querySelectorAll('.export-chart-card');
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const titleEl = card.querySelector('h3');
        const title = titleEl ? titleEl.textContent : `Chart ${i + 1}`;
        const canvas = await html2canvas(card, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth - 40;
        const ratio = canvas.height / canvas.width;
        const imgHeight = imgWidth * ratio;
        if (y + imgHeight + 12 > pdfHeight - 20) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, 20, y);
        y += 6;
        pdf.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }
    } catch (e) {
      console.error('Error adding charts to PDF:', e);
    }
  };

  // Generate combined report (all MRFs)
  const generateCombinedReport = () => {
    if (!apiData) return null;

    const report = {
      title: "Combined MRF Report - All Facilities",
      dateRange: selectedDateRange,
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalMRFs: facilities.length,
        operationalMRFs: operationalMRFs,
        totalCapacity: totalCapacity,
        totalLoad: totalLoad,
        totalCollections: totalCollections,
        totalWaste: overallStats.totalWaste,
        totalRevenue: overallStats.totalRevenue,
        totalTransactions: overallStats.totalTransactions,
        activeOperators: overallStats.activeOperators
      },
      perPlant: apiData.counts?.perPlant || {},
      overall: apiData.counts?.overall || {},
      mrfOperators: mrfOperators.length,
      transactions: transactionsSummary,
      facilities: facilities.map(mrf => {
        const stats = getMRFStats(mrf.plantId);
        return {
          name: mrf.name,
          location: mrf.location,
          capacity: mrf.capacity,
          currentLoad: mrf.currentLoad,
          status: mrf.status,
          wasteCollected: stats.totalWeight,
          revenue: stats.revenue,
          collections: stats.collections,
          transactions: stats.transactions
        };
      })
    };

    return report;
  };

  // Generate individual report for a specific plant
  const generateIndividualReport = (plantId) => {
    if (!apiData) return null;

    const plantData = apiData.counts?.perPlant?.[plantId] || {};
    const plantTotal = Object.values(plantData).reduce((sum, val) => sum + val, 0);
    const mrf = facilities.find(m => m.plantId === plantId);
    const stats = getMRFStats(plantId);

    // Filter transactions for this plant (by user email containing plantId)
    const plantTransactions = transactions.filter(t => {
      if (!t.user) return false;
      const userEmail = typeof t.user === 'object' ? t.user.email : '';
      return getPlantIdFromEmail(userEmail) === plantId;
    });

    const report = {
      title: `MRF Report - ${mrf?.name || plantId}`,
      plantId: plantId,
      dateRange: selectedDateRange,
      generatedAt: new Date().toLocaleString(),
      facility: {
        name: mrf?.name || plantId,
        location: mrf?.location || 'N/A',
        capacity: mrf?.capacity || 0,
        currentLoad: mrf?.currentLoad || 0,
        status: mrf?.status || 'unknown',
        revenue: stats.revenue,
        transactions: stats.transactions
      },
      wasteData: plantData,
      totalWeight: plantTotal,
      wasteCategories: Object.keys(plantData).length,
      transactions: plantTransactions,
      transactionSummary: {
        total: plantTransactions.length,
        totalRevenue: plantTransactions.reduce((sum, t) => sum + (t.cost || 0), 0),
        totalQuantity: plantTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0)
      }
    };

    return report;
  };

  // Download PDF report
  const downloadReport = async (reportType = 'all', plantId = null) => {
    setIsGeneratingReport(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      let report;
      if (reportType === 'all') {
        report = generateCombinedReport();
      } else {
        // If reportType is not 'all', it's a plantId
        const targetPlantId = plantId || reportType;
        report = generateIndividualReport(targetPlantId);
      }

      if (!report) {
        alert("No data available to generate report");
        return;
      }

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(report.title, pdfWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Date info
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${report.generatedAt}`, pdfWidth / 2, yPos, { align: "center" });
      yPos += 5;
      pdf.text(`Date Range: ${report.dateRange}`, pdfWidth / 2, yPos, { align: "center" });
      yPos += 15;

      if (reportType === 'all') {
        // Combined report content
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Summary Statistics", 20, yPos);
        yPos += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Total MRF Facilities: ${report.summary.totalMRFs}`, 20, yPos);
        yPos += 6;
        pdf.text(`Operational MRFs: ${report.summary.operationalMRFs}`, 20, yPos);
        yPos += 6;
        pdf.text(`Total Capacity: ${report.summary.totalCapacity} kg`, 20, yPos);
        yPos += 6;
        pdf.text(`Current Load: ${report.summary.totalLoad} kg`, 20, yPos);
        yPos += 6;
        pdf.text(`Total Collections: ${report.summary.totalCollections}`, 20, yPos);
        yPos += 6;
        pdf.text(`Total Waste: ${report.summary.totalWaste.toFixed(2)} kg`, 20, yPos);
        yPos += 6;
        pdf.text(`Total Revenue: ₹${report.summary.totalRevenue.toLocaleString()}`, 20, yPos);
        yPos += 6;
        pdf.text(`Total Transactions: ${report.summary.totalTransactions}`, 20, yPos);
        yPos += 6;
        pdf.text(`MRF Operators: ${report.summary.activeOperators} (${report.summary.mrfOperators} total)`, 20, yPos);
        yPos += 10;

        // Per Plant Data
        if (Object.keys(report.perPlant).length > 0) {
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Waste Data by Plant", 20, yPos);
          yPos += 8;

          Object.entries(report.perPlant).forEach(([plantId, data]) => {
            if (yPos > pdfHeight - 30) {
              pdf.addPage();
              yPos = 20;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(plantId.toUpperCase(), 20, yPos);
            yPos += 6;

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            const total = Object.values(data).reduce((sum, val) => sum + val, 0);
            pdf.text(`Total Weight: ${total.toFixed(2)} kg`, 25, yPos);
            yPos += 5;

            Object.entries(data).forEach(([wasteName, weight]) => {
              if (yPos > pdfHeight - 20) {
                pdf.addPage();
                yPos = 20;
              }
              pdf.text(`${wasteName}: ${weight} kg`, 30, yPos);
              yPos += 5;
            });
            yPos += 5;
          });
        }

        // Overall Summary
        if (Object.keys(report.overall).length > 0) {
          if (yPos > pdfHeight - 40) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Overall Waste Summary", 20, yPos);
          yPos += 8;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          Object.entries(report.overall).forEach(([wasteName, weight]) => {
            if (yPos > pdfHeight - 20) {
              pdf.addPage();
              yPos = 20;
            }
            pdf.text(`${wasteName}: ${weight} kg`, 25, yPos);
            yPos += 5;
          });
        }

        // Transactions Section
        if (transactions && transactions.length > 0) {
          if (yPos > pdfHeight - 50) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Transactions Summary", 20, yPos);
          yPos += 8;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.text(`Total Transactions: ${transactionsSummary.total}`, 20, yPos);
          yPos += 6;
          pdf.text(`Total Revenue: ₹${transactionsSummary.totalRevenue.toLocaleString()}`, 20, yPos);
          yPos += 6;
          pdf.text(`Total Quantity: ${transactionsSummary.totalQuantity.toLocaleString()} kg`, 20, yPos);
          yPos += 10;

          // Transaction Details (show first 20)
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text("Recent Transactions", 20, yPos);
          yPos += 8;

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Date", 20, yPos);
          pdf.text("Item", 50, yPos);
          pdf.text("Destination", 90, yPos);
          pdf.text("Quantity", 130, yPos);
          pdf.text("Cost", 160, yPos);
          yPos += 5;

          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          transactions.slice(0, 20).forEach((t) => {
            if (yPos > pdfHeight - 20) {
              pdf.addPage();
              yPos = 20;
              pdf.setFontSize(9);
              pdf.setFont("helvetica", "bold");
              pdf.text("Date", 20, yPos);
              pdf.text("Item", 50, yPos);
              pdf.text("Destination", 90, yPos);
              pdf.text("Quantity", 130, yPos);
              pdf.text("Cost", 160, yPos);
              yPos += 5;
              pdf.setFontSize(8);
              pdf.setFont("helvetica", "normal");
            }
            const date = t.date || 'N/A';
            const item = (t.itemName || 'N/A').substring(0, 20);
            const dest = (t.destination || 'N/A').substring(0, 15);
            const qty = (t.quantity || 0).toLocaleString();
            const cost = `₹${(t.cost || 0).toLocaleString()}`;
            pdf.text(date, 20, yPos);
            pdf.text(item, 50, yPos);
            pdf.text(dest, 90, yPos);
            pdf.text(qty, 130, yPos);
            pdf.text(cost, 160, yPos);
            yPos += 5;
          });

          if (transactions.length > 20) {
            yPos += 3;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            pdf.text(`... and ${transactions.length - 20} more transactions`, 20, yPos);
            yPos += 5;
          }
        }
      } else {
        // Individual report content
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Facility Information", 20, yPos);
        yPos += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Name: ${report.facility.name}`, 20, yPos);
        yPos += 6;
        pdf.text(`Location: ${report.facility.location}`, 20, yPos);
        yPos += 6;
        pdf.text(`Capacity: ${report.facility.capacity} kg`, 20, yPos);
        yPos += 6;
        pdf.text(`Current Load: ${report.facility.currentLoad} kg`, 20, yPos);
        yPos += 6;
        pdf.text(`Status: ${report.facility.status}`, 20, yPos);
        yPos += 6;
        pdf.text(`Revenue: ₹${report.facility.revenue.toLocaleString()}`, 20, yPos);
        yPos += 6;
        pdf.text(`Transactions: ${report.facility.transactions}`, 20, yPos);
        yPos += 10;

        // Waste Data
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Waste Collection Data", 20, yPos);
        yPos += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Total Weight: ${report.totalWeight.toFixed(2)} kg`, 20, yPos);
        yPos += 6;
        pdf.text(`Waste Categories: ${report.wasteCategories}`, 20, yPos);
        yPos += 8;

        Object.entries(report.wasteData).forEach(([wasteName, weight]) => {
          if (yPos > pdfHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.text(`${wasteName}: ${weight} kg`, 25, yPos);
          yPos += 5;
        });

        // Transactions Section for Individual Report
        if (report.transactions && report.transactions.length > 0) {
          if (yPos > pdfHeight - 50) {
            pdf.addPage();
            yPos = 20;
          }

          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Transactions", 20, yPos);
          yPos += 8;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.text(`Total Transactions: ${report.transactionSummary.total}`, 20, yPos);
          yPos += 6;
          pdf.text(`Total Revenue: ₹${report.transactionSummary.totalRevenue.toLocaleString()}`, 20, yPos);
          yPos += 6;
          pdf.text(`Total Quantity: ${report.transactionSummary.totalQuantity.toLocaleString()} kg`, 20, yPos);
          yPos += 10;

          // Transaction Details
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text("Transaction Details", 20, yPos);
          yPos += 8;

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.text("Date", 20, yPos);
          pdf.text("Item", 50, yPos);
          pdf.text("Destination", 90, yPos);
          pdf.text("Quantity", 130, yPos);
          pdf.text("Cost", 160, yPos);
          yPos += 5;

          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          report.transactions.slice(0, 30).forEach((t) => {
            if (yPos > pdfHeight - 20) {
              pdf.addPage();
              yPos = 20;
              pdf.setFontSize(9);
              pdf.setFont("helvetica", "bold");
              pdf.text("Date", 20, yPos);
              pdf.text("Item", 50, yPos);
              pdf.text("Destination", 90, yPos);
              pdf.text("Quantity", 130, yPos);
              pdf.text("Cost", 160, yPos);
              yPos += 5;
              pdf.setFontSize(8);
              pdf.setFont("helvetica", "normal");
            }
            const date = t.date || 'N/A';
            const item = (t.itemName || 'N/A').substring(0, 20);
            const dest = (t.destination || 'N/A').substring(0, 15);
            const qty = (t.quantity || 0).toLocaleString();
            const cost = `₹${(t.cost || 0).toLocaleString()}`;
            pdf.text(date, 20, yPos);
            pdf.text(item, 50, yPos);
            pdf.text(dest, 90, yPos);
            pdf.text(qty, 130, yPos);
            pdf.text(cost, 160, yPos);
            yPos += 5;
          });

          if (report.transactions.length > 30) {
            yPos += 3;
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            pdf.text(`... and ${report.transactions.length - 30} more transactions`, 20, yPos);
          }
        } else {
          if (yPos > pdfHeight - 30) {
            pdf.addPage();
            yPos = 20;
          }
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text("Transactions", 20, yPos);
          yPos += 8;
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.text("No transactions recorded for this facility.", 20, yPos);
        }
      }

      // Save PDF
      await addChartsToPdf(pdf);

      const targetPlantId = plantId || (reportType !== 'all' ? reportType : null);
      const fileName = reportType === 'all' 
        ? `MRF_Combined_Report_${new Date().toISOString().split('T')[0]}.pdf`
        : `MRF_${targetPlantId}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
                  <span className="text-3xl">🏛️</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">{t("zilla.title")}</h1>
                  <p className="text-slate-600">{t("zilla.subtitle")}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">{t("zilla.dataRange")}</p>
                <select 
                  value={selectedDateRange}
                  onChange={(e) => {
                    setSelectedDateRange(e.target.value);
                    // Data will be refetched automatically via useEffect dependency
                  }}
                  className="text-sm font-semibold text-slate-800 border border-slate-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">{t("zilla.today")}</option>
                  <option value="week">{t("zilla.week")}</option>
                  <option value="month">{t("zilla.month")}</option>
                </select>
              </div>
              <button
                onClick={() => {
                  fetchPlantData();
                  fetchCollections();
                  fetchTransactions();
                  if (apiData) fetchMRFOperators();
                }}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all disabled:opacity-50"
                title="Refresh all data"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
              onClick={() => {
                localStorage.removeItem("auth_token");
                window.location.href = "/";
              }}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <LogOut size={18} />
              <span>{t("actions.logout")}</span>
            </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="text-rose-600" size={18} />
              <p className="text-sm text-rose-800">Error loading data: {error}</p>
            </div>
          )}
          
          {apiData && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium">
                ✓ Showing data from {apiData.meta?.entriesCount || 0} entries
                {apiData.query?.dateKey && ` for ${apiData.query.dateKey}`}
              </p>
            </div>
          )}
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Package className="text-white" size={24} />
              </div>
              <span className="text-sm font-medium text-blue-700 bg-blue-200 px-3 py-1 rounded-full">
                {operationalMRFs}/{facilities.length} {t("zilla.active")}
              </span>
            </div>
            <p className="text-slate-700 text-sm font-medium mb-1">Total Waste Collected</p>
            <p className="text-4xl font-bold text-slate-800">{overallStats.totalWaste.toFixed(1)}<span className="text-xl text-slate-500"> kg</span></p>
            <p className="text-xs text-slate-600 mt-2">Across all facilities</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm p-6 border border-emerald-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-600 p-3 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <span className="text-sm font-medium text-emerald-700 bg-emerald-200 px-3 py-1 rounded-full">
                Revenue
              </span>
            </div>
            <p className="text-slate-700 text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-4xl font-bold text-slate-800">₹{overallStats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-slate-600 mt-2">{overallStats.totalTransactions} transactions</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-600 p-3 rounded-lg">
                <Activity className="text-white" size={24} />
              </div>
              <span className="text-sm font-medium text-purple-700 bg-purple-200 px-3 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-slate-700 text-sm font-medium mb-1">MRF Operators</p>
            <p className="text-4xl font-bold text-slate-800">{overallStats.activeOperators}</p>
            <p className="text-xs text-slate-600 mt-2">Out of {mrfOperators.length} total</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm p-6 border border-amber-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-600 p-3 rounded-lg">
                <BarChart3 className="text-white" size={24} />
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${ 
                totalCapacity > 0 && ((totalLoad / totalCapacity) * 100) > 70 ? 'text-amber-700 bg-amber-200' : 'text-emerald-700 bg-emerald-200'
              }`}>
                {totalCapacity > 0 && ((totalLoad / totalCapacity) * 100) > 70 ? t("zilla.high") : t("zilla.optimal")}
              </span>
            </div>
            <p className="text-slate-700 text-sm font-medium mb-1">Collections</p>
            <p className="text-4xl font-bold text-slate-800">{totalCollections}</p>
            <p className="text-xs text-slate-600 mt-2">Waste entries recorded</p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 font-semibold border-b-2 transition-all ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t("zilla.tabFacilities")}
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`py-4 px-6 font-semibold border-b-2 transition-all ${
                  activeTab === 'collections'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t("zilla.tabCollections")}
              </button>
              <button
                onClick={() => setActiveTab('operators')}
                className={`py-4 px-6 font-semibold border-b-2 transition-all ${
                  activeTab === 'operators'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                MRF Operators
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-6 font-semibold border-b-2 transition-all ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`py-4 px-6 font-semibold border-b-2 transition-all ${
                  activeTab === 'charts'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Charts & Analytics
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-6 font-semibold border-b-2 transition-all ${
                  activeTab === 'reports'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Reports
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t("zilla.registeredTitle")}</h2>
                    <p className="text-slate-600 text-sm mt-1">{t("zilla.registeredSubtitle")}</p>
                  </div>
                  <button
                    onClick={() => setShowAddMRF(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Plus size={20} />
                    {t("zilla.registerMRF")}
                  </button>
                </div>

                {/* API Data Summary Cards */}
                {facilities.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {facilities.map((facility) => {
                      const plantData = apiData?.counts?.perPlant?.[facility.plantId] || {};
                      const totalWeight = Object.values(plantData).reduce((sum, val) => sum + (Number(val) || 0), 0);
                      const itemTypes = Object.keys(plantData).length;
                      return (
                        <div key={facility.id} className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                          <h4 className="font-bold text-slate-800 capitalize mb-2">{facility.name}</h4>
                          <p className="text-2xl font-bold text-emerald-600">{totalWeight.toFixed(1)} kg</p>
                          <p className="text-xs text-slate-600 mt-1">{itemTypes} waste categories</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Overall Summary */}
                {apiData && apiData.counts && apiData.counts.overall && Object.keys(apiData.counts.overall).length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t("zilla.overallBreakdown")}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {Object.entries(apiData.counts.overall).map(([wasteName, weight]) => (
                        <div key={wasteName} className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-slate-600 mb-1 truncate" title={wasteName}>{wasteName}</p>
                          <p className="text-lg font-bold text-blue-600">{weight} kg</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {facilities.map((mrf) => {
                    const loadPercentage = getLoadPercentage(mrf.currentLoad, mrf.capacity);
                    const mrfStats = getMRFStats(mrf.plantId);
                    return (
                      <div key={mrf.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-slate-800">{mrf.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(mrf.status)}`}>
                                {mrf.status.charAt(0).toUpperCase() + mrf.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-slate-600">
                              <p className="flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400" />
                                {mrf.location}
                              </p>
                              <p className="flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                {mrf.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteMRF(mrf.id)}
                            className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* Individual MRF Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-600 mb-1">Waste Collected</p>
                            <p className="text-lg font-bold text-blue-600">{mrfStats.totalWeight.toFixed(1)} kg</p>
                            <p className="text-xs text-slate-500">{mrfStats.categories} categories</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-600 mb-1">Revenue</p>
                            <p className="text-lg font-bold text-emerald-600">₹{mrfStats.revenue.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{mrfStats.transactions} transactions</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-600 mb-1">Collections</p>
                            <p className="text-lg font-bold text-purple-600">{mrfStats.collections}</p>
                            <p className="text-xs text-slate-500">Entries recorded</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-600 mb-1">Capacity</p>
                            <p className="text-lg font-bold text-slate-800">{loadPercentage}%</p>
                            <p className="text-xs text-slate-500">{mrf.currentLoad.toLocaleString()}kg / {mrf.capacity.toLocaleString()}kg</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <div className="mb-2">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-slate-700">{t("zilla.capacityUtil")}</span>
                                <span className="font-bold text-slate-800">{loadPercentage}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-3 rounded-full transition-all ${getLoadColor(loadPercentage)}`}
                                  style={{ width: `${loadPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Waste breakdown */}
                            {apiData?.counts?.perPlant?.[mrf.plantId] && Object.keys(apiData.counts.perPlant[mrf.plantId]).length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold text-slate-600 mb-2">Waste Breakdown</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(apiData.counts.perPlant[mrf.plantId]).slice(0, 5).map(([name, weight]) => (
                                    <span key={name} className="text-xs bg-white px-2 py-1 rounded border border-slate-200">
                                      {name}: {weight}kg
                                    </span>
                                  ))}
                                  {Object.keys(apiData.counts.perPlant[mrf.plantId]).length > 5 && (
                                    <span className="text-xs text-slate-500">+{Object.keys(apiData.counts.perPlant[mrf.plantId]).length - 5} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-3 md:justify-end">
                            <div className="text-center bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-xs text-slate-600 mb-1">{t("zilla.collections")}</p>
                              <p className="text-2xl font-bold text-slate-800">{mrfStats.collections}</p>
                            </div>
                            <div className="text-center bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-xs text-slate-600 mb-1">Revenue</p>
                              <p className="text-lg font-bold text-emerald-600">₹{mrfStats.revenue.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-slate-400" />
                              <span className="text-xs text-slate-600">Operator:</span>
                              <span className="text-sm font-semibold bg-white px-3 py-1 rounded border border-slate-200">
                                {mrf.operatorName || 'No operator assigned'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">{t("zilla.registeredOn")}: {mrf.createdDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'collections' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">{t("zilla.collectionLogTitle")}</h2>
                  <p className="text-slate-600 text-sm mt-1">{t("zilla.collectionLogSubtitle")}</p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">{t("zilla.colId")}</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">{t("zilla.colFacility")}</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">{t("zilla.colCategory")}</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">{t("zilla.colWeight")}</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">{t("zilla.colDate")}</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">{t("zilla.colTime")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">
                            No collections found for the selected date range
                          </td>
                        </tr>
                      ) : (
                        collections.map((collection, index) => (
                          <tr key={collection.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="py-4 px-6 text-slate-600 font-medium">#{String(index + 1).padStart(4, '0')}</td>
                            <td className="py-4 px-6 text-slate-800 font-medium">{collection.mrfName}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getWasteTypeColor(collection.type)}`}>
                                {collection.type}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-800 font-bold">{collection.weight} kg</td>
                            <td className="py-4 px-6 text-slate-600">{collection.date}</td>
                            <td className="py-4 px-6 text-slate-600">{collection.time}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Transactions</h2>
                  <p className="text-slate-600 text-sm mt-1">All transactions across MRF facilities</p>
                </div>

                {/* Transactions Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <p className="text-sm text-slate-600 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-emerald-600">{transactionsSummary.total}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">₹{transactionsSummary.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-slate-600 mb-1">Total Quantity</p>
                    <p className="text-2xl font-bold text-purple-600">{transactionsSummary.totalQuantity.toFixed(1)} kg</p>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Date</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Item</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Destination</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Quantity</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Cost</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">
                            No transactions found for the selected date range
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction, index) => (
                          <tr key={transaction._id || index} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                            <td className="py-4 px-6 text-slate-600">{transaction.date}</td>
                            <td className="py-4 px-6 text-slate-800 font-medium">{transaction.itemName}</td>
                            <td className="py-4 px-6 text-slate-600">{transaction.destination}</td>
                            <td className="py-4 px-6 text-slate-800">{transaction.quantity || 0} kg</td>
                            <td className="py-4 px-6 text-slate-800 font-bold">₹{transaction.cost.toLocaleString()}</td>
                            <td className="py-4 px-6 text-slate-600">{transaction.user?.name || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'operators' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">MRF Operators</h2>
                    <p className="text-slate-600 text-sm mt-1">List of all registered MRF operators</p>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                    <Users className="text-blue-600" size={20} />
                    <span className="text-sm font-semibold text-blue-700">{mrfOperators.length} Operators</span>
                  </div>
                </div>

                {mrfOperators.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <Users className="mx-auto text-slate-400 mb-4" size={48} />
                    <p className="text-slate-600">No MRF operators registered yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mrfOperators.map((operator) => {
                      const mrf = facilities.find(m => m.email === operator.email);
                      return (
                        <div key={operator.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-slate-800 mb-1">{operator.name}</h3>
                              <p className="text-sm text-slate-600 flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                {operator.email}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              operator.isActive 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {operator.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {mrf && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-xs text-slate-500 mb-1">Assigned Facility</p>
                              <p className="text-sm font-semibold text-slate-800">{mrf.name}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                <MapPin size={12} className="inline mr-1" />
                                {mrf.location}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'charts' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Charts & Analytics</h2>
                  <p className="text-slate-600 text-sm mt-1">Visual representation of MRF data and performance metrics</p>
                </div>

                {/* Chart Data Preparation */}
                {(() => {
                  // Waste collected by facility
                  const wasteByFacility = facilities.map(mrf => {
                    const stats = getMRFStats(mrf.plantId);
                    return {
                      name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
                      waste: stats.totalWeight,
                      revenue: stats.revenue,
                      collections: stats.collections,
                      capacityUtil: parseFloat(getLoadPercentage(mrf.currentLoad, mrf.capacity))
                    };
                  });

                  // Revenue by facility
                  const revenueByFacility = facilities.map(mrf => {
                    const stats = getMRFStats(mrf.plantId);
                    return {
                      name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
                      revenue: stats.revenue,
                      transactions: stats.transactions
                    };
                  });

                  // Waste breakdown by category (top 10)
                  const wasteCategories = apiData?.counts?.overall ? Object.entries(apiData.counts.overall)
                    .map(([name, weight]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, value: weight }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10) : [];

                  // Capacity utilization by facility
                  const capacityData = facilities.map(mrf => ({
                    name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
                    utilized: parseFloat(getLoadPercentage(mrf.currentLoad, mrf.capacity)),
                    capacity: mrf.capacity / 1000, // Convert to tons for display
                    current: mrf.currentLoad / 1000
                  }));

                  // Transactions by facility
                  const transactionsByFacility = facilities.map(mrf => {
                    const stats = getMRFStats(mrf.plantId);
                    return {
                      name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
                      count: stats.transactions,
                      revenue: stats.revenue
                    };
                  });

                  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Waste Collected by Facility */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Waste Collected by Facility</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={wasteByFacility}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                            <Legend />
                            <Bar dataKey="waste" fill="#3b82f6" name="Waste (kg)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Revenue by Facility */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue by Facility</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={revenueByFacility}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Waste Breakdown by Category */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Waste Breakdown by Category (Top 10)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={wasteCategories}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={2}
                              labelLine={false}
                              label={renderCategoryLabel}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {wasteCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toFixed(1)} kg`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Capacity Utilization */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Capacity Utilization (%)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={capacityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                            <Legend />
                            <Bar dataKey="utilized" fill="#f59e0b" name="Utilization %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Transactions by Facility */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Transactions by Facility</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={transactionsByFacility}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8b5cf6" name="Transaction Count" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Collections vs Revenue Comparison */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Collections vs Revenue</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={wasteByFacility}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                            <YAxis yAxisId="left" fontSize={10} />
                            <YAxis yAxisId="right" orientation="right" fontSize={10} />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="collections" fill="#06b6d4" name="Collections" />
                            <Bar yAxisId="right" dataKey="revenue" fill="#ec4899" name="Revenue (₹)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Generate Reports</h2>
                  <p className="text-slate-600 text-sm mt-1">Download comprehensive reports for all facilities or individual MRFs</p>
                </div>

                <div className="space-y-6">
                  {/* Combined Report */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-blue-600 p-2 rounded-lg">
                            <FileText className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">Combined Report</h3>
                            <p className="text-sm text-slate-600">All MRF facilities combined data</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          <p>• Summary statistics for all facilities</p>
                          <p>• Waste data breakdown by plant</p>
                          <p>• Overall waste summary</p>
                          <p>• MRF operator information</p>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadReport('all')}
                        disabled={isGeneratingReport || !apiData}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={20} />
                        {isGeneratingReport ? 'Generating...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>

                  {/* Individual Reports */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Individual Facility Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {facilities.map((mrf) => {
                        const plantData = apiData?.counts?.perPlant?.[mrf.plantId] || {};
                        const hasData = Object.keys(plantData).length > 0;
                        return (
                          <div key={mrf.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-slate-800">{mrf.name}</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                  <MapPin size={14} className="inline mr-1" />
                                  {mrf.location}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(mrf.status)}`}>
                                {mrf.status}
                              </span>
                            </div>
                            <div className="mb-4">
                              <p className="text-xs text-slate-600 mb-1">Capacity Utilization</p>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${getLoadColor(getLoadPercentage(mrf.currentLoad, mrf.capacity))}`}
                                  style={{ width: `${Math.min(parseFloat(getLoadPercentage(mrf.currentLoad, mrf.capacity)), 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {mrf.currentLoad.toLocaleString()}kg / {mrf.capacity.toLocaleString()}kg ({getLoadPercentage(mrf.currentLoad, mrf.capacity)}%)
                              </p>
                            </div>
                            {hasData && (
                              <div className="mb-4">
                                <p className="text-xs text-slate-600 mb-2">Waste Categories: {Object.keys(plantData).length}</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(plantData).slice(0, 3).map(([name, weight]) => (
                                    <span key={name} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                      {name}: {weight}kg
                                    </span>
                                  ))}
                                  {Object.keys(plantData).length > 3 && (
                                    <span className="text-xs text-slate-500">+{Object.keys(plantData).length - 3} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => downloadReport(mrf.plantId)}
                              disabled={isGeneratingReport || !hasData}
                              className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Download size={18} />
                              {isGeneratingReport ? 'Generating...' : 'Download Report'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add MRF Modal */}
      {showAddMRF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            {formStep === 1 ? (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
                    <Plus className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t("zilla.modalRegisterTitle")}</h2>
                    <p className="text-slate-600 text-sm">{t("zilla.modalRegisterSubtitle")}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("zilla.facilityName")} *
                    </label>
                    <input
                      type="text"
                      value={newMRF.name}
                      onChange={(e) => setNewMRF({...newMRF, name: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., South Zone MRF"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("zilla.officialEmail")} *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={newMRF.email}
                        onChange={(e) => setNewMRF({...newMRF, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="facility@zillapanchayat.gov"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("zilla.location")} *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input
                        type="text"
                        value={newMRF.location}
                        onChange={(e) => setNewMRF({...newMRF, location: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Zone E - Market Area"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {t("zilla.storageCapacity")} *
                    </label>
                    <input
                      type="number"
                      value={newMRF.capacity}
                      onChange={(e) => setNewMRF({...newMRF, capacity: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., 50000 (in kg)"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                  >
                    {t("zilla.cancel")}
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!newMRF.name || !newMRF.email || !newMRF.location || !newMRF.capacity}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("zilla.generateCreds")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-block bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-full mb-4">
                    <CheckCircle className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{t("zilla.credsGenerated")}</h2>
                  <p className="text-slate-600">{t("zilla.credsSave")}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 mb-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">{t("zilla.facilityNameUpper")}</p>
                      <p className="text-lg font-bold text-slate-800">{newMRF.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">{t("zilla.emailUpper")}</p>
                      <p className="text-sm font-mono text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-200">{newMRF.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">{t("zilla.autoPassUpper")}</p>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm font-mono font-bold text-blue-600 bg-white px-3 py-2 rounded-lg border-2 border-blue-300">{generatedPassword}</p>
                        <button
                          onClick={() => copyToClipboard(generatedPassword, 'new')}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all"
                        >
                          {copiedPassword === 'new' ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                    <p className="text-sm text-amber-800">
                      <strong>{t("zilla.important")}</strong> {t("zilla.importantMsg")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                  >
                    {t("zilla.cancel")}
                  </button>
                  <button
                    onClick={handleAddMRF}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold"
                  >
                    {t("zilla.completeRegistration")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden charts container for PDF export */}
      <div ref={chartsExportRef} style={{ position: 'absolute', top: -99999, left: -99999, width: 1000, background: '#ffffff', padding: 16 }}>
        {(() => {
          const wasteByFacility = facilities.map(mrf => {
            const stats = getMRFStats(mrf.plantId);
            return {
              name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
              waste: stats.totalWeight,
              revenue: stats.revenue,
              collections: stats.collections,
              capacityUtil: parseFloat(getLoadPercentage(mrf.currentLoad, mrf.capacity))
            };
          });

          const revenueByFacility = facilities.map(mrf => {
            const stats = getMRFStats(mrf.plantId);
            return {
              name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
              revenue: stats.revenue,
              transactions: stats.transactions
            };
          });

          const wasteCategories = apiData?.counts?.overall ? Object.entries(apiData.counts.overall)
            .map(([name, weight]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, value: weight }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10) : [];

          const capacityData = facilities.map(mrf => ({
            name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
            utilized: parseFloat(getLoadPercentage(mrf.currentLoad, mrf.capacity)),
            capacity: mrf.capacity / 1000,
            current: mrf.currentLoad / 1000
          }));

          const transactionsByFacility = facilities.map(mrf => {
            const stats = getMRFStats(mrf.plantId);
            return {
              name: mrf.name.length > 15 ? mrf.name.substring(0, 15) + '...' : mrf.name,
              count: stats.transactions,
              revenue: stats.revenue
            };
          });

          const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

          return (
            <div style={{ width: 960 }}>
              <div className="export-chart-card" style={{ width: 960, height: 340, background: '#fff', padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 700, color: '#111827' }}>Waste Collected by Facility</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={wasteByFacility}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} kg`} />
                    <Legend />
                    <Bar dataKey="waste" fill="#3b82f6" name="Waste (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="export-chart-card" style={{ width: 960, height: 340, background: '#fff', padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 700, color: '#111827' }}>Revenue by Facility</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByFacility}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="export-chart-card" style={{ width: 960, height: 340, background: '#fff', padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 700, color: '#111827' }}>Waste Breakdown by Category (Top 10)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={wasteCategories} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} labelLine={false} label={renderCategoryLabel} fill="#8884d8" dataKey="value">
                      {wasteCategories.map((entry, index) => (
                        <Cell key={`cell-e-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} kg`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="export-chart-card" style={{ width: 960, height: 340, background: '#fff', padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 700, color: '#111827' }}>Capacity Utilization (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={capacityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="utilized" fill="#f59e0b" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="export-chart-card" style={{ width: 960, height: 340, background: '#fff', padding: 12, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, fontWeight: 700, color: '#111827' }}>Transactions by Facility</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transactionsByFacility}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={50} fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" name="Transaction Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}