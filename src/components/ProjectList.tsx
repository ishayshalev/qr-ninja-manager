import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyProjectState } from "./projects/EmptyProjectState";
import { DeleteProjectDialog } from "./projects/DeleteProjectDialog";
import { ProjectCard } from "./projects/ProjectCard";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface ProjectListProps {
  projects: Project[];
  onCreateProject: (name: string, description: string) => void;
  onProjectSelect: (projectId: string | null) => void;
  selectedProjectId: string | null;
}

export const ProjectList = ({ projects, onCreateProject, onProjectSelect, selectedProjectId }: ProjectListProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [deleteQRCodes, setDeleteQRCodes] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateQRProjectMutation = useMutation({
    mutationFn: async ({ qrId, projectId }: { qrId: string; projectId: string }) => {
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
        description: "QR code moved to project successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to move QR code to project.",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async ({ projectId, deleteQRs }: { projectId: string; deleteQRs: boolean }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      if (deleteQRs) {
        const { error: qrError } = await supabase
          .from("qr_codes")
          .delete()
          .eq("project_id", projectId);
        
        if (qrError) throw qrError;
      } else {
        const { error: updateError } = await supabase
          .from("qr_codes")
          .update({ project_id: null })
          .eq("project_id", projectId);
        
        if (updateError) throw updateError;
      }

      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      
      if (projectError) throw projectError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      setDeleteQRCodes(false);
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Delete project error:", error);
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    onCreateProject(newProjectName, newProjectDescription);
    setNewProjectName("");
    setNewProjectDescription("");
    setIsCreateDialogOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate({
        projectId: projectToDelete,
        deleteQRs: deleteQRCodes,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("ring-2", "ring-primary", "ring-opacity-50");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("ring-2", "ring-primary", "ring-opacity-50");
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, projectId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-primary", "ring-opacity-50");
    const qrId = e.dataTransfer.getData("qrId");
    if (qrId) {
      updateQRProjectMutation.mutate({ qrId, projectId });
    }
  };

  if (projects.length === 0) {
    return (
      <EmptyProjectState
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDescription={newProjectDescription}
        setNewProjectDescription={setNewProjectDescription}
        handleCreateProject={handleCreateProject}
      />
    );
  }

  return (
    <div className="mb-8">
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        deleteQRCodes={deleteQRCodes}
        setDeleteQRCodes={setDeleteQRCodes}
        onConfirmDelete={confirmDeleteProject}
      />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Projects</h2>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Project description"
                  />
                </div>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            {...project}
            selectedProjectId={selectedProjectId}
            onProjectSelect={(projectId) => onProjectSelect(projectId === selectedProjectId ? null : projectId)}
            onDeleteProject={handleDeleteProject}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};