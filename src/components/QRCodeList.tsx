import { QRCode } from "@/pages/Index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Download, Link, GripVertical } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QRCodeListProps {
  qrCodes: QRCode[];
  setQRCodes: React.Dispatch<React.SetStateAction<QRCode[]>>;
  projects: { id: string; name: string }[];
}

export const QRCodeList = ({ qrCodes, setQRCodes, projects }: QRCodeListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProjectMutation = useMutation({
    mutationFn: async ({ qrId, projectId }: { qrId: string; projectId: string | null }) => {
      const { error } = await supabase
        .from("qr_codes")
        .update({ project_id: projectId })
        .eq("id", qrId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "QR code project updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update QR code project.",
        variant: "destructive",
      });
    },
  });

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, qrId: string) => {
    e.dataTransfer.setData("qrId", qrId);
  };

  const handleProjectChange = (qrId: string, projectId: string | null) => {
    updateProjectMutation.mutate({ qrId, projectId });
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
    <div>
      <h2 className="text-xl font-semibold mb-4">QR Codes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qr) => (
          <Card 
            key={qr.id} 
            className="overflow-hidden relative"
            draggable
            onDragStart={(e) => handleDragStart(e, qr.id)}
          >
            <div className="absolute top-2 right-2 cursor-move">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
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
                <div className="flex items-center text-sm text-gray-600">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  <span>{qr.usageCount} scans</span>
                </div>
                <Select
                  value={qr.projectId || "none"}
                  onValueChange={(value) => handleProjectChange(qr.id, value === "none" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
};