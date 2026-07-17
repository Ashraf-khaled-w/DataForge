import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWorkspaces } from "../../services/workspaces";
import { getRecords } from "../../services/records";
import { getUsers } from "../../services/users";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useAuth } from "../Context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const formatDateToISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeDate = (val) => {
  if (val === undefined || val === null) return "";
  let str = String(val).trim();
  if (str === "") return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (str.includes("T")) {
    const tParts = str.split("T");
    if (/^\d{4}-\d{2}-\d{2}$/.test(tParts[0])) {
      return tParts[0];
    }
  }

  const num = Number(str);
  if (!isNaN(num) && num > 10000 && num < 100000) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return formatDateToISO(date);
    }
  }

  const cleanStr = str.replace(/[\s\u200e\u200f]+/g, " ");
  const parts = cleanStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let p1 = parts[0].trim();
    let p2 = parts[1].trim();
    let p3 = parts[2].trim();

    const monthMap = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };

    let m = parseInt(p2, 10);
    if (isNaN(m)) {
      m = monthMap[p2.toLowerCase()] || 0;
    }

    let d = parseInt(p1, 10);
    let y = parseInt(p3, 10);

    if (parseInt(p1, 10) > 1000) {
      y = parseInt(p1, 10);
      d = parseInt(p3, 10);
      m = isNaN(parseInt(p2, 10)) ? monthMap[p2.toLowerCase()] : parseInt(p2, 10);
    }

    if (y > 0 && m > 0 && m <= 12 && d > 0 && d <= 31) {
      if (y < 100) {
        y += y < 50 ? 2000 : 1900;
      }
      if (m > 12) {
        const temp = m;
        m = d;
        d = temp;
      }

      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) {
        return formatDateToISO(date);
      }
    }
  }

  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    return formatDateToISO(parsedDate);
  }

  const arabicMonths = {
    "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "مايو": 5, "يونيو": 6,
    "يوليو": 7, "أغسطس": 8, "سبتمبر": 9, "أكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12,
    "كانون الثاني": 1, "شباط": 2, "آذار": 3, "نيسان": 4, "أيار": 5, "حزيران": 6,
    "تموز": 7, "آب": 8, "أيلول": 9, "تشرين الأول": 10, "تشرين الثاني": 11, "كانون الأول": 12
  };

  const words = cleanStr.split(/\s+/);
  if (words.length === 3) {
    let day = parseInt(words[0], 10);
    let monthName = words[1];
    let year = parseInt(words[2], 10);

    let month = arabicMonths[monthName] || 0;
    if (day > 0 && month > 0 && year > 1000) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return formatDateToISO(date);
      }
    }
  }

  return str;
};

