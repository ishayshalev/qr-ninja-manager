import { QRCode, TimeRange } from "@/types/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Link, Trash2, BarChart2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, subMonths, subWeeks, subYears } from "date-fns";

interface QRCardProps {
  qr: QRCode;
  projects: { id: string; name: string }[];
  onProjectChange: (qrId: string, projectId: string | null) => void;
  timeRange: TimeRange;
}

export const QRCard = ({ qr, projects, onProjectChange, timeRange = "all" }: QRCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = startOfDay(new Date());

    switch (timeRange) {
      case "daily":
        startDate = subDays(endDate, 1);
        break;
      case "weekly":
        startDate = subWeeks(endDate, 1);
        break;
      case "monthly":
        startDate = subMonths(endDate, 1);
        break;
      case "yearly":
        startDate = subYears(endDate, 1);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
    }

    return { startDate, endDate };
  };

  // Query to get scans within the selected time range
  const { data: scansInRange = 0 } = useQuery({
    queryKey: ["qrScans", qr.id, timeRange],
    queryFn: async () => {
      console.log("Fetching scans for QR code:", qr.id, "with time range:", timeRange);
      const { startDate, endDate } = getDateRange();
      const { data, error } = await supabase
        .rpc("get_qr_scans_in_range", {
          qr_id: qr.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });

      if (error) {
        console.error("Error fetching scans:", error);
        throw error;
      }

      console.log("Scans data:", data);
      return data || 0;
    },
  });

  const deleteQRMutation = useMutation({
    mutationFn: async (qrId: string) => {
      console.log("Deleting QR code:", qrId);
      const { error } = await supabase
        .from("qr_codes")
        .delete()
        .eq("id", qrId);
      
      if (error) {
        console.error("Delete QR code error:", error);
        throw error;
      }
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
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{qr.name}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart2 className="h-4 w-4" />
            <span>
              {scansInRange} scans{" "}
              {timeRange && timeRange !== "all" ? `this ${timeRange.replace(/ly$/, "")}` : "total"}
            </span>
          </div>
        </div>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the QR code.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteQRMutation.mutate(qr.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
