import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { QRCodeList } from "@/components/QRCodeList";
import { CreateQRDialog } from "@/components/CreateQRDialog";
import { useToast } from "@/hooks/use-toast";

export interface QRCode {
  id: string;
  name: string;
  redirectUrl: string;
  usageCount: number;
  createdAt: Date;
}

const Index = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const { toast } = useToast();

  const handleCreateQR = (name: string, redirectUrl: string) => {
    const newQR: QRCode = {
      id: crypto.randomUUID(),
      name,
      redirectUrl,
      usageCount: 0,
      createdAt: new Date(),
    };
    setQRCodes((prev) => [...prev, newQR]);
    toast({
      title: "QR Code Created",
      description: "Your new QR code has been created successfully.",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Manager</h1>
          <p className="text-gray-600 mt-2">Create and manage your QR codes</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <PlusIcon className="mr-2 h-4 w-4" />
          Create QR Code
        </Button>
      </div>

      <QRCodeList qrCodes={qrCodes} setQRCodes={setQRCodes} />
      
      <CreateQRDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateQR={handleCreateQR}
      />
    </div>
  );
};

export default Index;