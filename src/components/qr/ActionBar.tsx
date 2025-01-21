import { Button } from "@/components/ui/button";
import { TimeRange, QRCode } from "@/types/qr";
import { TimeRangeSelector } from "../TimeRangeSelector";
import { QRExportOptions } from "../QRExportOptions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ActionBarProps {
  qrCodes: QRCode[];
  projects: Array<{ id: string; name: string }>;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  setIsCreateQROpen: (open: boolean) => void;
  currentTabValue: string;
}

export const ActionBar = ({
  qrCodes,
  projects,
  timeRange,
  setTimeRange,
  setIsCreateQROpen,
  currentTabValue,
}: ActionBarProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteQRCodes, setDeleteQRCodes] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleDeleteProject = () => {
    if (currentTabValue !== "all" && currentTabValue !== "no-folder") {
      deleteProjectMutation.mutate({
        projectId: currentTabValue,
        deleteQRs: deleteQRCodes,
      });
    }
  };

  return (
    <div className="mb-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <div className="flex gap-4">
        {currentTabValue !== "all" && currentTabValue !== "no-folder" && (
          <>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Folder
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Folder</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this folder? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="deleteQRCodes"
                      checked={deleteQRCodes}
                      onChange={(e) => setDeleteQRCodes(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="deleteQRCodes" className="text-sm text-gray-600">
                      Also delete all QR codes in this folder
                    </label>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteProject}>
                      Delete Folder
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
        <QRExportOptions 
          qrCodes={qrCodes}
          projects={projects}
          currentProjectId={currentTabValue === "all" ? null : currentTabValue === "no-folder" ? null : currentTabValue}
        />
        <Button variant="default" onClick={() => setIsCreateQROpen(true)}>
          Create QR Code
        </Button>
      </div>
    </div>
  );
};