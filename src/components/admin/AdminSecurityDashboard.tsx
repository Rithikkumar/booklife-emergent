import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, Eye, Activity, RefreshCw } from 'lucide-react';
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import { toast } from 'sonner';

interface SecurityLog {
  id: string;
  event: string;
  context: {
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    userAgent?: string;
    route?: string;
  };
}

export const AdminSecurityDashboard = () => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { credentialAccessLogs, isLoading, refetch } = useSecurityMonitoring();

  useEffect(() => {
    loadSecurityLogs();
  }, []);

  const loadSecurityLogs = () => {
    try {
      const logs = JSON.parse(sessionStorage.getItem('securityLogs') || '[]');
      setSecurityLogs(logs.reverse()); // Show newest first
    } catch (error) {
      console.error('Failed to load security logs:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      loadSecurityLogs();
      await refetch();
      toast.success('Security data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStats = () => {
    const total = securityLogs.length;
    const critical = securityLogs.filter(log => log.context.severity === 'critical').length;
    const high = securityLogs.filter(log => log.context.severity === 'high').length;
    const recent = securityLogs.filter(log => {
      const logTime = new Date(log.context.timestamp);
      return Date.now() - logTime.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours
    }).length;

    return { total, critical, high, recent };
  };

  const stats = getStats();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor security events and credential access</p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Events</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">High Risk</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{stats.critical + stats.high}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Recent (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-600">{stats.recent}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Credential Access</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">{credentialAccessLogs?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="credentials">Credential Access</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Real-time security monitoring and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {securityLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No security events recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(log.context.severity)}
                          <Badge variant={getSeverityColor(log.context.severity) as any}>
                            {log.context.severity}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{log.event}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Time: {new Date(log.context.timestamp).toLocaleString()}</p>
                            {log.context.route && <p>Route: {log.context.route}</p>}
                            {log.context.userId && <p>User: {log.context.userId}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credential Access Logs</CardTitle>
              <CardDescription>Monitor access to sensitive class meeting credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading credential access logs...</p>
                  </div>
                ) : credentialAccessLogs?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No credential access logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {credentialAccessLogs?.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <Badge variant={log.suspicious_activity ? 'destructive' : 'secondary'}>
                            {log.action}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">Class ID: {log.class_id}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Time: {new Date(log.created_at).toLocaleString()}</p>
                            <p>User: {log.user_id}</p>
                            {log.ip_address && <p>IP: {log.ip_address}</p>}
                            {log.suspicious_activity && (
                              <Badge variant="destructive" className="text-xs">
                                Suspicious Activity
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};