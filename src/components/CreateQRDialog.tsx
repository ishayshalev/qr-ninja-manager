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

const normalizeUrl = (url: string) => {
  if (!url) return url;
  
  // Add https:// if no protocol is specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (e) {
    return url;
  }
};

export const CreateQRDialog = ({
  open,
  onOpenChange,
  onCreateQR,
}: CreateQRDialogProps) => {
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUrl = normalizeUrl(redirectUrl);
    onCreateQR(name, normalizedUrl);
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
            <Label htmlFor="redirectUrl">Website URL</Label>
            <Input
              id="redirectUrl"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="website.com"
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