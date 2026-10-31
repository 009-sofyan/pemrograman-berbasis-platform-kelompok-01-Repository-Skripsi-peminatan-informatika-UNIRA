import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoadingScreen } from "./components/ui/LoadingScreen";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const RepositoryPage = lazy(() => import("./pages/RepositoryPage"));
const SkripsiDetailPage = lazy(() => import("./pages/SkripsiDetailPage"));
const PengajuanPage = lazy(() => import("./pages/PengajuanPage"));
const PeminatanPage = lazy(() => import("./pages/PeminatanPage"));
const PersetujuanPage = lazy(() => import("./pages/PersetujuanPage"));
const MahasiswaPage = lazy(() => import("./pages/MahasiswaPage"));
const PemetaanPage = lazy(() => import("./pages/PemetaanPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ImageCreditsPage = lazy(() => import("./pages/ImageCreditsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen label="Memuat halaman…" />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/credits" element={<ImageCreditsPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
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
    </Suspense>
  );
}
