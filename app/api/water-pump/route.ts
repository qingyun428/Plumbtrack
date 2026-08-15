import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  deriveProjectPubStatus,
  pumpOptionsSeed,
  waterPumpProjectsSeed,
  type WaterPumpOption,
  type WaterPumpProject,
  type WaterPumpProjectPump,
  type WaterPumpQuotation,
  type WaterPumpTankDetails,
} from "@/lib/water-pump-data";

export const runtime = "nodejs";

type DbOption = {
  code: string;
  name: string;
  description: string | null;
  is_default: boolean;
  active: boolean;
  sort_order: number;
};

type DbPump = {
  id: string;
  option_code: string;
  option_name: string;
  quantity: number | null;
  location: string | null;
  need_pub: boolean;
  submitted_pub: boolean;
  approved_pub: boolean;
  remark: string | null;
};

type DbQuotation = {
  id: string;
  supplier_name: string;
  quote_number: string | null;
  quote_date: string | null;
  total_price: number | null;
  contact_person: string | null;
  contact_number: string | null;
  gst_status: "Not Specified" | "Included" | "Excluded" | null;
  lead_time: string | null;
  warranty: string | null;
  remark: string | null;
  selected: boolean;
};

type DbTank = {
  supply_type: string | null;
  supplier_scope: string | null;
  tank_size: string | null;
  quantity: number | null;
  location: string | null;
  installation_fee: number | null;
  booster_pump_quantity: number | null;
  remark: string | null;
};

type DbProject = {
  id: string;
  project_number: number;
  name: string;
  address: string | null;
  maincon: string | null;
  contact: string | null;
  status: WaterPumpProject["status"];
  pub_status: WaterPumpProject["pubStatus"];
  updated_label: string | null;
  final_confirmed_price: number | null;
  selected_supplier_name: string | null;
  confirmation_date: string | null;
  po_number: string | null;
  final_remark: string | null;
  pumps?: DbPump[] | null;
  quotations?: DbQuotation[] | null;
  tank?: DbTank[] | DbTank | null;
};

type ApiPayload =
  | { action: "saveProject"; project: WaterPumpProject }
  | { action: "saveOption"; option: WaterPumpOption }
  | { action: "toggleOption"; code: string; active: boolean }
  | { action: "deleteOption"; code: string };

const projectSelect = `
  *,
  pumps:water_pump_project_pumps(*),
  quotations:water_pump_quotations(*),
  tank:water_pump_tank_details(*)
`;

