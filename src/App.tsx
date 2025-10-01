import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import InvestorCRM from "./pages/InvestorCRM";
import TermSheetChecker from "./pages/tools/TermSheetChecker";
import MetricBenchmarks from "./pages/tools/MetricBenchmarks";
import SafeCalculator from "./pages/tools/SafeCalculator";
import CapTable from "./pages/tools/CapTable";
import ValuationCalculator from "./pages/tools/ValuationCalculator";
import PitchDeckAnalyzer from "./pages/tools/PitchDeckAnalyzer";
import DilutionCalculator from "./pages/tools/DilutionCalculator";
import DataRoom from "./pages/tools/DataRoom";
import InvestorDataRoom from "./pages/InvestorDataRoom";
import DocumentTemplates from "./pages/tools/DocumentTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/investor-crm" element={<InvestorCRM />} />
          <Route path="/tools/term-sheet" element={<TermSheetChecker />} />
          <Route path="/tools/benchmarks" element={<MetricBenchmarks />} />
          <Route path="/tools/safe-calculator" element={<SafeCalculator />} />
          <Route path="/tools/cap-table" element={<CapTable />} />
          <Route path="/tools/valuation" element={<ValuationCalculator />} />
          <Route path="/tools/pitch-deck" element={<PitchDeckAnalyzer />} />
          <Route path="/tools/dilution" element={<DilutionCalculator />} />
          <Route path="/tools/data-room" element={<DataRoom />} />
          <Route path="/investor/:token" element={<InvestorDataRoom />} />
          <Route path="/tools/document-templates" element={<DocumentTemplates />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
