import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { DashboardPage } from "./pages/dashboard-page";
import { RoomPage } from "./pages/room-page";
import { ScanPage } from "./pages/scan-page";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="rooms/:roomId" element={<RoomPage />} />
        <Route path="scans/:scanId" element={<ScanPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
