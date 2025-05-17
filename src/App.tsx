import { RootLayout } from "@/components/layouts/root-layout"
import { HomePage } from "@/pages/home"
// import { PersonaGenerationFlow } from "@/features/persona/components/persona-generation-flow"
import { PersonaSimulationPage } from "@/pages/persona-simulation/page"
import DashboardPage from "@/pages/dashboard/DashboardPage";
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { CopilotKit } from "@copilotkit/react-core";

export function App() {
  return (
    <BrowserRouter>
      <CopilotKit 
        runtimeUrl="/api/copilotkit" 
        // agentIdプロパティはCopilotKitのバージョンによってはないかもしれない。
        // ドキュメントでは agent="agent_name" となっていたが、
        // runtimeに複数のエージェントを登録し、ここでデフォルトを指定するイメージ。
        // Mastraの orchestratorAgent を指定する想定。
        // ただし、バックエンドのagentsオプションが現状空なので、この指定が有効かは不明。
        // agentプロパティの正確な型や役割は CopilotKit のドキュメントで要確認。
        // 仮に `agentId` または `defaultAgentId` のようなプロパティを期待。
        // ドキュメントの例では `agent="sample_agent"` であったため、それに倣う。
        agent="orchestratorAgent" // 使用するMastra Agentの名前
      >
        <RootLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/persona-simulation" element={<PersonaSimulationPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* <Route path="/persona/generate" element={<PersonaGenerationFlow />} /> */}
          </Routes>
        </RootLayout>
      </CopilotKit>
    </BrowserRouter>
  )
} 