import { fetchJSON, API_URL } from "@/core/http";

export const getUploadUrl = async (fileName: string, fileType: string) => {
  return await fetchJSON(`${API_URL}/knowledge/upload-url`, "POST", { fileName, fileType });
};

export const createDocument = async (documentData: any) => {
  return await fetchJSON(`${API_URL}/knowledge/documents`, "POST", documentData);
};

export const getDocuments = async (categoryId?: string) => {
  const query = categoryId ? `?categoryId=${categoryId}` : "";
  return await fetchJSON(`${API_URL}/knowledge/documents${query}`, "GET");
};

export const getSidebarMenu = async () => {
  return await fetchJSON(`${API_URL}/knowledge/sidebar-menu`, "GET");
};

export const getCategoryById = async (id: string) => {
  return await fetchJSON(`${API_URL}/knowledge/categories/${id}`, "GET");
};

export const createCategory = async (data: any) => {
  return await fetchJSON(`${API_URL}/knowledge/categories`, "POST", data);
};

export const updateCategory = async (id: string, data: any) => {
  return await fetchJSON(`${API_URL}/knowledge/categories/${id}`, "PUT", data);
};

export const deleteCategory = async (id: string) => {
  return await fetchJSON(`${API_URL}/knowledge/categories/${id}`, "DELETE");
};
export const deleteDocument = async (id: string) => {
  return await fetchJSON(`${API_URL}/knowledge/documents/${id}`, "DELETE");
};
export const searchKnowledge = async (query: string) => {
  return await fetchJSON(`${API_URL}/knowledge/search?q=${query}`, "GET");
};
export const createVehicle = async (data: any) => {
  return await fetchJSON(`${API_URL}/knowledge/vehicles`, "POST", data);
};
export const getVehiclesByCategory = async (categoryId: string) => {
  return await fetchJSON(`${API_URL}/knowledge/vehicles/category?categoryId=${categoryId}`, "GET");
};

export const updateVehicle = async (id: string, data: any) => {
  return await fetchJSON(`${API_URL}/knowledge/vehicles/${id}`, "PUT", data);
};
export const getVehicles = async (categoryId?: string) => {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return await fetchJSON(`${API_URL}/knowledge/vehicles${query}`, "GET");
};

export const updateDocument = async (id: string, data: any) => {
  return await fetchJSON(`${API_URL}/knowledge/documents/${id}`, "PUT", data);
};