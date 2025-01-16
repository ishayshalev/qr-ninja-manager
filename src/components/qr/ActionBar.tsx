import { Button } from "@/components/ui/button";
import { TimeRange, QRCode } from "@/types/qr";
import { TimeRangeSelector } from "../TimeRangeSelector";
import { QRExportOptions } from "../QRExportOptions";

interface ActionBarProps {
  qrCodes: QRCode[];
  projects: Array<{ id: string; name: string }>;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  setIsCreateQROpen: (open: boolean) => void;
  currentTabValue: string;
}

export const ActionBar = ({
  qrCodes,
  projects,
  timeRange,
  setTimeRange,
  setIsCreateQROpen,
  currentTabValue,
}: ActionBarProps) => {
  const filteredQRCodes = currentTabValue === "all" 
    ? qrCodes
    : currentTabValue === "no-folder"
      ? qrCodes.filter(qr => !qr.projectId)
      : qrCodes.filter(qr => qr.projectId === currentTabValue);

  const totalScans = filteredQRCodes.reduce((acc, qr) => acc + (qr.usageCount || 0), 0);

  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          Total Scans: {totalScans}
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <div className="flex gap-4">
        <Button variant="default" onClick={() => setIsCreateQROpen(true)}>
          Create QR Code
        </Button>
        <QRExportOptions 
          qrCodes={qrCodes}
          projects={projects}
          currentProjectId={currentTabValue === "all" ? null : currentTabValue === "no-folder" ? null : currentTabValue}
        />
      </div>
    </div>
  );
};