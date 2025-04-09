"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Loader2, Users, Server, FileText, Building, Briefcase, Shield, RefreshCw } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import UserManagement from "@/components/admin/user-management"
import VendorManagement from "@/components/admin/vendor-management"
import apiClient from "@/lib/api-client"
import { MakeUserAdmin } from "@/components/admin-make-user-admin"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useMediaQuery } from "@/hooks/use-media-query"
import { motion } from "framer-motion"

interface StatsCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  uid: string;
}

export default function AdminPage() {
  const { userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [dataLoaded, setDataLoaded] = useState(false);
  const router = useRouter();
  const initialCheckRef = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  const fetchStats = useCallback(async () => {
    if (!userProfile || userProfile.role !== 'admin' || isLoadingStats) {
      return;
    }
    
    setIsLoadingStats(true);
    
    try {
      let usersData = [];
      try {
        const response = await apiClient.auth.getAllUsers();
        usersData = Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Error fetching users for stats:", error);
        usersData = [];
      }
      
      const [resumesData, vendorsData, jobsData] = await Promise.allSettled([
        apiClient.resumes.getAllResumes(),
        apiClient.vendors.getAll(),
        apiClient.jobs.getAll()
      ]);

      const resumeCount = resumesData.status === 'fulfilled' ? 
        (Array.isArray(resumesData.value) ? resumesData.value.length : 0) : 0;
      
      const vendorCount = vendorsData.status === 'fulfilled' ? 
        (Array.isArray(vendorsData.value) ? vendorsData.value.length : 0) : 0;
      
      const jobCount = jobsData.status === 'fulfilled' ? 
        (Array.isArray(jobsData.value) ? jobsData.value.length : 0) : 0;

      setApiStatus('online');
      
      const newStats = [
        {
          title: "Total Users",
          value: usersData.length,
          description: "Active user accounts",
          icon: <Users className="h-5 w-5 text-blue-500" />,
        },
        {
          title: "Total Resumes",
          value: resumeCount,
          description: "Resumes analyzed",
          icon: <FileText className="h-5 w-5 text-purple-500" />,
        },
        {
          title: "Total Vendors",
          value: vendorCount,
          description: "Registered vendors",
          icon: <Building className="h-5 w-5 text-orange-500" />,
        },
        {
          title: "Total Jobs",
          value: jobCount,
          description: "Active job postings",
          icon: <Briefcase className="h-5 w-5 text-indigo-500" />,
        },
      ];
      
      setStats(newStats);
      setDataLoaded(true);
      
    } catch (error) {
      console.error("Error fetching stats:", error);
      setApiStatus('offline');
      
      setStats([
        {
          title: "API Status",
          value: "Offline",
          description: "Connection error",
          icon: <Server className="h-5 w-5 text-red-500" />,
        },
      ]);
      
      toast({
        title: "Failed to load dashboard data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [userProfile, isLoadingStats, toast]);

  const fetchUsers = useCallback(async () => {
    if (!userProfile || userProfile.role !== 'admin' || isLoadingUsers) {
      return;
    }
    
    setIsLoadingUsers(true);
    try {
      const response = await apiClient.auth.getAllUsers();
      const formattedUsers = Array.isArray(response) ? response.map(user => ({
        id: user.id || user._id || user.uid || '',
        uid: user.uid || user.id || user._id || '',
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user'
      })) : [];
      
      setUsers(formattedUsers);
    } catch (error: unknown) {
      console.error("Error fetching users:", error);
      toast({
        title: "Failed to load users",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userProfile, isLoadingUsers, toast]);

  useEffect(() => {
    if (!initialCheckRef.current && userProfile === null) {
      initialCheckRef.current = true;
      refreshUserProfile().catch(error => {
        console.error("Error refreshing profile:", error);
      });
    }
  }, [refreshUserProfile, userProfile]);

  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    if (activeTab === 'dashboard' && !dataLoaded && !isLoadingStats) {
      fetchStats();
    }
  }, [activeTab, userProfile, dataLoaded, isLoadingStats, fetchStats]);

  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    if (activeTab === 'users' && !isLoadingUsers && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab, userProfile, users.length, isLoadingUsers, fetchUsers]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (userProfile && userProfile.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="inline-block p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
            <Shield className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-8">
            You need administrator privileges to access this page.
          </p>
          
          <div className="max-w-sm mx-auto mb-8">
            <MakeUserAdmin />
          </div>
          
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <DashboardSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <motion.div
        className="flex-1 min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90"
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : isSidebarOpen ? "16rem" : "4.5rem",
          width: isMobile ? "100%" : isSidebarOpen ? "calc(100% - 16rem)" : "calc(100% - 4.5rem)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <DashboardShell className="border-none">
          <DashboardHeader 
            heading={
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    System management and configurations
                  </p>
                </div>
              </div>
            }
            text=""
          >
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    await refreshUserProfile();
                    toast({
                      title: "Profile refreshed",
                      description: "User profile has been updated",
                    });
                  } catch (error) {
                    toast({
                      title: "Refresh failed",
                      description: `${error}`,
                      variant: "destructive",
                    });
                  }
                }}
                className="border border-border/40 shadow-sm hover:shadow hover:bg-background/80"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> 
                Refresh
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="shadow-sm hover:shadow bg-primary/90 hover:bg-primary"
              >
                Back to Dashboard
              </Button>
            </div>
          </DashboardHeader>

          <div className="container max-w-screen-xl mx-auto px-4 py-6">
            <div className="mb-6 flex items-center space-x-2">
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {userProfile?.role || 'Admin'}
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-background border">
                {userProfile?.email || 'Admin'}
              </div>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="space-y-8">
              <div className="bg-card rounded-xl p-1.5 shadow-sm border border-border/50">
                <TabsList className="grid w-full grid-cols-4 bg-transparent">
                  <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Dashboard</TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Users</TabsTrigger>
                  <TabsTrigger value="vendors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Vendors</TabsTrigger>
                  <TabsTrigger value="tools" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">Admin Tools</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="dashboard" className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium flex items-center">
                    <Server className="h-5 w-5 mr-2 text-primary" /> 
                    System Overview
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchStats()} 
                    disabled={isLoadingStats}
                    className="border border-border/40 shadow-sm hover:shadow hover:bg-background/80"
                  >
                    {isLoadingStats ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isLoadingStats ? ' Loading...' : ' Refresh'}
                  </Button>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {isLoadingStats ? (
                    Array(5).fill(0).map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-5 rounded-full" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-8 w-16 mb-1" />
                          <Skeleton className="h-4 w-28" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    stats.map((stat, i) => (
                      <Card key={i} className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/90 overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-[100px] -z-0" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                            {stat.icon}
                          </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <div className="text-3xl font-bold">{stat.value}</div>
                          <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                
                <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/90 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[200px] -z-0" />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm mr-3">
                        <ChevronRight className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>System events from the last 24 hours</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 hover:bg-background/40 p-2 rounded-lg transition-colors">
                        <div>
                          <p className="font-medium flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            System Status
                          </p>
                          <p className="text-sm text-muted-foreground">
                            API {apiStatus === 'online' ? 'online' : 'connection issue'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm px-2 py-1 rounded-md bg-background">{new Date().toLocaleTimeString()}</p>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-b border-border/40 pb-4 hover:bg-background/40 p-2 rounded-lg transition-colors">
                        <div>
                          <p className="font-medium flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            Dashboard Accessed
                          </p>
                          <p className="text-sm text-muted-foreground">Admin user logged in</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm px-2 py-1 rounded-md bg-background">{new Date().toLocaleTimeString()}</p>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="users" className="space-y-6">
                <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/90 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[200px] -z-0" />
                  <CardHeader className="flex flex-row items-center justify-between relative z-10">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm mr-3">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Manage system users and roles</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchUsers()} 
                      disabled={isLoadingUsers}
                      className="border border-border/40 shadow-sm hover:shadow hover:bg-background/80"
                    >
                      {isLoadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      {isLoadingUsers ? ' Loading...' : ' Refresh'}
                    </Button>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <UserManagement 
                      users={users}
                      isLoading={isLoadingUsers}
                      onUserUpdated={fetchUsers}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="vendors" className="space-y-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-card to-card/80">
                  <CardHeader>
                    <div className="flex items-center">
                      <div className="h-8 w-8 mr-2 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Vendor Management</CardTitle>
                        <CardDescription>Manage vendor information</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <VendorManagement />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="tools" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/90 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[120px] -z-0" />
                    <CardHeader className="relative z-10">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm mr-3">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Grant Admin Access</CardTitle>
                          <CardDescription>Promote users to administrators</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <MakeUserAdmin />
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-border/40 shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-card to-card/90 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[120px] -z-0" />
                    <CardHeader className="relative z-10">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm mr-3">
                          <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>System Information</CardTitle>
                          <CardDescription>Environment details</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-background/60 border border-border/30 shadow-sm hover:shadow transition-all">
                          <span className="font-medium flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            Environment
                          </span>
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium border border-primary/20">
                            {process.env.NODE_ENV}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-background/60 border border-border/30 shadow-sm hover:shadow transition-all">
                          <span className="font-medium flex items-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500 mr-2"></div>
                            API URL
                          </span>
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium truncate max-w-[200px] border border-primary/20" title={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}>
                            {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}
                          </span>
                        </div>
                        {/* <div className="flex justify-between items-center p-3 rounded-lg bg-background/60 border border-border/30 shadow-sm hover:shadow transition-all">
                          <span className="font-medium flex items-center">
                            <div className="h-2 w-2 rounded-full bg-orange-500 mr-2"></div>
                            API Status
                          </span>
                          <span className={`px-3 py-1 rounded-full ${apiStatus === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'} text-sm font-medium border ${apiStatus === 'online' ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
                            {apiStatus === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DashboardShell>
      </motion.div>
    </div>
  );
}
