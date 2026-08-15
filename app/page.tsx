"use client";

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Droplets,
  ExternalLink,
  FileText,
  FolderKanban,
  Hourglass,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSupabaseBrowserClient, getSupabaseConfigStatus } from "@/lib/supabase";

type View =
  | "dashboard"
  | "projects"
  | "records"
  | "calendar"
  | "team"
  | "activity"
  | "settings"
  | "water-pump"
  | "detail"
  | "new-project";

type Project = {
  id: string | number;
  code: string;
  name: string;
  reference: string;
  description: string;
  maincon: string;
  pic: string;
  step: number;
  stage: string;
  progress: number;
  target: string;
  start: string;
  records: number;
  active: boolean;
  createdAt?: string;
  stageStatuses?: { stageNumber: number; status: string }[];
};

type RecordItem = {
  id: string | number;
  name: string;
  size: string;
  project: string;
  projectId?: string;
  stage: string;
  stageId?: string | null;
  stageNumber?: number;
  category: string;
  revision: string;
  date: string;
  uploader: string;
  storagePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  file?: File;
};

type ReminderItem = {
  id: string | number;
  title: string;
  project: string;
  projectId?: string;
  stage: string;
  stageId?: string | null;
  dueDate: string;
  status: "Normal" | "Due Soon" | "Overdue" | "Completed";
  completed: boolean;
};

type TeamMember = {
  id: string | number;
  name: string;
  email: string;
  role: "Administrator" | "View Only" | string;
  active: boolean;
  lastSeen: string;
};

type ActivityItem = {
  id: string | number;
  action: string;
  detail: string;
  date: string;
  type: "refresh" | "plus" | "upload" | "delete" | "settings";
  actor: string;
};

type SettingsState = {
  companyName: string;
  fileUploadLimitMb: number;
  dateFormat: string;
  followUpDays: number;
  dataRetention: string;
};

type StageStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "N/A";

type SupabaseConnection =
  | "checking"
  | "missing-env"
  | "signed-out"
  | "connected"
  | "read-error";

type SupabaseProjectRow = {
  id: string;
  name: string;
  reference: string;
  description: string | null;
  site_address: string | null;
  maincon: string | null;
  person_in_charge: string | null;
  start_date: string | null;
  target_completion_date: string | null;
  status: "active" | "attention_required" | "delayed" | "completed";
  progress: number | null;
  created_at: string | null;
  project_stages?: { stage_number: number; name: string; status: string }[] | null;
  records?: { id: string }[] | null;
};

const projectsSeed: Project[] = [
  {
    id: 1,
    code: "13",
    name: "130 LORONG KISMIS",
    reference: "A2100-00003-2026",
    description:
      "PROPOSED NEW ERECTION OF A 3-STOREY ENVELOPE CONTROL DETACHED DWELLING HOUSE WITH A MEZZANINE, AN ATTIC AND A SWIMMING POOL ON LOT 03627W MK05 AT 130 LORONG KISMIS, SINGAPORE, 598057 (BUKIT TIMAH PLANNING AREA)",
    maincon: "fu xiang constructure pte ltd",
    pic: "QING YU",
    step: 1,
    stage: "DP & DC Clearance",
    progress: 0,
    target: "11 Dec 2027",
    start: "29 Dec 2026",
    records: 0,
    active: true,
  },
  {
    id: 2,
    code: "80",
    name: "80 CLOVER AVENUE",
    reference: "PT-2026-080",
    description:
      "PROPOSED ERECTION OF A PAIR OF 2-STOREY ENVELOPE CONTROL SEMI-DETACHED DWELLING HOUSES EACH WITH AN ATTIC AND SWIMMING POOL ON LOT 07318V MK18 AT 80 CLOVER AVENUE (BISHAN PLANNING AREA)",
    maincon: "fu xiang construction pte ltd",
    pic: "QING YU",
    step: 4,
    stage: "Form B for New Public Sewer Connection",
    progress: 21,
    target: "12 Dec 2027",
    start: "03 Aug 2026",
    records: 0,
    active: true,
  },
  {
    id: 3,
    code: "84",
    name: "84 SELETAR HILLS DRIVE",
    reference: "PT-2026-084",
    description:
      "PROPOSED NEW ERECTION OF 2-STOREY ENVELOPE CONTROL SEMI-DETACHED DWELLING HOUSE WITH MEZZANINE AND AN ATTIC ON MK18 – 01999L AT 84 SELETAR HILLS DRIVE (SERANGOON PLANNING AREA)",
    maincon: "xin cheng construction pte ltd",
    pic: "QING YU",
    step: 6,
    stage: "Form B Part 1 & Part 2",
    progress: 36,
    target: "28 Aug 2027",
    start: "02 Aug 2026",
    records: 0,
    active: true,
  },
  {
    id: 4,
    code: "21",
    name: "21 DAISY ROAD",
    reference: "PT-2026-021",
    description:
      "PROPOSED ERECTION OF A 3-STOREY ENVELOPE CONTROL CORNER TERRACE DWELLING WITH MEZZANINE AND ATTIC ON LOT 06613M MK17 AT 21 DAISY ROAD SINGAPORE 359442 (SERANGOON PLANNING AREA)",
    maincon: "T2 CONSTRUCTION PTE LTD",
    pic: "QING YU",
    step: 8,
    stage: "Above-ground Works",
    progress: 42,
    target: "28 Aug 2027",
    start: "02 Aug 2026",
    records: 0,
    active: true,
  },
  {
    id: 5,
    code: "11",
    name: "117 THOMSON RIDGE",
    reference: "PT-2026-117",
    description:
      "PROPOSED NEW ERECTION OF A 2-STOREY ENVELOPE CONTROL SEMI-DETACHED DWELLING HOUSE WITH ATTIC ON LOT MK15-00095L AT 117 THOMSON RIDGE, SINGAPORE 574699 (BISHAN PLANNING AREA)",
    maincon: "wtk builder pte ltd",
    pic: "QING YU",
    step: 4,
    stage: "Form B for New Public Sewer Connection",
    progress: 21,
    target: "02 Aug 2027",
    start: "02 Aug 2026",
    records: 1,
    active: true,
  },
  {
    id: 6,
    code: "12",
    name: "12 PRINCESS OF WALES ROAD",
    reference: "PT-2026-012",
    description:
      "PROPOSED ERECTION OF 2-STOREY ENVELOPE CONTROL SEMI-DETACHED DWELLING HOUSE WITH A MEZZANINE AND AN ATTIC ON LOT 01805V MK2 AT 12 PRINCESS OF WALES ROAD SINGAPORE 266911 (BUKIT TIMAH PLANNING AREA)",
    maincon: "xin cheng construction pte ltd",
    pic: "QING YU",
    step: 3,
    stage: "Shop Drawing & Maincon Approval",
    progress: 9,
    target: "03 Oct 2027",
    start: "29 Jul 2026",
    records: 2,
    active: true,
  },
  {
    id: 7,
    code: "51",
    name: "51 BOURNEMOUTH ROAD",
    reference: "PT-2026-051",
    description:
      "PROPOSED ERECTION OF A 2-STOREY ENVELOPE CONTROL DETACHED DWELLING HOUSE WITH BASEMENT, ATTIC AND SWIMMING POOL ON LOT 03159W & 03163V MK25 AT 51 BOURNEMOUTH ROAD (MARINE PARADE PLANNING AREA)",
    maincon: "fu xiang construction pte ltd",
    pic: "QING YU",
    step: 3,
    stage: "Shop Drawing & Maincon Approval",
    progress: 17,
    target: "28 Dec 2027",
    start: "29 Jul 2026",
    records: 3,
    active: true,
  },
  {
    id: 8,
    code: "15",
    name: "15 JALAN REMIS",
    reference: "PT-2026-015",
    description:
      "PROPOSED NEW ERECTION OF A 3-STOREY ENVELOPE CONTROL SEMI-DETACHED DWELLING HOUSE WITH A BASEMENT, A MEZZANINE AND AN ATTIC AT 15 JALAN REMIS SINGAPORE 468085 (BEDOK PLANNING AREA)",
    maincon: "fu xiang construction pte ltd",
    pic: "QING YU",
    step: 1,
    stage: "DP & DC Clearance",
    progress: 0,
    target: "25 Dec 2027",
    start: "29 Jul 2026",
    records: 0,
    active: true,
  },
  {
    id: 9,
    code: "75",
    name: "754 MOUNTBATTEN ROAD",
    reference: "PT-2026-754",
    description:
      "PROPOSED NEW ERECTION OF A 3 STOREY SEMI-DETACHED DWELLING HOUSE WITH ATTIC AND SWIMMING POOL ON LOT 00427K TS 28, SINGAPORE (NOVENA PLANNING AREA)",
    maincon: "hock hwa builders pte ltd",
    pic: "QING YU",
    step: 2,
    stage: "Temporary Water Submission",
    progress: 8,
    target: "25 Dec 2027",
    start: "29 Jul 2026",
    records: 3,
    active: true,
  },
  {
    id: 10,
    code: "18",
    name: "18A BERRIMA ROAD",
    reference: "PT-2026-018",
    description: "18A Berrima Rd, Singapore 299894",
    maincon: "cs link construction pte ltd",
    pic: "QWE",
    step: 11,
    stage: "Form C Submission",
    progress: 67,
    target: "27 Jul 2027",
    start: "26 Jul 2026",
    records: 2,
    active: true,
  },
];

