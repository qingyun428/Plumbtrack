"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDollarSign,
  Droplets,
  Factory,
  FileCheck2,
  Gauge,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";

type PumpTab = "dashboard" | "projects" | "suppliers" | "options";

const pumpOptions = [
  ["WT", "Water Tank Installation + Booster Pump"],
  ["EP", "Ejector Pump"],
  ["ES", "Ejector Sump Pump"],
  ["BW", "Backwash Sump Pump"],
  ["RW", "Rainwater Sump Pump"],
  ["OF", "Overflow Sump Pump"],
  ["P+", "Other Pump"],
] as const;

const project = {
  name: "36 JALAN INTAN",
  address:
    "PROPOSED NEW ERECTION OF 2-STOREY INTERMEDIATE TERRACED DWELLING HOUSE WITH AN ATTIC ON LOT MK 10-00830C 36 JALAN INSTAN SINGAPORE 668796 (BUKIT BATOK PLANNING AREA)",
  maincon: "Foo Brothers Pte Ltd",
  contact: "—",
  status: "Supplier Selected",
  updated: "08 Aug 2026",
  confirmationDate: "02 Feb 2026",
  poNumber: "—",
  selectedSupplier: "Not selected",
  confirmedPrice: "$0.00",
};

const tabs: { id: PumpTab; label: string }[] = [
  { id: "dashboard", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "suppliers", label: "Suppliers" },
  { id: "options", label: "Pump Options" },
];

export default function WaterPumpPage({ showToast }: { showToast: (message: string) => void }) {
  const [tab, setTab] = useState<PumpTab>("dashboard");
  const [detail, setDetail] = useState(false);
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(pumpOptions.map(([code]) => [code, true])),
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return !needle || `${project.name} ${project.address} ${project.maincon} BNW BEN WT OF`.toLowerCase().includes(needle);
  }, [query]);

  const openDetail = () => {
    setDetail(true);
    setTab("projects");
  };

  return (
    <div className="page pump-page">
      <header className="pump-hero">
        <div>
          <p className="eyebrow">WATER TANK &amp; PUMP MANAGEMENT</p>
          <h1>Water Pump</h1>
          <p>Track pump requirements, supplier quotations and PUB approval in one workspace.</p>
        </div>
        <div className="pump-connection"><span /><strong>Local data connected</strong><small>All source records imported</small></div>
      </header>

      <div className="pump-toolbar">
        <div className="pump-tabs" role="tablist" aria-label="Water Pump sections">
          {tabs.map((item) => (
            <button key={item.id} className={tab === item.id && !detail ? "active" : ""} onClick={() => { setTab(item.id); setDetail(false); }}>
              {item.label}
            </button>
          ))}
        </div>
        <label className="pump-search"><Search size={15} /><span className="sr-only">Search pump records</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project, supplier or pump…" /></label>
      </div>

      {detail ? (
        <ProjectDetail onBack={() => setDetail(false)} showToast={showToast} />
      ) : tab === "dashboard" ? (
        <PumpDashboard onOpen={openDetail} matches={matches} />
      ) : tab === "projects" ? (
        <ProjectsView onOpen={openDetail} matches={matches} showToast={showToast} />
      ) : tab === "suppliers" ? (
        <SuppliersView />
      ) : (
        <PumpOptionsView enabled={enabled} setEnabled={setEnabled} showToast={showToast} />
      )}
    </div>
  );
}

