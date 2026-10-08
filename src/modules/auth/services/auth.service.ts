import { fetchJSON, API_URL } from "@/core/http";

export const loginUser = async (email: string, password: string) => {
  try {
    const res = await fetchJSON(`${API_URL}/login`, "POST", { email, password });
    
    const responseData = res.data ? res.data : res;

    // Ya no usamos localStorage aquí. Devolvemos la data completa.
    return { success: true, data: responseData };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.error || "Error de conexión con el servidor",
    };
  }
};

export const createVehicle = async (data: any) => {
  return await fetchJSON(`${API_URL}/knowledge/vehicles`, "POST", data);
};

export const deleteVehicle = async (id: string) => {
  return await fetchJSON(`${API_URL}/knowledge/vehicles/${id}`, "DELETE");
};