import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeList } from "@/components/QRCodeList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Index component mounted, checking session...');
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error);
          throw error;
        }
        
        console.log('Current session:', session);
        if (!session) {
          console.log('No session found, redirecting to auth');
          navigate("/auth", { replace: true });
          return;
        }
        
        if (mounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (!session && mounted) {
        navigate("/auth", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      console.log('Fetching projects...');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) {
        console.error('No user found in session');
        throw new Error("No user found");
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq('user_id', session.session.user.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error('Projects fetch error:', projectsError);
        throw projectsError;
      }

      console.log('Projects fetched:', projectsData);

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
    },
    enabled: isAuthenticated,
    retry: 3,
    meta: {
      onError: () => {
        console.error('Projects query error:', projectsError);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }
  });

  const { data: qrCodes = [], isLoading: isLoadingQRCodes, error: qrCodesError } = useQuery({
    queryKey: ["qrCodes"],
    queryFn: async () => {
      console.log('Fetching QR codes...');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) {
        console.error('No user found in session');
        throw new Error("No user found");
      }

      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq('user_id', session.session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('QR codes fetch error:', error);
        throw error;
      }

      console.log('QR codes fetched:', data);
      return data.map(qr => ({
        id: qr.id,
        name: qr.name,
        redirectUrl: qr.redirect_url,
        usageCount: qr.usage_count || 0,
        projectId: qr.project_id
      }));
    },
    enabled: isAuthenticated,
    retry: 3,
    meta: {
      onError: () => {
        console.error('QR codes query error:', qrCodesError);
        toast({
          title: "Error",
          description: "Failed to load QR codes. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    }
  });

  if (isLoading || isLoadingProjects || isLoadingQRCodes) {
    return (
      <Layout>
        <div className="p-4">Loading...</div>
      </Layout>
    );
  }

  if (projectsError || qrCodesError) {
    return (
      <Layout>
        <div className="p-4 text-red-500">
          Error loading data. Please try refreshing the page.
        </div>
      </Layout>
    );
  }

  const totalScans = qrCodes.reduce((total, qr) => total + (qr.usageCount || 0), 0);

  return (
    <Layout totalScans={totalScans}>
      <div className="p-4">
        <QRCodeList
          qrCodes={qrCodes}
          setQRCodes={(qrs) => {
            console.log("QR codes update requested:", qrs);
          }}
          projects={projects}
        />
      </div>
    </Layout>
  );
};

export default Index;