import { RootLayout } from "@/components/layouts/root-layout"
import { HomePage } from "@/pages/home"
// import { PersonaGenerationFlow } from "@/features/persona/components/persona-generation-flow"
import { PersonaSimulationPage } from "@/pages/persona-simulation/page"
import DashboardPage from "@/pages/dashboard/DashboardPage";
import { BrowserRouter, Route, Routes } from "react-router-dom"

export function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/persona-simulation" element={<PersonaSimulationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* <Route path="/persona/generate" element={<PersonaGenerationFlow />} /> */}
        </Routes>
      </RootLayout>
    </BrowserRouter>
  )
} 