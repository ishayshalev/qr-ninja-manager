import { QRCode } from "@/types/qr";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateQRDialog } from "./CreateQRDialog";
import { TabsHeader } from "./qr/TabsHeader";
import { ActionBar } from "./qr/ActionBar";
import { QRCodeGrid } from "./qr/QRCodeGrid";

interface QRCodeListProps {
  qrCodes: QRCode[];
  setQRCodes: React.Dispatch<React.SetStateAction<QRCode[]>>;
  projects: { id: string; name: string }[];
}

export const QRCodeList = ({ qrCodes, setQRCodes, projects }: QRCodeListProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: newFolderName,
            user_id: session.session.user.id
          }
        ])
        .select();
      
      if (error) throw error;
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

      // Check subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, trial_ends_at, current_period_ends_at')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      const hasActiveSubscription = subscription && (
        (subscription.status === 'trialing' && new Date(subscription.trial_ends_at) > new Date()) ||
        (subscription.status === 'active' && new Date(subscription.current_period_ends_at) > new Date())
      );

      if (!hasActiveSubscription) {
        throw new Error("Subscription required");
      }

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
      
      if (error) throw error;
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
      if (error instanceof Error && error.message === "Subscription required") {
        toast({
          title: "Subscription Required",
          description: "Please upgrade your plan to create more QR codes.",
          variant: "destructive",
        });
        navigate("/upgrade");
      } else {
        toast({
          title: "Error",
          description: "Failed to create QR code.",
          variant: "destructive",
        });
      }
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
              timeRange="all"
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
