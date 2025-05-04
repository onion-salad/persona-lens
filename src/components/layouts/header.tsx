import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
// import { ModeToggle } from "@/components/mode-toggle"
import { useSimulationStore } from "@/lib/store/simulationStore"

export function Header() {
  const location = useLocation()
  const isSimulationPage = location.pathname === '/persona-simulation';
  const totalSteps = 4;
  const currentStep = useSimulationStore((state) => state.currentStep);
  const displayStep = Math.min(currentStep, 3);
  // TODO: Remove this line once state management is fully integrated
  // const currentStepForDisplay = isSimulationPage ? 0 : -1; // Placeholder削除

  const navigation = [
    { name: "ホーム", href: "/" },
    // { name: "ペルソナ作成", href: "/persona/generate" }, // リンクを削除
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-gray-900">
              Persona Lens
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "transition-colors hover:text-gray-900",
                  location.pathname === item.href
                    ? "text-gray-900"
                    : "text-gray-500"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
          </div>
          <nav className="flex items-center">
            {/* <ModeToggle /> */}
          </nav>
        </div>
      </div>
      {/* --- Simulation Progress Bar (visible only on simulation page) --- */}
      {isSimulationPage && (
        <div className="w-full h-1 bg-gray-200"> {/* Bar background */}
          <div className="flex h-full">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 transition-colors duration-300 ${
                  index <= displayStep ? 'bg-gray-900' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </header>
  )
} 