import { QRCode } from "@/types/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Link } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QRCardProps {
  qr: QRCode;
  projects: { id: string; name: string }[];
  onProjectChange: (qrId: string, projectId: string | null) => void;
}

export const QRCard = ({ qr, projects, onProjectChange }: QRCardProps) => {
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

  return (
    <Card key={qr.id} className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{qr.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          <QRCodeCanvas
            id={qr.id}
            value={qr.redirectUrl}
            size={200}
            level="H"
            includeMargin
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link className="h-4 w-4 mr-2" />
            <span className="truncate">{qr.redirectUrl}</span>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Current location:</p>
            <Select
              value={qr.projectId || "none"}
              onValueChange={(value) => onProjectChange(qr.id, value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
  );
};