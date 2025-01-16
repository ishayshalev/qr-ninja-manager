import { QRCode, TimeRange } from "@/types/qr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { CreateQRDialog } from "./CreateQRDialog";
import { QRCard } from "./QRCard";
import { QRExportOptions } from "./QRExportOptions";

interface QRCodeListProps {
  qrCodes: QRCode[];
  setQRCodes: React.Dispatch<React.SetStateAction<QRCode[]>>;
  projects: { id: string; name: string; totalScans: number }[];
}

export const QRCodeList = ({ qrCodes, setQRCodes, projects }: QRCodeListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateQROpen, setIsCreateQROpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const updateProjectMutation = useMutation({
    mutationFn: async ({ qrId, projectId }: { qrId: string; projectId: string | null }) => {
      const { error } = await supabase
        .from("qr_codes")
        .update({ project_id: projectId })
        .eq("id", qrId);
      
      if (error) {
        console.error("Update project error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "QR code folder updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Update project mutation error:", error);
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

      console.log("Creating folder with user ID:", session.session.user.id);
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: newFolderName,
            user_id: session.session.user.id
          }
        ])
        .select();
      
      if (error) {
        console.error("Create folder error:", error);
        throw error;
      }
      return data;
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
    onError: (error) => {
      console.error("Create folder mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to create folder.",
        variant: "destructive",
      });
    },
  });

  const createQRMutation = useMutation({
    mutationFn: async ({ name, redirectUrl, folderId }: { name: string; redirectUrl: string; folderId: string | null }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      console.log("Creating QR code with user ID:", session.session.user.id);
      const { data, error } = await supabase
        .from("qr_codes")
        .insert([
          {
            name,
            redirect_url: redirectUrl,
            project_id: folderId,
            user_id: session.session.user.id
          }
        ])
        .select();
      
      if (error) {
        console.error("Create QR code error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
      setIsCreateQROpen(false);
      toast({
        title: "Success",
        description: "QR code created successfully.",
      });
    },
    onError: (error) => {
      console.error("Create QR code mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to create QR code.",
        variant: "destructive",
      });
    },
  });

  const handleProjectChange = (qrId: string, projectId: string | null) => {
    updateProjectMutation.mutate({ qrId, projectId });
  };

  const handleCreateQR = (name: string, redirectUrl: string, folderId: string | null) => {
    createQRMutation.mutate({ name, redirectUrl, folderId });
  };

  return (
    <div className="w-full">
      <CreateQRDialog
        open={isCreateQROpen}
        onOpenChange={setIsCreateQROpen}
        onCreateQR={handleCreateQR}
        folders={projects}
      />
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 flex justify-start flex-wrap p-4">
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
                <Button variant="default" onClick={() => setIsCreateQROpen(true)}>
                  Create QR Code
                </Button>
                <QRExportOptions 
                  qrCodes={qrCodes}
                  projects={projects}
                  currentProjectId={tabValue === "all" ? null : tabValue === "no-folder" ? null : tabValue}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(tabValue === "all" 
                ? qrCodes
                : tabValue === "no-folder"
                  ? qrCodes.filter(qr => !qr.projectId)
                  : qrCodes.filter(qr => qr.projectId === tabValue)
              ).map((qr) => (
                <QRCard
                  key={qr.id}
                  qr={qr}
                  projects={projects}
                  onProjectChange={handleProjectChange}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};