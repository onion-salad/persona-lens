import { RootLayout } from "@/components/layouts/root-layout"
import { HomePage } from "@/pages/home"
import { PersonaGenerationFlow } from "@/features/persona/components/persona-generation-flow"
import { BrowserRouter, Route, Routes } from "react-router-dom"

export function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/persona/generate" element={<PersonaGenerationFlow />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  )
} 