function PumpDashboard({ onOpen, matches }: { onOpen: () => void; matches: boolean }) {
  const metrics = [
    ["Total Projects", "01", "All projects", Droplets, "cyan"],
    ["Waiting for Quotation", "00", "Awaiting quotes", CircleDollarSign, "yellow"],
    ["Supplier Selected", "00", "Supplier confirmed", Check, "mint"],
    ["PUB Not Submitted", "01", "Follow-up required", FileCheck2, "pink"],
    ["PUB Submitted", "00", "Awaiting approval", ShieldCheck, "purple"],
    ["PUB Approved", "00", "Approved", Gauge, "mint"],
  ] as const;

  return <>
    <section className="pump-intro">
      <div><span>CONTROL DESK</span><h2>工程资料，一眼就清楚。</h2><p>快速记录 Pump 需求、比较 Supplier 报价，并追踪每台 Pump 的 PUB 状态。</p></div>
      <div className="pump-orbit"><Droplets size={31} /><span>Q</span></div>
    </section>
    <section className="pump-metrics">
      {metrics.map(([label, value, note, Icon, tone]) => <article key={label} className={`pump-metric ${tone}`}><Icon size={18} /><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}
    </section>
    <section className="pump-section">
      <div className="pump-section-head"><div><h2>最近更新项目</h2><p>Latest updated projects</p></div><button onClick={onOpen}>View details <ChevronRight size={15} /></button></div>
      {matches ? <ProjectRow onOpen={onOpen} /> : <div className="pump-empty">No matching pump records.</div>}
    </section>
  </>;
}

function ProjectRow({ onOpen }: { onOpen: () => void }) {
  return <button className="pump-project-row" onClick={onOpen}>
    <span className="pump-project-code">36</span>
    <span><strong>{project.name}</strong><small>{project.maincon}</small></span>
    <span><small>PUMPS</small><strong>WT · OF</strong></span>
    <span><small>QUOTATIONS</small><strong>1 supplier quote</strong></span>
    <span><small>PUB STATUS</small><em>Not Submitted</em></span>
    <span><small>UPDATED</small><strong>{project.updated}</strong></span>
    <ChevronRight size={17} />
  </button>;
}

function ProjectsView({ onOpen, matches, showToast }: { onOpen: () => void; matches: boolean; showToast: (message: string) => void }) {
  return <section className="pump-section">
    <div className="pump-section-head"><div><span>PROJECT REGISTER</span><h2>Projects</h2><p>1 project record · latest updated first</p></div><button className="pump-primary" onClick={() => showToast("Water Pump project form is ready for local records")}><Plus size={15} /> New Project</button></div>
    {matches ? <ProjectRow onOpen={onOpen} /> : <div className="pump-empty">No matching pump records.</div>}
  </section>;
}

function SuppliersView() {
  return <section className="pump-section">
    <div className="pump-section-head"><div><span>SUPPLIER DIRECTORY</span><h2>所有参与过报价的 Supplier</h2><p>Supplier records are created from project quotations.</p></div><strong className="pump-count">1 <small>Supplier</small></strong></div>
    <article className="supplier-card">
      <div className="supplier-mark">BN</div><div><h3>BNW</h3><p>BEN</p></div>
      <dl><div><dt>Quoted Projects</dt><dd>1</dd></div><div><dt>Selected</dt><dd>0</dd></div><div><dt>Latest Quote</dt><dd>02 Feb 2026</dd></div></dl>
    </article>
  </section>;
}

function PumpOptionsView({ enabled, setEnabled, showToast }: { enabled: Record<string, boolean>; setEnabled: (value: Record<string, boolean>) => void; showToast: (message: string) => void }) {
  const [newOption, setNewOption] = useState("");
  return <section className="pump-section">
    <div className="pump-section-head"><div><span>PUMP OPTION LIBRARY</span><h2>管理项目建立时的勾选项</h2><p>System default pumps cannot be deleted.</p></div></div>
    <form className="pump-add-option" onSubmit={(event) => { event.preventDefault(); if (!newOption.trim()) return; showToast(`${newOption.trim()} added to this local preview`); setNewOption(""); }}><SlidersHorizontal size={16} /><input value={newOption} onChange={(event) => setNewOption(event.target.value)} placeholder="New Pump Option" /><button><Plus size={15} /> Add Option</button></form>
    <div className="pump-options-grid">{pumpOptions.map(([code, name]) => <article key={code}><span className="pump-option-code">{code}</span><div><h3>{name}</h3><p>System Default · Cannot delete</p></div><small>DEFAULT</small><button className={enabled[code] ? "toggle on" : "toggle"} onClick={() => setEnabled({ ...enabled, [code]: !enabled[code] })} aria-label={`${enabled[code] ? "Disable" : "Enable"} ${name}`}><i /></button></article>)}</div>
  </section>;
}

function ProjectDetail({ onBack, showToast }: { onBack: () => void; showToast: (message: string) => void }) {
  return <div className="pump-detail">
    <button className="pump-back" onClick={onBack}><ArrowLeft size={15} /> Back to Projects</button>
    <header><div className="pump-project-code large">36</div><div><span>PROJECT #1</span><h2>{project.name}</h2><p>{project.address}</p><div className="pump-pills"><em>{project.status}</em><em>Not Submitted</em></div></div><div className="pump-final"><small>FINAL CONFIRMED</small><strong>{project.confirmedPrice}</strong><span>{project.selectedSupplier}</span></div></header>

    <div className="pump-detail-grid">
      <div>
        <section className="pump-section compact"><div className="pump-section-head"><div><h2>Pump &amp; PUB Status</h2><p>2 selected pump types</p></div><button onClick={() => showToast("PUB status saved locally")}>Update PUB Status</button></div>
          <div className="pump-status-cards">
            <PumpStatus code="WT" name="Water Tank Installation + Booster Pump" location="1ST U/G · Qty 1" need="Yes" status="Not Submitted" />
            <PumpStatus code="OF" name="Overflow Sump Pump" location="Pump Room · Qty 1" need="No" status="Not Required" />
          </div>
        </section>
        <section className="pump-section compact"><div className="pump-section-head"><div><h2>Supplier Quotations</h2><p>1 quotation record</p></div></div><div className="quotation-row"><div><strong>BNW</strong><small>BEN</small></div><span>Quote No.<strong>—</strong></span><span>Date<strong>02 Feb 2026</strong></span><span>Price<strong>—</strong></span><em>Not Selected</em></div></section>
        <section className="pump-section compact"><div className="pump-section-head"><div><h2>Water Tank Information</h2><p>Own Company Supply / Manufacture</p></div><span className="own-supply">OWN SUPPLY</span></div><div className="tank-grid"><Data label="Tank Size" value="1M X 1M X 1M" /><Data label="Quantity" value="1" /><Data label="Location" value="1ST U/G" /><Data label="Installation Fee" value="—" /><Data label="Booster Pump" value="Qty 1" /><Data label="Supplier Scope" value="Installation + Booster Pump" /></div></section>
      </div>
      <aside className="pump-info"><Factory size={20} /><h3>Project Information</h3><Data label="Maincon" value={project.maincon} /><Data label="Contact" value={project.contact} /><Data label="Confirmation Date" value={project.confirmationDate} /><Data label="PO Number" value={project.poNumber} /><button onClick={() => showToast("Project editor opened in local mode")}>Edit Project</button></aside>
    </div>
  </div>;
}

function PumpStatus({ code, name, location, need, status }: { code: string; name: string; location: string; need: string; status: string }) {
  return <article><span className="pump-option-code">{code}</span><div><h3>{name}</h3><p>{location}</p></div><em>{status}</em><dl><Data label="Need PUB" value={need} /><Data label="Submitted" value="No" /><Data label="Approved" value="No" /></dl></article>;
}

function Data({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
