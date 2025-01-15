import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Folder, Plus, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string | null;
  totalScans: number;
}

interface ProjectListProps {
  projects: Project[];
  onCreateProject: (name: string, description: string) => void;
  onProjectSelect: (projectId: string | null) => void;
  selectedProjectId: string | null;
}

export const ProjectList = ({ projects, onCreateProject, onProjectSelect, selectedProjectId }: ProjectListProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const { toast } = useToast();

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

  if (projects.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Projects</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new project</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className={`cursor-pointer transition-colors ${
              selectedProjectId === project.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onProjectSelect(project.id === selectedProjectId ? null : project.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {project.description && (
                <p className="text-sm text-gray-600 mb-2">{project.description}</p>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <BarChart2 className="h-4 w-4 mr-2" />
                <span>{project.totalScans} total scans</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};