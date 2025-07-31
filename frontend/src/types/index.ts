export interface Unit {
  id: number;
  date?: string;
  unitCode: string;
  project?: string;
  type?: string;
  salesStatus?: string;
  clientName?: string;
  blockNo?: string;
  plot?: string;
  floor?: string;
  unitNo?: string;
  bua?: number;
  garden?: number;
  roof?: number;
  outdoor?: number;
  unitPrice?: number;
  contractPrice?: number;
  priceInstallment?: number;
  salesAgent?: string;
  brokerName?: string;
  source?: string;
  address?: string;
  phoneNumber?: string;
  maintenance?: number;
  parking?: string;
  year?: number;
  deliveryDate?: string;
  gracePeriod?: number;
  contractFinishing?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: number;
  reservationCode: string;
  sr?: string;
  reservationDate?: string;
  clientName?: string;
  nationality?: string;
  idPassport?: string;
  dateOfId?: string;
  serialNumOfId?: string;
  address?: string;
  email?: string;
  homeNumber?: string;
  mobileNumber?: string;
  unitCode?: string;
  payment?: number;
  deposit?: number;
  currency?: string;
  paymentMethod?: string;
  depositTransferNumber?: string;
  dateOfDepositTransfer?: string;
  bankName?: string;
  sales?: string;
  salesManager?: string;
  seniorSalesManager?: string;
  cancel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FilterOptions {
  projects: string[];
  types: string[];
  salesStatuses: string[];
  salesAgents: string[];
}

export interface ReservationFilterOptions {
  nationalities: string[];
  currencies: string[];
  paymentMethods: string[];
  salesPeople: string[];
  salesManagers: string[];
}

export interface DashboardStats {
  totalUnits: number;
  soldUnits: number;
  availableUnits: number;
  reservedUnits: number;
  totalValue: number;
  recentUnits: Partial<Unit>[];
}

export interface ImportHistory {
  id: number;
  filename: string;
  recordCount: number;
  importedAt: string;
}

export interface UploadResponse {
  message: string;
  totalRows: number;
  validRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    unitCode: string;
    error: string;
  }>;
} 