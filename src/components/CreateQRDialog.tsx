import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateQR: (name: string, redirectUrl: string, folderId: string | null) => void;
  folders: { id: string; name: string }[];
}

const normalizeUrl = (url: string) => {
  if (!url) return url;
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
  folders,
}: CreateQRDialogProps) => {
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUrl = normalizeUrl(redirectUrl);
    onCreateQR(name, normalizedUrl, selectedFolder);
    setName("");
    setRedirectUrl("");
    setSelectedFolder(null);
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
          <div className="space-y-2">
            <Label>Folder</Label>
            <Select
              value={selectedFolder || "none"}
              onValueChange={(value) => setSelectedFolder(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Create QR Code</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};