import { QRCode } from "@/types/qr";
import { QRCard } from "../QRCard";

interface QRCodeGridProps {
  qrCodes: QRCode[];
  projects: Array<{ id: string; name: string }>;
  currentTabValue: string;
  onProjectChange: (qrId: string, projectId: string | null) => void;
}

export const QRCodeGrid = ({
  qrCodes,
  projects,
  currentTabValue,
  onProjectChange,
}: QRCodeGridProps) => {
  const filteredQRCodes = currentTabValue === "all"
    ? qrCodes
    : qrCodes.filter(qr => qr.projectId === currentTabValue);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredQRCodes.map((qr) => (
        <QRCard
          key={qr.id}
          qrCode={qr}
          projects={projects}
          onProjectChange={onProjectChange}
        />
      ))}
    </div>
  );
};