import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWorkspaces } from "../../services/workspaces";
import { getRecords } from "../../services/records";
import { getUsers } from "../../services/users";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { getDashboardLogs } from "../../services/logs";
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

  return str;
};

function Dashboard() {
  const { user } = useAuth();
  const [studies, setStudies] = useState([]);
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [studiesData, patientsData, usersData, logsData] = await Promise.all([
          getWorkspaces(),
          getRecords(),
          user?.role === "admin" ? getUsers() : Promise.resolve([]),
          (user?.role === "admin" || user?.role === "team_leader") ? getDashboardLogs() : Promise.resolve([])
        ]);
        setStudies(studiesData);
        setPatients(patientsData);
        setUsers(usersData);
        setLogs(logsData || []);
        
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

  const getFieldAnalysis = (field) => {
    const values = activePatients
      .map((p) => getFieldValue(p, field))
      .filter((val) => val !== undefined && val !== null && String(val).trim() !== "");

    if (values.length === 0) return { empty: true };

    if (field.type === "select" || field.type === "text") {
      const counts = {};
      values.forEach((v) => {
        const str = String(v);
        counts[str] = (counts[str] || 0) + 1;
      });

      const distribution = Object.keys(counts).map((val) => ({
        value: val,
        count: counts[val],
        percentage: Math.round((counts[val] / values.length) * 100),
      }));

      return {
        type: "categorical",
        distribution,
      };
    }

    if (field.type === "number" || field.type === "decimal") {
      const nums = values.map((v) => Number(v)).filter((n) => !isNaN(n));
      if (nums.length === 0) return { empty: true };
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const sum = nums.reduce((acc, n) => acc + n, 0);
      const mean = (sum / nums.length).toFixed(1);

      return {
        type: "numerical",
        values: nums,
        min,
        max,
        mean,
      };
    }

    return { empty: true };
  };

  return (
    <div className="min-h-screen bg-white text-black font-serif-body py-12 px-6 md:px-10 pattern-lines">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-black"></span>
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold">
                ANALYTICAL ENGINE
              </span>
            </div>
            <h1 className="font-serif-display font-black text-4xl md:text-5xl uppercase tracking-tight text-black">
              REAL-TIME ANALYTICS
            </h1>
            <p className="font-serif-body text-sm text-neutral-700 mt-1 max-w-xl">
              Distribution metrics, variable analysis, and system activity logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {studies.length > 0 && (
              <div className="relative">
                <select
                  value={selectedStudyId}
                  onChange={(e) => setSelectedStudyId(e.target.value)}
                  className="px-4 py-2.5 border-2 border-black bg-white text-black font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  {studies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              to="/workspaces"
              className="bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest px-6 py-2.5 border-2 border-black transition-none font-bold"
            >
              WORKSPACES MANAGER
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-8 font-mono text-xs uppercase tracking-widest text-neutral-500">
            COMPUTING DASHBOARD METRICS...
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              
              <div className="border-2 border-black p-5 bg-white space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                  ACTIVE WORKSPACE
                </span>
                <span className="font-serif-display font-bold text-xl text-black truncate block">
                  {currentStudyFocus ? currentStudyFocus.title : "N/A"}
                </span>
              </div>

              <div className="border-2 border-black p-5 bg-white space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                  TOTAL RECORDS
                </span>
                <span className="font-serif-display font-black text-4xl text-black">
                  {totalRecords}
                </span>
              </div>

              <div className="border-2 border-black p-5 bg-white space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                  TOTAL FIELDS
                </span>
                <span className="font-serif-display font-black text-4xl text-black">
                  {totalVariables}
                </span>
              </div>

              <div className="border-2 border-black p-5 bg-white space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                  WORKSPACE OWNER
                </span>
                <span className="font-serif-display font-bold text-xl text-black truncate block">
                  {currentStudyFocus?.owner_name || "SYSTEM"}
                </span>
              </div>

              <div className="border-2 border-black p-5 bg-white space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                  SYSTEM USER
                </span>
                <span className="font-serif-display font-bold text-xl text-black truncate block">
                  {user?.full_name || "USER"}
                </span>
              </div>

            </div>

            {/* Variable Analytics Section */}
            {currentStudyFocus && (
              <div className="border-4 border-black bg-white p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-4 gap-4">
                  <div>
                    <h2 className="font-serif-display font-black text-2xl uppercase tracking-tight text-black">
                      VARIABLE ANALYTICS — {currentStudyFocus.title}
                    </h2>
                    <p className="font-mono text-xs uppercase tracking-widest text-neutral-600 mt-1">
                      CHARTS GENERATED FOR COLUMNS MARKED AS ANALYTIC
                    </p>
                  </div>
                </div>

                {analyticFields.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-black font-mono text-xs text-neutral-500 uppercase tracking-widest">
                    NO VARIABLES MARKED FOR ANALYTICS. CHECK "ANALYZE" BOX IN WORKSPACE MANAGER.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {analyticFields.map((field) => {
                      const analysis = getFieldAnalysis(field);

                      if (analysis.empty) {
                        return (
                          <div key={field.key} className="border-2 border-black p-6 bg-white space-y-4">
                            <h3 className="font-serif-display font-bold text-xl uppercase">{field.label || field.key}</h3>
                            <p className="font-mono text-xs text-neutral-500 uppercase">NO VALUES REGISTERED FOR THIS ATTRIBUTE.</p>
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
                                "#000000",
                                "#333333",
                                "#666666",
                                "#999999",
                                "#CCCCCC",
                                "#E5E5E5",
                              ],
                              borderColor: ["#000000", "#000000", "#000000", "#000000", "#000000", "#000000"],
                              borderWidth: 2,
                            },
                          ],
                        };

                        return (
                          <div key={field.key} className="border-2 border-black p-6 bg-white space-y-6">
                            <div>
                              <h3 className="font-serif-display font-bold text-xl uppercase">{field.label || field.key} DISTRIBUTION</h3>
                              <p className="font-mono text-xs uppercase text-neutral-500 mt-1">CATEGORICAL OPTIONS</p>
                            </div>
                            <div className="h-64 flex items-center justify-center">
                              <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                          </div>
                        );
                      }

                      if (analysis.type === "numerical") {
                        const chartData = {
                          labels: analysis.values.map((_, i) => `#${i + 1}`),
                          datasets: [
                            {
                              data: analysis.values,
                              borderColor: "#000000",
                              backgroundColor: "rgba(0, 0, 0, 0.05)",
                              borderWidth: 2,
                              fill: true,
                              tension: 0,
                            },
                          ],
                        };

                        return (
                          <div key={field.key} className="border-2 border-black p-6 bg-white space-y-6">
                            <div>
                              <h3 className="font-serif-display font-bold text-xl uppercase">{field.label || field.key} NUMERICAL TREND</h3>
                              <p className="font-mono text-xs uppercase text-neutral-500 mt-1">MIN: {analysis.min} | MAX: {analysis.max} | MEAN: {analysis.mean}</p>
                            </div>
                            <div className="h-64">
                              <Line
                                data={chartData}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: { legend: { display: false } },
                                  scales: {
                                    y: { ticks: { color: "#000000" }, grid: { color: "#E5E5E5" } },
                                    x: { ticks: { color: "#000000" }, grid: { display: false } },
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

            {/* Role-Based Activity Logs Section */}
            {(user?.role === "admin" || user?.role === "team_leader") && (
              <div className="border-4 border-black bg-white p-8 space-y-6 pattern-lines">
                <div className="border-b-2 border-black pb-4">
                  <h2 className="font-serif-display font-black text-2xl uppercase tracking-tight text-black">
                    {user.role === "admin" ? "GLOBAL ACTIVITY AUDIT FEED" : "TEAM ACTIVITY HISTORY"}
                  </h2>
                  <p className="font-mono text-xs uppercase tracking-widest text-neutral-600 mt-1">
                    REAL-TIME AUDIT LOGS OF ALL WORKSPACE MUTATIONS
                  </p>
                </div>

                {logs.length === 0 ? (
                  <div className="font-mono text-xs text-neutral-500 uppercase py-6 text-center">
                    NO RECENT ACTIVITY LOGS RECORDED.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3 font-serif-body">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 border-2 border-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-black">
                            <span className="font-mono uppercase bg-black text-white px-2 py-0.5 mr-2 text-xs">
                              {log.user_name || "USER"}
                            </span>
                            {log.details || "PERFORMED ACTION"}
                          </div>
                          <div className="font-mono text-[10px] uppercase text-neutral-600 mt-1">
                            ACTION: {log.action} {log.workspace_title && `| WORKSPACE: ${log.workspace_title}`}
                          </div>
                        </div>
                        <div className="font-mono text-[10px] uppercase text-neutral-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
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
