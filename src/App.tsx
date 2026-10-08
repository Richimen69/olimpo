import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts y Guards
import { MainLayout } from "@/shared/components/layout/MainLayout";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";

// Páginas
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { DashboardPage } from "@/modules/knowledge/pages/DashboardPage";
import { AdminUploadPage } from "@/modules/knowledge/pages/AdminUploadPage";
import { AdminCategoriesPage } from "@/modules/knowledge/pages/AdminCategoriesPage";
import { CategoryPage } from "@/modules/knowledge/pages/CategoryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/upload" element={<AdminUploadPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;