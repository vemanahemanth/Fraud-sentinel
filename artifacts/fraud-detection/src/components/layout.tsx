import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShieldAlert, Activity, Briefcase, FileSearch, Users, 
  Store, FileText, BarChart3, BrainCircuit, History, 
  MessageSquareWarning, Settings, LogOut 
} from "lucide-react";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Monitor", path: "/", icon: Activity },
  { title: "Alerts", path: "/alerts", icon: ShieldAlert },
  { title: "Cases", path: "/cases", icon: Briefcase },
  { title: "Rules", path: "/rules", icon: FileSearch },
  { title: "Users", path: "/users", icon: Users },
  { title: "Merchants", path: "/merchants", icon: Store },
  { title: "SAR Filings", path: "/sar", icon: FileText },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
  { title: "ML Models", path: "/model-performance", icon: BrainCircuit },
  { title: "Investigations", path: "/investigation", icon: History },
  { title: "Communications", path: "/communications", icon: MessageSquareWarning },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background text-foreground flex overflow-hidden selection:bg-primary/30">
        <Sidebar className="border-r border-border/40 bg-sidebar">
          <SidebarHeader className="px-4 py-4 border-b border-border/40">
            <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <span>Aegis Command</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-mono">Fraud Ops Center</div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Core Systems</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.path}
                        className="hover:bg-accent/50 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      >
                        <Link href={item.path} className="flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/40 p-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-destructive hover:text-destructive/80 cursor-pointer transition-colors mt-4">
              <LogOut className="h-4 w-4" />
              <span>Disconnect</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
