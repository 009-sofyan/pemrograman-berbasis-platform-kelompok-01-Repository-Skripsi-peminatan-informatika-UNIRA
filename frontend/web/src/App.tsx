import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ROLE_LANDING } from "./constants";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import RepositoryPage from "./pages/RepositoryPage";
import SkripsiDetailPage from "./pages/SkripsiDetailPage";
import PengajuanPage from "./pages/PengajuanPage";
import PeminatanPage from "./pages/PeminatanPage";
import PersetujuanPage from "./pages/PersetujuanPage";
import MahasiswaPage from "./pages/MahasiswaPage";
import PemetaanPage from "./pages/PemetaanPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_LANDING[user.role]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/repository" element={<RepositoryPage />} />
          <Route path="/repository/:id" element={<SkripsiDetailPage />} />
          <Route path="/profil" element={<ProfilePage />} />

          <Route element={<ProtectedRoute roles={["mahasiswa"]} />}>
            <Route path="/pengajuan" element={<PengajuanPage />} />
            <Route path="/peminatan" element={<PeminatanPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["kaprodi"]} />}>
            <Route path="/persetujuan" element={<PersetujuanPage />} />
            <Route path="/pemetaan" element={<PemetaanPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["tendik"]} />}>
            <Route path="/mahasiswa" element={<MahasiswaPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
