import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type ProjectForm = {
  name: string;
  reference: string;
  maincon: string;
  address: string;
  pic: string;
  start: string;
  target?: string;
  temporaryWater: "yes" | "no";
  publicSewer: "yes" | "no";
};

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
};

type ReminderItem = {
  id: string | number;
  title: string;
  project: string;
  projectId?: string;
  stage: string;
  stageId?: string | null;
  stageNumber?: number;
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

type DbProjectRow = {
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
  project_stages?: DbStageRow[] | null;
  records?: { id: string }[] | null;
};

type DbStageRow = {
  id?: string;
  stage_number: number;
  name: string;
  status: string;
};

type DbRecordRow = {
  id: string;
  project_id: string;
  stage_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  category: string | null;
  revision: number | null;
  created_at: string | null;
  projects?: { name: string | null } | { name: string | null }[] | null;
  project_stages?: { stage_number: number | null; name: string | null } | { stage_number: number | null; name: string | null }[] | null;
  profiles?: { email: string | null; full_name: string | null } | { email: string | null; full_name: string | null }[] | null;
};

type DbReminderRow = {
  id: string;
  project_id: string;
  stage_id: string | null;
  title: string;
  due_date: string;
  completed_at: string | null;
  projects?: { name: string | null } | { name: string | null }[] | null;
  project_stages?: { stage_number: number | null; name: string | null } | { stage_number: number | null; name: string | null }[] | null;
};

type DbTeamMemberRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  active: boolean;
  last_seen_label: string | null;
  updated_at?: string | null;
};

type DbActivityRow = {
  id: number;
  action: string;
  subject: string;
  created_at: string | null;
  profiles?: { email: string | null; full_name: string | null } | { email: string | null; full_name: string | null }[] | null;
};

type DbSettingsRow = {
  company_name: string | null;
  file_upload_limit_mb: number | null;
  date_format: string | null;
  follow_up_days: number | null;
  data_retention: string | null;
};

type JsonPayload = {
  action?: string;
  data?: ProjectForm;
  id?: string | number;
  projectId?: string | number;
  stageNumber?: number;
  status?: string;
  patch?: Partial<Project>;
  record?: RecordItem;
  reminder?: ReminderItem;
  member?: TeamMember;
  settings?: SettingsState;
  name?: string;
  title?: string;
  email?: string;
};

