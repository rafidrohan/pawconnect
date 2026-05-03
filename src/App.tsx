import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import MyPets from "./pages/MyPets";
import PetProfile from "./pages/PetProfile";
import AddPet from "./pages/AddPet";
import ReportPet from "./pages/ReportPet";
import ViewMatches from "./pages/ViewMatches";
import MyCases from "./pages/MyCases";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CaseDetails from "./pages/CaseDetails";
import EditPet from "./pages/EditPet";
import PublicCases from "./pages/PublicCases";

import { AuthGuard } from "@/components/features/auth/AuthGuard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/cases" element={<PublicCases isPublicView={true} />} />
        <Route path="/cases/:id" element={<CaseDetails isPublicView={true} />} />
        
        <Route path="/app" element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-pets" element={<MyPets />} />
          <Route path="my-pets/add" element={<AddPet />} />
          <Route path="my-pets/edit/:id" element={<EditPet />} />
          <Route path="my-pets/:id" element={<PetProfile />} />
          <Route path="report/:type" element={<ReportPet />} />
          <Route path="matches" element={<ViewMatches />} />
          <Route path="cases" element={<MyCases />} />
          <Route path="cases/active" element={<PublicCases isPublicView={false} />} />
          <Route path="cases/:id" element={<CaseDetails />} />
          <Route path="notifications" element={<Notifications />} />
          <Route 
            path="analytics" 
            element={
              JSON.parse(localStorage.getItem("user") || "{}").role?.toUpperCase() === "ADMIN" 
                ? <Analytics /> 
                : <Navigate to="/app/dashboard" replace />
            } 
          />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
