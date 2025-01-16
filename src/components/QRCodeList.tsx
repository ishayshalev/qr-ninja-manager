import { QRCode } from "@/pages/Index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BarChart2, Download, Link, GripVertical, Plus } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

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
  const [newFolderDescription, setNewFolderDescription] = useState("");

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
            description: newFolderDescription,
            user_id: session.session.user.id
          }
        ]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateFolderOpen(false);
      setNewFolderName("");
      setNewFolderDescription("");
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, qrId: string) => {
    e.dataTransfer.setData("qrId", qrId);
  };

  const handleProjectChange = (qrId: string, projectId: string | null) => {
    updateProjectMutation.mutate({ qrId, projectId });
  };

  const getTotalScans = (projectId: string | null) => {
    if (projectId === null) {
      return qrCodes
        .filter(qr => !qr.projectId)
        .reduce((sum, qr) => sum + (qr.usageCount || 0), 0);
    }
    return qrCodes
      .filter(qr => qr.projectId === projectId)
      .reduce((sum, qr) => sum + (qr.usageCount || 0), 0);
  };

  const getAllScans = () => {
    return qrCodes.reduce((sum, qr) => sum + (qr.usageCount || 0), 0);
  };

  const renderQRCodeCard = (qr: QRCode) => (
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
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="all">
            All QR Codes ({qrCodes.length}) - {getAllScans()} scans
          </TabsTrigger>
          <TabsTrigger value="no-folder">
            No Folder ({qrCodes.filter(qr => !qr.projectId).length}) - {getTotalScans(null)} scans
          </TabsTrigger>
          {projects.map((project) => (
            <TabsTrigger key={project.id} value={project.id}>
              {project.name} ({qrCodes.filter(qr => qr.projectId === project.id).length}) - {project.totalScans} scans
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
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="Folder description"
                  />
                </div>
                <Button onClick={() => createFolderMutation.mutate()}>Create Folder</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => renderQRCodeCard(qr))}
          </div>
        </TabsContent>

        <TabsContent value="no-folder">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.filter(qr => !qr.projectId).map((qr) => renderQRCodeCard(qr))}
          </div>
        </TabsContent>

        {projects.map((project) => (
          <TabsContent key={project.id} value={project.id}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrCodes.filter(qr => qr.projectId === project.id).map((qr) => renderQRCodeCard(qr))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};