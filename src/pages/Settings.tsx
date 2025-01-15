import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email || "");
      }
    };
    loadUserProfile();
  }, []);

  const handleUpdateProfile = async () => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully. Check your email to confirm changes.",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Button onClick={handleUpdateProfile}>Update Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;