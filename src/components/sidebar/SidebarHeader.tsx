import { SidebarHeader as Header } from "@/components/ui/sidebar";

export function SidebarHeader() {
  return (
    <Header className="border-b p-4">
      <div className="flex items-center gap-2 pl-2">
        <div className="h-8 w-8 rounded-lg bg-primary"></div>
        <span className="text-lg font-semibold">QR Manager</span>
      </div>
    </Header>
  );
}