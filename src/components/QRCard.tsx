import { QRCode } from "@/types/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Link, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeDisplay } from "./qr/QRCodeDisplay";
import { DeleteQRDialog } from "./qr/DeleteQRDialog";
import { useState } from "react";

interface QRCardProps {
  qr: QRCode;
  projects: { id: string; name: string }[];
  onProjectChange: (qrId: string, projectId: string | null) => void;
}

export const QRCard = ({ qr, projects, onProjectChange }: QRCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteQRMutation = useMutation({
    mutationFn: async (qrId: string) => {
      const { error } = await supabase
        .from("qr_codes")
        .delete()
        .eq("id", qrId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
      toast({
        title: "QR Code Deleted",
        description: "Your QR code has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Delete QR code mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to delete QR code.",
        variant: "destructive",
      });
    },
  });

  const downloadQRCode = () => {
    const canvas = document.getElementById(qr.id) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${qr.name}-qr.png`;
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
        <QRCodeDisplay id={qr.id} redirectUrl={qr.redirectUrl} />
        
        <div className="space-y-4 w-full">
          <div className="flex items-center text-sm text-gray-600 w-full">
            <Link className="h-4 w-4 mr-2" />
            <span className="truncate">{qr.redirectUrl}</span>
          </div>
          <div className="w-full text-left">
            <p className="text-sm text-gray-600 mb-1">Folder:</p>
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

        <div className="mt-4 flex justify-between items-center">
          <DeleteQRDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirmDelete={() => deleteQRMutation.mutate(qr.id)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQRCode}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};