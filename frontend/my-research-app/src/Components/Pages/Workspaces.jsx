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
    <div className="min-h-screen bg-white text-black font-serif-body py-12 px-6 md:px-10 pattern-lines">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-black pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-black"></span>
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-600 font-bold">
                WORKSPACE MANAGER
              </span>
            </div>
            <h1 className="font-serif-display font-black text-4xl md:text-5xl uppercase tracking-tight text-black">
              WORKSPACES CATALOG
            </h1>
            <p className="font-serif-body text-sm text-neutral-700 mt-1 max-w-xl">
              Configure dataset schemas, manage relational JSONB variable models, and review custom data collections.
            </p>
          </div>
          
          {/* Search & Create Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="SEARCH WORKSPACES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-mono text-xs tracking-widest placeholder:text-neutral-400"
              />
            </div>
            
            <button
              onClick={handleOpenCreateModal}
              className="bg-black hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest px-6 py-3.5 border-2 border-black transition-none cursor-pointer font-bold flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>+ CREATE WORKSPACE</span>
            </button>
          </div>
        </div>

        {/* Workspaces Table / Content Box */}
        <div className="border-4 border-black bg-white">
          {loading ? (
            <div className="p-8 space-y-4 font-mono text-xs text-neutral-500 uppercase tracking-widest">
              <span>LOADING WORKSPACES ENGINE...</span>
            </div>
          ) : filteredStudies.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-12 h-12 border-2 border-black text-black flex items-center justify-center mx-auto font-mono font-bold text-xl">
                !
              </div>
              <h3 className="font-serif-display font-bold text-xl text-black uppercase">NO WORKSPACES FOUND</h3>
              <p className="font-serif-body text-sm text-neutral-600 max-w-md mx-auto">
                {searchTerm ? "No workspaces match your search criteria." : "Create your first schema workspace to begin ingestion database collections."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-serif-body">
                <thead>
                  <tr className="bg-black text-white font-mono text-xs uppercase tracking-widest border-b-2 border-black">
                    <th
                      onClick={() => handleSort("row_num")}
                      className="px-6 py-4 w-16 cursor-pointer hover:bg-neutral-800 select-none"
                    >
                      # {sortConfig.key === "row_num" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      onClick={() => handleSort("title")}
                      className="px-6 py-4 cursor-pointer hover:bg-neutral-800 select-none"
                    >
                      WORKSPACE DETAILS {sortConfig.key === "title" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      onClick={() => handleSort("owner_id")}
                      className="px-6 py-4 w-40 cursor-pointer hover:bg-neutral-800 select-none"
                    >
                      OWNER {sortConfig.key === "owner_id" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th
                      onClick={() => handleSort("fields_count")}
                      className="px-6 py-4 w-40 cursor-pointer hover:bg-neutral-800 select-none"
                    >
                      VARIABLES {sortConfig.key === "fields_count" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="px-6 py-4 w-48 text-right">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {sortedStudies.map((study, idx) => (
                    <tr key={study.id} className="hover:bg-neutral-100 transition-none group">
                      <td className="px-6 py-5 whitespace-nowrap font-mono text-xs font-bold text-black">
                        #{idx + 1}
                      </td>
                      
                      <td className="px-6 py-5">
                        <div>
                          <h3 className="font-serif-display font-bold text-lg text-black group-hover:underline">
                            {study.title || "Untitled Workspace"}
                          </h3>
                          {study.description ? (
                            <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                              {study.description}
                            </p>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">No description provided</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="font-mono text-xs uppercase font-bold text-black border border-black px-2 py-1 bg-white">
                          {study.owner_name || `ID: ${study.owner_id.substring(0, 8)}...`}
                        </span>
                      </td>
                      
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="font-mono text-xs uppercase font-bold text-black border-2 border-black px-2.5 py-1 bg-white">
                          {getColumnCount(study.config)} FIELDS
                        </span>
                      </td>
                      
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/workspace/${study.id}/records`}
                            className="font-mono text-xs uppercase tracking-widest bg-black text-white hover:bg-white hover:text-black border border-black px-3 py-1.5 font-bold transition-none"
                            title="Open records table"
                          >
                            OPEN
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(study)}
                            className="font-mono text-xs uppercase tracking-widest bg-white hover:bg-black text-black hover:text-white border border-black px-3 py-1.5 font-bold transition-none cursor-pointer"
                            title="Edit workspace"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDeleteStudy(study.id, study.title)}
                            className="font-mono text-xs uppercase tracking-widest bg-white text-black hover:bg-black hover:text-white border border-black px-3 py-1.5 font-bold transition-none cursor-pointer"
                            title="Delete workspace"
                          >
                            DEL
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-none p-4">
          <div className="relative w-full max-w-2xl bg-white border-4 border-black p-8 space-y-6 max-h-[90vh] overflow-y-auto pattern-grid">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <h3 className="font-serif-display font-black text-2xl uppercase tracking-tight text-black">
                  {editingStudy ? "EDIT WORKSPACE" : "CREATE WORKSPACE"}
                </h3>
                <p className="font-mono text-xs uppercase tracking-widest text-neutral-600 mt-1">
                  CONFIGURE SCHEMA VARIABLES & DATA TYPES
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="font-mono font-bold text-base px-3 py-1 border-2 border-black bg-white hover:bg-black hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {errorMsg && (
                <div className="border-2 border-black bg-black text-white p-4 font-mono text-xs">
                  <span>[ERROR] {errorMsg}</span>
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    WORKSPACE TITLE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clinical Trial Cohort A..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-3 border-b-2 border-black focus:border-b-4 focus:outline-none bg-white text-black font-serif-body text-base placeholder:italic placeholder:text-neutral-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-xs uppercase font-bold tracking-widest text-black">
                    DESCRIPTION / OBJECTIVE
                  </label>
                  <textarea
                    placeholder="Describe the research objective..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-3 border-2 border-black focus:outline-none bg-white text-black font-serif-body text-sm placeholder:italic placeholder:text-neutral-400 resize-none"
                  />
                </div>
              </div>

              {/* Columns Builder Header */}
              <div className="border-t-2 border-black pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-xs uppercase font-bold tracking-widest text-black">
                    SCHEMA VARIABLE BUILDER
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="font-mono text-xs uppercase tracking-widest bg-black text-white hover:bg-white hover:text-black border-2 border-black px-4 py-2 font-bold transition-none cursor-pointer"
                  >
                    + ADD COLUMN
                  </button>
                </div>

                {fieldsList.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-black font-mono text-xs text-neutral-500 uppercase tracking-widest">
                    NO COLUMNS DEFINED. CLICK "+ ADD COLUMN" TO CONFIGURE HEADERS.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                    {fieldsList.map((field, idx) => (
                      <div key={idx} className="border-2 border-black p-4 bg-white space-y-3 font-serif-body">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            required
                            placeholder="Header Label (e.g. Age)"
                            value={field.label}
                            onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                            className="px-2.5 py-2 border-b-2 border-black focus:outline-none text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="System Key (e.g. age)"
                            value={field.key}
                            onChange={(e) => handleFieldChange(idx, "key", e.target.value)}
                            className="px-2.5 py-2 border-b-2 border-black focus:outline-none font-mono text-xs"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                            className="px-2.5 py-2 border-2 border-black font-mono text-xs uppercase cursor-pointer"
                          >
                            <option value="text">Text (string)</option>
                            <option value="number">Number</option>
                            <option value="decimal">Decimal</option>
                            <option value="select">Select Options</option>
                            <option value="date">Date</option>
                            <option value="birthday">Birthday</option>
                          </select>
                        </div>

                        {field.type === "select" && (
                          <input
                            type="text"
                            required
                            placeholder="Options (comma-separated: Option 1, Option 2)"
                            value={field.optionsText || ""}
                            onChange={(e) => handleFieldChange(idx, "optionsText", e.target.value)}
                            className="w-full px-2.5 py-2 border-2 border-black font-mono text-xs"
                          />
                        )}

                        <div className="flex items-center justify-between font-mono text-xs uppercase pt-1">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required || false}
                                onChange={(e) => handleFieldChange(idx, "required", e.target.checked)}
                                className="w-4 h-4 border-2 border-black text-black focus:ring-0 cursor-pointer"
                              />
                              <span>REQUIRED</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.is_analytic || false}
                                onChange={(e) => handleFieldChange(idx, "is_analytic", e.target.checked)}
                                className="w-4 h-4 border-2 border-black text-black focus:ring-0 cursor-pointer"
                              />
                              <span>ANALYZE</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="font-mono text-xs uppercase font-bold text-black hover:underline cursor-pointer"
                          >
                            REMOVE [✕]
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
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
                  {submitting ? "SAVING..." : "SAVE WORKSPACE →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workspaces;