function Dashboard() {
  const { user } = useAuth();
  const [studies, setStudies] = useState([]);
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [studiesData, patientsData, usersData] = await Promise.all([
          getWorkspaces(),
          getRecords(),
          user?.role === "admin" ? getUsers() : Promise.resolve([])
        ]);
        setStudies(studiesData);
        setPatients(patientsData);
        setUsers(usersData);
        
        if (studiesData && studiesData.length > 0) {
          setSelectedStudyId(studiesData[0].id);
        }
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  // Extract JSONB record field values
  const getFieldValue = (patient, field) => {
    if (!patient || !field) return "";
    const key = field.key;
    const label = field.label;

    const extract = (obj) => {
      if (!obj || typeof obj !== "object") return undefined;
      if (obj[key] !== undefined) return obj[key];
      if (label && obj[label] !== undefined) return obj[label];
      
      const searchKey = String(key).toLowerCase().trim();
      const foundKey = Object.keys(obj).find(
        (k) => String(k).toLowerCase().trim() === searchKey
      );
      if (foundKey) return obj[foundKey];

      if (label) {
        const searchLabel = String(label).toLowerCase().trim();
        const foundLabel = Object.keys(obj).find(
          (k) => String(k).toLowerCase().trim() === searchLabel
        );
        if (foundLabel) return obj[foundLabel];
      }

      return undefined;
    };

    if (patient.data && typeof patient.data === "object") {
      const val = extract(patient.data);
      if (val !== undefined) return val;
    }
    
    const val = extract(patient);
    const resultVal = val !== undefined ? val : "";

    if (field.type === "date" || field.type === "birthday") {
      return normalizeDate(resultVal);
    }
    return resultVal;
  };

  const currentStudyFocus = studies.find((s) => s.id === selectedStudyId) || null;

  const activePatients = currentStudyFocus
    ? patients.filter((p) => p.workspace_id === currentStudyFocus.id)
    : [];

  const getFields = (study) => {
    if (!study || !study.config) return [];
    try {
      const config =
        typeof study.config === "string"
          ? JSON.parse(study.config)
          : study.config;
      return config?.fields || [];
    } catch (e) {
      console.error("Error parsing workspace config:", e);
      return [];
    }
  };

  const fields = currentStudyFocus ? getFields(currentStudyFocus) : [];
  const analyticFields = fields.filter((f) => f.is_analytic);

  const totalRecords = activePatients.length;
  const totalVariables = fields.length;
  const totalAnalyticFields = analyticFields.length;
  
  const getOwnerName = () => {
    if (!currentStudyFocus) return "N/A";
    const owner = users.find((u) => u.id === currentStudyFocus.owner_id);
    return owner ? owner.full_name : currentStudyFocus.owner_name || "Workspace Owner";
  };
  const ownerName = getOwnerName();

  const getCompletenessRate = () => {
    if (!currentStudyFocus || activePatients.length === 0 || analyticFields.length === 0) return 0;
    let expectedFields = 0;
    let filledFields = 0;

    activePatients.forEach((p) => {
      analyticFields.forEach((f) => {
        expectedFields++;
        const val = getFieldValue(p, f);
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          filledFields++;
        }
      });
    });

    return expectedFields > 0 ? Math.round((filledFields / expectedFields) * 100) : 100;
  };
  const completenessRate = getCompletenessRate();

  const getFieldAnalysis = (field) => {
    const values = activePatients
      .map((p) => getFieldValue(p, field))
      .filter((val) => val !== undefined && val !== null && String(val).trim() !== "");

    if (values.length === 0) return { empty: true };

    if (field.type === "date" || field.type === "birthday") {
      const counts = {};
      values.forEach((v) => {
        const yyyymm = String(v).substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(yyyymm)) {
          counts[yyyymm] = (counts[yyyymm] || 0) + 1;
        } else {
          counts["Invalid/Other"] = (counts["Invalid/Other"] || 0) + 1;
        }
      });

      const sortedMonths = Object.keys(counts).sort();
      const distribution = sortedMonths.map((month) => ({
        month,
        count: counts[month],
      }));

      return {
        type: "timeline",
        distribution,
        totalRecords: values.length,
      };
    }

    if (field.type === "number" || field.type === "decimal") {
      const nums = values.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
      if (nums.length === 0) return { empty: true };

      const total = nums.reduce((sum, val) => sum + val, 0);
      const avg = total / nums.length;
      const min = Math.min(...nums);
      const max = Math.max(...nums);

      const isDecimalType = field.type === "decimal";
      const isAllInt = !isDecimalType && nums.every((n) => Number.isInteger(n));
      const range = max - min;
      let buckets = [];

      if (range === 0) {
        buckets = [{ range: `${min}`, count: nums.length }];
      } else if (isAllInt && range < 5) {
        const valCounts = {};
        nums.forEach((n) => {
          valCounts[n] = (valCounts[n] || 0) + 1;
        });
        buckets = Object.keys(valCounts)
          .map((val) => ({
            range: `${val}`,
            count: valCounts[val],
          }))
          .sort((a, b) => parseInt(a.range, 10) - parseInt(b.range, 10));
      } else if (isAllInt) {
        const bucketSize = range / 5;
        const counts = [0, 0, 0, 0, 0];
        nums.forEach((n) => {
          const idx = Math.min(Math.floor((n - min) / bucketSize), 4);
          counts[idx]++;
        });
        buckets = counts.map((count, i) => {
          const start = Math.floor(min + i * bucketSize);
          const end = i < 4 ? Math.floor(min + (i + 1) * bucketSize) - 1 : max;
          return {
            range: `${start} - ${end}`,
            count,
          };
        });
      } else {
        const bucketSize = range / 5;
        const counts = [0, 0, 0, 0, 0];
        nums.forEach((n) => {
          const idx = Math.min(Math.floor((n - min) / bucketSize), 4);
          counts[idx]++;
        });
        buckets = counts.map((count, i) => {
          const start = (min + i * bucketSize).toFixed(1);
          const end = (min + (i + 1) * bucketSize).toFixed(1);
          return {
            range: `${start} - ${end}`,
            count,
          };
        });
      }

      return {
        type: "number",
        average: isAllInt ? Math.round(avg).toString() : avg.toFixed(2),
        min: isAllInt ? Math.round(min) : min,
        max: isAllInt ? Math.round(max) : max,
        totalRecords: nums.length,
        sum: total,
        buckets,
      };
    } else {
      const counts = {};
      values.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
      });
      const total = values.length;
      const distribution = Object.keys(counts).map((val) => ({
        value: val,
        count: counts[val],
        percentage: Math.round((counts[val] / total) * 100),
      })).sort((a, b) => b.count - a.count);

      return {
        type: "categorical",
        distribution,
        totalRecords: total,
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 md:p-10 font-sans w-full">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print, nav, aside, header, footer, select, button {
            display: none !important;
          }
          body, html, #root, main, .min-h-screen {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .bg-slate-800\\/25 {
            border: 1px solid #334155 !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 20px !important;
            background: transparent !important;
          }
          .grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
          }
          .text-slate-100, .text-slate-350, .text-slate-200 {
            color: black !important;
          }
        }
      `}} />

      {/* Print-Only Header */}
      <div className="hidden print:block mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-xl font-bold text-white">DataForge Analytics Report</h1>
        <h2 className="text-lg font-semibold text-indigo-400 mt-1">
          Workspace / المساحة: {currentStudyFocus ? currentStudyFocus.title : "N/A"}
        </h2>
        {currentStudyFocus?.description && (
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {currentStudyFocus.description}
          </p>
        )}
        <div className="flex gap-6 mt-4 text-xs text-slate-500 font-medium">
          <span>Date Generated: {new Date().toLocaleDateString()}</span>
          <span>Total Records: {totalRecords} entries</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block & Selector Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-800/25 border border-slate-700/60 p-6 rounded-xl shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time statistical breakdown and data ingestion visualization.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Study Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 border border-slate-700/60 rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-bold shadow-inner transition-all cursor-pointer select-none no-print"
              >
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                  {currentStudyFocus ? currentStudyFocus.title : "Select Workspace"}
                </span>
                <svg className={`w-3.5 h-3.5 text-slate-405 transition-transform duration-250 ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-20 py-1.5 overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-805 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Select Workspace
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {studies.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedStudyId(s.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                            s.id === selectedStudyId
                              ? "text-indigo-400 bg-indigo-500/10"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          }`}
                        >
                          <span className="truncate pr-4">{s.title}</span>
                          {s.id === selectedStudyId && (
                            <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Print Report Button */}
            <button
              onClick={() => window.print()}
              disabled={loading}
              className="border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap no-print"
              title="Print report or save as PDF"
            >
              <svg className="w-4 h-4 text-emerald-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report / طباعة التقرير
            </button>

            <Link
              to="/workspaces"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow transition-all flex items-center justify-center gap-2 whitespace-nowrap no-print"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Manage Workspaces
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-xl space-y-3 shadow animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-7 bg-slate-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800/20 h-80 rounded-xl border border-slate-700/60 animate-pulse"></div>
              <div className="bg-slate-800/20 h-80 rounded-xl border border-slate-700/60 animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Card 1: Active Workspace */}
              <div className="bg-slate-800/20 p-5 border border-slate-700/60 rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <span className="text-slate-450 text-[10px] font-semibold uppercase tracking-wider block">Active Workspace</span>
                  <span className="text-xs font-bold text-slate-200 truncate block" title={currentStudyFocus?.title || "N/A"}>
                    {currentStudyFocus ? currentStudyFocus.title : "N/A"}
                  </span>
                </div>
              </div>

              {/* Card 2: Total Records */}
              <div className="bg-slate-800/20 p-5 border border-slate-700/60 rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
                  </svg>
                </div>
                <div>
                  <span className="text-slate-450 text-[10px] font-semibold uppercase tracking-wider block">Total Records</span>
                  <span className="text-2xl font-bold text-slate-200">{totalRecords}</span>
                </div>
              </div>

              {/* Card 3: Configured Fields */}
              <div className="bg-slate-800/20 p-5 border border-slate-700/60 rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-slate-450 text-[10px] font-semibold uppercase tracking-wider block">Total Fields</span>
                  <span className="text-2xl font-bold text-slate-200">{totalVariables}</span>
                </div>
              </div>

              {/* Card 4: Creator Owner */}
              <div className="bg-slate-800/20 p-5 border border-slate-700/60 rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-450 rounded-lg border border-amber-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <span className="text-slate-450 text-[10px] font-semibold uppercase tracking-wider block">Workspace Owner</span>
                  <span className="text-xs font-bold text-slate-200 truncate block" title={ownerName}>
                    {ownerName}
                  </span>
                </div>
              </div>

              {/* Card 5: Data Completeness */}
              <div className="bg-slate-800/20 p-5 border border-slate-700/60 rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-slate-450 text-[10px] font-semibold uppercase tracking-wider block">Completeness</span>
                  <span className="text-2xl font-bold text-slate-200">{completenessRate}%</span>
                </div>
              </div>

            </div>

            {/* Dashboard Content */}
            {studies.length === 0 ? (
              <div className="bg-slate-800/20 border border-slate-700/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-lg">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-200">No Workspaces Configured</h3>
                <p className="text-slate-450 text-xs mt-1 max-w-md">
                  There are no workspaces configured in the system. Please go to workspaces configuration page first.
                </p>
                <Link
                  to="/workspaces"
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow transition-all"
                >
                  Configure Workspaces
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {totalRecords === 0 ? (
                  <div className="bg-slate-800/20 border border-slate-700/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-amber-500/5 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-500/10">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-200">No Records Ingested</h3>
                    <p className="text-slate-455 text-xs mt-1 max-w-md">
                      This workspace schema variables exist, but no records have been added. Add records in records catalog page to visualize stats.
                    </p>
                    <Link
                      to={`/workspace/${currentStudyFocus?.id}/records`}
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow transition-all"
                    >
                      Go to Records Table
                    </Link>
                  </div>
                ) : analyticFields.length === 0 ? (
                  <div className="bg-slate-800/20 border border-slate-700/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-amber-500/5 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-500/10">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-200">No Variables Marked for Analytics</h3>
                    <p className="text-slate-455 text-xs mt-1 max-w-md">
                      No variable config columns have the "Analyze" checkbox checked. Toggle the "Analyze" settings checkbox in the workspace manager config.
                    </p>
                    <Link
                      to="/workspaces"
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow transition-all"
                    >
                      Go to Workspaces Manager
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {analyticFields.map((field) => {
                      const analysis = getFieldAnalysis(field);

                      if (analysis.empty) {
                        return (
                          <div key={field.key} className="bg-slate-805/30 border border-slate-700/60 rounded-xl p-5 shadow space-y-3">
                            <h3 className="text-base font-bold text-slate-200">{field.label || field.key} Analysis</h3>
                            <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                              No values registered for this analytic attribute.
                            </div>
                          </div>
                        );
                      }

                      if (analysis.type === "categorical") {
                        const chartData = {
                          labels: analysis.distribution.map((d) => d.value),
                          datasets: [
                            {
                              data: analysis.distribution.map((d) => d.count),
                              backgroundColor: [
                                "rgba(99, 102, 241, 0.75)",
                                "rgba(16, 185, 129, 0.75)",
                                "rgba(244, 63, 94, 0.75)",
                                "rgba(245, 158, 11, 0.75)",
                                "rgba(6, 182, 212, 0.75)",
                                "rgba(139, 92, 246, 0.75)",
                              ],
                              borderColor: [
                                "rgb(99, 102, 241)",
                                "rgb(16, 185, 129)",
                                "rgb(244, 63, 94)",
                                "rgb(245, 158, 11)",
                                "rgb(6, 182, 212)",
                                "rgb(139, 92, 246)",
                              ],
                              borderWidth: 1.5,
                            },
                          ],
                        };

                        return (
                          <div key={field.key} className="bg-slate-805/30 border border-slate-700/60 rounded-xl p-5 shadow space-y-4 flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 space-y-3 w-full">
                              <div>
                                <h3 className="text-base font-bold text-slate-200">{field.label || field.key} Share</h3>
                                <p className="text-xs text-slate-450">Distribution analysis of categorical options.</p>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {analysis.distribution.map((item) => (
                                  <div key={item.value} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold text-slate-350">
                                      <span>{item.value}</span>
                                      <span>{item.percentage}% ({item.count})</span>
                                    </div>
                                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-indigo-505 h-full rounded-full"
                                        style={{ width: `${item.percentage}%`, backgroundColor: "rgb(99, 102, 241)" }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="w-full md:w-44 h-44 shrink-0 flex items-center justify-center">
                              <Doughnut
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: { legend: { display: false } },
                                }}
                              />
                            </div>
                          </div>
                        );
                      } else if (analysis.type === "number") {
                        const chartData = {
                          labels: analysis.buckets.map((b) => b.range),
                          datasets: [
                            {
                              data: analysis.buckets.map((b) => b.count),
                              backgroundColor: "rgba(16, 185, 129, 0.75)",
                              borderColor: "rgb(16, 185, 129)",
                              borderWidth: 1.5,
                              borderRadius: 4,
                            },
                          ],
                        };

                        return (
                          <div key={field.key} className="bg-slate-805/30 border border-slate-700/60 rounded-xl p-5 shadow space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                              <div>
                                <h3 className="text-base font-bold text-slate-200">{field.label || field.key} Distribution</h3>
                                <p className="text-xs text-slate-450">Statistical metrics and histogram ranges.</p>
                              </div>
                              <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900 p-2 rounded-lg border border-slate-800">
                                <div className="px-2 border-r border-slate-850">
                                  <span className="text-[9px] text-slate-500 block font-normal">AVG</span>
                                  <span className="text-slate-200">{analysis.average}</span>
                                </div>
                                <div className="px-2 border-r border-slate-850">
                                  <span className="text-[9px] text-slate-500 block font-normal">MIN</span>
                                  <span className="text-slate-200">{analysis.min}</span>
                                </div>
                                <div className="px-2">
                                  <span className="text-[9px] text-slate-500 block font-normal">MAX</span>
                                  <span className="text-slate-200">{analysis.max}</span>
                                </div>
                              </div>
                            </div>
                            <div className="h-44">
                              <Bar
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: { legend: { display: false } },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: { precision: 0, color: "#64748b" },
                                      grid: { color: "#334155" }
                                    },
                                    x: {
                                      ticks: { color: "#64748b" },
                                      grid: { display: false }
                                    }
                                  },
                                }}
                              />
                            </div>
                          </div>
                        );
                      } else if (analysis.type === "timeline") {
                        const chartData = {
                          labels: analysis.distribution.map((d) => d.month),
                          datasets: [
                            {
                              label: "Records Count",
                              data: analysis.distribution.map((d) => d.count),
                              backgroundColor: "rgba(99, 102, 241, 0.12)",
                              borderColor: "rgb(99, 102, 241)",
                              borderWidth: 2,
                              pointBackgroundColor: "rgb(99, 102, 241)",
                              pointBorderColor: "#fff",
                              pointBorderWidth: 1.5,
                              pointRadius: 4,
                              tension: 0.35,
                              fill: true,
                            },
                          ],
                        };

                        return (
                          <div key={field.key} className="bg-slate-805/30 border border-slate-700/60 rounded-xl p-5 shadow space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                              <div>
                                <h3 className="text-base font-bold text-slate-200">{field.label || field.key} Timeline Trend</h3>
                                <p className="text-xs text-slate-450">Total patient entries mapped chronologically by month.</p>
                              </div>
                              <span className="bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/20">
                                {analysis.totalRecords} Entries
                              </span>
                            </div>
                            <div className="h-44">
                              <Line
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: { legend: { display: false } },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: { precision: 0, color: "#64748b" },
                                      grid: { color: "#334155" }
                                    },
                                    x: {
                                      ticks: { color: "#64748b" },
                                      grid: { display: false }
                                    }
                                  },
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
      </div>
    </div>
  );
}

export default Dashboard;
