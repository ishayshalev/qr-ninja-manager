import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface TabsHeaderProps {
  qrCodes: Array<{ projectId: string | null }>;
  projects: Array<{ id: string; name: string }>;
  isCreateFolderOpen: boolean;
  setIsCreateFolderOpen: (open: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  onCreateFolder: () => void;
}

export const TabsHeader = ({
  qrCodes,
  projects,
  isCreateFolderOpen,
  setIsCreateFolderOpen,
  newFolderName,
  setNewFolderName,
  onCreateFolder,
}: TabsHeaderProps) => {
  return (
    <TabsList className="mb-4 flex items-center justify-center gap-2 p-2">
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
            <Button onClick={onCreateFolder}>Create Folder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </TabsList>
  );
};