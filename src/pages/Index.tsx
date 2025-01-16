import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateQRDialog } from "@/components/CreateQRDialog";
import { QRCodeList } from "@/components/QRCodeList";
import { ProjectList } from "@/components/ProjectList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export interface QRCode {
  id: string;
  name: string;
  redirectUrl: string;
  usageCount: number;
  projectId: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  totalScans: number;
}

const Index = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch total scans for each project
      const projectsWithScans = await Promise.all(
        projectsData.map(async (project) => {
          const { data: totalScans } = await supabase
            .rpc("get_project_total_scans", { project_id: project.id });

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            totalScans: totalScans || 0,
          };
        })
      );

      return projectsWithScans;
    }
  });

  const { data: qrCodes = [], isLoading: isLoadingQRCodes } = useQuery({
    queryKey: ["qrCodes", selectedProjectId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      let query = supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedProjectId) {
        query = query.eq("project_id", selectedProjectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.map(qr => ({
        id: qr.id,
        name: qr.name,
        redirectUrl: qr.redirect_url,
        usageCount: qr.usage_count || 0,
        projectId: qr.project_id
      }));
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (newProject: { name: string; description: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: newProject.name,
            description: newProject.description,
            user_id: session.session.user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project Created",
        description: "Your project has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating project:", error);
    },
  });

  const createQRMutation = useMutation({
    mutationFn: async (newQR: { name: string; redirectUrl: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const normalizedUrl = newQR.redirectUrl.startsWith('http://') || newQR.redirectUrl.startsWith('https://')
        ? newQR.redirectUrl
        : `https://${newQR.redirectUrl}`;

      const { data, error } = await supabase
        .from("qr_codes")
        .insert([
          {
            name: newQR.name,
            redirect_url: normalizedUrl,
            user_id: session.session.user.id,
            project_id: selectedProjectId
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "QR Code Created",
        description: "Your QR code has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create QR code. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating QR code:", error);
    },
  });

  const handleCreateProject = (name: string, description: string) => {
    createProjectMutation.mutate({ name, description });
  };

  const handleCreateQR = (name: string, redirectUrl: string) => {
    createQRMutation.mutate({ name, redirectUrl });
  };

  if (isLoadingProjects || isLoadingQRCodes) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">QR Code Manager</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create QR Code
          </Button>
          <Button onClick={() => navigate("/settings")}>Settings</Button>
        </div>
      </div>

      <ProjectList
        projects={projects}
        onCreateProject={handleCreateProject}
        onProjectSelect={setSelectedProjectId}
        selectedProjectId={selectedProjectId}
      />

      <QRCodeList
        qrCodes={qrCodes}
        setQRCodes={(qrs) => {
          if (Array.isArray(qrs)) {
            queryClient.setQueryData(["qrCodes", selectedProjectId], qrs);
          }
        }}
        projects={projects}
      />

      <CreateQRDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateQR={handleCreateQR}
      />
    </div>
  );
};

export default Index;
