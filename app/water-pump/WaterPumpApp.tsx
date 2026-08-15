"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  CircleDollarSign,
  Database,
  Droplets,
  Factory,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createBlankWaterPumpProject,
  dateLabel,
  deriveProjectPubStatus,
  derivePumpPubStatus,
  moneyLabel,
  pumpOptionsSeed,
  waterPumpProjectsSeed,
  waterPumpStatuses,
  type WaterPumpOption,
  type WaterPumpProject,
  type WaterPumpProjectPump,
  type WaterPumpQuotation,
} from "@/lib/water-pump-data";

type PumpView = "dashboard" | "projects" | "suppliers" | "options" | "detail" | "edit";

type WaterPumpApiResponse = {
  connected?: boolean;
  message?: string;
  options?: WaterPumpOption[];
  projects?: WaterPumpProject[];
  project?: WaterPumpProject;
  option?: WaterPumpOption;
  deleted?: string;
  error?: string;
};

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "projects" as const, label: "Projects", icon: Building2 },
  { id: "suppliers" as const, label: "Suppliers", icon: Truck },
  { id: "options" as const, label: "Pump Options", icon: Settings2 },
];

const viewTitles: Record<PumpView, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: "PUMP TRACKER - Q", title: "项目总览" },
  projects: { eyebrow: "PROJECT REGISTER", title: "全部项目" },
  suppliers: { eyebrow: "SUPPLIER DIRECTORY", title: "Supplier 管理" },
  options: { eyebrow: "PUMP OPTION LIBRARY", title: "Pump 选项" },
  detail: { eyebrow: "PROJECT DETAIL", title: "项目详情" },
  edit: { eyebrow: "PROJECT FORM", title: "编辑项目" },
};

function todayLabel() {
  return dateLabel(new Date().toISOString().slice(0, 10));
}

