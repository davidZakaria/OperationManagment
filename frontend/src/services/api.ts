import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Unit, Reservation, ApiResponse, FilterOptions, ReservationFilterOptions, DashboardStats, ImportHistory, UploadResponse } from '../types';

const API_BASE = (window as any).env?.REACT_APP_API_BASE || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const unitsApi = {
  // Get all units with filtering and pagination
  getUnits: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    project?: string;
    type?: string;
    salesStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Unit[]>> => {
    const response = await api.get('/units', { params });
    return response.data;
  },

  // Get single unit by ID
  getUnit: async (id: number): Promise<Unit> => {
    const response = await api.get(`/units/${id}`);
    return response.data;
  },

  // Create new unit
  createUnit: async (unit: Partial<Unit>): Promise<Unit> => {
    const response = await api.post('/units', unit);
    return response.data;
  },

  // Update unit
  updateUnit: async (id: number, unit: Partial<Unit>): Promise<Unit> => {
    const response = await api.put(`/units/${id}`, unit);
    return response.data;
  },

  // Delete unit
  deleteUnit: async (id: number): Promise<void> => {
    await api.delete(`/units/${id}`);
  },

  // Get filter options
  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await api.get('/units/filters');
    return response.data;
  },

  // Export units to Excel
  exportUnits: async (params?: {
    search?: string;
    project?: string;
    type?: string;
    salesStatus?: string;
  }): Promise<Blob> => {
    const response = await api.get('/units/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/units/stats/dashboard');
    return response.data;
  },
};

export const reservationsApi = {
  // Get all reservations with filtering and pagination
  getReservations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    nationality?: string;
    currency?: string;
    paymentMethod?: string;
    sales?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<Reservation[]>> => {
    const response = await api.get('/reservations', { params });
    return response.data;
  },

  // Get single reservation by ID
  getReservation: async (id: number): Promise<Reservation> => {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  },

  // Create new reservation
  createReservation: async (reservation: Partial<Reservation>): Promise<Reservation> => {
    const response = await api.post('/reservations', reservation);
    return response.data;
  },

  // Update reservation
  updateReservation: async (id: number, reservation: Partial<Reservation>): Promise<Reservation> => {
    const response = await api.put(`/reservations/${id}`, reservation);
    return response.data;
  },

  // Delete reservation
  deleteReservation: async (id: number): Promise<void> => {
    await api.delete(`/reservations/${id}`);
  },

  // Get filter options
  getFilterOptions: async (): Promise<ReservationFilterOptions> => {
    const response = await api.get('/reservations/filters');
    return response.data;
  },

  // Export reservations to Excel
  exportReservations: async (params?: {
    search?: string;
    nationality?: string;
    currency?: string;
    paymentMethod?: string;
    sales?: string;
  }): Promise<Blob> => {
    const response = await api.get('/reservations/export/excel', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<any> => {
    const response = await api.get('/reservations/stats/dashboard');
    return response.data;
  },
};

export const uploadApi = {
  // Upload Excel file
  uploadFile: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // Get upload history
  getUploadHistory: async (): Promise<ImportHistory[]> => {
    const response = await api.get('/upload/history');
    return response.data;
  },
};

export const uploadReservationsApi = {
  // Upload Excel file for reservations
  uploadFile: async (file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload-reservations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // Get upload history
  getUploadHistory: async (): Promise<ImportHistory[]> => {
    const response = await api.get('/upload-reservations/history');
    return response.data;
  },
};

export const healthApi = {
  // Health check
  checkHealth: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const formTemplatesApi = {
  // Get all templates
  getTemplates: async (): Promise<any> => {
    const response = await api.get('/form-templates');
    return response.data;
  },

  // Get single template
  getTemplate: async (id: number): Promise<any> => {
    const response = await api.get(`/form-templates/${id}`);
    return response.data;
  },

  // Create new template
  createTemplate: async (templateData: any): Promise<any> => {
    const response = await api.post('/form-templates', templateData);
    return response.data;
  },

  // Update template
  updateTemplate: async (id: number, templateData: any): Promise<any> => {
    const response = await api.put(`/form-templates/${id}`, templateData);
    return response.data;
  },

  // Delete template
  deleteTemplate: async (id: number): Promise<any> => {
    const response = await api.delete(`/form-templates/${id}`);
    return response.data;
  },

  // Create default template
  createDefaultTemplate: async (): Promise<any> => {
    const response = await api.post('/form-templates/create-default');
    return response.data;
  },
};

export const formGenerationApi = {
  // Search reservations for form generation
  searchReservations: async (params?: { search?: string; limit?: number }): Promise<any> => {
    const response = await api.get('/form-generation/search-reservations', { params });
    return response.data;
  },

  // Merge reservation and unit data
  mergeData: async (reservationCode: string, unitCode: string): Promise<any> => {
    const response = await api.get(`/form-generation/merge-data/${reservationCode}/${unitCode}`);
    return response.data;
  },

  // Populate template with data
  populateTemplate: async (templateId: number, reservationCode: string, unitCode: string): Promise<any> => {
    const response = await api.post('/form-generation/populate-template', {
      templateId,
      reservationCode,
      unitCode
    });
    return response.data;
  },

  // Generate a new form
  generateForm: async (templateId: number, reservationCode: string, unitCode: string, generatedBy?: string): Promise<any> => {
    const response = await api.post('/form-generation/generate', {
      templateId,
      reservationCode,
      unitCode,
      generatedBy
    });
    return response.data;
  },

  // Get all generated forms
  getForms: async (params?: { status?: string; limit?: number }): Promise<any> => {
    const response = await api.get('/form-generation/forms', { params });
    return response.data;
  },

  // Get single generated form
  getForm: async (id: number): Promise<any> => {
    const response = await api.get(`/form-generation/forms/${id}`);
    return response.data;
  },

  // Update generated form
  updateForm: async (id: number, formData: any, status?: string): Promise<any> => {
    const response = await api.put(`/form-generation/forms/${id}`, { formData, status });
    return response.data;
  },

  // Mark form as printed
  markPrinted: async (id: number): Promise<any> => {
    const response = await api.post(`/form-generation/forms/${id}/mark-printed`);
    return response.data;
  },
};

export default api; 