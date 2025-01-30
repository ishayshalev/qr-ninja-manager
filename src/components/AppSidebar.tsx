import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { SidebarNavigation } from "@/components/sidebar/SidebarNavigation";
import { TrialStatusCard } from "@/components/sidebar/TrialStatusCard";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent className="flex h-full flex-col justify-between">
        <SidebarNavigation />
        <div className="px-2 mb-2">
          <TrialStatusCard />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}