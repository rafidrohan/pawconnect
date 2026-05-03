import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { 
  ArrowLeft, 
  MoreVertical, 
  Camera, 
  Calendar, 
  Palette, 
  Clock, 
  Edit2, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  User, 
  MapPin, 
  Eye,
  Heart,
  PawPrint,
  Dog,
  Loader2,
  Activity
} from "lucide-react";
import { getApiUrl } from "@/lib/api";

export default function PetProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPetData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [petRes, casesRes] = await Promise.all([
          fetch(getApiUrl(`/api/my-pets/${id}`), {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(getApiUrl(`/api/my-pets/${id}/cases`), {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);

        if (petRes.ok && casesRes.ok) {
          const petData = await petRes.json();
          const casesData = await casesRes.json();
          setPet(petData);
          setCases(casesData);
        } else {
          setError("Failed to load pet profile");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Connection error");
      } finally {
        setLoading(false);
      }
    };

    fetchPetData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this pet profile? This action cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/my-pets/${id}`), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        navigate("/app/my-pets");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Loading Pet Profile...</h2>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6">
          <PawPrint className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{error || "Pet Not Found"}</h2>
        <p className="text-gray-500 mb-8">We couldn't retrieve this pet profile. It may have been removed.</p>
        <Button onClick={() => navigate("/app/my-pets")} variant="outline" className="rounded-xl font-bold px-8 h-12">
          Back to My Pets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Back Button */}
      <button 
        onClick={() => navigate("/app/my-pets")}
        className="flex items-center gap-2 text-rose-500 font-bold hover:gap-3 transition-all mt-4 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to My Pets
      </button>

      {/* Header Profile Card */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Image Section */}
          <div className="relative w-full lg:w-[280px] h-[280px] shrink-0 rounded-2xl overflow-hidden group border border-gray-100 dark:border-gray-800">
            {pet.photo_url ? (
              <img 
                src={pet.photo_url} 
                alt={pet.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center text-gray-300 gap-3">
                <Dog className="w-16 h-16 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Photo</span>
              </div>
            )}
          </div>

          {/* Identity Details */}
          <div className="flex-1 flex flex-col justify-between py-2">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{pet.name}</h1>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${pet.gender === 'MALE' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/30' : 'bg-rose-50 text-rose-500 dark:bg-rose-900/30'}`}>
                      {pet.gender === 'MALE' ? '♂' : pet.gender === 'FEMALE' ? '♀' : '?'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 font-bold">
                    <Dog className="w-4.5 h-4.5" />
                    {pet.breed} • {pet.species}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:border-green-900/30 font-bold px-4 py-1.5 rounded-xl border shadow-none">
                    Registered
                  </Badge>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-400">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: Calendar, label: "Age Range", value: pet.age, color: "text-blue-500", bg: "bg-blue-50/50 dark:bg-blue-900/10" },
                  { icon: Palette, label: "Color", value: pet.color, color: "text-amber-500", bg: "bg-amber-50/50 dark:bg-amber-900/10" },
                  { icon: ShieldCheck, label: "Gender", value: pet.gender, color: "text-rose-500", bg: "bg-rose-50/50 dark:bg-rose-900/10" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 dark:bg-slate-800/30">
                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-[14px] truncate">{item.value}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-8 text-gray-400 font-bold text-[13px]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Registered on: {new Date(pet.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Profile
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 lg:mt-0">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/app/report/lost?petId=${id}`)}
                className="h-12 rounded-xl border-orange-100 dark:border-orange-900/20 text-orange-600 bg-orange-50/30 dark:bg-orange-950/20 font-bold flex items-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all shadow-none"
              >
                <Plus className="w-4.5 h-4.5" />
                Report as Lost
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/app/my-pets/edit/${id}`)}
                className="h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800/50 font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-none"
              >
                <Edit2 className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="h-12 rounded-xl border-red-100 dark:border-red-900/20 text-red-500 bg-red-50/30 dark:bg-red-950/20 font-bold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-none"
              >
                <Trash2 className="w-4.5 h-4.5" />
                Delete Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* About Card */}
        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl p-6 overflow-hidden flex flex-col h-full">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Detailed Information</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800/80 flex-1">
            {[
              { label: "Pet Name", value: pet.name, icon: Heart, color: "text-rose-500", bg: "bg-rose-50/50" },
              { label: "Species", value: pet.species, icon: Dog, color: "text-purple-500", bg: "bg-purple-50/50" },
              { label: "Breed", value: pet.breed, icon: PawPrint, color: "text-blue-500", bg: "bg-blue-50/50" },
              { label: "Gender", value: pet.gender, icon: User, color: "text-blue-400", bg: "bg-blue-50/50" },
              { label: "Age Range", value: pet.age, icon: Calendar, color: "text-amber-500", bg: "bg-amber-50/50" },
              { label: "Color", value: pet.color, icon: Palette, color: "text-amber-600", bg: "bg-amber-50/50" },
              { label: "Distinctive Marks", value: pet.distinguishing_marks || "None listed", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50/50" },
            ].map((item, i) => (
              <div key={i} className="py-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} dark:bg-slate-800 flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-[14px] font-bold text-gray-500 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="text-[14px] font-bold text-gray-900 dark:text-white text-right max-w-[240px]">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Identification & Activity Card */}
        <div className="space-y-6">
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl p-6">
             <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Pet Identification</h3>
             <div className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                   <PawPrint className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile ID</p>
                  <p className="text-xl font-black text-rose-500 tracking-tight">PET-{(id || "").toString().padStart(6, '0')}</p>
                </div>
             </div>
          </Card>

          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-rose-50/30 dark:bg-rose-950/20 rounded-2xl p-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">Active Protection</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mt-1">
                  This pet is listed in our secure database. In case of disappearance, you can quickly convert this profile into a Lost Report.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Linked Cases Section */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Linked Case History</h3>
          <Badge className="bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400 font-bold">
            {cases.length} Case{cases.length !== 1 && 's'}
          </Badge>
        </div>
        
        {cases.length > 0 ? (
          <div className="space-y-4">
            {cases.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-gray-50/30 dark:bg-slate-800/30 rounded-2xl border border-gray-50 dark:border-gray-800 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                <div className="flex items-center gap-8 flex-1">
                  <Badge className={`w-20 py-2 rounded-lg border-0 font-black text-[10px] uppercase tracking-wider justify-center ${item.case_type === 'LOST' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                    {item.case_type}
                  </Badge>
                  <div className="space-y-1">
                    <h4 className="text-[16px] font-black text-gray-900 dark:text-white">Case ID: {item.case_id}</h4>
                    <div className="flex items-center gap-6 text-[12px] text-gray-400 font-bold">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{item.area}, {item.city}</div>
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(item.report_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] font-bold text-gray-400 mb-1">Status</p>
                    <Badge className="bg-rose-50 text-rose-500 dark:bg-rose-950/30 font-bold border-0">
                      {item.status}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => navigate(`/app/cases/${item.case_id}`)}
                    variant="outline" 
                    className="h-11 px-6 rounded-xl border-rose-100 text-rose-500 font-bold bg-white hover:bg-rose-50 transition-all flex items-center gap-2 shadow-none"
                  >
                    <Eye className="w-5 h-5" />
                    View Case
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50/30 dark:bg-slate-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
             <Plus className="w-10 h-10 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-500 font-bold">No linked cases found for this pet.</p>
             <p className="text-xs text-gray-400 mt-1">Cases will appear here if you ever report this pet as lost or found.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
