import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Heart, 
  CheckCircle2, 
  Clock, 
  FileText, 
  BarChart3, 
  Search, 
  Settings, 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Check,
  ChevronDown,
  Activity,
  MoreVertical,
  Star,
  Loader2,
  Info
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "../components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { getApiUrl } from "@/lib/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(getApiUrl("/api/notifications"), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Error fetching notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.notification_id);
      if (unreadIds.length === 0) return;

      const token = localStorage.getItem("token");
      await Promise.all(unreadIds.map(id => 
        fetch(getApiUrl(`/api/notifications/${id}/read`), { 
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` }
        })
      ));

      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error("Error marking as read", err);
    }
  };

  const getIcon = (msg: string) => {
    if (msg.toLowerCase().includes('match')) return <Heart className="w-4 h-4 text-red-500" fill="currentColor"/>;
    if (msg.toLowerCase().includes('recovered')) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <Bell className="w-4 h-4 text-blue-500" />;
  };

  const getColor = (msg: string) => {
    if (msg.toLowerCase().includes('match')) return 'bg-red-50 dark:bg-red-950/20';
    if (msg.toLowerCase().includes('recovered')) return 'bg-green-50 dark:bg-green-950/20';
    return 'bg-blue-50 dark:bg-blue-950/20';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600">
            <Bell className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Stay updated with the latest alerts and activities.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Feed Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-4">
             <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
               You have <span className="text-red-500">{notifications.filter(n => !n.is_read).length}</span> unread notifications
             </p>
             <Button 
               variant="ghost" 
               className="text-sm font-bold text-gray-500 hover:text-red-600 flex items-center gap-2 hover:bg-transparent px-0"
               onClick={markAllAsRead}
             >
               <Check className="w-4 h-4" /> Mark all as read
             </Button>
          </div>

          <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden min-h-[400px]">
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {loading ? (
                <div className="flex items-center justify-center py-40">
                  <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-center px-6">
                  <Bell className="w-12 h-12 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">No notifications yet.</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notif, index) => (
                    <motion.div
                      key={notif.notification_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-6 flex items-center justify-between group hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors ${!notif.is_read ? 'bg-white dark:bg-[#1A2234]' : 'bg-white/40 dark:bg-slate-800/10'}`}
                    >
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${getColor(notif.message)}`}>
                          {getIcon(notif.message)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[15px] ${!notif.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-600 dark:text-gray-400'}`}>
                            {notif.message.includes('match') ? 'Potential Match Found' : 'Notification'}
                          </h4>
                          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 shrink-0 ml-6">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </span>
                          <div className={`w-2 h-2 rounded-full bg-red-500 ${notif.is_read ? 'opacity-0' : 'opacity-100'} shadow-[0_0_8px_rgba(239,68,68,0.5)]`} />
                        </div>
                        
                        {notif.message.includes('match') && (
                          <Button variant="outline" size="sm" className="h-9 px-5 rounded-xl border-red-100 dark:border-gray-700 text-red-600 dark:text-red-400 font-bold text-[12px] hover:bg-red-50">
                            View Match
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>

          <div className="flex justify-center pt-4">
            <Button variant="outline" className="h-10 px-8 rounded-lg border-gray-100 dark:border-gray-800 text-gray-500 font-bold text-[13px] bg-white dark:bg-[#1A2234] hover:bg-gray-50">
              Load more <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="lg:col-span-4 space-y-6 sticky top-28 mt-12">
          <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-50 dark:border-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">Filter Notifications</h3>
            </div>
            <CardContent className="p-2">
               {[
                 { label: 'All Notifications', count: 12, active: true, icon: <Activity className="w-4 h-4"/> },
                 { label: 'Unread', count: 3, active: false, icon: <Mail className="w-4 h-4"/> },
                 { label: 'Matches', count: 4, active: false, icon: <Heart className="w-4 h-4"/> },
                 { label: 'Updates', count: 3, active: false, icon: <Clock className="w-4 h-4"/> },
                 { label: 'System', count: 2, active: false, icon: <Settings className="w-4 h-4"/> },
               ].map((filter, i) => (
                  <button key={i} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${filter.active ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                    <div className="flex items-center gap-3">
                      {filter.icon}
                      {filter.label}
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] ${filter.active ? 'bg-red-200/50 text-red-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>
                      {filter.count}
                    </span>
                  </button>
               ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-50 dark:border-gray-800/50">
              <h3 className="font-bold text-gray-900 dark:text-white">Notification Preferences</h3>
              <p className="text-[11px] text-gray-500 font-semibold mt-1">Manage how you receive notifications</p>
            </div>
            <CardContent className="p-5 space-y-5">
               {[
                 { label: 'Email Notifications', icon: <Mail className="w-4 h-4" /> },
                 { label: 'SMS Notifications', icon: <MessageSquare className="w-4 h-4" /> },
                 { label: 'Push Notifications', icon: <Smartphone className="w-4 h-4" /> },
               ].map((pref, i) => (
                 <div key={i} className="flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center text-gray-400 group-hover:text-red-500 transition-colors">
                        {pref.icon}
                     </div>
                     <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">{pref.label}</span>
                   </div>
                   
                   {/* Custom Toggle Switch */}
                   <div className="w-11 h-6 bg-red-500 dark:bg-red-600 rounded-full p-1 cursor-pointer flex justify-end shadow-inner">
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                   </div>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