const stageTemplates = [
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

const projectSelect =
  "id,name,reference,description,site_address,maincon,person_in_charge,start_date,target_completion_date,status,progress,created_at,project_stages(id,stage_number,name,status),records(id)";

const recordSelect =
  "id,project_id,stage_id,storage_path,file_name,mime_type,size_bytes,category,revision,created_at,projects(name),project_stages(stage_number,name),profiles(email,full_name)";

const reminderSelect =
  "id,project_id,stage_id,title,due_date,completed_at,projects(name),project_stages(stage_number,name)";

const activitySelect = "id,action,subject,created_at,profiles(email,full_name)";

function isUuid(value: string | number | null | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function firstNested<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function projectCode(name: string) {
  const digits = name.replace(/\D/g, "").slice(0, 2);
  if (digits) return digits;
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PT"
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dateTimeLabel(value: string | null | undefined) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function bytesLabel(bytes: number | null | undefined) {
  if (!bytes) return "0.00 MB";
  return `${(Number(bytes) / 1024 / 1024).toFixed(2)} MB`;
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

function toDbStageStatus(status: string | undefined) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("progress")) return "in_progress";
  if (normalized.includes("approval") || normalized.includes("waiting")) return "waiting_approval";
  if (normalized.includes("complete")) return "completed";
  if (normalized === "n/a" || normalized.includes("not_applicable")) return "not_applicable";
  return "not_started";
}

function activityType(action: string): ActivityItem["type"] {
  const normalized = action.toLowerCase();
  if (normalized.includes("delete")) return "delete";
  if (normalized.includes("upload") || normalized.includes("record")) return "upload";
  if (normalized.includes("create") || normalized.includes("add")) return "plus";
  if (normalized.includes("setting")) return "settings";
  return "refresh";
}

function toProject(row: DbProjectRow): Project {
  const orderedStages = [...(row.project_stages ?? [])].sort((a, b) => a.stage_number - b.stage_number);
  const currentStage =
    orderedStages.find((stage) => stage.status !== "completed" && stage.status !== "not_applicable") ??
    orderedStages[0];

  return {
    id: row.id,
    code: projectCode(row.name),
    name: row.name,
    reference: row.reference,
    description: row.description || row.site_address || "No description saved",
    maincon: row.maincon || "Not set",
    pic: row.person_in_charge || "Not set",
    step: currentStage?.stage_number ?? 1,
    stage: currentStage?.name ?? stageTemplates[0][0],
    progress: row.progress ?? 0,
    target: formatDate(row.target_completion_date),
    start: formatDate(row.start_date),
    records: row.records?.length ?? 0,
    active: row.status !== "completed",
    createdAt: row.created_at ?? undefined,
  };
}

function toRecord(row: DbRecordRow): RecordItem {
  const project = firstNested(row.projects);
  const stage = firstNested(row.project_stages);
  const uploader = firstNested(row.profiles);

  return {
    id: row.id,
    name: row.file_name,
    size: bytesLabel(row.size_bytes),
    project: project?.name ?? "Unknown project",
    projectId: row.project_id,
    stage: stage?.stage_number ? `Step ${stage.stage_number} · ${stage.name ?? "Stage"}` : "Project record",
    stageId: row.stage_id,
    stageNumber: stage?.stage_number ?? undefined,
    category: row.category ?? "Other Record",
    revision: `Rev ${row.revision ?? 1}`,
    date: dateTimeLabel(row.created_at),
    uploader: uploader?.email ?? uploader?.full_name ?? "server sync",
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes ?? undefined,
  };
}

function toReminder(row: DbReminderRow): ReminderItem {
  const project = firstNested(row.projects);
  const stage = firstNested(row.project_stages);
  const completed = Boolean(row.completed_at);

  return {
    id: row.id,
    title: row.title,
    project: project?.name ?? "Unknown project",
    projectId: row.project_id,
    stage: stage?.stage_number ? `Step ${stage.stage_number} · ${stage.name ?? "Stage"}` : "Project reminder",
    stageId: row.stage_id,
    stageNumber: stage?.stage_number ?? undefined,
    dueDate: row.due_date,
    status: reminderStatus(row.due_date, completed),
    completed,
  };
}

function toTeamMember(row: DbTeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    active: row.active,
    lastSeen: row.last_seen_label ?? dateTimeLabel(row.updated_at),
  };
}

function toActivity(row: DbActivityRow): ActivityItem {
  const actor = firstNested(row.profiles);
  return {
    id: row.id,
    action: row.action,
    detail: row.subject,
    date: dateTimeLabel(row.created_at),
    type: activityType(row.action),
    actor: actor?.email ?? actor?.full_name ?? "server sync",
  };
}

function toSettings(row: DbSettingsRow | null | undefined): SettingsState {
  return {
    companyName: row?.company_name ?? "PlumbTrack Contractor",
    fileUploadLimitMb: row?.file_upload_limit_mb ?? 25,
    dateFormat: row?.date_format ?? "DD/MM/YYYY",
    followUpDays: row?.follow_up_days ?? 7,
    dataRetention: row?.data_retention ?? "Permanent",
  };
}

function offlineResponse(payload: JsonPayload, message = "SUPABASE_SERVICE_ROLE_KEY is missing. Data is only saved in this browser preview.") {
  return NextResponse.json({
    connected: false,
    message,
    project: payload.data ? null : undefined,
    record: payload.record,
    reminder: payload.reminder,
    teamMember: payload.member,
    settings: payload.settings,
  });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ connected: true, error: message }, { status });
}

async function logActivity(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  action: string,
  subject: string,
  projectId?: string | null,
  stageId?: string | null,
) {
  if (!supabase) return;
  await supabase.from("activity_logs").insert({
    action,
    subject,
    project_id: isUuid(projectId) ? projectId : null,
    stage_id: isUuid(stageId) ? stageId : null,
    after_state: { source: "plumbtrack-api" },
  });
}

