import { BarChart2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

interface TopBarProps {
  totalScans?: number;
}

export function TopBar({ totalScans }: TopBarProps) {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Overview";
      case "/analytics":
        return "QR Analytics";
      case "/settings":
        return "Settings";
      case "/billing":
        return "Billing";
      default:
        return "Overview";
    }
  };

  return (
    <div className="flex items-center justify-between border-b bg-background p-4">
      <h1 className="text-2xl font-semibold">{getPageTitle()}</h1>
      <div className="flex items-center gap-2">
        {totalScans !== undefined && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <BarChart2 className="h-4 w-4" />
            <span className="font-medium">{totalScans} total scans</span>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Last 24 hours</DropdownMenuItem>
            <DropdownMenuItem>Last 7 days</DropdownMenuItem>
            <DropdownMenuItem>Last 30 days</DropdownMenuItem>
            <DropdownMenuItem>All time</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}