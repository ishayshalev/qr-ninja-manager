import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

interface LayoutProps {
  children: React.ReactNode;
  totalScans?: number;
}

export function Layout({ children, totalScans }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1">
        <TopBar totalScans={totalScans} />
        {children}
      </div>
    </div>
  );
}