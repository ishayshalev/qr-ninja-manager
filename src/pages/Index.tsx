import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeList } from "@/components/QRCodeList";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

const queryClient = new QueryClient();

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index component mounted, checking session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Current session:', session);
      if (!session) {
        console.log('No session found, redirecting to auth');
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) throw new Error("No user found");

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      const projectsWithScans = await Promise.all(
        projectsData.map(async (project) => {
          const { data: totalScans } = await supabase
            .rpc("get_project_total_scans", { project_id: project.id });

          return {
            id: project.id,
            name: project.name,
            totalScans: totalScans || 0,
          };
        })
      );

      return projectsWithScans;
    }
  });

  const { data: qrCodes = [], isLoading: isLoadingQRCodes } = useQuery({
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
        usageCount: qr.usage_count || 0,
        projectId: qr.project_id
      }));
    }
  });

  if (isLoadingProjects || isLoadingQRCodes) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8">
        <QRCodeList
          qrCodes={qrCodes}
          setQRCodes={(qrs) => {
            if (Array.isArray(qrs)) {
              queryClient.setQueryData(["qrCodes"], qrs);
            }
          }}
          projects={projects}
        />
      </div>
    </div>
  );
};

export default Index;