const recordSeed: RecordItem[] = [
  { id: 11, name: "117TR drawing approval already records.pdf", size: "0.06 MB", project: "117 THOMSON RIDGE", stage: "Step 3 · Shop Drawing & Maincon Approval", category: "Other Record", revision: "Rev 1", date: "02 Aug 2026", uploader: "qingyuc832@gmail.com" },
  { id: 10, name: "Amend DP Clearance - ES20251125-80818 - 12 Princess of Wales Road - Internal Drain_1.pdf", size: "0.06 MB", project: "12 PRINCESS OF WALES ROAD", stage: "Step 1 · DP & DC Clearance", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 9, name: "Amend DC No objection - ES20251125-80818 - 12 Princess of Wales Road.pdf", size: "0.06 MB", project: "12 PRINCESS OF WALES ROAD", stage: "Step 1 · DP & DC Clearance", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 8, name: "REVIEW.pdf", size: "0.80 MB", project: "51 BOURNEMOUTH ROAD", stage: "Step 2 · Temporary Water Submission", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 7, name: "WJU-326-36157_51 BOURNEMOUTH ROAD.pdf", size: "0.04 MB", project: "51 BOURNEMOUTH ROAD", stage: "Step 2 · Temporary Water Submission", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 6, name: "A1235-00188-2025_ES20260213-37196 DP Sanitary Clearance.pdf.pdf", size: "0.08 MB", project: "51 BOURNEMOUTH ROAD", stage: "Step 1 · DP & DC Clearance", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 5, name: "REVIEW.pdf", size: "0.80 MB", project: "754 MOUNTBATTEN ROAD", stage: "Step 2 · Temporary Water Submission", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 4, name: "A2520-16071-2025_ES20260408-65135 DP Sanitary Clearance.pdf.pdf", size: "0.08 MB", project: "754 MOUNTBATTEN ROAD", stage: "Step 1 · DP & DC Clearance", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 3, name: "ES2026022540871_DC SEW No Objection.pdf", size: "0.08 MB", project: "754 MOUNTBATTEN ROAD", stage: "Step 1 · DP & DC Clearance", category: "Other Record", revision: "Rev 1", date: "29 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 2, name: "WJU-225-17925 reply letter.pdf", size: "0.04 MB", project: "18A BERRIMA ROAD", stage: "Step 2 · Temporary Water Submission", category: "Other Record", revision: "Rev 1", date: "26 Jul 2026", uploader: "qingyuc832@gmail.com" },
  { id: 1, name: "A1653-24588-2024_ES20251107-71060 DP Sanitary Clearance.pdf", size: "0.08 MB", project: "18A BERRIMA ROAD", stage: "Step 1 · DP & DC Clearance", category: "Other Record", revision: "Rev 1", date: "26 Jul 2026", uploader: "qingyuc832@gmail.com" },
];

const stages = [
  ["DP & DC Clearance", "取得 DP Clearance 和 DC Clearance。"],
  ["Temporary Water Submission", "准备和提交临时水申请。"],
  ["Shop Drawing & Maincon Approval", "准备 Shop Drawing，并取得 Main Contractor 批准。"],
  ["Form B for New Public Sewer Connection", "如有 New Public Sewer Connection，准备 Form B 给 Maincon。"],
  ["Underground Works", "地下工程开始施工。"],
  ["Form B Part 1 & Part 2", "地下工程期间准备 Form B Part 1 与 Part 2。"],
  ["Underground Works Completion", "地下工程全部完成、检查及缺陷跟进。"],
  ["Above-ground Works", "根据已批准 Shop Drawing 进行地上 Plumbing & Sanitary 工程。"],
  ["Permanent Water Submission", "协调现场完工、永久水申请及 Water Meter Installation。"],
  ["As-built Drawing", "现场接近完成后，准备并提交 As-built Drawing。"],
  ["Form C Submission", "准备 Form C、Testing Record 与现场测试记录。"],
  ["Sanitary Fixtures Installation", "Form C Submission 后安装卫生器具并完成最后工作。"],
  ["OMM Submission", "准备并提供 Operation & Maintenance Manual 给 Maincon。"],
  ["Project Completed", "确认工程与主要记录完成，正式结束项目。"],
] as const;

const activitySeed = [
  ["Updated stage", "DP & DC Clearance · 130 LORONG KISMIS", "08 Aug 2026", "refresh"],
  ["Force-updated stage", "Underground Works · 80 CLOVER AVENUE", "03 Aug 2026", "refresh"],
  ["Updated stage", "Form B for New Public Sewer Connection · 80 CLOVER AVENUE", "03 Aug 2026", "refresh"],
  ["Created project", "80 CLOVER AVENUE · 80 CLOVER AVENUE", "03 Aug 2026", "plus"],
  ["Updated stage", "Form B Part 1 & Part 2 · 84 SELETAR HILLS DRIVE", "02 Aug 2026", "refresh"],
  ["Uploaded file", "117TR drawing approval already records.pdf · 117 THOMSON RIDGE", "02 Aug 2026", "upload"],
  ["Created project", "117 THOMSON RIDGE · 117 THOMSON RIDGE", "02 Aug 2026", "plus"],
  ["Uploaded file", "REVIEW.pdf · 51 BOURNEMOUTH ROAD", "29 Jul 2026", "upload"],
  ["Updated stage", "Temporary Water Submission · 754 MOUNTBATTEN ROAD", "29 Jul 2026", "refresh"],
  ["Created project", "18A BERRIMA ROAD · 18A BERRIMA ROAD", "26 Jul 2026", "plus"],
] as const;

const reminderSeed: ReminderItem[] = [
  {
    id: "local-reminder-1",
    title: "DP & DC Clearance",
    project: "754 MOUNTBATTEN ROAD",
    stage: "Step 1 · DP & DC Clearance",
    dueDate: "2026-03-05",
    status: "Completed",
    completed: true,
  },
  {
    id: "local-reminder-2",
    title: "Temporary Water Submission",
    project: "754 MOUNTBATTEN ROAD",
    stage: "Step 2 · Temporary Water Submission",
    dueDate: "2026-07-09",
    status: "Overdue",
    completed: false,
  },
];

const teamSeed: TeamMember[] = [
  {
    id: "local-team-1",
    name: "Chen QingYu",
    email: "qingyuc832@gmail.com",
    role: "Administrator",
    active: true,
    lastSeen: "08 Aug 2026",
  },
];

const activityItemsSeed: ActivityItem[] = activitySeed.map(
  ([action, detail, date, type], index) => ({
    id: `local-activity-${index}`,
    action,
    detail,
    date,
    type: type as ActivityItem["type"],
    actor: "qingyuc832@gmail.com",
  }),
);

const settingsSeed: SettingsState = {
  companyName: "PlumbTrack Contractor",
  fileUploadLimitMb: 25,
  dateFormat: "DD/MM/YYYY",
  followUpDays: 7,
  dataRetention: "Permanent",
};

const projectSchema = z.object({
  name: z.string().min(3, "Project name is required"),
  reference: z.string().min(3, "Reference is required"),
  maincon: z.string().min(2, "Maincon company is required"),
  address: z.string().min(5, "Site address is required"),
  pic: z.string().min(2, "PIC is required"),
  start: z.string().min(1, "Start date is required"),
  target: z.string().optional(),
  temporaryWater: z.enum(["yes", "no"]),
  publicSewer: z.enum(["yes", "no"]),
});

type ProjectForm = z.infer<typeof projectSchema>;

const supabaseProjectSelect =
  "id,name,reference,description,site_address,maincon,person_in_charge,start_date,target_completion_date,status,progress,created_at,project_stages(stage_number,name,status),records(id)";

type PlumbtrackApiResponse = {
  connected?: boolean;
  message?: string;
  projects?: Project[];
  records?: RecordItem[];
  reminders?: ReminderItem[];
  teamMembers?: TeamMember[];
  activities?: ActivityItem[];
  settings?: SettingsState;
  project?: Project;
  record?: RecordItem;
  reminder?: ReminderItem;
  teamMember?: TeamMember;
  error?: string;
};

type RecordUploadPayload = {
  record: RecordItem;
};

function isPersistedId(id: string | number | undefined | null) {
  return typeof id === "string" && !id.startsWith("local-");
}

async function plumbtrackApi(action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch("/api/plumbtrack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = (await response.json()) as PlumbtrackApiResponse;
  if (!response.ok || result.error) throw new Error(result.error ?? "Supabase sync failed");
  return result;
}

async function uploadRecordFile({ record }: RecordUploadPayload) {
  if (!record.file || !record.projectId) return plumbtrackApi("saveRecord", { record });

  const form = new FormData();
  form.append("action", "uploadRecordFile");
  form.append("file", record.file);
  form.append("record", JSON.stringify({ ...record, file: undefined }));
  form.append("projectId", record.projectId);
  if (record.stageId) form.append("stageId", record.stageId);
  if (record.stageNumber) form.append("stageNumber", String(record.stageNumber));

  const response = await fetch("/api/plumbtrack", {
    method: "POST",
    body: form,
  });
  const result = (await response.json()) as PlumbtrackApiResponse;
  if (!response.ok || result.error) throw new Error(result.error ?? "Supabase file upload failed");
  return result;
}

function reminderStatus(dueDate: string, completed: boolean): ReminderItem["status"] {
  if (completed) return "Completed";
  const due = new Date(`${dueDate}T00:00:00`).getTime();
  if (Number.isNaN(due)) return "Normal";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((due - today.getTime()) / 86400000);
  if (days < 0) return "Overdue";
  if (days <= 7) return "Due Soon";
  return "Normal";
}

function projectCode(name: string) {
  const digits = name.replace(/\D/g, "").slice(0, 2);
  if (digits) return digits;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "PT";
}

function formatProjectDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapSupabaseProject(row: SupabaseProjectRow): Project {
  const orderedStages = [...(row.project_stages ?? [])].sort(
    (a, b) => a.stage_number - b.stage_number,
  );
  const allApplicableStagesCompleted =
    orderedStages.length > 0 &&
    orderedStages.every((stage) => stage.status === "completed" || stage.status === "not_applicable");
  const currentStage =
    allApplicableStagesCompleted
      ? [...orderedStages].reverse().find((stage) => stage.status !== "not_applicable") ?? orderedStages.at(-1)
      : orderedStages.find(
      (stage) =>
        stage.status !== "completed" && stage.status !== "not_applicable",
      ) ?? orderedStages[0];

  return {
    id: row.id,
    code: projectCode(row.name),
    name: row.name,
    reference: row.reference,
    description: row.description || row.site_address || "No description saved",
    maincon: row.maincon || "Not set",
    pic: row.person_in_charge || "Not set",
    step: currentStage?.stage_number ?? 1,
    stage: currentStage?.name ?? stages[0][0],
    progress: row.progress ?? 0,
    target: formatProjectDate(row.target_completion_date),
    start: formatProjectDate(row.start_date),
    records: row.records?.length ?? 0,
    active: row.status !== "completed",
    createdAt: row.created_at ?? undefined,
    stageStatuses: orderedStages.map((stage) => ({
      stageNumber: stage.stage_number,
      status: stage.status,
    })),
  };
}

function createLocalProject(data: ProjectForm): Project {
  return {
    id: `local-${Date.now()}`,
    code: projectCode(data.name),
    name: data.name.toUpperCase(),
    reference: data.reference,
    description: data.address,
    maincon: data.maincon,
    pic: data.pic,
    step: 1,
    stage: "DP & DC Clearance",
    progress: 0,
    target: data.target || "Not set",
    start: data.start,
    records: 0,
    active: true,
    stageStatuses: stages.map((_, index) => ({
      stageNumber: index + 1,
      status: index === 0 ? "in_progress" : (index === 3 || index === 5) ? "not_applicable" : "not_started",
    })),
  };
}

const navItems = [
  { id: "dashboard" as View, label: "Dashboard", icon: LayoutDashboard },
  { id: "projects" as View, label: "Projects", icon: FolderKanban, badge: "10" },
  { id: "records" as View, label: "Records", icon: FileText },
  { id: "water-pump" as View, label: "Water Pump", icon: Droplets },
  { id: "calendar" as View, label: "Calendar & Reminder", icon: CalendarDays },
  { id: "team" as View, label: "Team", icon: Users },
  { id: "activity" as View, label: "Activity Log", icon: Activity },
  { id: "settings" as View, label: "Settings", icon: Settings },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="search-box">
      <Search size={15} aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SupabaseConnectionPanel({ connection, detail, email, loading, onSignIn, onSignOut }: { connection: SupabaseConnection; detail: string; email: string | null; loading: boolean; onSignIn: (email: string, password: string) => void; onSignOut: () => void }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  if (connection === "connected") {
    return <div className="supabase-strip connected"><ShieldCheck size={16} /><span>{detail || `Supabase connected as ${email}`}</span><button onClick={onSignOut}>Sign out</button></div>;
  }

  if (connection === "checking") {
    return <div className="supabase-strip"><Hourglass size={16} /><span>{detail || "Checking Supabase session..."}</span></div>;
  }

  if (connection === "missing-env") {
    return <div className="supabase-strip warning"><AlertCircle size={16} /><span>{detail}</span></div>;
  }

  if (connection === "read-error") {
    return <div className="supabase-strip error"><AlertCircle size={16} /><span>{detail}</span></div>;
  }

  return (
    <form className="supabase-strip auth" onSubmit={(event) => { event.preventDefault(); onSignIn(loginEmail, password); }}>
      <ShieldCheck size={16} />
      <span>{detail || "Sign in to load Supabase projects"}</span>
      <input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="Supabase email" required />
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
      <button disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}

export default function HomePage() {
  const waterPumpUrl = process.env.NEXT_PUBLIC_WATER_PUMP_URL?.trim() || "/water-pump";
  const [view, setView] = useState<View>("dashboard");
  const [projects, setProjects] = useState(projectsSeed);
  const [records, setRecords] = useState(recordSeed);
  const [reminders, setReminders] = useState(reminderSeed);
  const [teamMembers, setTeamMembers] = useState(teamSeed);
  const [activities, setActivities] = useState(activityItemsSeed);
  const [settings, setSettings] = useState(settingsSeed);
  const [selectedId, setSelectedId] = useState<Project["id"]>(projectsSeed[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [connection, setConnection] = useState<SupabaseConnection>(() =>
    getSupabaseBrowserClient() ? "checking" : "missing-env",
  );
  const [connectionDetail, setConnectionDetail] = useState(() => {
    const status = getSupabaseConfigStatus();
    if (status.hasUrl && status.hasAnonKey) {
      return "Checking Supabase session...";
    }
    const missing = [
      !status.hasUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !status.hasAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    ].filter(Boolean);
    return `Supabase is not in this build. Add ${missing.join(" and ")} in Vercel, then redeploy.`;
  });
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceSyncConnected = useRef(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  useEffect(() => {
    let mounted = true;

    fetch("/api/plumbtrack", { cache: "no-store" })
      .then((response) => response.json() as Promise<PlumbtrackApiResponse>)
      .then((payload) => {
        if (!mounted) return;
        if (payload.projects?.length) {
          setProjects(payload.projects);
          setSelectedId(payload.projects[0].id);
        }
        if (payload.records) setRecords(payload.records);
        if (payload.reminders) setReminders(payload.reminders);
        if (payload.teamMembers) setTeamMembers(payload.teamMembers);
        if (payload.activities) setActivities(payload.activities);
        if (payload.settings) setSettings(payload.settings);
        if (payload.connected) {
          serviceSyncConnected.current = true;
          setConnection("connected");
          setConnectionDetail(payload.message ?? "Supabase service sync connected.");
          setSessionEmail("server sync");
        }
      })
      .catch((error: unknown) => {
        console.warn("PlumbTrack service sync unavailable", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadSupabaseProjects = useCallback(async (email?: string | null) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data, error } = await supabase
      .from("projects")
      .select(supabaseProjectSelect)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const nextProjects = ((data ?? []) as SupabaseProjectRow[]).map(
      mapSupabaseProject,
    );
    setProjects(nextProjects);
    if (nextProjects[0]) setSelectedId(nextProjects[0].id);
    setConnection("connected");
    setConnectionDetail(
      nextProjects.length > 0
        ? `Supabase connected as ${email ?? "signed-in user"} - ${nextProjects.length} project(s) loaded.`
        : `Supabase connected as ${email ?? "signed-in user"} - no projects found in public.projects.`,
    );
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const email = data.session?.user.email ?? null;
      setSessionEmail(email);
      if (!data.session) {
        if (serviceSyncConnected.current) return;
        setConnection("signed-out");
        setConnectionDetail("Supabase variables found. Sign in with your Supabase Auth email/password to load projects.");
        return;
      }
      try {
        await loadSupabaseProjects(email);
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Unknown Supabase read error";
        setConnection("read-error");
        setConnectionDetail(`Supabase read failed: ${message}`);
        showToast("Supabase read failed. See the top status bar.");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSessionEmail(session?.user.email ?? null);
        if (!session) {
          if (serviceSyncConnected.current) return;
          setConnection("signed-out");
          setConnectionDetail("Supabase variables found. Sign in with your Supabase Auth email/password to load projects.");
          setProjects(projectsSeed);
          setSelectedId(projectsSeed[0].id);
          return;
        }
        try {
          await loadSupabaseProjects(session.user.email ?? null);
          showToast("Supabase connected");
        } catch (error) {
          console.error(error);
          const message = error instanceof Error ? error.message : "Unknown Supabase read error";
          setConnection("read-error");
          setConnectionDetail(`Supabase read failed: ${message}`);
          showToast("Supabase read failed. See the top status bar.");
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadSupabaseProjects, showToast]);

  const navigate = useCallback((next: View) => {
    if (next === "water-pump") {
      window.location.assign(waterPumpUrl);
      return;
    }
    setView(next);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [waterPumpUrl]);

  const openProject = (id: Project["id"]) => {
    setSelectedId(id);
    navigate("detail");
  };

  const selectedProject =
    projects.find((project) => String(project.id) === String(selectedId)) ??
    projects[0] ??
    null;

  const signInToSupabase = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConnection("missing-env");
      setConnectionDetail("Supabase environment variables are missing in this deployment.");
      showToast("Supabase environment variables are missing.");
      return;
    }

    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setAuthLoading(false);
    if (error) {
      setConnection("signed-out");
      setConnectionDetail(`Supabase sign-in failed: ${error.message}`);
      showToast(error.message);
      return;
    }
    showToast("Signed in to Supabase");
  }, [showToast]);

  const signOutFromSupabase = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    showToast("Signed out from Supabase");
  }, [showToast]);

  const createProject = useCallback(async (data: ProjectForm) => {
    const fallback = createLocalProject(data);
    setProjects((current) => [fallback, ...current]);
    setSelectedId(fallback.id);
    navigate("detail");

    try {
      const result = await plumbtrackApi("createProject", { data });
      if (result.project) {
        setProjects((current) =>
          current.map((project) =>
            String(project.id) === String(fallback.id) ? result.project! : project,
          ),
        );
        setSelectedId(result.project.id);
        showToast(result.connected ? "Project saved to Supabase" : "Project saved locally");
        return;
      }
    } catch (error) {
      console.warn("Service project save failed, trying browser Supabase", error);
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || connection !== "connected") {
      showToast("Project saved locally. Sign in to save to Supabase.");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      showToast("Sign in to Supabase before saving.");
      return;
    }

    const { data: savedProject, error } = await supabase
      .from("projects")
      .insert({
        name: data.name.toUpperCase(),
        reference: data.reference,
        description: data.address,
        site_address: data.address,
        maincon: data.maincon,
        person_in_charge: data.pic,
        start_date: data.start,
        target_completion_date: data.target || null,
        status: "active",
        temporary_water_required: data.temporaryWater === "yes",
        public_sewer_connection: data.publicSewer === "yes",
        progress: 0,
        created_by: session.user.id,
      })
      .select(supabaseProjectSelect)
      .single();

    if (error) {
      showToast(`Supabase save failed: ${error.message}`);
      return;
    }

    const stageRows = stages.map(([name, description], index) => ({
      project_id: savedProject.id,
      stage_number: index + 1,
      name,
      description,
      status:
        (data.temporaryWater === "no" && index === 1) ||
        (data.publicSewer === "no" && (index === 3 || index === 5))
          ? "not_applicable"
          : index === 0
            ? "in_progress"
            : "not_started",
      applicable: !(
        (data.temporaryWater === "no" && index === 1) ||
        (data.publicSewer === "no" && (index === 3 || index === 5))
      ),
      updated_by: session.user.id,
    }));

    const { error: stageError } = await supabase
      .from("project_stages")
      .insert(stageRows);
    if (stageError) {
      showToast(`Project saved, stage setup failed: ${stageError.message}`);
      return;
    }

    const mappedProject = mapSupabaseProject({
      ...(savedProject as SupabaseProjectRow),
      project_stages: stageRows.map((row) => ({
        stage_number: row.stage_number,
        name: row.name,
        status: row.status,
      })),
    });
    setProjects((current) =>
      current.map((project) =>
        String(project.id) === String(fallback.id) ? mappedProject : project,
      ),
    );
    setSelectedId(mappedProject.id);
    showToast("Project saved to Supabase");
  }, [connection, navigate, showToast]);

  const updateProject = useCallback(async (id: Project["id"], patch: Partial<Project>) => {
    setProjects((current) =>
      current.map((project) =>
        String(project.id) === String(id) ? { ...project, ...patch } : project,
      ),
    );

    const dbPatch: Record<string, string | number> = {};
    if (patch.progress !== undefined) dbPatch.progress = patch.progress;
    if (patch.active !== undefined) dbPatch.status = patch.active ? "active" : "completed";
    if (Object.keys(dbPatch).length === 0) return;

    try {
      await plumbtrackApi("updateProject", { id, patch });
      return;
    } catch (error) {
      console.warn("Service project update failed, trying browser Supabase", error);
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || connection !== "connected" || String(id).startsWith("local-")) {
      return;
    }

    const { error } = await supabase.from("projects").update(dbPatch).eq("id", id);
    if (error) showToast(`Supabase update failed: ${error.message}`);
  }, [connection, showToast]);

  const deleteProject = useCallback(async (project: Project) => {
    if (!window.confirm(`Delete ${project.name}? This will also remove its stages, records and reminders from Supabase.`)) {
      return;
    }

    setProjects((current) => current.filter((item) => String(item.id) !== String(project.id)));
    setSelectedId((current) => {
      if (String(current) !== String(project.id)) return current;
      return projects.find((item) => String(item.id) !== String(project.id))?.id ?? "";
    });
    navigate("projects");

    try {
      await plumbtrackApi("deleteProject", { id: project.id, name: project.name });
      showToast("Project deleted from Supabase");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Project removed locally");
    }
  }, [navigate, projects, showToast]);

  const saveRecord = useCallback(async (record: RecordItem) => {
    const recordForState = { ...record, file: undefined };
    setRecords((current) => [recordForState, ...current]);
    try {
      const result = record.file
        ? await uploadRecordFile({ record })
        : await plumbtrackApi("saveRecord", { record });
      if (result.record) {
        setRecords((current) =>
          current.map((item) => (String(item.id) === String(record.id) ? result.record! : item)),
        );
      }
      showToast(result.connected ? "Record and file saved to Supabase" : "Record added locally");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Record added locally");
    }
  }, [showToast]);

  const deleteRecord = useCallback(async (record: RecordItem) => {
    setRecords((current) => current.filter((item) => String(item.id) !== String(record.id)));
    try {
      await plumbtrackApi("deleteRecord", { id: record.id, name: record.name });
      showToast("Record deleted from Supabase");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Record removed locally");
    }
  }, [showToast]);

  const saveReminder = useCallback(async (reminder: ReminderItem) => {
    setReminders((current) => [reminder, ...current]);
    try {
      const result = await plumbtrackApi("saveReminder", { reminder });
      if (result.reminder) {
        setReminders((current) =>
          current.map((item) => (String(item.id) === String(reminder.id) ? result.reminder! : item)),
        );
      }
      showToast(result.connected ? "Reminder saved to Supabase" : "Reminder added locally");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Reminder added locally");
    }
  }, [showToast]);

  const deleteReminder = useCallback(async (reminder: ReminderItem) => {
    setReminders((current) => current.filter((item) => String(item.id) !== String(reminder.id)));
    try {
      await plumbtrackApi("deleteReminder", { id: reminder.id, title: reminder.title });
      showToast("Reminder deleted from Supabase");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Reminder removed locally");
    }
  }, [showToast]);

  const toggleReminder = useCallback(async (reminder: ReminderItem) => {
    const completed = !reminder.completed;
    const nextReminder = {
      ...reminder,
      completed,
      status: reminderStatus(reminder.dueDate, completed),
    };
    setReminders((current) =>
      current.map((item) => (String(item.id) === String(reminder.id) ? nextReminder : item)),
    );
    try {
      await plumbtrackApi("saveReminder", { reminder: nextReminder });
      showToast("Reminder status saved");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Reminder status updated locally");
    }
  }, [showToast]);

  const saveTeamMember = useCallback(async (member: TeamMember) => {
    setTeamMembers((current) => [member, ...current]);
    try {
      const result = await plumbtrackApi("saveTeamMember", { member });
      if (result.teamMember) {
        setTeamMembers((current) =>
          current.map((item) => (String(item.id) === String(member.id) ? result.teamMember! : item)),
        );
      }
      showToast(result.connected ? "Employee saved to Supabase" : "Employee added locally");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Employee added locally");
    }
  }, [showToast]);

  const deleteTeamMember = useCallback(async (member: TeamMember) => {
    setTeamMembers((current) => current.filter((item) => String(item.id) !== String(member.id)));
    try {
      await plumbtrackApi("deleteTeamMember", { id: member.id, email: member.email });
      showToast("Employee deleted from Supabase");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Employee removed locally");
    }
  }, [showToast]);

  const saveSettings = useCallback(async (nextSettings: SettingsState) => {
    setSettings(nextSettings);
    try {
      await plumbtrackApi("saveSettings", { settings: nextSettings });
      showToast("Settings saved to Supabase");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Settings saved locally");
    }
  }, [showToast]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">PT</div>
          <div><strong>PlumbTrack</strong><span>PROJECT PROGRAM</span></div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav aria-label="Workspace navigation">
          <p>WORKSPACE</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id || ((view === "detail" || view === "new-project") && item.id === "projects");
            return (
              <button key={item.id} className={active ? "active" : ""} onClick={() => navigate(item.id)}>
                <Icon size={17} strokeWidth={1.7} /><span>{item.label}</span>{item.badge && <em>{projects.length}</em>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">陈</div>
          <div><strong>陈青宇</strong><span>Administrator</span></div>
          <button onClick={() => showToast("Local preview stays signed in") } aria-label="Sign out"><ArrowUpRight size={16} /></button>
        </div>
      </aside>
      {sidebarOpen && <button className="nav-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <div className="mobile-topbar">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="brand-mark compact">PT</div><strong>PlumbTrack</strong>
          <button className="mobile-add" onClick={() => navigate("new-project")} aria-label="Add project"><Plus size={21} /></button>
        </div>
        <SupabaseConnectionPanel connection={connection} detail={connectionDetail} email={sessionEmail} loading={authLoading} onSignIn={signInToSupabase} onSignOut={signOutFromSupabase} />
        {view === "dashboard" && <Dashboard projects={projects} onOpen={openProject} onAdd={() => navigate("new-project")} />}
        {view === "projects" && <Projects projects={projects} onOpen={openProject} onAdd={() => navigate("new-project")} />}
        {view === "records" && <Records records={records} projects={projects} onDelete={deleteRecord} showToast={showToast} />}
        {view === "calendar" && <CalendarPage reminders={reminders} projects={projects} onOpen={() => projects[0] ? openProject(projects[0].id) : navigate("projects")} onCreate={saveReminder} onDelete={deleteReminder} onToggle={toggleReminder} />}
        {view === "team" && <TeamPage members={teamMembers} onCreate={saveTeamMember} onDelete={deleteTeamMember} />}
        {view === "activity" && <ActivityPage activities={activities} />}
        {view === "settings" && <SettingsPage key={JSON.stringify(settings)} settings={settings} onSave={saveSettings} />}
        {view === "detail" && selectedProject && <ProjectDetail key={selectedProject.id} project={selectedProject} onBack={() => navigate("projects")} onUpdate={(patch) => updateProject(selectedProject.id, patch)} onDelete={() => deleteProject(selectedProject)} onUpload={saveRecord} onCompleteClose={() => { updateProject(selectedProject.id, { active: false, progress: 100 }); navigate("records"); }} showToast={showToast} />}
        {view === "detail" && !selectedProject && <div className="page"><div className="panel standalone"><EmptyState title="No project selected." /></div></div>}
        {view === "new-project" && <NewProjectPage onCancel={() => navigate("projects")} onCreate={createProject} />}
      </main>
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function Dashboard({ projects, onOpen, onAdd }: { projects: Project[]; onOpen: (id: Project["id"]) => void; onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const visible = projects.filter((p) => `${p.name} ${p.description} ${p.maincon} ${p.pic}`.toLowerCase().includes(search.toLowerCase())).slice(0, 6);
  const queuedProjects = projects.slice(0, 5);
  const metrics = [
    { label: "Active Projects", value: String(projects.filter((p) => p.active).length), note: "0 require attention", icon: FolderKanban, accent: "cyan" },
    { label: "Average Progress", value: "22%", note: "22%", icon: ArrowUpRight, accent: "mint", progress: 22 },
    { label: "Pending Approval", value: "5", note: "PUB, Maincon or Consultant", icon: Hourglass, accent: "yellow" },
    { label: "Due Soon", value: "0", note: "Within the next 7 days", icon: AlertCircle, accent: "pink" },
    { label: "Saved Files", value: "11", note: "Cloud project records", icon: FileText, accent: "purple" },
  ];
  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div><Eyebrow>PROJECT CONTROL CENTRE</Eyebrow><h1>Good afternoon, 陈青宇</h1><p>Here is what needs your attention across all plumbing projects.</p></div>
        <button className="primary-button" onClick={onAdd}><Plus size={16} /> Add new project</button>
      </header>
      <section className="metric-grid" aria-label="Project metrics">
        {metrics.map(({ label, value, note, icon: Icon, accent, progress }) => (
          <article className={`metric-card accent-${accent}`} key={label}>
            <div className="metric-icon"><Icon size={18} /></div><p>{label}</p><strong>{value}</strong><small>{note}</small>
            {progress !== undefined && <div className="tiny-progress"><span style={{ width: `${progress}%` }} /></div>}
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel span-2 project-panel">
          <div className="panel-header"><div><Eyebrow>LIVE PROJECTS</Eyebrow><h2>Project progress</h2></div><SearchBox value={search} onChange={setSearch} placeholder="Search project, address, Maincon or PIC" /></div>
          <div className="project-rows">
            {visible.map((project) => <ProjectRow key={project.id} project={project} onClick={() => onOpen(project.id)} />)}
            {visible.length === 0 && <EmptyState title="No matching projects" />}
          </div>
        </article>
        <article className="panel queue-panel">
          <div className="panel-header simple"><div><Eyebrow>ACTION QUEUE</Eyebrow><h2>Waiting for reply</h2></div><span className="count-badge">5</span></div>
          {queuedProjects.map((project) => <button className="queue-row" key={project.id} onClick={() => onOpen(project.id)}><span><strong>{project.name}</strong><small>{project.stage}</small></span><ArrowRight size={15} /></button>)}
          {queuedProjects.length === 0 && <EmptyState title="No projects waiting." icon="check" />}
        </article>
        <article className="panel status-panel"><div className="panel-header simple"><div><Eyebrow>SCHEDULE</Eyebrow><h2>Delayed projects</h2></div><span className="count-badge">0</span></div><EmptyState title="All target dates are on track." icon="check" /></article>
        <article className="panel records-panel span-2"><div className="panel-header simple"><div><Eyebrow>RECENT RECORDS</Eyebrow><h2>Latest uploads</h2></div><span className="muted-count">11 total</span></div>{recordSeed.slice(0,5).map((record) => <div className="latest-row" key={record.id}><span className="file-badge">PDF</span><span><strong>{record.name}</strong><small>{record.project} · {record.category}</small></span><time>{record.date}</time></div>)}</article>
      </section>
    </div>
  );
}

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button className="project-row" onClick={onClick}>
      <span className="project-initial">{project.code}</span>
      <span className="project-row-main"><span><strong>{project.name}</strong><small>{project.description}</small></span><span className="project-stage"><em>CURRENT STAGE</em><b>STEP {project.step} · {project.stage}</b></span></span>
      <span className="project-progress"><strong>{project.progress}%</strong><span><i style={{ width: `${project.progress}%` }} /></span></span><ArrowRight className="row-arrow" size={17} />
    </button>
  );
}

function Projects({ projects, onOpen, onAdd }: { projects: Project[]; onOpen: (id: Project["id"]) => void; onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const visible = useMemo(() => {
    const found = projects.filter((p) => `${p.name} ${p.description} ${p.maincon} ${p.pic} ${p.reference}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (filter === "active" && p.active) || p.stage === filter || p.maincon === filter));
    return [...found].sort((a,b) => sort === "progress" ? b.progress - a.progress : sort === "name" ? a.name.localeCompare(b.name) : (Date.parse(b.createdAt ?? "") || Number(b.id) || 0) - (Date.parse(a.createdAt ?? "") || Number(a.id) || 0));
  }, [projects, search, filter, sort]);
  return (
    <div className="page">
      <header className="page-header"><div><Eyebrow>PROJECT REGISTER</Eyebrow><h1>All projects</h1><p>{projects.length} projects · {projects.filter((p) => p.active).length} active</p></div><button className="primary-button" onClick={onAdd}><Plus size={16} /> Add new project</button></header>
      <div className="toolbar project-toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search name, address, Maincon, PIC or reference" /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter projects"><option value="all">All</option><option value="active">Active</option>{Array.from(new Set(projects.map((p) => p.maincon))).map((v) => <option key={v}>{v}</option>)}{Array.from(new Set(projects.map((p) => p.stage))).map((v) => <option key={v}>{v}</option>)}</select><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort projects"><option value="latest">Latest updated</option><option value="progress">Highest progress</option><option value="name">Project name</option></select></div>
      <div className="project-register">{visible.map((project) => <button className="project-card" key={project.id} onClick={() => onOpen(project.id)}><div className="project-card-top"><span className="project-initial large">{project.code}</span><span className="status-pill active">{project.active ? "Active" : "Completed"}</span><ArrowUpRight size={17} /></div><h3>{project.name}</h3><p>{project.description}</p><div className="project-meta"><span><small>Maincon</small><strong>{project.maincon}</strong></span><span><small>Person in Charge</small><strong>{project.pic}</strong></span></div><div className="project-card-stage"><span><small>CURRENT STAGE</small><strong>STEP {project.step} · {project.stage}</strong></span><span className="progress-number"><small>Overall progress</small><strong>{project.progress}%</strong></span></div><div className="card-progress"><i style={{ width: `${project.progress}%` }} /></div><footer><span>Target {project.target}</span><span>{project.records} records</span></footer></button>)}</div>
      {visible.length === 0 && <div className="panel standalone"><EmptyState title="No projects match these filters." /></div>}
    </div>
  );
}

function Records({ records, projects, onDelete, showToast }: { records: RecordItem[]; projects: Project[]; onDelete: (record: RecordItem) => void; showToast: (message: string) => void }) {
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("all");
  const [category, setCategory] = useState("all");
  const [preview, setPreview] = useState<RecordItem | null>(null);
  const visible = records.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) && (project === "all" || r.project === project) && (category === "all" || r.category === category));
  const remove = (record: RecordItem) => { if (window.confirm(`Delete ${record.name}? This will remove the record from Supabase when connected.`)) onDelete(record); };
  const download = (record: RecordItem) => { const blob = new Blob([`PlumbTrack mock record\n${record.name}\n${record.project}\n${record.stage}`], { type: "text/plain" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${record.name}.txt`; anchor.click(); URL.revokeObjectURL(url); showToast("Mock download started"); };
  return (
    <div className="page"><header className="page-header"><div><Eyebrow>DOCUMENT CONTROL</Eyebrow><h1>Records</h1><p>Search, preview and download every project file from one place.</p></div></header>
      <div className="toolbar records-toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Search file name" /><select value={project} onChange={(e) => setProject(e.target.value)}><option value="all">All projects</option>{projects.map((p) => <option key={p.id}>{p.name}</option>)}</select><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{["Approval Letter","Submission","Shop Drawing","As-built Drawing","Form B","Form C","Testing Record","Site Photo","Completed Photo","OMM","Other Record"].map((v) => <option key={v}>{v}</option>)}</select><select><option>All uploaders</option><option>qingyuc832@gmail.com</option></select></div>
      <div className="records-table"><div className="records-head"><span>File</span><span>Project / Stage</span><span>Category</span><span>Revision</span><span>Uploaded</span><span>Action</span></div>{visible.map((record) => <div className="record-row" key={record.id}><div className="file-cell"><span className="file-badge">PDF</span><span><strong>{record.name}</strong><small>{record.size}</small></span></div><div><strong>{record.project}</strong><small>{record.stage}</small></div><div><span className="category-pill">{record.category}</span></div><div>{record.revision}</div><div><span>{record.date}</span><small>{record.uploader}</small></div><div className="record-actions"><button onClick={() => setPreview(record)}><ExternalLink size={14} /> View</button><button onClick={() => download(record)}><Download size={14} /> Download</button><button className="danger" onClick={() => remove(record)} aria-label={`Delete ${record.name}`}><Trash2 size={15} /></button></div></div>)}</div>
      {visible.length === 0 && <div className="panel standalone"><EmptyState title="No records found." /></div>}
      {preview && <div className="modal-layer"><button className="modal-backdrop" onClick={() => setPreview(null)} aria-label="Close preview" /><div className="preview-modal" role="dialog" aria-modal="true"><header><span className="file-badge">PDF</span><div><strong>{preview.name}</strong><small>{preview.project} · {preview.stage}</small></div><button onClick={() => setPreview(null)} aria-label="Close preview"><X size={19} /></button></header><div className="mock-document"><FileText size={54} /><strong>Document preview</strong><p>This local preview represents the future Supabase Storage document viewer.</p></div></div></div>}
    </div>
  );
}

function CalendarPage({ reminders, projects, onOpen, onCreate, onDelete, onToggle }: { reminders: ReminderItem[]; projects: Project[]; onOpen: () => void; onCreate: (reminder: ReminderItem) => void; onDelete: (reminder: ReminderItem) => void; onToggle: (reminder: ReminderItem) => void }) {
  const [filter, setFilter] = useState("All");
  const [adding, setAdding] = useState(false);
  const visible = filter === "All" ? reminders : reminders.filter((event) => event.status === filter);
  const stats = ["Overdue", "Due Soon", "Normal", "Completed"].map((label) => [label, String(reminders.filter((item) => item.status === label).length)] as const);
  const addReminder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedProject = projects.find((item) => String(item.id) === String(form.get("projectId"))) ?? projects[0];
    if (!selectedProject) return;
    const dueDate = String(form.get("dueDate"));
    const reminder: ReminderItem = {
      id: `local-reminder-${Date.now()}`,
      title: String(form.get("title")),
      project: selectedProject.name,
      projectId: isPersistedId(selectedProject.id) ? String(selectedProject.id) : undefined,
      stage: String(form.get("stage") || selectedProject.stage),
      dueDate,
      status: reminderStatus(dueDate, false),
      completed: false,
    };
    onCreate(reminder);
    setAdding(false);
    event.currentTarget.reset();
  };
  return <div className="page"><header className="page-header"><div><Eyebrow>PROGRAMME DATES</Eyebrow><h1>Calendar & reminders</h1><p>Submission, approval, site work and completion dates across all projects.</p></div><button className="primary-button" onClick={() => setAdding(!adding)}><Plus size={16} /> Add reminder</button></header>{adding && <form className="inline-form" onSubmit={addReminder}><label>Title<input name="title" required placeholder="e.g. Water meter coordination" /></label><label>Project<select name="projectId">{projects.map((project) => <option value={String(project.id)} key={project.id}>{project.name}</option>)}</select></label><label>Stage<input name="stage" placeholder="Stage / note" /></label><label>Due Date<input name="dueDate" type="date" required /></label><button className="primary-button">Save reminder</button></form>}<div className="filter-tabs">{["All","Normal","Due Soon","Overdue","Completed"].map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><section className="calendar-grid"><article className="panel programme-panel"><Eyebrow>THIS PROGRAMME</Eyebrow><h2>{reminders.length} important dates</h2><div className="calendar-stats">{stats.map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="coordination-note"><BellRing size={20} /><span><strong>Water meter coordination</strong><p>Permanent Water Submission, site completion and meter installation should remain aligned.</p></span></div></article><article className="calendar-events">{visible.map((event) => { const due = new Date(`${event.dueDate}T00:00:00`); return <div className="calendar-event" key={event.id}><button onClick={onOpen}><span className="date-box"><strong>{Number.isNaN(due.getTime()) ? "--" : due.getDate()}</strong><small>{Number.isNaN(due.getTime()) ? "Date" : due.toLocaleDateString("en-GB", { month: "short" })}</small></span><span className={`status-pill ${event.status.toLowerCase().replace(" ", "-")}`}>{event.status}</span><span><strong>{event.title}</strong><small>{event.project} · {event.stage}</small></span><ArrowRight size={17} /></button><div className="record-actions"><button onClick={() => onToggle(event)}>{event.completed ? "Reopen" : "Done"}</button><button className="danger" onClick={() => { if (window.confirm(`Delete reminder ${event.title}?`)) onDelete(event); }}><Trash2 size={15} /></button></div></div>; })}{visible.length === 0 && <div className="panel standalone"><EmptyState title="No dates in this category." /></div>}</article></section></div>;
}

function TeamPage({ members, onCreate, onDelete }: { members: TeamMember[]; onCreate: (member: TeamMember) => void; onDelete: (member: TeamMember) => void }) {
  const [adding, setAdding] = useState(false);
  return <div className="page"><header className="page-header"><div><Eyebrow>ACCESS & RESPONSIBILITY</Eyebrow><h1>Team</h1><p>{members.length} active team members</p></div><button className="primary-button" onClick={() => setAdding(!adding)}><Plus size={16} /> Add employee</button></header>{adding && <form className="inline-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onCreate({ id: `local-team-${Date.now()}`, name: String(form.get("name")), email: String(form.get("email")), role: String(form.get("role")), active: true, lastSeen: "Just now" }); setAdding(false); event.currentTarget.reset(); }}><label>Full Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label><label>Role<select name="role"><option>View Only</option><option>Administrator</option></select></label><button className="primary-button">Save employee</button></form>}<div className="team-grid">{members.map((member) => <article className="team-card" key={member.id}><div className="member-head"><span className="member-avatar">{member.name.split(" ").map((v) => v[0]).join("").slice(0,2)}</span><span className="status-pill active">{member.active ? "active" : "inactive"}</span><button className="danger" aria-label={`Delete ${member.name}`} onClick={() => { if (window.confirm(`Delete employee ${member.name}?`)) onDelete(member); }}><Trash2 size={16} /></button></div><h3>{member.name}</h3><p>{member.email}</p><span className="role-pill">{member.role}</span><div className="member-stats"><span><strong>0</strong><small>Assigned projects</small></span><span><strong>{member.role === "Administrator" ? "70" : "0"}</strong><small>Recent actions</small></span></div><footer>Last seen {member.lastSeen}</footer></article>)}</div></div>;
}

function ActivityPage({ activities }: { activities: ActivityItem[] }) {
  const [search, setSearch] = useState("");
  const visible = activities.filter((item) => `${item.action} ${item.detail} ${item.actor}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page"><header className="page-header"><div><Eyebrow>AUDIT TRAIL</Eyebrow><h1>Activity log</h1><p>A permanent record of project, stage, user and document changes.</p></div></header><div className="activity-search"><SearchBox value={search} onChange={setSearch} placeholder="Search person, action or project" /></div><div className="activity-list">{visible.map((item) => <article className="activity-row" key={item.id}><span className={`activity-icon ${item.type}`}>{item.type === "plus" ? <Plus size={17} /> : item.type === "upload" ? <Upload size={17} /> : item.type === "delete" ? <Trash2 size={17} /> : item.type === "settings" ? <Settings size={17} /> : <Activity size={17} />}</span><span><strong>{item.action}</strong><p>{item.detail}</p><small>{item.actor} · {item.date}</small></span>{item.type === "refresh" && <em>before → after</em>}</article>)}</div></div>;
}

function SettingsPage({ settings, onSave }: { settings: SettingsState; onSave: (settings: SettingsState) => void }) {
  const [draft, setDraft] = useState(settings);
  return <div className="page"><header className="page-header"><div><Eyebrow>SYSTEM PREFERENCES</Eyebrow><h1>Settings</h1><p>Company identity, file controls, dates, notifications and retention.</p></div></header><form className="settings-form" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}><section className="settings-section"><div className="section-number">01</div><div className="settings-heading"><h2>Company profile</h2><p>Shown throughout your project workspace.</p></div><div className="form-grid"><label>Company Name<input value={draft.companyName} onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))} /></label><label className="span-2">Company Logo<span className="upload-zone"><span className="brand-mark compact">PT</span><span><strong>Upload company logo</strong><small>PNG, JPG or WEBP</small></span><input type="file" accept="image/png,image/jpeg,image/webp" /></span></label></div></section><section className="settings-section"><div className="section-number">02</div><div className="settings-heading"><h2>Records & notifications</h2><p>Controls for project files and follow-up reminders.</p></div><div className="form-grid four"><label>File Upload Limit (MB)<input type="number" value={draft.fileUploadLimitMb} onChange={(event) => setDraft((current) => ({ ...current, fileUploadLimitMb: Number(event.target.value) }))} /></label><label>Date Format<select value={draft.dateFormat} onChange={(event) => setDraft((current) => ({ ...current, dateFormat: event.target.value }))}><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option><option>DD MMM YYYY</option></select></label><label>Follow-up Reminder (days)<input type="number" value={draft.followUpDays} onChange={(event) => setDraft((current) => ({ ...current, followUpDays: Number(event.target.value) }))} /></label><label>Data Retention<select value={draft.dataRetention} onChange={(event) => setDraft((current) => ({ ...current, dataRetention: event.target.value }))}><option>Permanent</option><option>7 years after completion</option><option>5 years after completion</option></select></label></div><div className="info-note"><ShieldCheck size={18} /><p>The default 14-stage workflow, status colours, Administrator and View Only permission model are protected system controls.</p></div></section><button className="primary-button save-settings">Save settings</button></form></div>;
}

function LegacyCalendarPage({ onOpen }: { onOpen: () => void }) {
  const [filter, setFilter] = useState("All");
  const events = [{ day: "5", month: "Mar", status: "Completed", title: "DP & DC Clearance" },{ day: "9", month: "Jul", status: "Overdue", title: "Temporary Water Submission" }];
  const visible = filter === "All" ? events : events.filter((event) => event.status === filter);
  return <div className="page"><header className="page-header"><div><Eyebrow>PROGRAMME DATES</Eyebrow><h1>Calendar & reminders</h1><p>Submission, approval, site work and completion dates across all projects.</p></div></header><div className="filter-tabs">{["All","Normal","Due Soon","Overdue","Completed"].map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><section className="calendar-grid"><article className="panel programme-panel"><Eyebrow>THIS PROGRAMME</Eyebrow><h2>2 important dates</h2><div className="calendar-stats">{[["Overdue","1"],["Due Soon","0"],["Normal","0"],["Completed","1"]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><div className="coordination-note"><BellRing size={20} /><span><strong>Water meter coordination</strong><p>Permanent Water Submission, site completion and meter installation should remain aligned.</p></span></div></article><article className="calendar-events">{visible.map((event) => <button className="calendar-event" key={event.status} onClick={onOpen}><span className="date-box"><strong>{event.day}</strong><small>{event.month}</small></span><span className={`status-pill ${event.status.toLowerCase().replace(" ", "-")}`}>{event.status}</span><span><strong>{event.title}</strong><small>754 MOUNTBATTEN ROAD · hock hwa builders pte ltd</small></span><ArrowRight size={17} /></button>)}{visible.length === 0 && <div className="panel standalone"><EmptyState title="No dates in this category." /></div>}</article></section></div>;
}

function LegacyTeamPage({ showToast }: { showToast: (message: string) => void }) {
  const [adding, setAdding] = useState(false); const [members, setMembers] = useState([{ name: "Chen QingYu", email: "qingyuc832@gmail.com", role: "Administrator" }]);
  return <div className="page"><header className="page-header"><div><Eyebrow>ACCESS & RESPONSIBILITY</Eyebrow><h1>Team</h1><p>{members.length} active team members</p></div><button className="primary-button" onClick={() => setAdding(!adding)}><Plus size={16} /> Add employee</button></header>{adding && <form className="inline-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setMembers((current) => [...current, { name: String(form.get("name")), email: String(form.get("email")), role: String(form.get("role")) }]); setAdding(false); showToast("Employee added"); }}><label>Full Name<input name="name" required /></label><label>Email<input name="email" type="email" required /></label><label>Role<select name="role"><option>View Only</option><option>Administrator</option></select></label><button className="primary-button">Save employee</button></form>}<div className="team-grid">{members.map((member) => <article className="team-card" key={member.email}><div className="member-head"><span className="member-avatar">{member.name.split(" ").map((v) => v[0]).join("").slice(0,2)}</span><span className="status-pill active">active</span><button aria-label="Member actions"><MoreHorizontal size={18} /></button></div><h3>{member.name}</h3><p>{member.email}</p><span className="role-pill">{member.role}</span><div className="member-stats"><span><strong>0</strong><small>Assigned projects</small></span><span><strong>{member.role === "Administrator" ? "70" : "0"}</strong><small>Recent actions</small></span></div><footer>Last seen 08 Aug 2026</footer></article>)}</div></div>;
}

function LegacyActivityPage() {
  const [search, setSearch] = useState(""); const visible = activitySeed.filter((item) => `${item[0]} ${item[1]}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="page"><header className="page-header"><div><Eyebrow>AUDIT TRAIL</Eyebrow><h1>Activity log</h1><p>A permanent record of project, stage, user and document changes.</p></div></header><div className="activity-search"><SearchBox value={search} onChange={setSearch} placeholder="Search person, action or project" /></div><div className="activity-list">{visible.map(([action,detail,date,type], index) => <article className="activity-row" key={`${action}-${index}`}><span className={`activity-icon ${type}`}>{type === "plus" ? <Plus size={17} /> : type === "upload" ? <Upload size={17} /> : <Activity size={17} />}</span><span><strong>{action}</strong><p>{detail}</p><small>qingyuc832@gmail.com · {date}</small></span>{type === "refresh" && <em>before → after</em>}</article>)}</div></div>;
}

function LegacySettingsPage({ showToast }: { showToast: (message: string) => void }) {
  return <div className="page"><header className="page-header"><div><Eyebrow>SYSTEM PREFERENCES</Eyebrow><h1>Settings</h1><p>Company identity, file controls, dates, notifications and retention.</p></div></header><form className="settings-form" onSubmit={(e) => { e.preventDefault(); showToast("Settings saved"); }}><section className="settings-section"><div className="section-number">01</div><div className="settings-heading"><h2>Company profile</h2><p>Shown throughout your project workspace.</p></div><div className="form-grid"><label>Company Name<input defaultValue="PlumbTrack Contractor" /></label><label className="span-2">Company Logo<span className="upload-zone"><span className="brand-mark compact">PT</span><span><strong>Upload company logo</strong><small>PNG, JPG or WEBP</small></span><input type="file" accept="image/png,image/jpeg,image/webp" /></span></label></div></section><section className="settings-section"><div className="section-number">02</div><div className="settings-heading"><h2>Records & notifications</h2><p>Controls for project files and follow-up reminders.</p></div><div className="form-grid four"><label>File Upload Limit (MB)<input type="number" defaultValue="25" /></label><label>Date Format<select defaultValue="DD/MM/YYYY"><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option><option>DD MMM YYYY</option></select></label><label>Follow-up Reminder (days)<input type="number" defaultValue="7" /></label><label>Data Retention<select><option>Permanent</option><option>7 years after completion</option><option>5 years after completion</option></select></label></div><div className="info-note"><ShieldCheck size={18} /><p>The default 14-stage workflow, status colours, Administrator and View Only permission model are protected system controls.</p></div></section><button className="primary-button save-settings">Save settings</button></form></div>;
}

void [LegacyCalendarPage, LegacyTeamPage, LegacyActivityPage, LegacySettingsPage];

function stageStatusFromDb(status: string | undefined): StageStatus {
  if (status === "completed") return "Completed";
  if (status === "in_progress" || status === "waiting_approval") return "In Progress";
  if (status === "not_applicable") return "N/A";
  return "Not Started";
}

function stageStatusClassName(status: StageStatus) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function buildInitialStageStatuses(project: Project): StageStatus[] {
  const statuses = stages.map((_, index): StageStatus =>
    index === 3 || index === 5 ? "N/A" : "Not Started",
  );

  project.stageStatuses?.forEach((stage) => {
    statuses[stage.stageNumber - 1] = stageStatusFromDb(stage.status);
  });

  if (statuses.some((status) => status === "In Progress")) return statuses;
  if (statuses.every((status) => status === "Completed" || status === "N/A")) return statuses;

  const currentIndex = Math.max(0, Math.min(stages.length - 1, project.step - 1));
  if (statuses[currentIndex] !== "Completed" && statuses[currentIndex] !== "N/A") {
    statuses[currentIndex] = "In Progress";
    return statuses;
  }

  const nextIndex = statuses.findIndex((status) => status !== "Completed" && status !== "N/A");
  if (nextIndex >= 0) statuses[nextIndex] = "In Progress";
  return statuses;
}

function advanceStageStatuses(statuses: StageStatus[], completedIndex: number) {
  const nextStatuses = statuses.map((status, index): StageStatus => {
    if (index === completedIndex) return "Completed";
    if (status === "N/A" || status === "Completed") return status;
    return "Not Started";
  });
  const nextIndex = nextStatuses.findIndex((status) => status === "Not Started");
  if (nextIndex >= 0) nextStatuses[nextIndex] = "In Progress";
  return nextStatuses;
}

function stageProgress(statuses: StageStatus[]) {
  const applicable = statuses.filter((status) => status !== "N/A").length;
  const completed = statuses.filter((status) => status === "Completed").length;
  return {
    applicable,
    completed,
    percentage: Math.min(100, Math.round((completed / Math.max(1, applicable)) * 100)),
  };
}

function ProjectDetail({
  project,
  onBack,
  onUpdate,
  onDelete,
  onUpload,
  onCompleteClose,
  showToast,
}: {
  project: Project;
  onBack: () => void;
  onUpdate: (patch: Partial<Project>) => void;
  onDelete: () => void;
  onUpload: (record: RecordItem) => void;
  onCompleteClose: () => void;
  showToast: (message: string) => void;
}) {
  const initialStatuses = useMemo(() => buildInitialStageStatuses(project), [project]);
  const [expanded, setExpanded] = useState(() => {
    const initialIndex = initialStatuses.findIndex((status) => status === "In Progress");
    return initialIndex >= 0 ? initialIndex : -1;
  });
  const [statuses, setStatuses] = useState<StageStatus[]>(initialStatuses);
  const uploadRef = useRef<HTMLInputElement>(null);
  const currentStageIndex = statuses.findIndex((status) => status === "In Progress");
  const allStagesCompleted = statuses.every((status) => status === "Completed" || status === "N/A");
  const progress = stageProgress(statuses);

  const saveStage = async (stageNumber: number, status: StageStatus) => {
    if (status !== "Completed") {
      showToast("Please manually choose Completed before saving this step.");
      return;
    }

    const nextStatuses = advanceStageStatuses(statuses, stageNumber - 1);
    const nextIndex = nextStatuses.findIndex((nextStatus) => nextStatus === "In Progress");
    const nextProgress = stageProgress(nextStatuses);
    const nextStageName = nextIndex >= 0 ? stages[nextIndex][0] : "All stages completed";

    setStatuses(nextStatuses);
    setExpanded(nextIndex >= 0 ? nextIndex : -1);
    onUpdate({
      progress: nextProgress.percentage,
      step: nextIndex >= 0 ? nextIndex + 1 : stageNumber,
      stage: nextStageName,
      stageStatuses: nextStatuses.map((nextStatus, index) => ({
        stageNumber: index + 1,
        status: nextStatus === "In Progress" ? "in_progress" : nextStatus === "Completed" ? "completed" : nextStatus === "N/A" ? "not_applicable" : "not_started",
      })),
    });

    if (!isPersistedId(project.id)) {
      showToast(nextIndex >= 0 ? `Step ${nextIndex + 1} is now In Progress` : "All steps completed. You can close the project.");
      return;
    }

    try {
      const result = await plumbtrackApi("saveStage", {
        projectId: project.id,
        stageNumber,
        status,
      });
      if (result.project) onUpdate(result.project);
      showToast(nextIndex >= 0 ? `Step ${nextIndex + 1} is now In Progress` : "All steps completed. You can close the project.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Stage sync failed");
    }
  };

  const uploadStageFile = (file: File, stageNumber: number, stageName: string) => {
    const record: RecordItem = {
      id: `local-record-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      project: project.name,
      projectId: isPersistedId(project.id) ? String(project.id) : undefined,
      stage: `Step ${stageNumber} · ${stageName}`,
      stageNumber,
      category: "Other Record",
      revision: "Rev 1",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      uploader: "server sync",
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storagePath: `${project.id}/${Date.now()}-${file.name}`,
      file,
    };

    onUpload(record);
    onUpdate({ records: project.records + 1 });
    showToast("File record saved");
  };

  return (
    <div className="page detail-page">
      <div className="form-actions">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back to projects
        </button>
        <button className="danger-button" onClick={onDelete}>
          <Trash2 size={16} /> Delete Project
        </button>
      </div>

      <section className="project-hero">
        <div className="project-initial hero-initial">{project.code}</div>
        <div className="hero-copy">
          <div className="hero-badges">
            <span>{project.reference}</span>
            <span className="status-pill active">{project.active ? "Active" : "Completed"}</span>
          </div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        <div className="hero-progress">
          <strong>{project.progress}%</strong>
          <span>complete</span>
        </div>
      </section>

      <section className="project-summary">
        <div>
          <small>CURRENT STAGE</small>
          <strong>STEP {project.step}</strong>
          <span>{project.stage}</span>
        </div>
        {[
          ["Maincon", project.maincon],
          ["Person in Charge", project.pic],
          ["Start Date", project.start],
          ["Target Completion", project.target],
          ["Last Updated", "08 Aug 2026"],
          ["Records", String(project.records)],
        ].map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <div className="timeline-heading">
        <div>
          <Eyebrow>STANDARD WORKFLOW</Eyebrow>
          <h2>Project timeline</h2>
        </div>
        <div className="legend">
          <span className="done">Completed</span>
          <span className="doing">In progress</span>
          <span>Locked</span>
        </div>
      </div>

      <section className="timeline">
        {stages.map(([name, description], index) => {
          const open = expanded === index;
          const status = statuses[index];
          const stageNumber = index + 1;
          const canTouch = index === currentStageIndex;
          const statusClassName = stageStatusClassName(status);
          const displayStatus = status === "Not Started" ? "Locked" : status;

          return (
            <article className={`stage-card ${open ? "expanded" : ""} ${canTouch ? "current" : "locked"} ${statusClassName}`} key={name}>
              <span className={`timeline-number ${statusClassName}`}>{stageNumber}</span>
              <button
                className="stage-header"
                onClick={() => canTouch && setExpanded(open ? -1 : index)}
                aria-expanded={open}
                disabled={!canTouch}
              >
                <span>
                  <small>STEP {String(stageNumber).padStart(2, "0")}</small>
                  <h3>{name}</h3>
                  <p>{description}</p>
                </span>
                <span className={`status-pill ${statusClassName}`}>{displayStatus}</span>
                <span>{index === 0 ? project.records : 0} records</span>
                <ChevronDown size={18} />
              </button>

              {open && (
                <div className="stage-body">
                  <div className="form-grid four">
                    <label>
                      Stage Status
                      <select
                        value={status}
                        onChange={(event) =>
                          setStatuses((current) =>
                            current.map((value, itemIndex) =>
                              itemIndex === index ? (event.target.value as StageStatus) : value,
                            ),
                          )
                        }
                      >
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </label>
                    <label>
                      Expected Date
                      <input type="date" />
                    </label>
                    <label>
                      Actual Completion Date
                      <input type="date" />
                    </label>
                    <label>
                      {index === 0 ? "DC Clearance Status" : "Approval Reference"}
                      <input defaultValue={index === 0 ? "Received already" : ""} />
                    </label>
                    <label className="span-2">
                      Site Notes
                      <textarea placeholder="Add site notes, approval follow-up or work observations…" />
                    </label>
                  </div>

                  <div className="files-block">
                    <div>
                      <h4>Files & Photos</h4>
                      <p>Revision history and uploaded records for this stage.</p>
                    </div>
                    <input
                      ref={uploadRef}
                      className="hidden-input"
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        uploadStageFile(file, stageNumber, name);
                        event.currentTarget.value = "";
                      }}
                    />
                    <button type="button" className="secondary-button" onClick={() => uploadRef.current?.click()}>
                      <Plus size={15} /> Upload files / photos
                    </button>
                  </div>

                  <p className="empty-file">No files uploaded for this step yet.</p>
                  <p className="last-updated">Last updated 08 Aug 2026 by qingyuc832@gmail.com</p>
                  <p className="stage-rule-note">Manual control: select Completed first, then save. The next step will open automatically.</p>
                  <button className="primary-button stage-save" disabled={status !== "Completed"} onClick={() => saveStage(stageNumber, status)}>
                    Save completed stage
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className="close-project panel">
        <Eyebrow>FINAL CONTROL</Eyebrow>
        <h2>Complete & Close Project</h2>
        <p>Missing items are shown as guidance only. You may still close the project when some records are kept for internal tracking.</p>
        <div className="completion-summary">
          <strong>{progress.completed}/{progress.applicable}</strong>
          <span>{allStagesCompleted ? "all steps ready to close" : "complete every active step before closing"}</span>
        </div>
        <div className="check-grid">
          {[
            "DP & DC Clearance saved",
            "Temporary Water Submission",
            "Shop Drawing approved",
            "Form B completed (if applicable)",
            "Underground Works completed",
            "Form B Part 1 & Part 2 (if applicable)",
            "Permanent Water Submission",
            "Water Meter installed",
            "As-built Drawing uploaded",
            "Form C submitted",
            "Testing Record uploaded",
            "Sanitary Fixtures completed",
            "Completion photos uploaded",
            "OMM submitted",
          ].map((item, index) => (
            <span className={index === 0 || index === 3 ? "ready" : ""} key={item}>
              {index === 0 || index === 3 ? <Check size={13} /> : <i />} {item}
            </span>
          ))}
        </div>
        <button
          className="danger-button"
          disabled={!allStagesCompleted}
          onClick={() => {
            if (window.confirm("Close this project? This will be recorded in the activity log.")) {
              onCompleteClose();
              showToast("Project closed and logged");
            }
          }}
        >
          Complete & Close Project
        </button>
      </section>
    </div>
  );
}

function NewProjectPage({ onCancel, onCreate }: { onCancel: () => void; onCreate: (data: ProjectForm) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectForm>({ resolver: zodResolver(projectSchema), defaultValues: { start: "2026-08-08", temporaryWater: "yes", publicSewer: "no" } });
  return <div className="page new-project-page"><button className="back-button" onClick={onCancel}><ArrowLeft size={16} /> Back to projects</button><header className="page-header"><div><Eyebrow>NEW PROJECT</Eyebrow><h1>Create a landed house project</h1><p>PlumbTrack will automatically create the applicable 14-stage workflow.</p></div></header><form onSubmit={handleSubmit(onCreate)} className="project-form"><section className="settings-section"><div className="section-number">01</div><div className="settings-heading"><h2>Project information</h2><p>Core project details used across the register and records.</p></div><div className="form-grid"><FormField label="Project Name *" error={errors.name?.message}><input placeholder="e.g. 18 Greenbank Park" {...register("name")} /></FormField><FormField label="Project Reference Number *" error={errors.reference?.message}><input placeholder="e.g. PT-2026-018" {...register("reference")} /></FormField><FormField label="Maincon Company *" error={errors.maincon?.message}><input placeholder="Company name" {...register("maincon")} /></FormField><FormField label="Site Address *" error={errors.address?.message}><input placeholder="Full Singapore site address" {...register("address")} /></FormField><FormField label="Person in Charge *" error={errors.pic?.message}><input placeholder="PIC name" {...register("pic")} /></FormField><FormField label="Project Start Date *" error={errors.start?.message}><input type="date" {...register("start")} /></FormField><label>Target Completion Date<input type="date" {...register("target")} /></label></div></section><section className="settings-section"><div className="section-number">02</div><div className="settings-heading"><h2>Workflow conditions</h2><p>These choices determine which stages are applicable.</p></div><div className="condition-grid"><fieldset><legend>Temporary Water</legend><p>Does this project require a temporary water submission?</p><label><input type="radio" value="yes" {...register("temporaryWater")} /> Yes</label><label><input type="radio" value="no" {...register("temporaryWater")} /> No</label></fieldset><fieldset><legend>New Public Sewer Connection</legend><p>Does this project have a new public sewer connection?</p><label><input type="radio" value="yes" {...register("publicSewer")} /> Yes</label><label><input type="radio" value="no" {...register("publicSewer")} /> No</label><small>Form B stages will be marked N/A when No is selected.</small></fieldset></div></section><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button">Create project & workflow <ArrowRight size={16} /></button></div></form></div>;
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label>{label}{children}{error && <small className="field-error">{error}</small>}</label>; }

function EmptyState({ title, icon }: { title: string; icon?: string }) { return <div className="empty-state">{icon === "check" ? <Check size={20} /> : <Search size={20} />}<span>{title}</span></div>; }