function localId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneProject(project: WaterPumpProject): WaterPumpProject {
  return {
    ...project,
    pumps: project.pumps.map((pump) => ({ ...pump })),
    quotations: project.quotations.map((quotation) => ({ ...quotation })),
    tank: { ...project.tank },
  };
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function WaterPumpApp() {
  const mainAppUrl =
    process.env.NEXT_PUBLIC_MAIN_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "/";
  const [view, setView] = useState<PumpView>("dashboard");
  const [projects, setProjects] = useState<WaterPumpProject[]>(waterPumpProjectsSeed);
  const [options, setOptions] = useState<WaterPumpOption[]>(pumpOptionsSeed);
  const [selectedProjectId, setSelectedProjectId] = useState(waterPumpProjectsSeed[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dbConnected, setDbConnected] = useState(false);
  const [dbMessage, setDbMessage] = useState("Checking database...");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  useEffect(() => {
    let mounted = true;

    fetch("/api/water-pump", { cache: "no-store" })
      .then((response) => response.json() as Promise<WaterPumpApiResponse>)
      .then((payload) => {
        if (!mounted) return;
        setDbConnected(Boolean(payload.connected));
        setDbMessage(payload.message ?? (payload.connected ? "Database connected" : "Preview data loaded"));
        if (payload.options?.length) setOptions(payload.options);
        if (payload.projects) {
          setProjects(payload.projects);
          setSelectedProjectId(payload.projects[0]?.id ?? "");
        }
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setDbConnected(false);
        setDbMessage(error instanceof Error ? error.message : "Preview data loaded");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return projects.filter((project) => {
      const statusMatches = statusFilter === "All Status" || project.status === statusFilter;
      const searchMatches =
        !needle ||
        [
          project.name,
          project.address,
          project.maincon,
          project.contact,
          project.status,
          project.pubStatus,
          ...project.pumps.flatMap((pump) => [pump.optionCode, pump.optionName, pump.location]),
          ...project.quotations.flatMap((quotation) => [
            quotation.supplierName,
            quotation.contactPerson,
            quotation.quoteNumber,
          ]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return statusMatches && searchMatches;
    });
  }, [projects, search, statusFilter]);

  const suppliers = useMemo(() => {
    const supplierMap = new Map<
      string,
      { name: string; contact: string; quotedProjects: number; selected: number; latestQuote: string }
    >();

    projects.forEach((project) => {
      project.quotations.forEach((quotation) => {
        const key = quotation.supplierName.trim().toLowerCase();
        if (!key) return;
        const current =
          supplierMap.get(key) ??
          {
            name: quotation.supplierName,
            contact: quotation.contactPerson || "—",
            quotedProjects: 0,
            selected: 0,
            latestQuote: quotation.quoteDate,
          };
        current.quotedProjects += 1;
        current.selected += quotation.selected ? 1 : 0;
        if (quotation.quoteDate && quotation.quoteDate > current.latestQuote) {
          current.latestQuote = quotation.quoteDate;
        }
        supplierMap.set(key, current);
      });
    });

    return Array.from(supplierMap.values());
  }, [projects]);

  const navigate = (next: PumpView) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProject = (project: WaterPumpProject) => {
    setSelectedProjectId(project.id);
    navigate("detail");
  };

  const editProject = (project: WaterPumpProject) => {
    setSelectedProjectId(project.id);
    navigate("edit");
  };

  const startNewProject = () => {
    const nextNumber = Math.max(0, ...projects.map((project) => project.projectNumber)) + 1;
    const draft = createBlankWaterPumpProject(nextNumber);
    setProjects((current) => [draft, ...current]);
    setSelectedProjectId(draft.id);
    navigate("edit");
  };

  const saveProject = async (project: WaterPumpProject) => {
    const cleanProject = {
      ...project,
      pubStatus: deriveProjectPubStatus(project),
      updatedLabel: todayLabel(),
    };

    setSaving(true);
    setProjects((current) => {
      const exists = current.some((item) => item.id === cleanProject.id);
      return exists
        ? current.map((item) => (item.id === cleanProject.id ? cleanProject : item))
        : [cleanProject, ...current];
    });
    setSelectedProjectId(cleanProject.id);

    try {
      const response = await fetch("/api/water-pump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveProject", project: cleanProject }),
      });
      const payload = (await response.json()) as WaterPumpApiResponse;
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Water Pump save failed");

      if (payload.project) {
        setProjects((current) =>
          current.map((item) =>
            item.id === cleanProject.id || item.id === payload.project?.id
              ? payload.project!
              : item,
          ),
        );
        setSelectedProjectId(payload.project.id);
      }

      setDbConnected(Boolean(payload.connected));
      if (payload.connected) setDbMessage("Database connected");
      showToast(payload.connected ? "Project saved to Supabase" : "Project saved in local preview");
      navigate("detail");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Water Pump save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (project: WaterPumpProject) => {
    if (!window.confirm(`Delete ${project.name || "this Water Pump project"}? This will remove all pump details and quotations from Supabase.`)) {
      return;
    }

    const nextProjects = projects.filter((item) => item.id !== project.id);
    setProjects(nextProjects);
    setSelectedProjectId(nextProjects[0]?.id ?? "");
    navigate("projects");

    try {
      await fetch(`/api/water-pump?id=${encodeURIComponent(project.id)}`, {
        method: "DELETE",
      });
      showToast("Project deleted");
    } catch {
      showToast("Project removed locally");
    }
  };

  const saveOption = async (option: WaterPumpOption) => {
    setOptions((current) => {
      const exists = current.some((item) => item.code === option.code);
      return exists
        ? current.map((item) => (item.code === option.code ? option : item))
        : [...current, option].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    try {
      const response = await fetch("/api/water-pump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveOption", option }),
      });
      const payload = (await response.json()) as WaterPumpApiResponse;
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Option save failed");
      showToast(payload.connected ? "Pump option saved" : "Pump option added locally");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Pump option added locally");
    }
  };

  const toggleOption = async (code: string, active: boolean) => {
    setOptions((current) =>
      current.map((option) => (option.code === code ? { ...option, active } : option)),
    );

    try {
      await fetch("/api/water-pump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleOption", code, active }),
      });
    } catch {
      // Local state already reflects the user's choice.
    }
  };

  const deleteOption = async (option: WaterPumpOption) => {
    if (option.isDefault) {
      showToast("System default pump options cannot be deleted");
      return;
    }
    if (!window.confirm(`Delete custom pump option ${option.name}? Projects using it may block the delete.`)) {
      return;
    }

    const previousOptions = options;
    setOptions((current) => current.filter((item) => item.code !== option.code));

    try {
      const response = await fetch("/api/water-pump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteOption", code: option.code }),
      });
      const payload = (await response.json()) as WaterPumpApiResponse;
      if (!response.ok || payload.error) throw new Error(payload.error ?? "Option delete failed");
      showToast("Pump option deleted");
    } catch (error) {
      setOptions(previousOptions);
      showToast(error instanceof Error ? error.message : "Pump option delete failed");
    }
  };

  const header = viewTitles[view];

  return (
    <div className="wp-shell">
      <aside className="wp-sidebar">
        <div className="wp-brand">
          <div className="wp-brand-mark">Q</div>
          <div>
            <strong>Pump Tracker</strong>
            <span>WATER &amp; PUMP CONTROL</span>
          </div>
        </div>

        <button className="wp-back-main" onClick={() => window.location.assign(mainAppUrl)}>
          <ArrowLeft size={16} />
          Back to PlumbTrack
        </button>

        <nav className="wp-nav" aria-label="Pump Tracker navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              view === item.id ||
              ((view === "detail" || view === "edit") && item.id === "projects");
            return (
              <button
                key={item.id}
                className={active ? "active" : ""}
                onClick={() => navigate(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`wp-db-card ${dbConnected ? "connected" : ""}`}>
          <Database size={18} />
          <div>
            <strong>{dbConnected ? "Database 已连接" : "Preview Database"}</strong>
            <span>{dbConnected ? "所有项目自动保存" : dbMessage}</span>
          </div>
        </div>
      </aside>

      <main className="wp-main">
        <header className="wp-header">
          <div>
            <p>{header.eyebrow}</p>
            <h1>{header.title}</h1>
          </div>
          <div className="wp-header-actions">
            <label className="wp-search">
              <Search size={18} />
              <span className="sr-only">Search Water Pump records</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索项目、Maincon、Supplier、Pump…"
              />
            </label>
            <button className="wp-primary" onClick={startNewProject}>
              <Plus size={18} /> New Project
            </button>
          </div>
        </header>

        {loading ? (
          <section className="wp-loading">
            <Droplets size={28} />
            <span>Loading Water Pump workspace...</span>
          </section>
        ) : view === "dashboard" ? (
          <DashboardView
            projects={projects}
            filteredProjects={filteredProjects}
            onOpen={openProject}
            onCreate={startNewProject}
          />
        ) : view === "projects" ? (
          <ProjectsView
            projects={filteredProjects}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onOpen={openProject}
            onEdit={editProject}
            onCreate={startNewProject}
          />
        ) : view === "detail" && selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            onBack={() => navigate("projects")}
            onEdit={() => editProject(selectedProject)}
            onDelete={() => deleteProject(selectedProject)}
          />
        ) : view === "edit" && selectedProject ? (
          <ProjectEditView
            project={selectedProject}
            options={options}
            saving={saving}
            onCancel={() => navigate(selectedProject.name ? "detail" : "projects")}
            onSave={saveProject}
            onDelete={() => deleteProject(selectedProject)}
          />
        ) : view === "suppliers" ? (
          <SuppliersView suppliers={suppliers} />
        ) : view === "options" ? (
          <PumpOptionsView options={options} onSave={saveOption} onToggle={toggleOption} onDelete={deleteOption} />
        ) : (
          <section className="wp-empty">
            <Droplets size={28} />
            <strong>No Water Pump project selected.</strong>
          </section>
        )}
      </main>

      {toast && (
        <div className="wp-toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

function DashboardView({
  projects,
  filteredProjects,
  onOpen,
  onCreate,
}: {
  projects: WaterPumpProject[];
  filteredProjects: WaterPumpProject[];
  onOpen: (project: WaterPumpProject) => void;
  onCreate: () => void;
}) {
  const metrics = [
    { label: "TOTAL PROJECTS", value: projects.length.toString().padStart(2, "0"), note: "全部工程", icon: Droplets },
    {
      label: "WAITING FOR QUOTATION",
      value: projects.filter((project) => project.status === "Waiting for Quotation").length.toString().padStart(2, "0"),
      note: "等待报价",
      icon: CircleDollarSign,
    },
    {
      label: "SUPPLIER SELECTED",
      value: projects.filter((project) => project.status === "Supplier Selected").length.toString().padStart(2, "0"),
      note: "已确定 Supplier",
      icon: Check,
    },
    {
      label: "PUB NOT SUBMITTED",
      value: projects.filter((project) => project.pubStatus === "Not Submitted").length.toString().padStart(2, "0"),
      note: "需要跟进",
      icon: FileCheck2,
    },
    {
      label: "PUB SUBMITTED",
      value: projects.filter((project) => project.pubStatus === "Submitted").length.toString().padStart(2, "0"),
      note: "等待批准",
      icon: ShieldCheck,
    },
    {
      label: "PUB APPROVED",
      value: projects.filter((project) => project.pubStatus === "Approved").length.toString().padStart(2, "0"),
      note: "已批准",
      icon: Gauge,
    },
  ];

  return (
    <>
      <section className="wp-hero">
        <div>
          <p>WATER TANK &amp; PUMP MANAGEMENT</p>
          <h2>工程资料，一眼就清楚。</h2>
          <span>快速记录 Pump 需求、比较 Supplier 报价，并追踪每台 Pump 的 PUB 状态。</span>
          <button onClick={onCreate}>
            <Plus size={17} /> 建立新项目
          </button>
        </div>
        <div className="wp-hero-orb">
          <Droplets size={42} />
          <b>Q</b>
        </div>
      </section>

      <section className="wp-metric-grid">
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article className="wp-metric" key={label}>
            <Icon size={20} />
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{note}</span>
          </article>
        ))}
      </section>

      <ProjectTable
        title="最近更新项目"
        subtitle="Latest updated projects"
        projects={filteredProjects.slice(0, 5)}
        onOpen={onOpen}
        showEdit={false}
      />
    </>
  );
}

function ProjectsView({
  projects,
  statusFilter,
  setStatusFilter,
  onOpen,
  onEdit,
  onCreate,
}: {
  projects: WaterPumpProject[];
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onOpen: (project: WaterPumpProject) => void;
  onEdit: (project: WaterPumpProject) => void;
  onCreate: () => void;
}) {
  return (
    <section className="wp-card">
      <div className="wp-section-head">
        <div>
          <h2>Projects</h2>
          <p>{projects.length} project records · Latest updated first</p>
        </div>
        <div className="wp-table-tools">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All Status</option>
            {waterPumpStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <button className="wp-primary small" onClick={onCreate}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>
      <ProjectRows projects={projects} onOpen={onOpen} onEdit={onEdit} showEdit />
    </section>
  );
}

function ProjectTable({
  title,
  subtitle,
  projects,
  onOpen,
  showEdit,
}: {
  title: string;
  subtitle: string;
  projects: WaterPumpProject[];
  onOpen: (project: WaterPumpProject) => void;
  showEdit: boolean;
}) {
  return (
    <section className="wp-card">
      <div className="wp-section-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <select aria-label="Status filter" defaultValue="All Status">
          <option>All Status</option>
          {waterPumpStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>
      <ProjectRows
        projects={projects}
        onOpen={onOpen}
        onEdit={onOpen}
        showEdit={showEdit}
      />
    </section>
  );
}

function ProjectRows({
  projects,
  onOpen,
  onEdit,
  showEdit,
}: {
  projects: WaterPumpProject[];
  onOpen: (project: WaterPumpProject) => void;
  onEdit: (project: WaterPumpProject) => void;
  showEdit: boolean;
}) {
  if (projects.length === 0) {
    return (
      <div className="wp-empty">
        <Droplets size={27} />
        <strong>No matching pump projects.</strong>
        <span>Try another search term or create a new Water Pump project.</span>
      </div>
    );
  }

  return (
    <div className="wp-project-table">
      <div className="wp-table-head">
        <span>PROJECT</span>
        <span>PUMPS</span>
        <span>QUOTATIONS</span>
        <span>SELECTED SUPPLIER</span>
        <span>PUB STATUS</span>
        <span>UPDATED</span>
        <span />
      </div>
      {projects.map((project) => (
        <article className="wp-table-row" key={project.id}>
          <button className="wp-project-main" onClick={() => onOpen(project)}>
            <b>{project.projectNumber === 1 ? "36" : project.projectNumber}</b>
            <span>
              <strong>{project.name || "Untitled Project"}</strong>
              <small>{project.maincon || "No Maincon yet"}</small>
              <em className={`wp-status ${statusClass(project.status)}`}>{project.status}</em>
            </span>
          </button>
          <span className="wp-chip-line">
            {project.pumps.map((pump) => (
              <i key={pump.id}>{pump.optionCode}</i>
            ))}
          </span>
          <span>
            <strong>{project.quotations.length} Supplier quotes</strong>
          </span>
          <span>
            <strong>{project.selectedSupplierName || "Not selected"}</strong>
            <small>{moneyLabel(project.finalConfirmedPrice)}</small>
          </span>
          <span>
            <em className={`wp-pub ${statusClass(project.pubStatus)}`}>{project.pubStatus}</em>
          </span>
          <span>
            <strong>{project.updatedLabel || "—"}</strong>
          </span>
          <span className="wp-row-actions">
            <button onClick={() => onOpen(project)}>查看</button>
            {showEdit && <button onClick={() => onEdit(project)}>编辑</button>}
          </span>
        </article>
      ))}
    </div>
  );
}

function ProjectDetailView({
  project,
  onBack,
  onEdit,
  onDelete,
}: {
  project: WaterPumpProject;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="wp-detail">
      <button className="wp-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <section className="wp-detail-hero">
        <div>
          <p>PROJECT #{project.projectNumber}</p>
          <h2>{project.name || "Untitled Project"}</h2>
          <span>
            {project.address || "No project address yet"} · Updated {project.updatedLabel || "—"}
          </span>
          <div>
            <em className={`wp-status ${statusClass(project.status)}`}>{project.status}</em>
            <em className={`wp-pub ${statusClass(project.pubStatus)}`}>{project.pubStatus}</em>
          </div>
        </div>
        <aside>
          <small>FINAL CONFIRMED</small>
          <strong>{moneyLabel(project.finalConfirmedPrice)}</strong>
          <span>{project.selectedSupplierName || "Supplier not selected"}</span>
        </aside>
      </section>

      <div className="wp-detail-grid">
        <div className="wp-detail-main">
          <section className="wp-card">
            <div className="wp-section-head">
              <div>
                <h2>Pump &amp; PUB Status</h2>
                <p>{project.pumps.length} selected pump types</p>
              </div>
              <button onClick={onEdit}>Update PUB Status</button>
            </div>
            <div className="wp-pump-status-grid">
              {project.pumps.map((pump) => (
                <article key={pump.id}>
                  <b>{pump.optionCode}</b>
                  <div>
                    <h3>{pump.optionName}</h3>
                    <p>
                      {pump.location || "No location"} · Qty {pump.quantity}
                    </p>
                  </div>
                  <em className={`wp-pub ${statusClass(derivePumpPubStatus(pump))}`}>
                    {derivePumpPubStatus(pump)}
                  </em>
                  <dl>
                    <Data label="Need PUB" value={pump.needPub ? "Yes" : "No"} />
                    <Data label="Submitted" value={pump.submittedPub ? "Yes" : "No"} />
                    <Data label="Approved" value={pump.approvedPub ? "Yes" : "No"} />
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section className="wp-card">
            <div className="wp-section-head">
              <div>
                <h2>Supplier Quotations</h2>
                <p>{project.quotations.length} quotation records</p>
              </div>
              <button onClick={onEdit}>Change Selected Supplier</button>
            </div>
            <div className="wp-quotation-table">
              <div>
                <span>SUPPLIER</span>
                <span>QUOTE NO.</span>
                <span>DATE</span>
                <span>PRICE</span>
                <span>STATUS</span>
              </div>
              {project.quotations.map((quotation) => (
                <article key={quotation.id}>
                  <span>
                    <strong>{quotation.supplierName || "Unnamed Supplier"}</strong>
                    <small>{quotation.contactPerson || "—"}</small>
                  </span>
                  <span>{quotation.quoteNumber || "—"}</span>
                  <span>{dateLabel(quotation.quoteDate)}</span>
                  <span>{moneyLabel(quotation.totalPrice)}</span>
                  <em>{quotation.selected ? "Selected" : "Not Selected"}</em>
                </article>
              ))}
            </div>
          </section>

          <section className="wp-card">
            <div className="wp-section-head">
              <div>
                <h2>Water Tank Information</h2>
                <p>{project.tank.supplyType}</p>
              </div>
              <strong className="wp-own">OWN SUPPLY</strong>
            </div>
            <div className="wp-tank-card">
              <b>OWN</b>
              <div className="wp-data-grid">
                <Data label="Tank Size" value={project.tank.tankSize || "—"} />
                <Data label="Quantity" value={String(project.tank.quantity || "—")} />
                <Data label="Location" value={project.tank.location || "—"} />
                <Data label="Installation Fee" value={moneyLabel(project.tank.installationFee)} />
                <Data label="Booster Pump" value={`Qty ${project.tank.boosterPumpQuantity || 0}`} />
                <Data label="Supplier Scope" value={project.tank.supplierScope || "—"} />
              </div>
            </div>
          </section>

          <div className="wp-detail-actions">
            <button className="wp-primary" onClick={onEdit}>
              <Pencil size={17} /> Edit Project
            </button>
            <button onClick={onEdit}>
              <FileCheck2 size={17} /> Update PUB Status
            </button>
            <button className="danger" onClick={onDelete}>
              <Trash2 size={17} /> Delete Project
            </button>
          </div>
        </div>

        <aside className="wp-info-card">
          <Factory size={22} />
          <h3>Project Information</h3>
          <Data label="Maincon" value={project.maincon || "—"} />
          <Data label="Contact" value={project.contact || "—"} />
          <Data label="Confirmation Date" value={dateLabel(project.confirmationDate)} />
          <Data label="PO Number" value={project.poNumber || "—"} />
        </aside>
      </div>
    </div>
  );
}

function ProjectEditView({
  project,
  options,
  saving,
  onCancel,
  onSave,
  onDelete,
}: {
  project: WaterPumpProject;
  options: WaterPumpOption[];
  saving: boolean;
  onCancel: () => void;
  onSave: (project: WaterPumpProject) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(() => cloneProject(project));

  const update = <K extends keyof WaterPumpProject>(key: K, value: WaterPumpProject[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updatePump = (id: string, patch: Partial<WaterPumpProjectPump>) => {
    setDraft((current) => ({
      ...current,
      pumps: current.pumps.map((pump) => (pump.id === id ? { ...pump, ...patch } : pump)),
    }));
  };

  const togglePump = (option: WaterPumpOption) => {
    setDraft((current) => {
      const exists = current.pumps.some((pump) => pump.optionCode === option.code);
      if (exists) {
        if (!window.confirm(`Remove ${option.name} from this project?`)) return current;
        return {
          ...current,
          pumps: current.pumps.filter((pump) => pump.optionCode !== option.code),
        };
      }
      return {
        ...current,
        pumps: [
          ...current.pumps,
          {
            id: localId("pump"),
            optionCode: option.code,
            optionName: option.name,
            quantity: 1,
            location: option.code === "WT" ? "1ST U/G" : "",
            needPub: option.code === "WT",
            submittedPub: false,
            approvedPub: false,
            remark: "",
          },
        ],
      };
    });
  };

  const deletePump = (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    setDraft((current) => ({
      ...current,
      pumps: current.pumps.filter((pump) => pump.id !== id),
    }));
  };

  const updateQuotation = (id: string, patch: Partial<WaterPumpQuotation>) => {
    setDraft((current) => ({
      ...current,
      quotations: current.quotations.map((quotation) =>
        quotation.id === id ? { ...quotation, ...patch } : quotation,
      ),
    }));
  };

  const deleteQuotation = (id: string, supplierName: string) => {
    if (!window.confirm(`Delete quotation ${supplierName || "this supplier"}?`)) return;
    setDraft((current) => ({
      ...current,
      selectedSupplierName:
        current.quotations.find((quotation) => quotation.id === id)?.selected
          ? "Not selected"
          : current.selectedSupplierName,
      quotations: current.quotations.filter((quotation) => quotation.id !== id),
    }));
  };

  const selectQuotation = (id: string) => {
    setDraft((current) => ({
      ...current,
      selectedSupplierName:
        current.quotations.find((quotation) => quotation.id === id)?.supplierName ??
        "Not selected",
      quotations: current.quotations.map((quotation) => ({
        ...quotation,
        selected: quotation.id === id,
      })),
    }));
  };

  const addQuotation = () => {
    setDraft((current) => ({
      ...current,
      quotations: [
        ...current.quotations,
        {
          id: localId("quote"),
          supplierName: "",
          quoteNumber: "",
          quoteDate: "",
          totalPrice: null,
          contactPerson: "",
          contactNumber: "",
          gstStatus: "Not Specified",
          leadTime: "",
          warranty: "",
          remark: "",
          selected: false,
        },
      ],
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...draft,
      pubStatus: deriveProjectPubStatus(draft),
      selectedSupplierName:
        draft.quotations.find((quotation) => quotation.selected)?.supplierName ||
        "Not selected",
    });
  };

  return (
    <form className="wp-edit" onSubmit={submit}>
      <section className="wp-detail-hero edit">
        <div>
          <p>PROJECT #{draft.projectNumber}</p>
          <h2>{draft.name || "New Water Pump Project"}</h2>
          <span>只记录工程需要的 Pump、Supplier 报价与 PUB 状态。</span>
          <div>
            <em className={`wp-pub ${statusClass(deriveProjectPubStatus(draft))}`}>
              {deriveProjectPubStatus(draft)}
            </em>
          </div>
        </div>
      </section>

      <section className="wp-card">
        <StepLabel step="01" title="Project Information" />
        <div className="wp-form-grid two">
          <TextField
            label="Project Name *"
            value={draft.name}
            onChange={(value) => update("name", value)}
            required
          />
          <TextField
            label="Project Address"
            value={draft.address}
            onChange={(value) => update("address", value)}
          />
          <TextField
            label="Maincon Company"
            value={draft.maincon}
            onChange={(value) => update("maincon", value)}
          />
          <TextField
            label="Contact Number"
            value={draft.contact}
            onChange={(value) => update("contact", value)}
          />
          <label className="wp-field">
            <span>Project Status</span>
            <select
              value={draft.status}
              onChange={(event) =>
                update("status", event.target.value as WaterPumpProject["status"])
              }
            >
              {waterPumpStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="wp-card">
        <StepLabel step="02" title="Pump Selection" note="点击选择这一场需要的 Pump，可多选" />
        <div className="wp-pump-picker">
          {options.map((option) => {
            const selected = draft.pumps.some((pump) => pump.optionCode === option.code);
            return (
              <button
                key={option.code}
                type="button"
                className={selected ? "selected" : ""}
                onClick={() => togglePump(option)}
              >
                <b>{option.code}</b>
                <span>
                  <strong>{option.name}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="wp-selected-pumps">
          {draft.pumps.map((pump) => (
            <article key={pump.id}>
              <button type="button" className="wp-mini-danger wp-card-delete" onClick={() => deletePump(pump.id, pump.optionName)}>
                <Trash2 size={14} /> Remove
              </button>
              <h3>
                {pump.optionCode} · {pump.optionName}
              </h3>
              <div className="wp-form-grid three">
                <NumberField
                  label="Quantity"
                  value={pump.quantity}
                  onChange={(value) => updatePump(pump.id, { quantity: value })}
                />
                <TextField
                  label="Location"
                  value={pump.location}
                  onChange={(value) => updatePump(pump.id, { location: value })}
                />
                <ToggleField
                  label="Need PUB Submission"
                  value={pump.needPub}
                  onChange={(value) =>
                    updatePump(pump.id, {
                      needPub: value,
                      submittedPub: value ? pump.submittedPub : false,
                      approvedPub: value ? pump.approvedPub : false,
                    })
                  }
                />
                {pump.needPub && (
                  <>
                    <ToggleField
                      label="Submitted to PUB"
                      value={pump.submittedPub}
                      onChange={(value) => updatePump(pump.id, { submittedPub: value })}
                    />
                    <ToggleField
                      label="PUB Approved"
                      value={pump.approvedPub}
                      onChange={(value) => updatePump(pump.id, { approvedPub: value })}
                    />
                  </>
                )}
                <TextField
                  label="Remark"
                  value={pump.remark}
                  onChange={(value) => updatePump(pump.id, { remark: value })}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wp-card">
        <StepLabel
          step="03"
          title="Water Tank Information"
          note="Water Tank 由本公司制作 / 供应"
        />
        <div className="wp-own-banner">
          <strong>OWN COMPANY</strong>
          <span>Water Tank Supply / Manufacture: Own Company</span>
          <span>Supplier Scope: Water Tank Installation + Booster Pump only</span>
        </div>
        <div className="wp-form-grid three">
          <TextField
            label="Water Tank Size / Capacity"
            value={draft.tank.tankSize}
            onChange={(value) => update("tank", { ...draft.tank, tankSize: value })}
          />
          <NumberField
            label="Tank Quantity"
            value={draft.tank.quantity}
            onChange={(value) => update("tank", { ...draft.tank, quantity: value })}
          />
          <TextField
            label="Water Tank Location"
            value={draft.tank.location}
            onChange={(value) => update("tank", { ...draft.tank, location: value })}
          />
          <MoneyField
            label="Installation Fee (SGD)"
            value={draft.tank.installationFee}
            onChange={(value) => update("tank", { ...draft.tank, installationFee: value })}
          />
          <NumberField
            label="Booster Pump Quantity"
            value={draft.tank.boosterPumpQuantity}
            onChange={(value) =>
              update("tank", { ...draft.tank, boosterPumpQuantity: value })
            }
          />
          <TextField
            label="Remark"
            value={draft.tank.remark}
            onChange={(value) => update("tank", { ...draft.tank, remark: value })}
          />
        </div>
      </section>

      <section className="wp-card">
        <StepLabel
          step="04"
          title="Supplier Quotations"
          note="同一场可以比较多家，最后只能选择一家"
        />
        <div className="wp-quote-head">
          <span>{draft.quotations.length} Supplier quotation</span>
          <small>被选择的 Supplier 负责整场全部 Pump。</small>
          <button type="button" onClick={addQuotation}>
            <Plus size={16} /> Add Supplier
          </button>
        </div>
        <div className="wp-quote-forms">
          {draft.quotations.map((quotation) => (
            <article key={quotation.id}>
              <button type="button" className="wp-mini-danger wp-card-delete" onClick={() => deleteQuotation(quotation.id, quotation.supplierName)}>
                <Trash2 size={14} /> Delete quotation
              </button>
              <label className="wp-select-supplier">
                <input
                  type="radio"
                  name="selected-supplier"
                  checked={quotation.selected}
                  onChange={() => selectQuotation(quotation.id)}
                />
                <span>Select Supplier</span>
              </label>
              <div className="wp-form-grid three">
                <TextField
                  label="Supplier Name *"
                  value={quotation.supplierName}
                  onChange={(value) => updateQuotation(quotation.id, { supplierName: value })}
                  required
                />
                <TextField
                  label="Quotation Number"
                  value={quotation.quoteNumber}
                  onChange={(value) => updateQuotation(quotation.id, { quoteNumber: value })}
                />
                <DateField
                  label="Quotation Date"
                  value={quotation.quoteDate}
                  onChange={(value) => updateQuotation(quotation.id, { quoteDate: value })}
                />
                <MoneyField
                  label="Total Quotation Price (SGD)"
                  value={quotation.totalPrice}
                  onChange={(value) => updateQuotation(quotation.id, { totalPrice: value })}
                />
                <TextField
                  label="Contact Person"
                  value={quotation.contactPerson}
                  onChange={(value) => updateQuotation(quotation.id, { contactPerson: value })}
                />
                <TextField
                  label="Contact Number"
                  value={quotation.contactNumber}
                  onChange={(value) => updateQuotation(quotation.id, { contactNumber: value })}
                />
                <label className="wp-field">
                  <span>GST Status</span>
                  <select
                    value={quotation.gstStatus}
                    onChange={(event) =>
                      updateQuotation(quotation.id, {
                        gstStatus: event.target.value as WaterPumpQuotation["gstStatus"],
                      })
                    }
                  >
                    <option>Not Specified</option>
                    <option>Included</option>
                    <option>Excluded</option>
                  </select>
                </label>
                <TextField
                  label="Lead Time"
                  value={quotation.leadTime}
                  onChange={(value) => updateQuotation(quotation.id, { leadTime: value })}
                />
                <TextField
                  label="Warranty"
                  value={quotation.warranty}
                  onChange={(value) => updateQuotation(quotation.id, { warranty: value })}
                />
                <TextField
                  label="Remark"
                  value={quotation.remark}
                  onChange={(value) => updateQuotation(quotation.id, { remark: value })}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wp-card">
        <StepLabel step="05" title="Final Confirmation" />
        <div className="wp-final-summary">
          <Data label="SELECTED SUPPLIER" value={draft.selectedSupplierName || "Not selected"} />
          <Data
            label="SELECTED QUOTATION"
            value={draft.quotations.find((quotation) => quotation.selected)?.quoteNumber || "—"}
          />
          <Data
            label="QUOTED PRICE"
            value={moneyLabel(draft.quotations.find((quotation) => quotation.selected)?.totalPrice)}
          />
        </div>
        <div className="wp-form-grid three">
          <MoneyField
            label="Final Confirmed Price (SGD)"
            value={draft.finalConfirmedPrice}
            onChange={(value) => update("finalConfirmedPrice", value)}
          />
          <DateField
            label="Confirmation Date"
            value={draft.confirmationDate}
            onChange={(value) => update("confirmationDate", value)}
          />
          <TextField
            label="PO Number"
            value={draft.poNumber}
            onChange={(value) => update("poNumber", value)}
          />
          <TextField
            label="Final Remark"
            value={draft.finalRemark}
            onChange={(value) => update("finalRemark", value)}
          />
        </div>
      </section>

      <div className="wp-form-actions">
        <button type="button" className="danger" onClick={onDelete}>
          <Trash2 size={17} /> Delete Project
        </button>
        <span />
        <button type="button" onClick={onCancel}>
          <X size={17} /> Cancel
        </button>
        <button className="wp-primary" disabled={saving}>
          <Save size={17} /> {saving ? "Saving..." : "Save Project"}
        </button>
      </div>
    </form>
  );
}

function SuppliersView({
  suppliers,
}: {
  suppliers: { name: string; contact: string; quotedProjects: number; selected: number; latestQuote: string }[];
}) {
  return (
    <>
      <section className="wp-hero supplier">
        <div>
          <p>SUPPLIER DIRECTORY</p>
          <h2>所有参与过报价的 Supplier</h2>
          <span>Supplier 会在项目报价中自动建立，不需要重复输入。</span>
        </div>
        <strong>
          {suppliers.length}
          <small>SUPPLIERS</small>
        </strong>
      </section>

      <section className="wp-supplier-grid">
        {suppliers.map((supplier) => (
          <article key={supplier.name} className="wp-supplier-card">
            <b>{supplier.name.slice(0, 2).toUpperCase()}</b>
            <div>
              <h3>{supplier.name}</h3>
              <p>{supplier.contact || "—"}</p>
            </div>
            <Data label="Quoted Projects" value={String(supplier.quotedProjects)} />
            <Data label="Selected" value={String(supplier.selected)} />
            <Data label="Latest Quote" value={dateLabel(supplier.latestQuote)} />
            <ArrowUpRight size={18} />
          </article>
        ))}
      </section>
    </>
  );
}

function PumpOptionsView({
  options,
  onSave,
  onToggle,
  onDelete,
}: {
  options: WaterPumpOption[];
  onSave: (option: WaterPumpOption) => void;
  onToggle: (code: string, active: boolean) => void;
  onDelete: (option: WaterPumpOption) => void;
}) {
  const [newName, setNewName] = useState("");

  const addOption = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const customCount = options.filter((option) => !option.isDefault).length + 1;
    onSave({
      code: `C${customCount}`,
      name,
      description: "Custom pump option",
      isDefault: false,
      active: true,
      sortOrder: options.length + 1,
    });
    setNewName("");
  };

  return (
    <>
      <section className="wp-hero options">
        <div>
          <p>PUMP OPTION LIBRARY</p>
          <h2>管理项目建立时的勾选项</h2>
          <span>系统默认 Pump 不可以删除；自定义 Pump 可以修改或停用。</span>
        </div>
        <form className="wp-option-form" onSubmit={addOption}>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New Pump Option"
          />
          <button>
            <Plus size={17} /> Add Option
          </button>
        </form>
      </section>

      <section className="wp-option-grid">
        {options.map((option) => (
          <article key={option.code}>
            <b>{option.code}</b>
            <div>
              <h3>{option.name}</h3>
              <p>
                {option.isDefault ? "System Default · Cannot delete" : "Custom Option · Editable"}
              </p>
            </div>
            <span>{option.isDefault ? "DEFAULT" : "CUSTOM"}</span>
            <button
              className={option.active ? "wp-toggle on" : "wp-toggle"}
              type="button"
              aria-label={`${option.active ? "Disable" : "Enable"} ${option.name}`}
              onClick={() => onToggle(option.code, !option.active)}
            >
              <i />
            </button>
            <button
              className="wp-option-delete"
              type="button"
              disabled={option.isDefault}
              aria-label={`Delete ${option.name}`}
              onClick={() => onDelete(option)}
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </section>
    </>
  );
}

function StepLabel({ step, title, note }: { step: string; title: string; note?: string }) {
  return (
    <div className="wp-step">
      <b>{step}</b>
      <div>
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
    </div>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return (
    <div className="wp-data">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="wp-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="wp-field">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="wp-field">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="wp-field">
      <span>{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="wp-toggle-field">
      <span>{label}</span>
      <button
        type="button"
        className={value ? "yes" : ""}
        onClick={() => onChange(!value)}
      >
        <i>{value ? "Yes" : "No"}</i>
      </button>
    </label>
  );
}
