import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QRExportOptions } from "../QRExportOptions";

interface TabsHeaderProps {
  qrCodes: Array<{ projectId: string | null }>;
  projects: Array<{ id: string; name: string }>;
  isCreateFolderOpen: boolean;
  setIsCreateFolderOpen: (open: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  onCreateFolder: () => void;
  setIsCreateQROpen: (open: boolean) => void;
  currentTabValue: string;
}

export const TabsHeader = ({
  qrCodes,
  projects,
  isCreateFolderOpen,
  setIsCreateFolderOpen,
  newFolderName,
  setNewFolderName,
  onCreateFolder,
  setIsCreateQROpen,
  currentTabValue,
}: TabsHeaderProps) => {
  return (
    <div className="mb-4 bg-muted p-1 rounded-md">
      <div className="flex items-center gap-4">
        <TabsList className="flex-1">
          <TabsTrigger value="all">
            All QR Codes ({qrCodes.length})
          </TabsTrigger>
          {projects.map((project) => (
            <TabsTrigger key={project.id} value={project.id}>
              {project.name} ({qrCodes.filter(qr => qr.projectId === project.id).length})
            </TabsTrigger>
          ))}
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
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
        <div className="flex items-center gap-4 shrink-0">
          <QRExportOptions 
            qrCodes={qrCodes}
            projects={projects}
            currentProjectId={currentTabValue === "all" ? null : currentTabValue}
          />
          <Button variant="default" onClick={() => setIsCreateQROpen(true)}>
            Create QR Code
          </Button>
        </div>
      </div>
    </div>
  );
};