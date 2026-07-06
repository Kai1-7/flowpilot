import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ArtifactPage } from "./pages/ArtifactPage";
import { AutomationBuilderPage } from "./pages/AutomationBuilderPage";
import { AutomationDetailPage } from "./pages/AutomationDetailPage";
import { AutomationsPage } from "./pages/AutomationsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RunsPage } from "./pages/RunsPage";
import { TemplatesPage } from "./pages/TemplatesPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<DashboardPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="automations/new" element={<AutomationBuilderPage />} />
        <Route path="automations/:id" element={<AutomationDetailPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="runs" element={<RunsPage />} />
        <Route path="runs/:id" element={<RunsPage />} />
        <Route path="artifacts" element={<ArtifactPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
