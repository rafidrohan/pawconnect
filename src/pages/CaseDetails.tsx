import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  ArrowLeft, 
  MapPin, 
  MoreVertical, 
  Edit, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  SearchCode,
  FileText,
  Heart,
  Loader2,
  Trash2,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { getApiUrl } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function CaseDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [caseItem, setCaseItem] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [caseRes, matchesRes] = await Promise.all([
          fetch(getApiUrl(`/api/cases/${id}`), {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(getApiUrl(`/api/cases/${id}/matches`), {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);

        if (caseRes.ok) {
          const data = await caseRes.json();
          setCaseItem(data);
          setActivePhoto(data.photos?.[0] || data.photo_url || null);
        }
        if (matchesRes.ok) {
          setMatches(await matchesRes.json());
        }
      } catch (err) {
        console.error("Error fetching case details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/cases/${id}/status`), {
        method: 'PUT',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setCaseItem({ ...caseItem, status });
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this case? This action cannot be undone.")) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/cases/${id}`), {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        navigate('/app/cases');
      }
    } catch (err) {
      console.error("Error deleting case:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Case not found</h2>
        <Button onClick={() => navigate('/app/cases')} className="mt-4">Back to My Cases</Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'REPORTED': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500">Reported</Badge>;
      case 'UNDER_REVIEW': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500">Under Review</Badge>;
      case 'MATCH_FOUND': return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-500">Potential Match</Badge>;
      case 'RECOVERED': return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500">Recovered</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/app/cases')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Cases
        </Button>
        <div className="flex gap-2">
           <Button 
            variant="outline" 
            disabled={isUpdating}
            onClick={() => navigate(`/app/report/${caseItem.case_type.toLowerCase()}?edit=${id}`)}
            className="bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-800 text-green-700 dark:text-green-500 font-semibold hover:bg-green-50 dark:hover:bg-green-900/20"
           >
             <Edit className="w-4 h-4 mr-2" /> Edit Case
           </Button>
           
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isUpdating} className="w-10 px-0 bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-800 text-gray-500">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-100 dark:border-gray-800">
                {caseItem.status !== 'RECOVERED' && (
                  <DropdownMenuItem onClick={() => handleStatusUpdate('RECOVERED')} className="text-green-600 dark:text-green-400 font-medium py-2.5">
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Recovered
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400 font-medium py-2.5">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Case
                </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Pet Details & Map) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] overflow-hidden">
            <div className="flex flex-col md:flex-row p-6 gap-8">
              {/* Images */}
              <div className="w-full md:w-1/2 space-y-3">
                <img 
                  src={activePhoto || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600"} 
                  alt="Pet" 
                  className="w-full aspect-square object-cover rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300" 
                />
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {caseItem.photos?.map((photo: string, i: number) => (
                    <img 
                      key={i} 
                      src={photo} 
                      alt={`Pet thumb \${i}`} 
                      onClick={() => setActivePhoto(photo)}
                      className={`w-16 h-16 shrink-0 object-cover rounded-xl border-2 transition-all cursor-pointer \${
                        activePhoto === photo ? 'border-green-500 scale-105' : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
                        {caseItem.pet_name || "Unknown Pet"}
                      </h1>
                      <p className="text-lg text-gray-500 font-medium capitalize">
                        {caseItem.breed} ({caseItem.species.toLowerCase()})
                      </p>
                    </div>
                    <Badge variant="outline" className={`font-bold uppercase tracking-widest text-xs px-3 py-1 \${
                      caseItem.case_type === 'LOST' 
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-500'
                        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-500'
                    }`}>
                      {caseItem.case_type}
                    </Badge>
                  </div>
                  <div className="flex justify-start mb-6">
                     {getStatusBadge(caseItem.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Case ID</p>
                      <p className="font-mono text-sm text-gray-900 dark:text-white font-medium">#{String(id).padStart(6, '0')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Reported on</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(caseItem.report_date), 'MMM dd, yyyy • hh:mm a')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">City</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Area</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.area}</p>
                    </div>
                    
                    <div className="col-span-2 h-px bg-gray-100 dark:bg-gray-800 my-2"></div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Species</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{caseItem.species.toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Gender</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{caseItem.gender.toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Age</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.age || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Color</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.color}</p>
                    </div>
                    
                    <div className="col-span-2">
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Distinctive Marks</p>
                       <p className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.distinguishing_marks || 'None reported'}</p>
                    </div>
                    {caseItem.case_type === 'LOST' && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Reward</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">৳ {caseItem.reward || 0}</p>
                      </div>
                    )}
                    {caseItem.case_type === 'FOUND' && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Found Condition</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.found_condition || 'Good'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Map Section */}
          <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Details</h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-2/3 h-[250px] bg-slate-200 dark:bg-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 opacity-40 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Dhaka&zoom=12&size=600x300&style=feature:all|element:labels|visibility:on')] bg-cover bg-center mix-blend-luminosity"></div>
                  <div className="absolute z-10 text-center">
                    <MapPin className="w-8 h-8 text-red-500 mx-auto drop-shadow-md animate-bounce" fill="white" />
                  </div>
                </div>
                
                <div className="w-full md:w-1/3 space-y-6 flex flex-col justify-center">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-1"><MapPin className="w-4 h-4 text-gray-400"/> City</p>
                    <p className="text-sm pl-6 text-gray-600 dark:text-gray-400">{caseItem.city}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-1"><MapPin className="w-4 h-4 text-gray-400"/> Area</p>
                    <p className="text-sm pl-6 text-gray-600 dark:text-gray-400">{caseItem.area}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Timeline - Simplified for real data */}
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Case Status</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Reported</p>
                    <p className="text-xs text-gray-500">{format(new Date(caseItem.report_date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                {caseItem.status === 'MATCH_FOUND' && (
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">Potential Match Identified</p>
                  </div>
                )}
                {caseItem.status === 'RECOVERED' && (
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Case Successfully Solved</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Potential Matches Box */}
          <Card className="border-0 shadow-sm bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4" /> Potential Matches ({matches.length})
              </h3>
              {matches.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No matches found yet. We'll notify you!</p>
              ) : (
                <div className="space-y-3">
                  {matches.map((match: any) => (
                    <div key={match.match_id} className="flex items-center justify-between bg-white dark:bg-[#1A2234] rounded-xl p-3 shadow-sm border border-purple-50 dark:border-purple-900/20">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 rounded-lg">
                          <AvatarImage src={match.other_img} />
                          <AvatarFallback>PET</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-xs text-gray-900 dark:text-white leading-tight capitalize">{match.other_breed} <span className="font-normal text-gray-500">({match.other_type.toLowerCase()})</span></p>
                          <p className="text-[10px] font-bold text-green-600 mt-0.5">{Math.round(match.match_score * 100)}% Match</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/app/matches`)} className="h-8 text-[10px] border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-900/30 dark:text-purple-300 px-3">View</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 group-hover:text-green-600 transition-all duration-300">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reporter Name</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {caseItem.reporter_name || "Anonymous User"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-all duration-300">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {caseItem.reporter_phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600 transition-all duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white break-all">
                      {caseItem.reporter_email || "No email available"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Notes */}
          <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Description & Notes</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {caseItem.description || "No additional description provided."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
