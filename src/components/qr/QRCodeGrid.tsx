import { QRCard } from "../QRCard";
import { QRCode, TimeRange } from "@/types/qr";

interface QRCodeGridProps {
  qrCodes: QRCode[];
  projects: Array<{ id: string; name: string }>;
  currentTabValue: string;
  onProjectChange: (qrId: string, projectId: string | null) => void;
  timeRange: TimeRange;
}

export const QRCodeGrid = ({
  qrCodes,
  projects,
  currentTabValue,
  onProjectChange,
  timeRange,
}: QRCodeGridProps) => {
  const filteredQRCodes = currentTabValue === "all" 
    ? qrCodes
    : qrCodes.filter(qr => qr.projectId === currentTabValue);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredQRCodes.map((qr) => (
        <QRCard
          key={qr.id}
          qr={qr}
          projects={projects}
          onProjectChange={onProjectChange}
          timeRange={timeRange}
        />
      ))}
    </div>
  );
};