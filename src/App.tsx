import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Steps from "@/pages/Steps";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ApiKeyForm from "@/components/ApiKeyForm";
import { useState } from "react";

const queryClient = new QueryClient();

function App() {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return localStorage.getItem("api_key");
  });

  const handleApiKeySubmit = (key: string) => {
    localStorage.setItem("api_key", key);
    setApiKey(key);
  };

  if (!apiKey) {
    return <ApiKeyForm onSubmit={handleApiKeySubmit} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/steps" element={<Steps />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;