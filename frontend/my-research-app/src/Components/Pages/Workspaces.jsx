import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "../../services/workspaces";
import { getUsers } from "../../services/users";
import { useAuth } from "../Context/AuthContext";

function Workspaces() {
  const { user } = useAuth();
  const [studies, setStudies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState(null); // null means "Create" mode
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUserId, setFormUserId] = useState("");
  const [fieldsList, setFieldsList] = useState([]);

  // Load workspaces and users on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [studiesData, usersData] = await Promise.all([
          getWorkspaces(),
          user?.role === "admin" ? getUsers() : Promise.resolve([])
        ]);
        setStudies(studiesData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [user]);

  // Safely parse config to get the number of fields
  const getColumnCount = (config) => {
    if (!config) return 0;
    try {
      const parsed = typeof config === "string" ? JSON.parse(config) : config;
      return parsed?.fields?.length || 0;
    } catch (e) {
      console.error("Error parsing config:", e);
      return 0;
    }
  };

  const handleOpenCreateModal = () => {
    setErrorMsg("");
    setEditingStudy(null);
    setFormTitle("");
    setFormDescription("");
    setFormUserId(user?.id || "");
    setFieldsList([]);
    setIsModalOpen(true);
  };

  // Open Modal for Editing
  const handleOpenEditModal = (study) => {
    setErrorMsg("");
    setEditingStudy(study);
    setFormTitle(study.title || "");
    setFormDescription(study.description || "");
    setFormUserId(study.owner_id || "");

    // Load fields list
    let parsedFields = [];
    if (study.config) {
      try {
        const config =
          typeof study.config === "string"
            ? JSON.parse(study.config)
            : study.config;
        parsedFields = (config?.fields || []).map((f) => ({
          ...f,
          is_analytic: f.is_analytic !== undefined ? f.is_analytic : false,
          optionsText: f.options ? f.options.join(", ") : "",
        }));
      } catch (e) {
        console.error("Error parsing study columns config:", e);
      }
    }
    setFieldsList(parsedFields);
    setIsModalOpen(true);
  };

  // Delete Workspace
  const handleDeleteStudy = async (id, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the workspace "${title || "this workspace"}"?\nWarning: All record rows inside this workspace will be permanently deleted.`
      )
    ) {
      return;
    }

    try {
      await deleteWorkspace(id);
      setStudies((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Failed to delete workspace.");
    }
  };

  // Add Dynamic Field in Builder
  const handleAddField = () => {
    setFieldsList((prev) => [
      ...prev,
      { key: "", label: "", type: "text", required: false, is_analytic: false, optionsText: "" },
    ]);
  };

  // Remove Dynamic Field in Builder
  const handleRemoveField = (index) => {
    setFieldsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Dynamic Field value in Builder
  const handleFieldChange = (index, property, value) => {
    setFieldsList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [property]: value,
      };

      if (property === "label") {
        const isEnglish = /^[a-zA-Z0-9_ ]*$/.test(value);
        if (isEnglish) {
          updated[index].key = value
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
        }
      }
      return updated;
    });
  };

  // Sorting logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Submit Form (Create / Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formTitle.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    const invalidField = fieldsList.find((f) => !f.key.trim());
    if (invalidField) {
      setErrorMsg("All columns must have a valid system key (English letters/numbers/underscores).");
      return;
    }

    const cleanedFields = fieldsList.map((f) => {
      const cleaned = {
        key: f.key.trim(),
        type: f.type,
        label: f.label.trim(),
        required: !!f.required,
        is_analytic: !!f.is_analytic,
      };
      if (f.type === "select") {
        cleaned.options = typeof f.optionsText === "string"
          ? f.optionsText.split(",").map((o) => o.trim()).filter(Boolean)
          : (f.options || []);
      }
      return cleaned;
    });

    setSubmitting(true);
    const workspacePayload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      config: { fields: cleanedFields },
    };

    try {
      if (editingStudy) {
        const responseData = await updateWorkspace(editingStudy.id, workspacePayload);
        setStudies((prev) =>
          prev.map((s) => (s.id === editingStudy.id ? responseData : s))
        );
        setIsModalOpen(false);
      } else {
        const responseData = await createWorkspace(workspacePayload);
        setStudies((prev) => [responseData, ...prev]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving workspace:", error);
      setErrorMsg(error.response?.data?.error?.message || "Failed to save workspace. Try upgrading your subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudies = studies.filter(
    (study) =>
      study.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      study.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStudies = [...filteredStudies].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal, bVal;

    if (sortConfig.key === "title") {
      aVal = a.title || "";
      bVal = b.title || "";
    } else if (sortConfig.key === "owner_id") {
      aVal = a.owner_id || "";
      bVal = b.owner_id || "";
    } else if (sortConfig.key === "fields_count") {
      aVal = getColumnCount(a.config);
      bVal = getColumnCount(b.config);
    } else if (sortConfig.key === "row_num") {
      aVal = a.created_at || a.id;
      bVal = b.created_at || b.id;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 md:p-10 font-sans w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Workspaces
              </h1>
              <span className="bg-indigo-500/10 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/20">
                {studies.length} Total
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Manage data models, ingestion config, and workspace catalogs.
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/40 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-sm transition-all"
              />
            </div>
            
            <button
              onClick={handleOpenCreateModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Workspace
            </button>
          </div>
        </div>

        {/* Table/Content Card */}
        <div className="bg-slate-800/25 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="h-6 bg-slate-800 rounded w-1/4 animate-pulse"></div>
              <div className="border-t border-slate-800 my-4"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="space-y-2 w-1/3">
                    <div className="h-4 bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-3 bg-slate-855 rounded w-5/6 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-slate-800 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-24 animate-pulse"></div>
                  <div className="h-8 bg-slate-800 rounded w-20 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredStudies.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-200">No workspaces found</h3>
              <p className="text-slate-450 text-sm mt-1 max-w-md">
                {searchTerm ? "No workspaces match your search query." : "Create your first schema workspace to begin ingestion database collections."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/40 border-b border-slate-700/60">
                    <th
                      onClick={() => handleSort("row_num")}
                      className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 whitespace-nowrap cursor-pointer hover:text-indigo-400 select-none transition-colors"
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
                    <th
                      onClick={() => handleSort("title")}
                      className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-indigo-400 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Workspace Details
                        {sortConfig.key === "title" && (
                          <span className="text-[10px] text-indigo-400">
                            {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("owner_id")}
                      className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-24 whitespace-nowrap cursor-pointer hover:text-indigo-400 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Owner Name
                        {sortConfig.key === "owner_id" && (
                          <span className="text-[10px] text-indigo-400">
                            {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("fields_count")}
                      className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-40 whitespace-nowrap cursor-pointer hover:text-indigo-400 select-none transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        Variables config
                        {sortConfig.key === "fields_count" && (
                          <span className="text-[10px] text-indigo-400">
                            {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sortedStudies.map((study, idx) => (
                    <tr key={study.id} className="hover:bg-slate-805/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                            {study.title || "Untitled Workspace"}
                          </h3>
                          {study.description ? (
                            <p className="text-xs text-slate-450 mt-0.5 line-clamp-2 leading-relaxed">
                              {study.description}
                            </p>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">No description provided</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-slate-800 border border-slate-700/60 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase">
                            {study.owner_name ? study.owner_name.charAt(0) : "U"}
                          </div>
                          <span className="text-xs text-slate-300 font-semibold" title={study.owner_id}>
                            {study.owner_name || `ID: ${study.owner_id.substring(0, 8)}...`}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            </svg>
                            {getColumnCount(study.config)} {getColumnCount(study.config) === 1 ? "Field" : "Fields"}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/workspace/${study.id}/records`} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-all" title="Open records data grid">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(study)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                            title="Edit details/columns"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStudy(study.id, study.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-455 hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                            title="Delete workspace"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>

      {/* Dynamic Create/Edit Workspace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-auto my-6 p-4">
            
            {/* Modal Content */}
            <div className="relative flex flex-col w-full bg-slate-850 border border-slate-700/60 rounded-2xl shadow-2xl outline-none focus:outline-none overflow-hidden max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-900/30">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingStudy ? "Edit Workspace Details" : "Create New Workspace"}
                  </h3>
                  <p className="text-xs text-slate-450 mt-0.5">
                    Define variables config headers, data constraints, and fields.
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
              <form onSubmit={handleFormSubmit} className="flex flex-col overflow-hidden">
                
                {/* Scrollable Form Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                  
                  {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-350 p-3.5 rounded-xl text-xs flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0 text-rose-455" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Basic Details Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-355 uppercase tracking-wider">
                        Workspace Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Customer Survey, Product Catalog, Inventory..."
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-355 uppercase tracking-wider">
                        Description / Objective
                      </label>
                      <textarea
                        placeholder="Describe the objective, guidelines, or details of this workspace..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all resize-none"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Columns Config Builder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200 font-mono uppercase">Schema Variable Builder</h4>
                        <p className="text-[11px] text-slate-450 mt-0.5">
                          Set the column variables config required for this workspace.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="text-xs font-semibold text-indigo-450 hover:text-indigo-300 hover:bg-indigo-500/5 px-2.5 py-1.5 rounded-md border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Column
                      </button>
                    </div>

                    {/* Bilingual Guidelines Alert Box */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 text-[11px] text-amber-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-400 border-b border-amber-500/10 pb-1.5">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Database Keys Guidelines / إرشادات مفاتيح الحقول</span>
                      </div>
                      <div className="leading-relaxed space-y-1.5">
                        <p>
                          <strong>English:</strong> Please write the "System Key" in <strong>lowercase English only</strong> with <strong>no spaces</strong>. Use underscores (<code>_</code>) to separate words (e.g. <code>patient_name</code>).
                        </p>
                        <p className="border-t border-amber-500/10 pt-1.5 mt-1.5">
                          <strong>العربية:</strong> يرجى كتابة "المفتاح البرمجي" باللغة <strong>الإنجليزية والأحرف الصغيرة فقط</strong> و<strong>بدون مسافات</strong>. استخدم الشرطة السفلية (<code>_</code>) للفصل بين الكلمات (مثال: <code>patient_name</code>).
                        </p>
                      </div>
                    </div>

                    {fieldsList.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/10">
                        <span className="text-xs text-slate-450">
                          No columns defined yet. Click "Add Column" to configure your dataset headers.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">
                          <div className="flex-1">Column Label (اسم العمود)</div>
                          <div className="flex-1">System Key (المفتاح البرمجي)</div>
                          <div className="w-32">Type / النوع</div>
                          <div className="w-48 text-right pr-2">Settings / إعدادات</div>
                        </div>

                        {fieldsList.map((field, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col p-3 bg-slate-900/25 border border-slate-805 rounded-xl space-y-2 shadow-sm"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              {/* Column Label */}
                              <div className="w-full sm:flex-1 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block sm:hidden">
                                  Column Header in Table (اسم العمود)
                                </span>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Full Name / الاسم الكامل"
                                  value={field.label}
                                  onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                              </div>

                              {/* Column Key */}
                              <div className="w-full sm:flex-1 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block sm:hidden">
                                  System Key (English only)
                                </span>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. full_name"
                                  value={field.key}
                                  onChange={(e) => handleFieldChange(idx, "key", e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                              </div>

                              {/* Column Type Select */}
                              <div className="w-full sm:w-32 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block sm:hidden">
                                  Value Type
                                </span>
                                <div className="relative flex items-center">
                                  <select
                                    value={field.type}
                                    onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none pr-7 select-none"
                                  >
                                    <option value="text">Text (string)</option>
                                    <option value="number">Number</option>
                                    <option value="decimal">Decimal (float)</option>
                                    <option value="select">Select Options</option>
                                    <option value="date">Date</option>
                                    <option value="birthday">Birthday</option>
                                  </select>
                                  <div className="pointer-events-none absolute right-2 flex items-center text-slate-400">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Required checkbox & Remove button wrapper */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-48 pt-1 sm:pt-0">
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={field.required || false}
                                      onChange={(e) => handleFieldChange(idx, "required", e.target.checked)}
                                      className="w-3.5 h-3.5 text-indigo-650 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500/50"
                                    />
                                    <span className="text-xs text-slate-400 font-medium">Req</span>
                                  </label>

                                  <label className="flex items-center gap-1 cursor-pointer select-none" title="Select if this column should be analyzed (with charts) in the Dashboard.">
                                    <input
                                      type="checkbox"
                                      checked={field.is_analytic || false}
                                      onChange={(e) => handleFieldChange(idx, "is_analytic", e.target.checked)}
                                      className="w-3.5 h-3.5 text-emerald-650 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500/50"
                                    />
                                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                                      📊 Analyze
                                    </span>
                                  </label>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(idx)}
                                  className="p-1.5 text-slate-500 hover:text-rose-455 hover:bg-rose-500/5 rounded-lg transition-all cursor-pointer"
                                  title="Remove Column"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Options List Form for Select Type */}
                            {field.type === "select" && (
                              <div className="w-full px-3 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg mt-1 space-y-1">
                                <label className="block text-[10px] font-bold text-indigo-400">
                                  Dropdown Options (comma-separated list / قائمة الخيارات مفصولة بفواصل)
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. High, Medium, Low or Option 1, Option 2"
                                  value={field.optionsText || ""}
                                  onChange={(e) => handleFieldChange(idx, "optionsText", e.target.value)}
                                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-md text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end p-5 border-t border-slate-805 bg-slate-900/30 gap-3">
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
                      "Save Workspace"
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

export default Workspaces;
