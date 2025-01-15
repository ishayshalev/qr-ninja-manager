import { QRCode } from "@/pages/Index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Download, Link } from "lucide-react";
import QRCodeReact from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeListProps {
  qrCodes: QRCode[];
  setQRCodes: React.Dispatch<React.SetStateAction<QRCode[]>>;
}

export const QRCodeList = ({ qrCodes, setQRCodes }: QRCodeListProps) => {
  const { toast } = useToast();

  const downloadQRCode = (id: string, name: string) => {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${name}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been downloaded successfully.",
      });
    }
  };

  if (qrCodes.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-600">No QR codes yet</h3>
        <p className="text-gray-500 mt-2">Create your first QR code to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {qrCodes.map((qr) => (
        <Card key={qr.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{qr.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <QRCodeReact
                id={qr.id}
                value={qr.redirectUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Link className="h-4 w-4 mr-2" />
                <span className="truncate">{qr.redirectUrl}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BarChart2 className="h-4 w-4 mr-2" />
                <span>{qr.usageCount} scans</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQRCode(qr.id, qr.name)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};