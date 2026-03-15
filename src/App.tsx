import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";
import AirportSelection from "@/pages/AirportSelection";
import Dashboard from "@/pages/Dashboard";
import MapView from "@/pages/MapView";
import InspectionForm from "@/pages/InspectionForm";
import OverpassImport from "@/pages/OverpassImport";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AirportSelection />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/inspect" element={<InspectionForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