async function fetchProject(projectId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("projects").select(projectSelect).eq("id", projectId).single();
  if (error) throw error;
  return toProject(data as DbProjectRow);
}

async function resolveStageId(projectId: string, stageId?: string | null, stageNumber?: number) {
  if (isUuid(stageId)) return stageId;
  if (!stageNumber) return null;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("project_stages")
    .select("id")
    .eq("project_id", projectId)
    .eq("stage_number", stageNumber)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

function revisionNumber(revision: string | undefined) {
  const found = revision?.match(/\d+/)?.[0];
  return found ? Number(found) : 1;
}

async function handleRecordUpload(request: Request) {
  const supabase = getSupabaseAdminClient();
  const form = await request.formData();
  const file = form.get("file");
  const recordJson = form.get("record");
  const record = recordJson ? (JSON.parse(String(recordJson)) as RecordItem) : null;
  const projectId = String(form.get("projectId") ?? record?.projectId ?? "");
  const stageNumber = Number(form.get("stageNumber") ?? record?.stageNumber ?? 0) || undefined;
  const stageId = String(form.get("stageId") ?? record?.stageId ?? "");

  if (!record) return errorResponse("Missing record payload");
  if (!(file instanceof File)) return errorResponse("Missing upload file");
  if (!supabase || !isUuid(projectId)) return NextResponse.json({ connected: false, record });

  const resolvedStageId = await resolveStageId(projectId, stageId, stageNumber);
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  const storagePath = `${projectId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from("project-records").upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return errorResponse(`Storage upload failed: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("records")
    .insert({
      project_id: projectId,
      stage_id: resolvedStageId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      category: record.category || "Other Record",
      revision: revisionNumber(record.revision),
    })
    .select(recordSelect)
    .single();

  if (error) return errorResponse(error.message);
  await logActivity(supabase, "Uploaded file", `${file.name} · ${record.project}`, projectId, resolvedStageId);

  return NextResponse.json({ connected: true, record: toRecord(data as DbRecordRow) });
}

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({
      connected: false,
      message: "SUPABASE_SERVICE_ROLE_KEY is missing. Add it in Vercel to enable server-side Supabase sync.",
    });
  }

  const [projectsResult, recordsResult, remindersResult, teamResult, activitiesResult, settingsResult] =
    await Promise.all([
      supabase.from("projects").select(projectSelect).order("created_at", { ascending: false }),
      supabase.from("records").select(recordSelect).order("created_at", { ascending: false }),
      supabase.from("reminders").select(reminderSelect).order("due_date", { ascending: true }),
      supabase.from("team_members").select("*").order("created_at", { ascending: true }),
      supabase.from("activity_logs").select(activitySelect).order("created_at", { ascending: false }).limit(80),
      supabase.from("settings").select("*").eq("id", true).maybeSingle(),
    ]);

  if (projectsResult.error) return errorResponse(`Projects table read failed: ${projectsResult.error.message}`);
  if (recordsResult.error) return errorResponse(`Records table read failed: ${recordsResult.error.message}`);
  if (remindersResult.error) return errorResponse(`Reminders table read failed: ${remindersResult.error.message}`);

  const optionalErrors = [teamResult.error, activitiesResult.error, settingsResult.error]
    .filter(Boolean)
    .map((error) => error!.message);

  return NextResponse.json({
    connected: true,
    message: optionalErrors.length
      ? `Supabase connected. Optional setup needed: ${optionalErrors.join(" | ")}`
      : "Supabase service sync connected.",
    projects: ((projectsResult.data ?? []) as DbProjectRow[]).map(toProject),
    records: ((recordsResult.data ?? []) as DbRecordRow[]).map(toRecord),
    reminders: ((remindersResult.data ?? []) as DbReminderRow[]).map(toReminder),
    teamMembers: teamResult.error ? [] : ((teamResult.data ?? []) as DbTeamMemberRow[]).map(toTeamMember),
    activities: activitiesResult.error ? [] : ((activitiesResult.data ?? []) as DbActivityRow[]).map(toActivity),
    settings: settingsResult.error ? undefined : toSettings(settingsResult.data as DbSettingsRow | null),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) return handleRecordUpload(request);

  const payload = (await request.json()) as JsonPayload;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return offlineResponse(payload);

  if (payload.action === "createProject") {
    if (!payload.data) return errorResponse("Missing project form data");
    const data = payload.data;
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
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message);
    const projectId = (savedProject as { id: string }).id;
    const stageRows = stageTemplates.map(([name, description], index) => {
      const noTemporaryWater = data.temporaryWater === "no" && index === 1;
      const noPublicSewer = data.publicSewer === "no" && (index === 3 || index === 5);
      const notApplicable = noTemporaryWater || noPublicSewer;
      return {
        project_id: projectId,
        stage_number: index + 1,
        name,
        description,
        status: notApplicable ? "not_applicable" : index === 0 ? "waiting_approval" : "not_started",
        applicable: !notApplicable,
      };
    });

    const { error: stageError } = await supabase.from("project_stages").insert(stageRows);
    if (stageError) return errorResponse(`Project saved, stage setup failed: ${stageError.message}`);

    await logActivity(supabase, "Created project", `${data.name.toUpperCase()} · ${data.reference}`, projectId);
    const project = await fetchProject(projectId);
    return NextResponse.json({ connected: true, project });
  }

  if (payload.action === "updateProject") {
    if (!isUuid(payload.id)) return NextResponse.json({ connected: false });
    const patch = payload.patch ?? {};
    const dbPatch: Record<string, unknown> = {};
    if (patch.progress !== undefined) dbPatch.progress = patch.progress;
    if (patch.active !== undefined) dbPatch.status = patch.active ? "active" : "completed";
    if (Object.keys(dbPatch).length === 0) return NextResponse.json({ connected: true });

    const { error } = await supabase.from("projects").update(dbPatch).eq("id", payload.id);
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Updated project", `Project ${payload.id}`, String(payload.id));
    const project = await fetchProject(String(payload.id));
    return NextResponse.json({ connected: true, project });
  }

  if (payload.action === "deleteProject") {
    if (!isUuid(payload.id)) return NextResponse.json({ connected: false, deleted: payload.id });
    await logActivity(supabase, "Deleted project", payload.name ?? `Project ${payload.id}`, String(payload.id));
    const { error } = await supabase.from("projects").delete().eq("id", payload.id);
    if (error) return errorResponse(error.message);
    return NextResponse.json({ connected: true, deleted: payload.id });
  }

  if (payload.action === "saveStage") {
    if (!isUuid(payload.projectId) || !payload.stageNumber) return NextResponse.json({ connected: false });
    const { data: stage, error } = await supabase
      .from("project_stages")
      .update({ status: toDbStageStatus(payload.status) })
      .eq("project_id", payload.projectId)
      .eq("stage_number", payload.stageNumber)
      .select("id,name")
      .single();
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Updated stage", `${(stage as { name?: string }).name ?? "Stage"} · ${payload.projectId}`, String(payload.projectId), (stage as { id?: string }).id);
    return NextResponse.json({ connected: true });
  }

  if (payload.action === "saveRecord") {
    const record = payload.record;
    if (!record) return errorResponse("Missing record");
    const projectId = record.projectId;
    if (!isUuid(projectId)) return NextResponse.json({ connected: false, record });
    const stageId = await resolveStageId(projectId, record.stageId, record.stageNumber);
    const storagePath = record.storagePath || `${projectId}/${Date.now()}-${record.name}`;
    const row = {
      id: isUuid(record.id) ? record.id : randomUUID(),
      project_id: projectId,
      stage_id: stageId,
      storage_path: storagePath,
      file_name: record.name,
      mime_type: record.mimeType || "application/octet-stream",
      size_bytes: record.sizeBytes ?? 0,
      category: record.category || "Other Record",
      revision: revisionNumber(record.revision),
    };

    const { data, error } = await supabase.from("records").upsert(row, { onConflict: "id" }).select(recordSelect).single();
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Saved record", `${record.name} · ${record.project}`, projectId, stageId);
    return NextResponse.json({ connected: true, record: toRecord(data as DbRecordRow) });
  }

  if (payload.action === "deleteRecord") {
    if (!isUuid(payload.id)) return NextResponse.json({ connected: false, deleted: payload.id });
    const { data: existing } = await supabase
      .from("records")
      .select("storage_path,file_name,project_id,stage_id")
      .eq("id", payload.id)
      .maybeSingle();
    const record = existing as { storage_path?: string; file_name?: string; project_id?: string; stage_id?: string | null } | null;
    if (record?.storage_path) await supabase.storage.from("project-records").remove([record.storage_path]);
    const { error } = await supabase.from("records").delete().eq("id", payload.id);
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Deleted record", payload.name ?? record?.file_name ?? `Record ${payload.id}`, record?.project_id, record?.stage_id);
    return NextResponse.json({ connected: true, deleted: payload.id });
  }

  if (payload.action === "saveReminder") {
    const reminder = payload.reminder;
    if (!reminder) return errorResponse("Missing reminder");
    if (!isUuid(reminder.projectId)) return NextResponse.json({ connected: false, reminder });
    const stageId = await resolveStageId(reminder.projectId, reminder.stageId, undefined);
    const id = isUuid(reminder.id) ? reminder.id : randomUUID();
    const { data, error } = await supabase
      .from("reminders")
      .upsert({
        id,
        project_id: reminder.projectId,
        stage_id: stageId,
        title: reminder.title,
        due_date: reminder.dueDate,
        completed_at: reminder.completed ? new Date().toISOString() : null,
      })
      .select(reminderSelect)
      .single();
    if (error) return errorResponse(error.message);
    await logActivity(supabase, reminder.completed ? "Completed reminder" : "Saved reminder", `${reminder.title} · ${reminder.project}`, reminder.projectId, stageId);
    return NextResponse.json({ connected: true, reminder: toReminder(data as DbReminderRow) });
  }

  if (payload.action === "deleteReminder") {
    if (!isUuid(payload.id)) return NextResponse.json({ connected: false, deleted: payload.id });
    const { error } = await supabase.from("reminders").delete().eq("id", payload.id);
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Deleted reminder", payload.title ?? `Reminder ${payload.id}`);
    return NextResponse.json({ connected: true, deleted: payload.id });
  }

  if (payload.action === "saveTeamMember") {
    const member = payload.member;
    if (!member) return errorResponse("Missing team member");
    const id = isUuid(member.id) ? member.id : randomUUID();
    const role = member.role === "Administrator" ? "Administrator" : "View Only";
    const { data, error } = await supabase
      .from("team_members")
      .upsert({
        id,
        full_name: member.name,
        email: member.email,
        role,
        active: member.active,
        last_seen_label: member.lastSeen || "Just now",
      })
      .select("*")
      .single();
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Added team member", `${member.name} · ${member.email}`);
    return NextResponse.json({ connected: true, teamMember: toTeamMember(data as DbTeamMemberRow) });
  }

  if (payload.action === "deleteTeamMember") {
    if (!payload.id && !payload.email) return errorResponse("Missing team member id");
    const query = supabase.from("team_members").delete();
    const { error } = isUuid(payload.id)
      ? await query.eq("id", payload.id)
      : await query.eq("email", payload.email);
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Deleted team member", payload.email ?? `Team member ${payload.id}`);
    return NextResponse.json({ connected: true, deleted: payload.id ?? payload.email });
  }

  if (payload.action === "saveSettings") {
    const settings = payload.settings;
    if (!settings) return errorResponse("Missing settings");
    const { data, error } = await supabase
      .from("settings")
      .upsert({
        id: true,
        company_name: settings.companyName,
        file_upload_limit_mb: settings.fileUploadLimitMb,
        date_format: settings.dateFormat,
        follow_up_days: settings.followUpDays,
        data_retention: settings.dataRetention,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) return errorResponse(error.message);
    await logActivity(supabase, "Updated settings", settings.companyName);
    return NextResponse.json({ connected: true, settings: toSettings(data as DbSettingsRow) });
  }

  return errorResponse("Unknown PlumbTrack action", 404);
}
