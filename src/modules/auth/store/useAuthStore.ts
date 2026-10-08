import { create } from "zustand";
import { persist } from "zustand/middleware";

// 1. Definimos la interfaz del Usuario basada en tu modelo de Prisma
export interface User {
  id: string;
  name: string;
  email: string;
  whatsappPhone: string;
  role: "USER" | "ADMIN" | "MANAGER"; 
  isActive: boolean;
  areaId: string | null;
  area?: {
    id: string;
    name: string;
  } | null;
}

// 2. Definimos la interfaz del Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

// 3. Creamos el store con persistencia
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Función para iniciar sesión
      login: (userData, token) =>
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        }),

      // Función para cerrar sesión
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage", // Nombre que tendrá en localStorage
      // partialize te permite elegir qué guardar. En este caso guardamos todo.
    },
  ),
);
