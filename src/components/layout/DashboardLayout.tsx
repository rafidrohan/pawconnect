import React from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  MapPin, 
  Heart, 
  FolderOpen, 
  Bell, 
  BarChart3, 
  User, 
  Settings as SettingsIcon, 
  LogOut,
  Moon,
  Sun,
  Dog,
  LayoutDashboard,
  FileText,
  Search as SearchIcon,
  PawPrint,
  ChevronDown,
} from "lucide-react";
import stayUpdated from "@/assets/design/stay-updated.svg";
import { useTheme } from "@/components/providers/theme-provider";
import { getApiUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app/dashboard", activeColor: "text-green-600", activeBg: "bg-green-50 dark:bg-green-900/30", darkActiveColor: "dark:text-green-400" },
  { icon: PawPrint, label: "Report Lost Pet", path: "/app/report/lost", iconColor: "text-gray-400", activeColor: "text-red-600", activeBg: "bg-red-50 dark:bg-red-900/30", darkActiveColor: "dark:text-red-400" },
  { icon: PawPrint, label: "Report Found Pet", path: "/app/report/found", iconColor: "text-green-500", activeColor: "text-green-600", activeBg: "bg-green-50 dark:bg-green-900/30", darkActiveColor: "dark:text-green-400" },
  { icon: Heart, label: "View Matches", path: "/app/matches", activeColor: "text-purple-600", activeBg: "bg-purple-50 dark:bg-purple-900/30", darkActiveColor: "dark:text-purple-400" },
  { icon: FolderOpen, label: "My Cases", path: "/app/cases", activeColor: "text-indigo-600", activeBg: "bg-indigo-50 dark:bg-indigo-900/30", darkActiveColor: "dark:text-indigo-400" },
  { icon: SearchIcon, label: "Active Cases", path: "/app/cases/active", activeColor: "text-amber-600", activeBg: "bg-amber-50 dark:bg-amber-900/30", darkActiveColor: "dark:text-amber-400" },
  { icon: Bell, label: "Notifications", path: "/app/notifications", activeColor: "text-red-600", activeBg: "bg-red-50 dark:bg-red-900/30", darkActiveColor: "dark:text-red-400" },
  { icon: BarChart3, label: "Analytics", path: "/app/analytics", activeColor: "text-amber-600", activeBg: "bg-amber-50 dark:bg-amber-900/30", darkActiveColor: "dark:text-amber-400" },
  { icon: Dog, label: "My Pets", path: "/app/my-pets", activeColor: "text-rose-600", activeBg: "bg-rose-50 dark:bg-rose-900/30", darkActiveColor: "dark:text-rose-400" },
  { icon: User, label: "Profile", path: "/app/profile", activeColor: "text-slate-900", activeBg: "bg-slate-100 dark:bg-slate-800", darkActiveColor: "dark:text-white" },
  { icon: SettingsIcon, label: "Settings", path: "/app/settings", activeColor: "text-slate-900", activeBg: "bg-slate-100 dark:bg-slate-800", darkActiveColor: "dark:text-white" },
];

