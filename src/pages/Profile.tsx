import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  FileText, 
  Heart, 
  MapPin, 
  CheckCircle,
  Bell,
  Lock,
  ChevronRight,
  Camera,
  Users,
  Calendar,
  Loader2,
  Save,
  X
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { getApiUrl } from "@/lib/api";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>({
    totalReports: 0,
    recovered: 0,
    matchesFound: 0,
    memberSince: new Date()
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [profileRes, statsRes, activityRes] = await Promise.all([
        fetch(getApiUrl("/api/user/profile"), {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(getApiUrl("/api/user/stats"), {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(getApiUrl("/api/my-cases?limit=3"), {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserData(profile);
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || ""
        });
      }

      if (statsRes.ok) {
        setUserStats(await statsRes.json());
      }

      if (activityRes.ok) {
        setRecentActivity(await activityRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch profile data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/api/user/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsEditing(false);
        // Update local storage if email or name changed
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({
          ...localUser,
          name: formData.name,
          email: formData.email
        }));
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top action */}
      <div className="flex justify-end mb-4">
        {isEditing ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: userData.name || "",
                  email: userData.email || "",
                  phone: userData.phone || ""
                });
              }}
              className="bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-800"
            >
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
              Save Changes
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="bg-white dark:bg-[#1A2234] border-green-200 text-green-700 dark:border-green-800 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30"
          >
            <Camera className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Info */}
        <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
          <div className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6">Profile Information</h3>
            <div className="flex flex-col xl:flex-row gap-6 items-start">
               <div className="relative">
                 <Avatar className="w-24 h-24 border-4 border-green-50 dark:border-green-900/20">
                   <AvatarImage src={`https://ui-avatars.com/api/?name=${userData?.name}&background=random`} />
                   <AvatarFallback>{userData?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                 </Avatar>
                 <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                   <Camera className="w-4 h-4" />
                 </button>
               </div>
               
               <div className="flex-1 space-y-4 w-full">
                 <div>
                   <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                   <Input 
                     value={formData.name} 
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                     className="mt-1 h-9 bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800 focus-visible:ring-green-500" 
                     readOnly={!isEditing} 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                   <Input 
                     value={formData.email} 
                     onChange={(e) => setFormData({...formData, email: e.target.value})}
                     className="mt-1 h-9 bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800 focus-visible:ring-green-500" 
                     readOnly={!isEditing} 
                   />
                 </div>
                 <div>
                   <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                   <Input 
                     value={formData.phone} 
                     onChange={(e) => setFormData({...formData, phone: e.target.value})}
                     className="mt-1 h-9 bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800 focus-visible:ring-green-500" 
                     readOnly={!isEditing} 
                   />
                 </div>
               </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
          <div className="p-6">
             <h3 className="font-bold text-gray-900 dark:text-white mb-6">Account Statistics</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Reports</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userStats.totalReports}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Recovered</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userStats.recovered}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Users className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Matches Found</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userStats.matchesFound}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                    <Calendar className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Member Since</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {userStats.memberSince ? format(new Date(userStats.memberSince), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
             </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
          <div className="p-6">
             <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
             <div className="space-y-2">
                {[
                  { icon: FileText, title: 'My Cases', sub: 'View and manage your reports', link: '/app/cases' },
                  { icon: Heart, title: 'View Matches', sub: 'See potential matches', link: '/app/matches' },
                  { icon: Bell, title: 'Notification Settings', sub: 'Manage your preferences', link: '/app/settings?tab=notifications' },
                  { icon: Lock, title: 'Update Password', sub: 'Change your account password', link: '/app/settings?tab=security' },
                ].map((action, i) => (
                  <button 
                    key={i} 
                    onClick={() => navigate(action.link)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-green-600 group-hover:bg-green-50 dark:group-hover:text-green-400 dark:group-hover:bg-green-900/20 transition-colors">
                         <action.icon className="w-5 h-5" />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900 dark:text-white">{action.title}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">{action.sub}</p>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
             </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 border-0 shadow-sm bg-white dark:bg-[#1A2234]">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <button 
              onClick={() => navigate('/app/cases')}
              className="text-sm text-green-600 font-medium hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
             {recentActivity.length === 0 ? (
               <div className="p-12 text-center">
                 <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                 <p className="text-gray-500 font-medium">No recent activity yet.</p>
               </div>
             ) : (
               recentActivity.map((act, i) => (
                  <div 
                    key={i} 
                    onClick={() => navigate(`/app/cases/${act.case_id}`)}
                    className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                         {act.case_type === 'LOST' ? <MapPin className="w-5 h-5 text-red-500" /> : <Heart className="w-5 h-5 text-green-500" />}
                       </div>
                       <div>
                         <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                           {act.case_type === 'LOST' ? 'Reported a lost pet' : 'Reported a found pet'}: {act.breed || act.species}
                         </p>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                           {format(new Date(act.report_date), "MMM d, yyyy • h:mm a")}
                         </p>
                       </div>
                    </div>
                    <Badge variant="outline" className={`hidden sm:inline-flex uppercase font-bold tracking-wider ${
                      act.status === 'RECOVERED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' :
                      act.case_type === 'LOST' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {act.status === 'RECOVERED' ? 'RECOVERED' : act.case_type}
                    </Badge>
                  </div>
               ))
             )}
          </div>
        </Card>

      </div>
    </div>
  );
}
