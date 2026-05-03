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
  CheckCircle,
  Lock,
  PawPrint
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

export default function CaseDetails({ isPublicView = false }: { isPublicView?: boolean }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [caseItem, setCaseItem] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

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

  useEffect(() => {
    if (caseItem?.latitude !== null && caseItem?.longitude !== null && caseItem?.latitude !== undefined && caseItem?.longitude !== undefined) {
      // Load Leaflet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        const L = (window as any).L;
        const lat = Number(caseItem.latitude);
        const lng = Number(caseItem.longitude);
        const map = L.map('case-map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const markerIcon = L.divIcon({
          html: `<div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        L.marker([lat, lng], { icon: markerIcon }).addTo(map);
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(link);
        document.head.removeChild(script);
      };
    }
  }, [caseItem]);

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

  const isAdmin = currentUser.role?.toUpperCase() === 'ADMIN';
  const isOwner = caseItem.reporter_user_id === currentUser.user_id;
  const canSeeContact = isAdmin || isOwner || caseItem.has_confirmed_match;

  const steps = [
    { label: 'Reported', status: 'REPORTED', color: 'bg-blue-500', icon: FileText },
    { label: 'Under Review', status: 'UNDER_REVIEW', color: 'bg-amber-500', icon: SearchCode },
    { label: 'Match Found', status: 'MATCH_FOUND', color: 'bg-purple-500', icon: Heart },
    { label: 'Recovered', status: 'RECOVERED', color: 'bg-green-500', icon: CheckCircle },
  ];

  const currentStepIdx = steps.findIndex(s => s.status === caseItem.status);

  return (
    <div className={`min-h-screen ${isPublicView ? 'bg-white dark:bg-[#0f172a]' : ''}`}>
      {isPublicView && (
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2 font-bold text-2xl text-gray-900 dark:text-white cursor-pointer" onClick={() => navigate('/')}>
            <PawPrint className="w-8 h-8 text-black dark:text-white fill-current" />
            <span className="flex items-center">Paw<span className="text-green-500">Connect</span></span>
          </div>
          <Button variant="ghost" className="rounded-xl font-bold gap-2" onClick={() => navigate('/cases')}>
            <ArrowLeft className="w-4 h-4" /> Back to Registry
          </Button>
        </nav>
      )}

      <div className={`space-y-6 max-w-6xl mx-auto pb-12 ${isPublicView ? 'px-6 mt-8' : ''}`}>
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {(isAdmin || isOwner) && (
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
              {matches.some(m => m.match_status === 'CONFIRMED') && caseItem.status !== 'RECOVERED' && (
                <Button 
                  variant="outline"
                  disabled={isUpdating}
                  onClick={async () => {
                    const confirmedMatch = matches.find(m => m.match_status === 'CONFIRMED');
                    if (!confirmedMatch) return;
                    setIsUpdating(true);
                    try {
                      const token = localStorage.getItem("token");
                      const res = await fetch(getApiUrl(`/api/matches/${confirmedMatch.match_id}/recover`), {
                        method: 'PUT',
                        headers: { "Authorization": `Bearer ${token}` }
                      });
                      if (res.ok) window.location.reload();
                    } catch (err) {
                      console.error("Recovery failed:", err);
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white border-0 font-bold px-6 shadow-lg shadow-green-100 dark:shadow-none"
                >
                  <Heart className="w-4 h-4 mr-2 fill-current" /> Mark Both as Recovered
                </Button>
              )}
            </div>
          )}
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
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {caseItem.photos?.map((photo: string, i: number) => (
                      <img 
                        key={i} 
                        src={photo} 
                        alt={`Thumb ${i}`} 
                        onClick={() => setActivePhoto(photo)}
                        className={`w-16 h-16 shrink-0 object-cover rounded-xl border-2 transition-all cursor-pointer ${
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
                      <Badge variant="outline" className={`font-bold uppercase tracking-widest text-xs px-3 py-1 ${
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
                          {format(new Date(caseItem.report_date), 'MMM dd, yyyy')}
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Gender</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{caseItem.gender.toLowerCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Color</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{caseItem.color}</p>
                      </div>
                      {Number(caseItem.reward) > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Reward</p>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">৳ {caseItem.reward}</p>
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
                  <div className="w-full md:w-2/3 h-[250px] bg-slate-200 dark:bg-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center group">
                    {caseItem.latitude ? (
                      <div id="case-map" className="absolute inset-0 w-full h-full z-0" />
                    ) : (
                      <>
                        <img 
                          src={`https://maps.googleapis.com/maps/api/staticmap?center=${caseItem.city}&zoom=12&size=600x300&style=feature:all|element:labels|visibility:on`} 
                          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity" 
                          alt="Map"
                        />
                        <div className="absolute z-10 text-center">
                          <MapPin className="w-8 h-8 text-red-500 mx-auto drop-shadow-md animate-bounce" fill="white" />
                        </div>
                      </>
                    )}
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
                    {caseItem.latitude && (
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-1"><SearchCode className="w-4 h-4 text-gray-400"/> Coordinates</p>
                        <p className="text-[10px] font-mono pl-6 text-gray-500">{Number(caseItem.latitude).toFixed(6)}, {Number(caseItem.longitude).toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Timeline - Growing Logic */}
            <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Case Status</h3>
                <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                  {steps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    
                    return (
                      <div key={idx} className={`relative pl-8 transition-all duration-300 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`absolute left-0 w-[24px] h-[24px] rounded-full flex items-center justify-center z-10 ${
                          isCompleted ? `${step.color} text-white` : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-[10px] font-bold text-green-500 mt-0.5">CURRENT STEP</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                            <p className="font-bold text-xs text-gray-900 dark:text-white leading-tight capitalize">{match.other_breed}</p>
                            <p className="text-[10px] font-bold text-green-600 mt-0.5">{Math.round(match.match_score * 100)}% Match</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate(`/app/matches`)} 
                            className="h-8 text-[10px] border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-900/30 dark:text-purple-300 px-3"
                          >
                            View
                          </Button>
                          {isAdmin && match.match_status !== 'CONFIRMED' && (
                            <Button 
                              size="sm" 
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem("token");
                                  const res = await fetch(getApiUrl(`/api/matches/${match.match_id}/status`), {
                                    method: 'PUT',
                                    headers: { 
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}` 
                                    },
                                    body: JSON.stringify({ status: 'CONFIRMED' })
                                  });
                                  if (res.ok) {
                                    // Refresh the page data
                                    window.location.reload();
                                  }
                                } catch (err) {
                                  console.error("Quick approve failed:", err);
                                }
                              }}
                              className="h-8 text-[10px] bg-green-600 hover:bg-green-700 text-white px-3 font-bold"
                            >
                              Confirm
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info - Privacy Gated */}
            <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center justify-between">
                  Contact Information
                  {!canSeeContact && <Lock className="w-4 h-4 text-amber-500" />}
                </h3>
                
                {canSeeContact ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-5 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 group-hover:text-green-600 transition-all duration-300">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reporter Name</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">{caseItem.reporter_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 transition-all duration-300">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">{caseItem.reporter_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600 transition-all duration-300">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white break-all">{caseItem.reporter_email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-gray-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                    <Lock className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Contact details are hidden for privacy. They will be revealed once a match is <b>confirmed</b>.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Description & Notes - Full Width at Bottom */}
        <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden mt-6">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Description & Notes</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {caseItem.description || "No additional description provided."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
