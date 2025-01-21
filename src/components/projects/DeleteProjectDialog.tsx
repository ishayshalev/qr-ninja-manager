import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleteQRCodes: boolean;
  setDeleteQRCodes: (value: boolean) => void;
  onConfirmDelete: () => void;
}

export const DeleteProjectDialog = ({
  isOpen,
  onOpenChange,
  deleteQRCodes,
  setDeleteQRCodes,
  onConfirmDelete,
}: DeleteProjectDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this project? This action cannot be undone.
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
              Also delete all QR codes in this project
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete}>
              Delete Project
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};