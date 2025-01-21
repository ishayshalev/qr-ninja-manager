import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeRangeSelector } from "@/components/TimeRangeSelector";
import { useState, useEffect } from "react";
import { TimeRange } from "@/types/qr";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to auth');
        navigate("/auth");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: scanData, isLoading } = useQuery({
    queryKey: ['qr-scans', timeRange],
    queryFn: async () => {
      console.log('Fetching scan data for timeRange:', timeRange);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) {
        console.error('No user found in session');
        throw new Error("No user found");
      }

      const { data: qrCodes, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, name')
        .eq('user_id', session.session.user.id);

      if (qrError) {
        console.error('Error fetching QR codes:', qrError);
        throw qrError;
      }

      if (!qrCodes || qrCodes.length === 0) {
        console.log('No QR codes found for user');
        return [];
      }

      const qrIds = qrCodes.map(qr => qr.id);
      
      const { data: scans, error: scansError } = await supabase
        .from('qr_scans')
        .select('*, qr_codes(name)')
        .in('qr_code_id', qrIds)
        .order('created_at', { ascending: false });

      if (scansError) {
        console.error('Error fetching scans:', scansError);
        throw scansError;
      }

      console.log('Fetched scan data:', scans);
      return scans || [];
    },
    enabled: true // The query will run automatically
  });

  const { data: deviceStats } = useQuery({
    queryKey: ['device-stats', scanData],
    queryFn: async () => {
      if (!scanData) return null;
      const stats = {
        devices: scanData.reduce((acc: Record<string, number>, scan) => {
          const device = scan.device_type || 'Unknown';
          acc[device] = (acc[device] || 0) + 1;
          return acc;
        }, {}),
        browsers: scanData.reduce((acc: Record<string, number>, scan) => {
          const browser = scan.browser || 'Unknown';
          acc[browser] = (acc[browser] || 0) + 1;
          return acc;
        }, {}),
        countries: scanData.reduce((acc: Record<string, number>, scan) => {
          const country = scan.country || 'Unknown';
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        }, {})
      };
      return stats;
    },
    enabled: !!scanData
  });

  const prepareChartData = (data: Record<string, number>) => {
    return Object.entries(data || {}).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (isLoading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">QR Analytics</h1>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Scans: {scanData?.length || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Tabs defaultValue="devices" className="w-full">
          <TabsList>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="browsers">Browsers</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData(deviceStats?.devices || {})}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browsers">
            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData(deviceStats?.browsers || {})}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="countries">
            <Card>
              <CardHeader>
                <CardTitle>Countries</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData(deviceStats?.countries || {})}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}