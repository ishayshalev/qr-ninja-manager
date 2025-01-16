import { QRCode } from "@/types/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Download, Link, Plus } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { TimeRange } from "@/types/qr";

interface QRCodeListProps {
  qrCodes: QRCode[];
  setQRCodes: React.Dispatch<React.SetStateAction<QRCode[]>>;
  projects: { id: string; name: string; totalScans: number }[];
}

export const QRCodeList = ({ qrCodes, setQRCodes, projects }: QRCodeListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

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
        description: "QR code folder updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update QR code folder.",
        variant: "destructive",
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const { error } = await supabase
        .from("projects")
        .insert([
          {
            name: newFolderName,
            user_id: session.session.user.id
          }
        ]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateFolderOpen(false);
      setNewFolderName("");
      toast({
        title: "Success",
        description: "Folder created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create folder.",
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

  const handleProjectChange = (qrId: string, projectId: string | null) => {
    updateProjectMutation.mutate({ qrId, projectId });
  };

  const exportQRCodes = (projectId: string | null) => {
    const qrCodesToExport = projectId 
      ? qrCodes.filter(qr => qr.projectId === projectId)
      : qrCodes;
    
    const csvContent = "Name,URL,Total Scans\n" + 
      qrCodesToExport.map(qr => 
        `${qr.name},${qr.redirectUrl},${qr.usageCount}`
      ).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `qr-codes${projectId ? '-' + projects.find(p => p.id === projectId)?.name : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderQRCodeCard = (qr: QRCode) => (
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
              onValueChange={(value) => handleProjectChange(qr.id, value === "none" ? null : value)}
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

  return (
    <div className="w-full">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 flex justify-start flex-wrap">
          <TabsTrigger value="all">
            All QR Codes ({qrCodes.length})
          </TabsTrigger>
          <TabsTrigger value="no-folder">
            No Folder ({qrCodes.filter(qr => !qr.projectId).length})
          </TabsTrigger>
          {projects.map((project) => (
            <TabsTrigger key={project.id} value={project.id}>
              {project.name} ({qrCodes.filter(qr => qr.projectId === project.id).length})
            </TabsTrigger>
          ))}
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                  />
                </div>
                <Button onClick={() => createFolderMutation.mutate()}>Create Folder</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsList>

        {["all", "no-folder", ...projects.map(p => p.id)].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Total Scans: {tabValue === "all" 
                    ? qrCodes.reduce((acc, qr) => acc + (qr.usageCount || 0), 0)
                    : tabValue === "no-folder"
                      ? qrCodes.filter(qr => !qr.projectId).reduce((acc, qr) => acc + (qr.usageCount || 0), 0)
                      : qrCodes.filter(qr => qr.projectId === tabValue).reduce((acc, qr) => acc + (qr.usageCount || 0), 0)
                  }
                </div>
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
              </div>
              <div className="flex gap-4">
                <Button variant="primary">
                  Create QR Code
                </Button>
                <Button variant="outline" onClick={() => exportQRCodes(tabValue === "all" ? null : tabValue)}>
                  Export QR Codes
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(tabValue === "all" 
                ? qrCodes
                : tabValue === "no-folder"
                  ? qrCodes.filter(qr => !qr.projectId)
                  : qrCodes.filter(qr => qr.projectId === tabValue)
              ).map(renderQRCodeCard)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};