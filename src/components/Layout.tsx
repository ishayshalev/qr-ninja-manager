import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

interface LayoutProps {
  children: React.ReactNode;
  totalScans?: number;
}

export function Layout({ children, totalScans }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <AppSidebar />
      <div className="flex-1 w-full">
        <TopBar totalScans={totalScans} />
        <div className="w-full px-6">
          {children}
        </div>
      </div>
    </div>
  );
}