import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateQRDialog } from "@/components/CreateQRDialog";
import { QRCodeList } from "@/components/QRCodeList";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QRCode {
  id: string;
  name: string;
  redirectUrl: string;
  usageCount: number;
}

const Index = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: qrCodes = [], isLoading } = useQuery({
    queryKey: ["qrCodes"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(qr => ({
        id: qr.id,
        name: qr.name,
        redirectUrl: qr.redirect_url,
        usageCount: qr.usage_count || 0
      }));
    }
  });

  const createQRMutation = useMutation({
    mutationFn: async (newQR: { name: string; redirectUrl: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      // Normalize URL by adding https:// if not present
      const normalizedUrl = newQR.redirectUrl.startsWith('http://') || newQR.redirectUrl.startsWith('https://')
        ? newQR.redirectUrl
        : `https://${newQR.redirectUrl}`;

      const { data, error } = await supabase
        .from("qr_codes")
        .insert([
          {
            name: newQR.name,
            redirect_url: normalizedUrl,
            user_id: session.session.user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
      toast({
        title: "QR Code Created",
        description: "Your QR code has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create QR code. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating QR code:", error);
    },
  });

  const handleCreateQR = (name: string, redirectUrl: string) => {
    createQRMutation.mutate({ name, redirectUrl });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">QR Code Manager</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create QR Code
        </Button>
      </div>

      <QRCodeList
        qrCodes={qrCodes}
        setQRCodes={(qrs) => {
          if (Array.isArray(qrs)) {
            queryClient.setQueryData(["qrCodes"], qrs);
          }
        }}
      />

      <CreateQRDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateQR={handleCreateQR}
      />
    </div>
  );
};

export default Index;