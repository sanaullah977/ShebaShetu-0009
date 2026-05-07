import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/lib/role-store";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login";
import PatientDashboard from "./pages/patient/Dashboard";
import SymptomFlow from "./pages/patient/SymptomFlow";
import Booking from "./pages/patient/Booking";
import LiveQueue from "./pages/patient/LiveQueue";
import Appointments from "./pages/patient/Appointments";
import ReportVault from "./pages/patient/ReportVault";
import ReceptionDashboard from "./pages/reception/Dashboard";
import QueueManager from "./pages/reception/QueueManager";
import ReceptionSchedule from "./pages/reception/Schedule";
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorScheduleView from "./pages/doctor/Schedule";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RoleProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Patient */}
            <Route path="/patient"              element={<AppShell><PatientDashboard /></AppShell>} />
            <Route path="/patient/symptom"      element={<AppShell><SymptomFlow /></AppShell>} />
            <Route path="/patient/book"         element={<AppShell><Booking /></AppShell>} />
            <Route path="/patient/queue"        element={<AppShell><LiveQueue /></AppShell>} />
            <Route path="/patient/appointments" element={<AppShell><Appointments /></AppShell>} />
            <Route path="/patient/reports"      element={<AppShell><ReportVault /></AppShell>} />

            {/* Reception */}
            <Route path="/reception"          element={<AppShell><ReceptionDashboard /></AppShell>} />
            <Route path="/reception/queue"    element={<AppShell><QueueManager /></AppShell>} />
            <Route path="/reception/schedule" element={<AppShell><ReceptionSchedule /></AppShell>} />

            {/* Doctor */}
            <Route path="/doctor"          element={<AppShell><DoctorDashboard /></AppShell>} />
            <Route path="/doctor/schedule" element={<AppShell><DoctorScheduleView /></AppShell>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
