import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getWorkspace } from "../../services/workspaces";
import {
  getRecordsByWorkspaceId,
  addRecord,
  deleteRecord,
  uploadRecordsFile,
} from "../../services/records";
import * as XLSX from "xlsx";

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

function RecordsTable() {
  const { workspaceId } = useParams();
  const [study, setStudy] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Load workspace details once on mount/workspace change
  useEffect(() => {
    const loadWorkspaceData = async () => {
      try {
        setLoading(true);
        const studyData = await getWorkspace(workspaceId);
        setStudy(studyData);
      } catch (error) {
        console.error("Error loading workspace details:", error);
      } finally {
        setLoading(false);
      }
    };
    loadWorkspaceData();
  }, [workspaceId]);

  // Fetch records page helper
  const fetchRecords = async (page) => {
    try {
      const data = await getRecordsByWorkspaceId(workspaceId, page, 50);
      if (data && data.success) {
        setPatients(data.records || []);
        setTotalPages(data.totalPages || 1);
        setTotalRecords(data.totalRecords || 0);
        setCurrentPage(data.currentPage || 1);
      } else {
        // Fallback for raw arrays
        setPatients(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalRecords(Array.isArray(data) ? data.length : 0);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error loading records:", error);
    }
  };

  // Load records on mount or page change
  useEffect(() => {
    fetchRecords(currentPage);
  }, [workspaceId, currentPage]);

  const getFields = () => {
    if (!study?.config) return [];
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

  const fields = getFields();

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

  // Sorting logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    if (String(patient.id).includes(term)) return true;

    return fields.some((field) => {
      const val = getFieldValue(patient, field);
      return String(val).toLowerCase().includes(term);
    });
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aVal, bVal;
    if (sortConfig.key === "row_num") {
      aVal = a.created_at || a.id;
      bVal = b.created_at || b.id;
    } else {
      const field = fields.find((f) => f.key === sortConfig.key);
      aVal = getFieldValue(a, field);
      bVal = getFieldValue(b, field);
    }

    // Try numerical comparison first
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    if (!isNaN(aNum) && !isNaN(bNum) && aVal !== "" && bVal !== "") {
      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    }

    // Alphabetical comparison fallback
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
    if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleOpenModal = () => {
    setErrorMsg("");
    const initialValues = {};
    fields.forEach((field) => {
      if (field.type === "date") {
        initialValues[field.key] = new Date().toISOString().split("T")[0];
      }
    });
    setFormValues(initialValues);
    setIsModalOpen(true);
  };

  const handleInputChange = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadRecordsFile(workspaceId, file);
      alert("Records imported successfully!");
      // Reset to page 1 and fetch updated list
      setCurrentPage(1);
      await fetchRecords(1);
    } catch (error) {
      console.error("Error uploading records file:", error);
      alert(error.response?.data?.error?.message || "Failed to upload file. Check subscription record limits.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      const newRecord = {
        workspace_id: workspaceId,
        data: formValues
      };

      await addRecord(newRecord);
      
      // Re-fetch page 1 to sync with paginated database state
      setCurrentPage(1);
      await fetchRecords(1);
      setFormValues({});
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding record:", error);
      setErrorMsg(error.response?.data?.error?.message || "Failed to add record. Workspace limits might be exceeded.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record row?")) {
      return;
    }
    try {
      await deleteRecord(id);
      // Re-fetch the current page to replace the deleted row
      await fetchRecords(currentPage);
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    }
  };
  
  const handleDownloadExcel = () => {
    if (!study || patients.length === 0) {
      alert("No data available to export.");
      return;
    }

    try {
      const rows = patients.map((patient) => {
        const row = {};
        fields.forEach((field) => {
          const headerName = field.label || field.key;
          row[headerName] = getFieldValue(patient, field);
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Workspace Data");

      const cleanTitle = study.title ? study.title.replace(/[^a-zA-Z0-9_\u0600-\u06FF ]/g, "").trim() : "workspace";
      const fileName = `${cleanTitle.replace(/\s+/g, "_")}_records.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting Excel file:", error);
      alert("Failed to export Excel file.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 md:p-10 font-sans w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center text-sm text-slate-400 gap-2">
          <Link to="/workspaces" className="hover:text-indigo-400 font-medium transition-colors">
            Workspaces
          </Link>
          <svg className="w-4 h-4 text-slate-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-200 font-semibold truncate max-w-xs md:max-w-md">
            {study?.title || `Workspace #${workspaceId}`}
          </span>
        </nav>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-805/40 border border-slate-700/60 p-6 rounded-xl shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/20">
                {patients.length} Records
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {study?.title || "Loading Workspace..."}
            </h1>
            {study?.description && (
              <p className="text-slate-450 text-sm max-w-3xl leading-relaxed">
                {study.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              id="record-file-upload"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <label
              htmlFor="record-file-upload"
              className={`border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                uploading || loading || fields.length === 0 ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
              }`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import File
                </>
              )}
            </label>

            <button
              onClick={handleDownloadExcel}
              disabled={loading || patients.length === 0}
              className="border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download records as Excel"
            >
              <svg className="w-4 h-4 text-emerald-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Excel
            </button>

            <button
              onClick={handleOpenModal}
              disabled={loading || fields.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow transition-all flex items-center gap-2 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Record
            </button>
          </div>
        </div>

        {/* Content Table Card */}
        <div className="bg-slate-800/25 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden">
          
          <div className="p-5 border-b border-slate-700/60 bg-slate-900/30">
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              <div className="h-6 bg-slate-800 rounded w-1/4 animate-pulse"></div>
              <div className="h-3 bg-slate-855 rounded w-2/3 animate-pulse"></div>
              <div className="border-t border-slate-800 my-4"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-800/50 rounded animate-pulse"></div>
              ))}
            </div>
          ) : fields.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-amber-500/5 text-amber-500 rounded-full flex items-center justify-center mb-4 border border-amber-500/10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-200">No Columns Configured</h3>
              <p className="text-slate-450 text-xs mt-1 max-w-md">
                This workspace does not have any schema variables configured. Go back and add columns in editor settings.
              </p>
            </div>
          ) : sortedPatients.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-200">No records found</h3>
              <p className="text-slate-450 text-xs mt-1 max-w-md">
                {searchTerm ? "No records match the search query." : "Start adding records for this workspace by clicking 'Add Record'."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/40 border-b border-slate-700/60">
                    <th
                      onClick={() => handleSort("row_num")}
                      className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 cursor-pointer hover:text-indigo-400 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        #
                        {sortConfig.key === "row_num" && (
                          <span className="text-[10px] text-indigo-400">
                            {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    {fields.map((field) => (
                      <th
                        key={field.key}
                        onClick={() => handleSort(field.key)}
                        className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[150px] whitespace-nowrap cursor-pointer hover:text-indigo-400 select-none transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          {field.label || field.key}
                          {sortConfig.key === field.key && (
                            <span className="text-[10px] text-indigo-400">
                              {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-805">
                  {sortedPatients.map((patient, idx) => (
                    <tr key={patient.id} className="hover:bg-slate-805/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                        {(currentPage - 1) * 50 + idx + 1}
                      </td>
                      {fields.map((field) => (
                        <td key={field.key} className="px-6 py-4 whitespace-nowrap text-xs text-slate-300 font-medium">
                          {getFieldValue(patient, field) || <span className="text-slate-600">-</span>}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-455 hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                          title="Delete Record Row"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-900/40 border-t border-slate-800 rounded-b-2xl">
                <div className="text-xs text-slate-400">
                  Showing <span className="font-semibold text-white">{patients.length}</span> of <span className="font-semibold text-white">{totalRecords}</span> records
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-700 rounded-lg text-slate-300 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Previous Page"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs font-semibold text-slate-300 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-700 rounded-lg text-slate-300 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    title="Next Page"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>

      {/* Dynamic Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-auto my-6 p-4">
            
            {/* Modal Box */}
            <div className="relative flex flex-col w-full bg-slate-850 border border-slate-700/60 rounded-2xl shadow-2xl outline-none focus:outline-none overflow-hidden">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-900/30">
                <div>
                  <h3 className="text-lg font-bold text-white">Add Record Row</h3>
                  <p className="text-xs text-slate-450 mt-0.5">
                    Insert values for the workspace's configured columns.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 ml-auto bg-transparent border-0 text-slate-400 hover:text-slate-200 float-right leading-none font-semibold outline-none focus:outline-none transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit}>
                <div className="relative p-6 flex-auto max-h-[60vh] overflow-y-auto space-y-4">
                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-350 p-3 rounded-xl text-xs flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0 text-rose-455" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-355 uppercase tracking-wider">
                        {field.label || field.key}
                        {field.required && <span className="text-rose-550 ml-0.5">*</span>}
                      </label>
                      
                      {field.type === "select" ? (
                        <div className="relative flex items-center">
                          <select
                            required={field.required}
                            value={formValues[field.key] || ""}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all cursor-pointer appearance-none pr-8 select-none"
                          >
                            <option value="">Select / اختر...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-3 flex items-center text-slate-400">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ) : field.type === "date" || field.type === "birthday" ? (
                        <input
                          type="date"
                          required={field.required}
                          value={formValues[field.key] || ""}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all cursor-pointer"
                        />
                      ) : field.type === "number" || field.type === "decimal" ? (
                        <input
                          type="number"
                          step={field.type === "decimal" ? "any" : "1"}
                          required={field.required}
                          value={formValues[field.key] || ""}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label || field.key}`}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                        />
                      ) : (
                        <input
                          type="text"
                          required={field.required}
                          value={formValues[field.key] || ""}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={`Enter ${field.label || field.key}`}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end p-5 border-t border-slate-800 bg-slate-900/30 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-700 text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow transition-all flex items-center gap-1.5 disabled:bg-indigo-500/50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Record"
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordsTable;
