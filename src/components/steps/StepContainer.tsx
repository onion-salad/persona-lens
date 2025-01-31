import { FC, ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { HistorySidebar } from "@/components/HistorySidebar";
import UserAvatar from "@/components/UserAvatar";

interface StepContainerProps {
  children: ReactNode;
  onHistorySelect: (history: any) => void;
}

const StepContainer: FC<StepContainerProps> = ({ children, onHistorySelect }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <HistorySidebar onHistorySelect={onHistorySelect} />
        <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <UserAvatar />
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StepContainer;