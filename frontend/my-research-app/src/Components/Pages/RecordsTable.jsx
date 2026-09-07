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

  const fetchRecords = async (page) => {
    try {
      const data = await getRecordsByWorkspaceId(workspaceId, page, 50);
      if (data && data.success) {
        setPatients(data.records || []);
        setTotalPages(data.totalPages || 1);
        setTotalRecords(data.totalRecords || 0);
        setCurrentPage(data.currentPage || 1);
      } else {
        setPatients(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalRecords(Array.isArray(data) ? data.length : 0);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error loading records:", error);
    }
  };

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

    const aNum = Number(aVal);
    const bNum = Number(bVal);
    if (!isNaN(aNum) && !isNaN(bNum) && aVal !== "" && bVal !== "") {
      return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
    }

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
      setCurrentPage(1);
      await fetchRecords(1);
      setFormValues({});
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding record:", error);
      setErrorMsg(error.response?.data?.error?.message || "Failed to add record.");
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
    <div className="min-h-screen bg-white text-black font-serif-body py-12 px-6 md:px-10 pattern-lines">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-black font-bold">
          <Link to="/workspaces" className="hover:underline">
            WORKSPACES
          </Link>
          <span>/</span>
          <span className="border-b-2 border-black">
            {study?.title || `WORKSPACE #${workspaceId}`}
          </span>
        </nav>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-6 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-black"></span>
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold border border-black px-2 py-0.5">
                {totalRecords} TOTAL RECORDS
              </span>
            </div>
            <h1 className="font-serif-display font-black text-3xl md:text-4xl uppercase tracking-tight text-black">
              {study?.title || "WORKSPACE DATA GRID"}
            </h1>
            {study?.description && (
              <p className="font-serif-body text-sm text-neutral-700 max-w-3xl leading-relaxed">
                {study.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              id="record-file-upload"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <label
              htmlFor="record-file-upload"
              className={`bg-white hover:bg-black text-black hover:text-white font-mono text-xs uppercase tracking-widest px-4 py-2.5 border-2 border-black transition-none cursor-pointer font-bold ${
                uploading || loading || fields.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? "UPLOADING..." : "IMPORT FILE"}
            </label>

            <button
              onClick={handleDownloadExcel}
              disabled={loading || patients.length === 0}
              className="bg-white hover:bg-black text-black hover:text-white font-mono text-xs uppercase tracking-widest px-4 py-2.5 border-2 border-black transition-none cursor-pointer font-bold disabled:opacity-50"
            >
              EXPORT EXCEL
            </button>

            <button
              onClick={handleOpenModal}
              disabled={loading || fields.length === 0}
              className="bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest px-6 py-2.5 border-2 border-black transition-none cursor-pointer font-bold disabled:opacity-50"
            >
              + ADD RECORD
            </button>
          </div>
        </div>

        {/* Content Table Card */}
        <div className="border-4 border-black bg-white">
          
          <div className="p-4 border-b-2 border-black bg-neutral-100 flex items-center justify-between">
            <input
              type="text"
              placeholder="FILTER RECORDS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-3 py-2 border-b-2 border-black bg-white text-black font-mono text-xs tracking-widest focus:outline-none placeholder:text-neutral-400"
            />
            <span className="font-mono text-xs uppercase tracking-widest font-bold">
              PAGE {currentPage} OF {totalPages || 1}
            </span>
          </div>

          {loading ? (
            <div className="p-8 font-mono text-xs uppercase tracking-widest text-neutral-500">
              LOADING RECORD ROWS ENGINE...
            </div>
          ) : fields.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-12 h-12 border-2 border-black text-black flex items-center justify-center mx-auto font-mono font-bold text-xl">
                !
              </div>
              <h3 className="font-serif-display font-bold text-xl uppercase">NO COLUMNS CONFIGURED</h3>
              <p className="font-serif-body text-sm text-neutral-600 max-w-md mx-auto">
                This workspace does not have any columns defined. Open Workspaces Manager to configure schema fields.
              </p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <h3 className="font-serif-display font-bold text-xl uppercase">NO RECORDS FOUND</h3>
              <p className="font-serif-body text-sm text-neutral-600">
                {searchTerm ? "No record rows match your search query." : "Click '+ ADD RECORD' or 'IMPORT FILE' to add your dataset entries."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-serif-body">
                <thead>
                  <tr className="bg-black text-white font-mono text-xs uppercase tracking-widest border-b-2 border-black">
                    <th
                      onClick={() => handleSort("row_num")}
                      className="px-6 py-4 w-16 cursor-pointer hover:bg-neutral-800 select-none whitespace-nowrap"
                    >
                      # {sortConfig.key === "row_num" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>

                    {fields.map((field) => (
                      <th
                        key={field.key}
                        onClick={() => handleSort(field.key)}
                        className="px-6 py-4 cursor-pointer hover:bg-neutral-800 select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{field.label || field.key}</span>
                          {field.required && <span className="text-white">*</span>}
                          {sortConfig.key === field.key && (
                            <span className="text-white">
                              {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}

                    <th className="px-6 py-4 text-right w-32 whitespace-nowrap">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {sortedPatients.map((patient, idx) => {
                    const rowNumber = (currentPage - 1) * 50 + idx + 1;
                    return (
                      <tr key={patient.id || idx} className="hover:bg-neutral-100 transition-none font-serif-body">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-black">
                          #{rowNumber}
                        </td>

                        {fields.map((field) => {
                          const val = getFieldValue(patient, field);
                          return (
                            <td key={field.key} className="px-6 py-4 text-sm whitespace-nowrap text-black">
                              {val !== "" && val !== null && val !== undefined ? (
                                String(val)
                              ) : (
                                <span className="text-neutral-400 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDeletePatient(patient.id)}
                            className="font-mono text-xs uppercase tracking-widest bg-white hover:bg-black text-black hover:text-white border border-black px-3 py-1 font-bold transition-none cursor-pointer"
                          >
                            DEL
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t-2 border-black bg-white flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest">
              <span>SHOWING {patients.length} OF {totalRecords} TOTAL RECORDS</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-white hover:bg-black text-black hover:text-white border border-black px-4 py-2 font-bold transition-none disabled:opacity-40"
                >
                  ← PREV
                </button>
                <span className="font-bold px-2">
                  PAGE {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-white hover:bg-black text-black hover:text-white border border-black px-4 py-2 font-bold transition-none disabled:opacity-40"
                >
                  NEXT →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-none p-4">
          <div className="relative w-full max-w-xl bg-white border-4 border-black p-8 space-y-6 max-h-[90vh] overflow-y-auto pattern-grid">
            
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <h3 className="font-serif-display font-black text-2xl uppercase tracking-tight text-black">
                  ADD NEW RECORD
                </h3>
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-600 mt-1">
                  ENTER VALUES FOR REGISTERED SCHEMA FIELDS
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-mono font-bold text-base px-3 py-1 border-2 border-black bg-white hover:bg-black hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {errorMsg && (
                <div className="border-2 border-black bg-black text-white p-4 font-mono text-xs">
                  <span>[ERROR] {errorMsg}</span>
                </div>
              )}

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {fields.map((field) => {
                  const val = formValues[field.key] !== undefined ? formValues[field.key] : "";

                  return (
                    <div key={field.key} className="space-y-1.5 font-serif-body">
                      <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                        {field.label || field.key} {field.required && "*"}
                      </label>

                      {field.type === "select" ? (
                        <select
                          required={field.required}
                          value={val}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-black bg-white text-black font-mono text-xs uppercase cursor-pointer"
                        >
                          <option value="">SELECT AN OPTION...</option>
                          {(field.options || []).map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "number" || field.type === "decimal" ? (
                        <input
                          type="number"
                          step={field.type === "decimal" ? "any" : "1"}
                          required={field.required}
                          value={val}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder="Enter numeric value..."
                          className="w-full px-3 py-2.5 border-b-2 border-black focus:outline-none font-mono text-xs"
                        />
                      ) : field.type === "date" || field.type === "birthday" ? (
                        <input
                          type="date"
                          required={field.required}
                          value={val}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-black font-mono text-xs"
                        />
                      ) : (
                        <input
                          type="text"
                          required={field.required}
                          value={val}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder="Enter text string..."
                          className="w-full px-3 py-2.5 border-b-2 border-black focus:outline-none text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end border-t-2 border-black pt-6 gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="font-mono text-xs uppercase tracking-widest bg-white hover:bg-black text-black hover:text-white border-2 border-black px-6 py-3 font-bold transition-none cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="font-mono text-xs uppercase tracking-widest bg-black hover:bg-white text-white hover:text-black border-2 border-black px-6 py-3 font-bold transition-none cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "SAVING..." : "SAVE RECORD ENTRY →"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

export default RecordsTable;
