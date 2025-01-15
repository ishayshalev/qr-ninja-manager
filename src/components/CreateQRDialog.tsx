import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateQR: (name: string, redirectUrl: string) => void;
}

export const CreateQRDialog = ({
  open,
  onOpenChange,
  onCreateQR,
}: CreateQRDialogProps) => {
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateQR(name, redirectUrl);
    setName("");
    setRedirectUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New QR Code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My QR Code"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="redirectUrl">Redirect URL</Label>
            <Input
              id="redirectUrl"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Create QR Code</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};