import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Palette, 
  User, 
  ShieldCheck,
  Lightbulb,
  RefreshCcw,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { getApiUrl } from "@/lib/api";
import { useSearchParams } from "react-router-dom";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "security");

  React.useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus({ type: 'error', message: "New passwords do not match" });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/api/user/password"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: "Password updated successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setStatus({ type: 'error', message: data.error || "Failed to update password" });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    // { id: 'general', label: 'General', icon: SettingsIcon, desc: 'Manage general settings' },
    // { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Configure notification preferences' },
    // { id: 'privacy', label: 'Privacy', icon: Lock, desc: 'Manage privacy and data' },
    // { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Customize theme and display' },
    // { id: 'account', label: 'Account', icon: User, desc: 'Manage your account' },
    { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Change password and security' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      
      {/* Settings Navigation */}
      <div className="w-full md:w-80 flex flex-col gap-2 shrink-0 overflow-y-auto pr-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-start gap-4 w-full p-4 rounded-xl text-left transition-colors ${
              activeTab === tab.id 
                ? 'bg-green-50 dark:bg-[#1A2234] border border-green-200 dark:border-green-900/50' 
                : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
            }`}
          >
            <tab.icon className={`w-6 h-6 shrink-0 mt-0.5 ${activeTab === tab.id ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'}`} />
            <div>
               <p className={`font-bold ${activeTab === tab.id ? 'text-green-800 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>{tab.label}</p>
               <p className={`text-xs ${activeTab === tab.id ? 'text-green-600/80 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>{tab.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        {/* 
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">General Settings</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                   <Label className="text-gray-700 dark:text-gray-300">Language</Label>
                   <Select defaultValue="en">
                      <SelectTrigger className="bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="bn">Bengali</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-gray-700 dark:text-gray-300">Time Zone</Label>
                   <Select defaultValue="dhaka">
                      <SelectTrigger className="bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800">
                        <SelectValue placeholder="Select Time Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dhaka">(GMT+06:00) Dhaka, Bangladesh</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-gray-700 dark:text-gray-300">Date Format</Label>
                   <Select defaultValue="mmddyyyy">
                      <SelectTrigger className="bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800">
                        <SelectValue placeholder="Select Date Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2 md:col-span-3 lg:col-span-1">
                   <Label className="text-gray-700 dark:text-gray-300">Items per page</Label>
                   <Select defaultValue="10">
                      <SelectTrigger className="bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800">
                        <SelectValue placeholder="Items per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
              </div>
            </Card>

            <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Other Preferences</h3>
              </div>
              <div className="p-6 space-y-4">
                 {[
                   { icon: Lightbulb, label: 'Show tips and suggestions', enabled: true },
                   { icon: RefreshCcw, label: 'Auto refresh dashboard', enabled: true },
                   { icon: Trash2, label: 'Confirm before deleting', enabled: true },
                 ].map((pref, i) => (
                   <div key={i} className="flex items-center justify-between py-2">
                     <div className="flex items-center gap-4 text-gray-700 dark:text-gray-200 font-medium">
                       <pref.icon className="w-5 h-5 text-gray-400" /> {pref.label}
                     </div>
                     <div className={`w-12 h-6 rounded-full p-1 cursor-pointer flex ${pref.enabled ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                     </div>
                   </div>
                 ))}
              </div>
            </Card>
          </div>
        )}
        */}

        {activeTab === 'security' && (
          <div className="space-y-6">
             <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Update Password</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4 max-w-md">
                   {status.type && (
                     <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-sm font-medium">{status.message}</p>
                     </div>
                   )}

                   <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Current Password</Label>
                      <Input 
                        type="password" 
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800"
                        placeholder="••••••••"
                      />
                   </div>

                   <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">New Password</Label>
                      <Input 
                        type="password" 
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800"
                        placeholder="••••••••"
                      />
                   </div>

                   <div className="space-y-2">
                      <Label className="text-gray-700 dark:text-gray-300">Confirm New Password</Label>
                      <Input 
                        type="password" 
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="bg-gray-50 dark:bg-[#151a25] border-gray-200 dark:border-gray-800"
                        placeholder="••••••••"
                      />
                   </div>

                   <div className="pt-2">
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto px-8"
                      >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update Password
                      </Button>
                   </div>
                </form>
             </Card>

             {/* 
             <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Security</h3>
                </div>
                <div className="p-6 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                         <p className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account.</p>
                      </div>
                      <Button variant="outline" disabled className="border-gray-200 dark:border-gray-800">Enable 2FA</Button>
                   </div>
                   <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                           <p className="font-bold text-gray-900 dark:text-white">Active Sessions</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Manage and sign out of your active sessions on other devices.</p>
                        </div>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">Sign out all other devices</Button>
                      </div>
                   </div>
                </div>
             </Card>
             */}
          </div>
        )}
      </div>
    </div>
  );
}
