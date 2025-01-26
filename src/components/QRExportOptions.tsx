import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCode } from "@/types/qr";
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';

interface QRExportOptionsProps {
  qrCodes: QRCode[];
  projects: { id: string; name: string }[];
  currentProjectId: string | null;
}

export const QRExportOptions = ({ qrCodes, projects, currentProjectId }: QRExportOptionsProps) => {
  const { toast } = useToast();

  const exportQRCodesAsZip = async (qrCodesToExport: QRCode[], format: 'png' | 'svg') => {
    const zip = new JSZip();
    
    for (const qr of qrCodesToExport) {
      if (format === 'png') {
        const canvas = document.getElementById(qr.id) as HTMLCanvasElement;
        if (canvas) {
          const pngData = canvas.toDataURL("image/png").split(',')[1];
          zip.file(`${qr.name}-qr.png`, pngData, { base64: true });
        }
      } else {
        const element = document.getElementById(`${qr.id}-svg`);
        if (element instanceof SVGElement) {
          const svgData = new XMLSerializer().serializeToString(element);
          zip.file(`${qr.name}-qr.svg`, svgData);
        }
      }
    }
    
    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `qr-codes-${format}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Codes Downloaded",
      description: `Your QR codes have been downloaded as a ZIP file (${format.toUpperCase()}).`,
    });
  };

  const exportQRCodesAsCSV = (projectId: string | null) => {
    const qrCodesToExport = projectId 
      ? qrCodes.filter(qr => qr.projectId === projectId)
      : qrCodes;
    
    const csvContent = "Name,URL\n" + 
      qrCodesToExport.map(qr => 
        `${qr.name},${qr.redirectUrl}`
      ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `qr-codes${projectId ? '-' + projects.find(p => p.id === projectId)?.name : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Codes Exported",
      description: "Your QR codes have been exported as a CSV file.",
    });
  };

  const handleExport = (type: 'csv' | 'png-zip' | 'svg-zip') => {
    const qrCodesToExport = currentProjectId 
      ? qrCodes.filter(qr => qr.projectId === currentProjectId)
      : qrCodes;

    switch (type) {
      case 'csv':
        exportQRCodesAsCSV(currentProjectId);
        break;
      case 'png-zip':
        exportQRCodesAsZip(qrCodesToExport, 'png');
        break;
      case 'svg-zip':
        exportQRCodesAsZip(qrCodesToExport, 'svg');
        break;
    }
  };

  return (
    <Select onValueChange={handleExport}>
      <SelectTrigger>
        <SelectValue placeholder="Export QR Codes" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="csv">Export as CSV</SelectItem>
        <SelectItem value="png-zip">Export as ZIP (PNG files)</SelectItem>
        <SelectItem value="svg-zip">Export as ZIP (SVG files)</SelectItem>
      </SelectContent>
    </Select>
  );
};