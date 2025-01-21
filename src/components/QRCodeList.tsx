import { QRCode } from "@/types/qr";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { CreateQRDialog } from "./CreateQRDialog";
import { TabsHeader } from "./qr/TabsHeader";
import { ActionBar } from "./qr/ActionBar";
import { QRCodeGrid } from "./qr/QRCodeGrid";

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

      const { data: existingProjects } = await supabase
        .from("projects")
        .select("name")
        .eq("user_id", session.session.user.id)
        .eq("name", newFolderName);

      if (existingProjects && existingProjects.length > 0) {
        throw new Error("A folder with this name already exists");
      }

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
        description: error instanceof Error ? error.message : "Failed to create folder.",
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
        <TabsHeader
          qrCodes={qrCodes}
          projects={projects}
          isCreateFolderOpen={isCreateFolderOpen}
          setIsCreateFolderOpen={setIsCreateFolderOpen}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          onCreateFolder={() => createFolderMutation.mutate()}
        />

        {["all", ...projects.map(p => p.id)].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <ActionBar
              qrCodes={qrCodes}
              projects={projects}
              setIsCreateQROpen={setIsCreateQROpen}
              currentTabValue={tabValue}
            />
            <QRCodeGrid
              qrCodes={qrCodes}
              projects={projects}
              currentTabValue={tabValue}
              onProjectChange={handleProjectChange}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};