export default function DashboardLayout() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(getApiUrl("/api/notifications/unread-count"), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setUnreadCount(data.count);
      } catch (err) {}
    };
    fetchCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Page title inference based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/app/dashboard": return <div className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard <span className="text-amber-500">👋</span></div>;
      case "/app/report/lost": return <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="text-destructive w-6 h-6" /> Report Lost Pet</div>;
      case "/app/report/found": return <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="text-green-500 w-6 h-6" /> Report Found Pet</div>;
      case "/app/matches": return <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Heart className="text-purple-500 w-6 h-6" /> View Matches</div>;
      case "/app/cases": return <div className="text-2xl font-bold text-gray-900 dark:text-white">My Cases</div>;
      case "/app/cases/active": return <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><SearchIcon className="text-amber-500 w-6 h-6" /> Platform Active Cases</div>;
      case "/app/notifications": return <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Bell className="text-green-500 w-6 h-6" /> Notifications</div>;
      case "/app/analytics": return <div className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</div>;
      case "/app/profile": return <div className="text-2xl font-bold text-gray-900 dark:text-white">Profile</div>;
      case "/app/settings": return <div className="text-2xl font-bold text-gray-900 dark:text-white">Settings</div>;
      default: 
        if (location.pathname.startsWith('/app/cases/')) return <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 cursor-pointer" onClick={() => navigate('/app/cases')}>&larr; Back to My Cases</div>;
        return <div className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</div>;
    }
  };

  const getPageSub = () => {
    switch(location.pathname) {
      case "/app/report/lost": return "Provide accurate details to help us find your pet faster.";
      case "/app/report/found": return "Provide details about the found pet to reunite them with their owner.";
      case "/app/matches": return "Potential matches between lost and found pets";
      case "/app/cases": return "View and manage all your reported cases.";
      case "/app/notifications": return "Stay updated with the latest alerts and activities.";
      case "/app/analytics": return "Insights and statistics about lost & found pet cases";
      case "/app/profile": return "Manage your personal information and account settings.";
      case "/app/settings": return "Customize your preferences and application settings.";
      default:
        if (location.pathname.startsWith('/app/cases/')) return "Detailed information about the reported case.";
        return "";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1520] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#151a25] border-r border-slate-200 dark:border-slate-800 flex flex-col fixed inset-y-0 z-10 transition-colors">
        <div className="p-4 flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <PawPrint className="w-8 h-8 text-black dark:text-white fill-current" />
          <span className="flex items-center font-bold text-xl text-gray-900 dark:text-white">
            Paw<span className="text-green-500">Connect</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter(item => item.label !== "Analytics" || user.role?.toUpperCase() === "ADMIN")
            .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/app/cases"}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-2 rounded-xl text-[13.5px] font-bold transition-all ${
                  isActive
                    ? `${item.activeBg} ${item.activeColor} ${item.darkActiveColor}`
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon 
                  className={`w-5 h-5 ${item.iconColor || ""}`} 
                  {...(item.icon === PawPrint ? { fill: "currentColor" } : { strokeWidth: 2.5 })} 
                />
                {item.label}
              </div>
              {item.label === "Notifications" && unreadCount > 0 && (
                <span className="bg-[#ff5b5b] text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 rounded-xl text-[13.5px] font-bold transition-all text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" strokeWidth={2.5} />
              Logout
            </div>
          </button>
        </nav>

        {/* Sidebar Footer Illustration & Message */}
        <div className="px-4 py-4 mt-auto">
          <div className="relative group flex justify-center mb-1">
            <img src={stayUpdated} className="w-[70%] h-auto object-contain transition-transform group-hover:scale-110 duration-700" alt="Pets Illustration" />
          </div>
          <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100/50 dark:border-green-900/20 rounded-xl p-3 text-center">
            <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Every pet deserves<br />to be home <Heart className="w-3 h-3 inline fill-current text-red-500" />
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-w-0 bg-gray-50/50 dark:bg-[#0F172A] overflow-hidden min-h-screen">
        {/* Top Header - Now blended and aligned */}
        <header className="h-24 flex items-center sticky top-0 z-30 bg-gray-50/50 dark:bg-[#0F172A] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-8 w-full flex items-center justify-between">
            <div className="flex-1 max-w-xl hidden lg:block">
            <div className="relative group">
              <Input 
                placeholder="Search pets, cases, locations..." 
                className="w-full h-11 bg-gray-50 dark:bg-[#0F172A] border-gray-100 dark:border-gray-800 rounded-2xl pl-5 pr-12 text-sm focus:ring-2 focus:ring-purple-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/app/cases/active?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button 
              onClick={() => navigate('/app/notifications')}
              className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-[#ff6b6b] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#1A2234] px-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-green-500 transition-all rounded-full overflow-hidden">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Sarah Ahmed')}&background=random`} />
                    <AvatarFallback>{(user.name || 'Sarah Ahmed').split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">
                      {user.name || 'Sarah Ahmed'}
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      {user.role || 'Reporter'}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-gray-100 dark:border-gray-800 shadow-xl">
                <DropdownMenuLabel className="font-bold">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl cursor-pointer font-bold" onClick={() => navigate('/app/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl cursor-pointer font-bold" onClick={() => navigate('/app/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="rounded-xl cursor-pointer font-bold text-red-500 focus:text-red-500"
                  onClick={handleLogout}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto px-8 py-8 w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
