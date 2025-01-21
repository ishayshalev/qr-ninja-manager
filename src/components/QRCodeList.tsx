import { useState } from "react";
import { CreateQRDialog } from "./CreateQRDialog";
import { QRCodeGrid } from "./qr/QRCodeGrid";
import { ProjectList } from "./ProjectList";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRCode {
  id: string;
  name: string;
  redirectUrl: string;
  projectId: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface QRCodeListProps {
  qrCodes: QRCode[];
  setQRCodes: (qrCodes: QRCode[]) => void;
  projects: Project[];
}

export const QRCodeList = ({ qrCodes, setQRCodes, projects }: QRCodeListProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            user_id: session.session.user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "Project created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = (name: string, description: string) => {
    createProjectMutation.mutate({ name, description });
  };

  const handleProjectChange = (qrId: string, projectId: string | null) => {
    const updatedQRCodes = qrCodes.map(qr => 
      qr.id === qrId ? { ...qr, projectId } : qr
    );
    setQRCodes(updatedQRCodes);
  };

  const filteredQRCodes = selectedProjectId
    ? qrCodes.filter((qr) => qr.projectId === selectedProjectId)
    : qrCodes;

  return (
    <div>
      <ProjectList
        projects={projects}
        onCreateProject={handleCreateProject}
        onProjectSelect={setSelectedProjectId}
        selectedProjectId={selectedProjectId}
      />
      <CreateQRDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateQR={(name, redirectUrl, folderId) => {
          const newQR = {
            id: crypto.randomUUID(),
            name,
            redirectUrl,
            projectId: folderId
          };
          setQRCodes([...qrCodes, newQR]);
          setIsCreateDialogOpen(false);
          toast({
            title: "Success",
            description: "QR code created successfully.",
          });
        }}
        folders={projects.map(p => ({ id: p.id, name: p.name }))}
      />
      <QRCodeGrid 
        qrCodes={filteredQRCodes}
        projects={projects}
        currentTabValue={selectedProjectId || "all"}
        onProjectChange={handleProjectChange}
      />
    </div>
  );
};