function fallbackResponse(message?: string) {
  return NextResponse.json({
    connected: false,
    source: "preview",
    message:
      message ??
      "SUPABASE_SERVICE_ROLE_KEY is missing, so Water Pump is using bundled preview data.",
    options: pumpOptionsSeed,
    projects: waterPumpProjectsSeed,
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeText(value: string | null | undefined, fallback = "") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function toOption(row: DbOption): WaterPumpOption {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? "",
    isDefault: row.is_default,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

function toPump(row: DbPump): WaterPumpProjectPump {
  return {
    id: row.id,
    optionCode: row.option_code,
    optionName: row.option_name,
    quantity: row.quantity ?? 1,
    location: row.location ?? "",
    needPub: row.need_pub,
    submittedPub: row.submitted_pub,
    approvedPub: row.approved_pub,
    remark: row.remark ?? "",
  };
}

function toQuotation(row: DbQuotation): WaterPumpQuotation {
  return {
    id: row.id,
    supplierName: row.supplier_name,
    quoteNumber: row.quote_number ?? "",
    quoteDate: row.quote_date ?? "",
    totalPrice: row.total_price,
    contactPerson: row.contact_person ?? "",
    contactNumber: row.contact_number ?? "",
    gstStatus: row.gst_status ?? "Not Specified",
    leadTime: row.lead_time ?? "",
    warranty: row.warranty ?? "",
    remark: row.remark ?? "",
    selected: row.selected,
  };
}

function toTank(row: DbTank | null | undefined): WaterPumpTankDetails {
  return {
    supplyType: row?.supply_type ?? "Own Company Supply / Manufacture",
    supplierScope: row?.supplier_scope ?? "Installation + Booster Pump",
    tankSize: row?.tank_size ?? "",
    quantity: row?.quantity ?? 1,
    location: row?.location ?? "",
    installationFee: row?.installation_fee ?? null,
    boosterPumpQuantity: row?.booster_pump_quantity ?? 1,
    remark: row?.remark ?? "",
  };
}

function toProject(row: DbProject): WaterPumpProject {
  const tankRow = Array.isArray(row.tank) ? row.tank[0] : row.tank;
  return {
    id: row.id,
    projectNumber: row.project_number,
    name: row.name,
    address: row.address ?? "",
    maincon: row.maincon ?? "",
    contact: row.contact ?? "",
    status: row.status,
    pubStatus: row.pub_status,
    updatedLabel: row.updated_label ?? "",
    finalConfirmedPrice: row.final_confirmed_price,
    selectedSupplierName: row.selected_supplier_name ?? "Not selected",
    confirmationDate: row.confirmation_date ?? "",
    poNumber: row.po_number ?? "",
    finalRemark: row.final_remark ?? "",
    pumps: (row.pumps ?? []).map(toPump),
    quotations: (row.quotations ?? []).map(toQuotation),
    tank: toTank(tankRow),
  };
}

async function fetchProject(id: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("water_pump_projects")
    .select(projectSelect)
    .eq("id", id)
    .single();

  if (error) throw error;
  return toProject(data as DbProject);
}

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return fallbackResponse();

  const [optionsResult, projectsResult] = await Promise.all([
    supabase
      .from("water_pump_options")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("water_pump_projects")
      .select(projectSelect)
      .order("project_number", { ascending: true }),
  ]);

  if (optionsResult.error || projectsResult.error) {
    const message =
      optionsResult.error?.message ??
      projectsResult.error?.message ??
      "Water Pump database tables are not available.";
    return fallbackResponse(message);
  }

  return NextResponse.json({
    connected: true,
    source: "supabase",
    message: "Database connected",
    options: ((optionsResult.data ?? []) as DbOption[]).map(toOption),
    projects: ((projectsResult.data ?? []) as DbProject[]).map(toProject),
  });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  const payload = (await request.json()) as ApiPayload;

  if (!supabase) {
    return NextResponse.json({
      connected: false,
      source: "preview",
      message: "Saved locally only. Add SUPABASE_SERVICE_ROLE_KEY to save in Supabase.",
      project: "project" in payload ? payload.project : null,
      option: "option" in payload ? payload.option : null,
    });
  }

  if (payload.action === "saveOption") {
    const option = payload.option;
    const { error } = await supabase.from("water_pump_options").upsert({
      code: option.code,
      name: option.name,
      description: option.description,
      is_default: option.isDefault,
      active: option.active,
      sort_order: option.sortOrder,
    });

    if (error) return NextResponse.json({ connected: true, error: error.message }, { status: 400 });
    return NextResponse.json({ connected: true, option });
  }

  if (payload.action === "toggleOption") {
    const { error } = await supabase
      .from("water_pump_options")
      .update({ active: payload.active })
      .eq("code", payload.code);

    if (error) return NextResponse.json({ connected: true, error: error.message }, { status: 400 });
    return NextResponse.json({ connected: true });
  }

  if (payload.action === "deleteOption") {
    const { error } = await supabase
      .from("water_pump_options")
      .delete()
      .eq("code", payload.code)
      .eq("is_default", false);

    if (error) return NextResponse.json({ connected: true, error: error.message }, { status: 400 });
    return NextResponse.json({ connected: true, deleted: payload.code });
  }

  const project = payload.project;
  const projectId = isUuid(project.id) ? project.id : randomUUID();
  const pubStatus = deriveProjectPubStatus(project);
  const selectedQuotation = project.quotations.find((quotation) => quotation.selected);

  const { error: projectError } = await supabase.from("water_pump_projects").upsert({
    id: projectId,
    project_number: project.projectNumber,
    name: normalizeText(project.name, "UNTITLED PROJECT"),
    address: project.address,
    maincon: project.maincon,
    contact: project.contact,
    status: project.status,
    pub_status: pubStatus,
    updated_label: project.updatedLabel,
    final_confirmed_price: project.finalConfirmedPrice,
    selected_supplier_name: selectedQuotation?.supplierName ?? project.selectedSupplierName,
    confirmation_date: normalizeText(project.confirmationDate) || null,
    po_number: project.poNumber,
    final_remark: project.finalRemark,
  });

  if (projectError) {
    return NextResponse.json({ connected: true, error: projectError.message }, { status: 400 });
  }

  const childTables = [
    "water_pump_project_pumps",
    "water_pump_quotations",
  ] as const;

  for (const table of childTables) {
    const { error } = await supabase.from(table).delete().eq("project_id", projectId);
    if (error) return NextResponse.json({ connected: true, error: error.message }, { status: 400 });
  }

  const pumpRows = project.pumps.map((pump, index) => ({
    id: isUuid(pump.id) ? pump.id : randomUUID(),
    project_id: projectId,
    option_code: pump.optionCode,
    option_name: pump.optionName,
    quantity: pump.quantity,
    location: pump.location,
    need_pub: pump.needPub,
    submitted_pub: pump.submittedPub,
    approved_pub: pump.approvedPub,
    remark: pump.remark,
    sort_order: index + 1,
  }));

  if (pumpRows.length > 0) {
    const { error } = await supabase.from("water_pump_project_pumps").insert(pumpRows);
    if (error) return NextResponse.json({ connected: true, error: error.message }, { status: 400 });
  }

  const quotationRows = project.quotations.map((quotation, index) => ({
    id: isUuid(quotation.id) ? quotation.id : randomUUID(),
    project_id: projectId,
    supplier_name: normalizeText(quotation.supplierName, "Unnamed Supplier"),
    quote_number: quotation.quoteNumber,
    quote_date: normalizeText(quotation.quoteDate) || null,
    total_price: quotation.totalPrice,
    contact_person: quotation.contactPerson,
    contact_number: quotation.contactNumber,
    gst_status: quotation.gstStatus,
    lead_time: quotation.leadTime,
    warranty: quotation.warranty,
    remark: quotation.remark,
    selected: quotation.selected,
    sort_order: index + 1,
  }));

  if (quotationRows.length > 0) {
    const { error } = await supabase.from("water_pump_quotations").insert(quotationRows);
    if (error) return NextResponse.json({ connected: true, error: error.message }, { status: 400 });
  }

  const { error: tankError } = await supabase.from("water_pump_tank_details").upsert({
    project_id: projectId,
    supply_type: project.tank.supplyType,
    supplier_scope: project.tank.supplierScope,
    tank_size: project.tank.tankSize,
    quantity: project.tank.quantity,
    location: project.tank.location,
    installation_fee: project.tank.installationFee,
    booster_pump_quantity: project.tank.boosterPumpQuantity,
    remark: project.tank.remark,
  });

  if (tankError) return NextResponse.json({ connected: true, error: tankError.message }, { status: 400 });

  const savedProject = await fetchProject(projectId);
  return NextResponse.json({ connected: true, project: savedProject });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ connected: false, deleted: id });

  const { error } = await supabase.from("water_pump_projects").delete().eq("id", id);
  if (error) return NextResponse.json({ connected: true, error: error.message }, { status: 400 });

  return NextResponse.json({ connected: true, deleted: id });
}
