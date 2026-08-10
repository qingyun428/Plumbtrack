export type WaterPumpStatus =
  | "Waiting for Quotation"
  | "Comparing Quotation"
  | "Supplier Selected"
  | "PUB Submitted"
  | "PUB Approved"
  | "Site Processing"
  | "Completed";

export type WaterPumpPubStatus =
  | "Not Submitted"
  | "Submitted"
  | "Approved"
  | "Not Required";

export type WaterPumpOption = {
  code: string;
  name: string;
  description: string;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
};

export type WaterPumpProjectPump = {
  id: string;
  optionCode: string;
  optionName: string;
  quantity: number;
  location: string;
  needPub: boolean;
  submittedPub: boolean;
  approvedPub: boolean;
  remark: string;
};

export type WaterPumpQuotation = {
  id: string;
  supplierName: string;
  quoteNumber: string;
  quoteDate: string;
  totalPrice: number | null;
  contactPerson: string;
  contactNumber: string;
  gstStatus: "Not Specified" | "Included" | "Excluded";
  leadTime: string;
  warranty: string;
  remark: string;
  selected: boolean;
};

export type WaterPumpTankDetails = {
  supplyType: string;
  supplierScope: string;
  tankSize: string;
  quantity: number;
  location: string;
  installationFee: number | null;
  boosterPumpQuantity: number;
  remark: string;
};

export type WaterPumpProject = {
  id: string;
  projectNumber: number;
  name: string;
  address: string;
  maincon: string;
  contact: string;
  status: WaterPumpStatus;
  pubStatus: WaterPumpPubStatus;
  updatedLabel: string;
  finalConfirmedPrice: number | null;
  selectedSupplierName: string;
  confirmationDate: string;
  poNumber: string;
  finalRemark: string;
  pumps: WaterPumpProjectPump[];
  quotations: WaterPumpQuotation[];
  tank: WaterPumpTankDetails;
};

export const waterPumpStatuses: WaterPumpStatus[] = [
  "Waiting for Quotation",
  "Comparing Quotation",
  "Supplier Selected",
  "PUB Submitted",
  "PUB Approved",
  "Site Processing",
  "Completed",
];

export const pumpOptionsSeed: WaterPumpOption[] = [
  {
    code: "WT",
    name: "Water Tank Installation + Booster Pump",
    description: "Own supply · Supplier installation",
    isDefault: true,
    active: true,
    sortOrder: 1,
  },
  {
    code: "EP",
    name: "Ejector Pump",
    description: "System default pump option",
    isDefault: true,
    active: true,
    sortOrder: 2,
  },
  {
    code: "ES",
    name: "Ejector Sump Pump",
    description: "System default pump option",
    isDefault: true,
    active: true,
    sortOrder: 3,
  },
  {
    code: "BW",
    name: "Backwash Sump Pump",
    description: "System default pump option",
    isDefault: true,
    active: true,
    sortOrder: 4,
  },
  {
    code: "RW",
    name: "Rainwater Sump Pump",
    description: "System default pump option",
    isDefault: true,
    active: true,
    sortOrder: 5,
  },
  {
    code: "OF",
    name: "Overflow Sump Pump",
    description: "System default pump option",
    isDefault: true,
    active: true,
    sortOrder: 6,
  },
  {
    code: "P+",
    name: "Other Pump",
    description: "Custom pump requirement",
    isDefault: true,
    active: true,
    sortOrder: 7,
  },
];

export const waterPumpProjectsSeed: WaterPumpProject[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    projectNumber: 1,
    name: "36 JALAN INTAN",
    address:
      "PROPOSED NEW ERECTION OF 2-STOREY INTERMEDIATE TERRACED DWELLING HOUSE WITH AN ATTIC ON LOT MK 10-00830C 36 JALAN INSTAN SINGAPORE 668796 (BUKIT BATOK PLANNING AREA)",
    maincon: "Foo Brothers Pte Ltd",
    contact: "—",
    status: "Supplier Selected",
    pubStatus: "Not Submitted",
    updatedLabel: "08 Aug 2026",
    finalConfirmedPrice: 0,
    selectedSupplierName: "Not selected",
    confirmationDate: "2026-02-02",
    poNumber: "—",
    finalRemark: "",
    pumps: [
      {
        id: "00000000-0000-4000-8000-000000000101",
        optionCode: "WT",
        optionName: "Water Tank Installation + Booster Pump",
        quantity: 1,
        location: "1ST U/G",
        needPub: true,
        submittedPub: false,
        approvedPub: false,
        remark: "",
      },
      {
        id: "00000000-0000-4000-8000-000000000102",
        optionCode: "OF",
        optionName: "Overflow Sump Pump",
        quantity: 1,
        location: "Pump Room",
        needPub: false,
        submittedPub: false,
        approvedPub: false,
        remark: "",
      },
    ],
    quotations: [
      {
        id: "00000000-0000-4000-8000-000000000201",
        supplierName: "BNW",
        quoteNumber: "—",
        quoteDate: "2026-02-02",
        totalPrice: null,
        contactPerson: "BEN",
        contactNumber: "",
        gstStatus: "Excluded",
        leadTime: "",
        warranty: "",
        remark: "",
        selected: false,
      },
    ],
    tank: {
      supplyType: "Own Company Supply / Manufacture",
      supplierScope: "Installation + Booster Pump",
      tankSize: "1M X 1M X 1M",
      quantity: 1,
      location: "1ST U/G",
      installationFee: null,
      boosterPumpQuantity: 1,
      remark: "",
    },
  },
];

export function moneyLabel(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function derivePumpPubStatus(pump: WaterPumpProjectPump): WaterPumpPubStatus {
  if (!pump.needPub) return "Not Required";
  if (pump.approvedPub) return "Approved";
  if (pump.submittedPub) return "Submitted";
  return "Not Submitted";
}

export function deriveProjectPubStatus(project: WaterPumpProject): WaterPumpPubStatus {
  const pubPumps = project.pumps.filter((pump) => pump.needPub);
  if (pubPumps.length === 0) return "Not Required";
  if (pubPumps.every((pump) => pump.approvedPub)) return "Approved";
  if (pubPumps.some((pump) => pump.submittedPub)) return "Submitted";
  return "Not Submitted";
}

export function createBlankWaterPumpProject(nextNumber: number): WaterPumpProject {
  return {
    id: `local-${Date.now()}`,
    projectNumber: nextNumber,
    name: "",
    address: "",
    maincon: "",
    contact: "",
    status: "Waiting for Quotation",
    pubStatus: "Not Submitted",
    updatedLabel: dateLabel(new Date().toISOString().slice(0, 10)),
    finalConfirmedPrice: null,
    selectedSupplierName: "Not selected",
    confirmationDate: "",
    poNumber: "",
    finalRemark: "",
    pumps: [],
    quotations: [],
    tank: {
      supplyType: "Own Company Supply / Manufacture",
      supplierScope: "Installation + Booster Pump",
      tankSize: "",
      quantity: 1,
      location: "",
      installationFee: null,
      boosterPumpQuantity: 1,
      remark: "",
    },
  };
}
