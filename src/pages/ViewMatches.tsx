import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Activity, 
  Star, 
  Lightbulb,
  PawPrint,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  Mail,
  Phone,
  User as UserIcon,
  Loader2,
  Heart,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "@/lib/api";

// --- Helpers ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- Dialog Components ---

function MatchDetailsDialog({ match, currentUser, onClose, onStatusUpdate }: { match: any, currentUser: any, onClose: () => void, onStatusUpdate: () => void }) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  if (!match) return null;

  const handleMarkRecovered = async () => {
    if (!match.match_id) {
      alert("Error: Match ID is missing. Please refresh the page.");
      console.error("Match object missing match_id:", match);
      return;
    }

    try {
      setIsUpdating(true);
      console.log(`Requesting recovery for match ${match.match_id}...`);
      const response = await fetch(getApiUrl(`/api/matches/${match.match_id}/recover`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
      onStatusUpdate();
    } catch (err) {
      console.error('Error marking as recovered:', err);
      alert(err instanceof Error ? err.message : 'Failed to mark as recovered. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-[#1A2234] rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Match Details</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Case Comparison</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* ... existing comparison grid ... */}
          {match.match_status === 'CONFIRMED' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-[24px] bg-green-50 dark:bg-green-900/10 border-2 border-green-100 dark:border-green-900/20 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                   <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Match Confirmed!</h4>
                    <p className="text-xs text-gray-500 font-medium">Contact details revealed below</p>
                  </div>
                </div>

                {match.lost_user_id === currentUser?.id && match.lost_status !== 'RECOVERED' && (
                  <Button 
                    size="sm"
                    onClick={handleMarkRecovered}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 font-bold shadow-lg shadow-green-200 dark:shadow-none"
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Heart className="w-4 h-4 mr-2" />}
                    Mark as Recovered
                  </Button>
                )}

                {match.lost_status === 'RECOVERED' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm">
                    <Heart className="w-4 h-4 fill-current" />
                    Recovered
                  </div>
                )}
              </div>

              {currentUser?.role?.toUpperCase() === 'ADMIN' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-full">
                       <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Lost Pet Reporter (Owner)</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Name</p>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{match.lost_user_name}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Email Address</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-500" />
                        <a href={`mailto:${match.lost_user_email}`} className="text-sm font-bold text-green-600 hover:underline">{match.lost_user_email}</a>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500" />
                        <a href={`tel:${match.lost_user_phone}`} className="text-sm font-bold text-green-600 hover:underline">{match.lost_user_phone || 'Not provided'}</a>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-full">
                       <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Found Pet Reporter</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Name</p>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{match.found_user_name}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Email Address</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-500" />
                        <a href={`mailto:${match.found_user_email}`} className="text-sm font-bold text-green-600 hover:underline">{match.found_user_email}</a>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500" />
                        <a href={`tel:${match.found_user_phone}`} className="text-sm font-bold text-green-600 hover:underline">{match.found_user_phone || 'Not provided'}</a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Name</p>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {match.lost_user_id === currentUser?.id ? match.found_user_name : match.lost_user_name}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Email Address</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-500" />
                      <a 
                        href={`mailto:${match.lost_user_id === currentUser?.id ? match.found_user_email : match.lost_user_email}`}
                        className="text-sm font-bold text-green-600 hover:underline"
                      >
                        {match.lost_user_id === currentUser?.id ? match.found_user_email : match.lost_user_email}
                      </a>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-green-100 dark:border-green-900/20">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Phone Number</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      <a 
                        href={`tel:${match.lost_user_id === currentUser?.id ? match.found_user_phone : match.lost_user_phone}`}
                        className="text-sm font-bold text-green-600 hover:underline"
                      >
                        {match.lost_user_id === currentUser?.id ? match.found_user_phone || 'Not provided' : match.lost_user_phone || 'Not provided'}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
            {/* VS Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white dark:bg-[#1A2234] border-4 border-gray-50 dark:border-slate-800 shadow-xl flex items-center justify-center">
                <span className="text-[15px] font-black text-purple-600">VS</span>
              </div>
            </div>

            {/* Lost Side */}
            <div className="space-y-6">
              <div className="relative group">
                <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white border-0 font-bold px-4 py-1 rounded-lg shadow-lg">LOST REPORT</Badge>
                <img 
                  src={match.lost_img || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600"} 
                  className="w-full aspect-video object-cover rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800"
                  alt="Lost Pet"
                />
              </div>
              
              <div className="space-y-4 px-2">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{match.lost_breed || match.lost_species}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Gender</p>
                    <p className="text-sm font-semibold dark:text-gray-300">{match.lost_gender}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Age</p>
                    <p className="text-sm font-semibold dark:text-gray-300">{match.lost_age || 'Adult'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Color</p>
                    <p className="text-sm font-semibold dark:text-gray-300">{match.lost_color}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Location</p>
                    <p className="text-sm font-semibold dark:text-gray-300 truncate">{match.lost_city}</p>
                  </div>
                </div>
                {match.lost_marks && (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                    <p className="text-[10px] text-purple-600 font-bold uppercase mb-1 flex items-center gap-2">
                      <Star className="w-3 h-3 fill-current" /> Distinctive Marks
                    </p>
                    <p className="text-sm text-purple-900 dark:text-purple-300 font-medium">{match.lost_marks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Found Side */}
            <div className="space-y-6">
              <div className="relative group">
                <Badge className="absolute top-4 left-4 z-10 bg-green-500 text-white border-0 font-bold px-4 py-1 rounded-lg shadow-lg">FOUND REPORT</Badge>
                <img 
                  src={match.found_img || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600"} 
                  className="w-full aspect-video object-cover rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800"
                  alt="Found Pet"
                />
              </div>
              
              <div className="space-y-4 px-2">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{match.found_breed || match.found_species}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Gender</p>
                    <p className="text-sm font-semibold dark:text-gray-300">{match.found_gender}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Age</p>
                    <p className="text-sm font-semibold dark:text-gray-300">{match.found_age || 'Adult'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Color</p>
                    <p className="text-sm font-semibold dark:text-gray-300">{match.found_color}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Location</p>
                    <p className="text-sm font-semibold dark:text-gray-300 truncate">{match.found_city}</p>
                  </div>
                </div>
                {match.found_marks && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1 flex items-center gap-2">
                      <Star className="w-3 h-3 fill-current" /> Reporter's Note
                    </p>
                    <p className="text-sm text-emerald-900 dark:text-emerald-300 font-medium">{match.found_marks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
           <Button variant="outline" onClick={onClose} className="rounded-xl px-8">Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewMatchDialog({ match, onReview, onClose, isProcessing }: { match: any, onReview: (status: string) => void, onClose: () => void, isProcessing: boolean }) {
  if (!match) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-[#1A2234] rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Review Potential Match</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Based on our comparison, there is a <span className="font-bold text-purple-600">{Math.round(match.match_score * 100)}%</span> probability that these reports refer to the same pet.
            </p>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-800">
             <div className="flex-1 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lost Report</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{match.lost_breed}</p>
             </div>
             <div className="flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-gray-300" />
             </div>
             <div className="flex-1 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Found Report</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{match.found_breed}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
             <Button 
               variant="outline" 
               className="h-12 rounded-2xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-950/20 font-bold"
               onClick={() => onReview('REJECTED')}
               disabled={isProcessing}
             >
               {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Not a Match'}
             </Button>
             <Button 
               className="h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/20 font-bold"
               onClick={() => onReview('CONFIRMED')}
               disabled={isProcessing}
             >
               {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Match'}
             </Button>
          </div>
          
          <button onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            DECIDE LATER
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main Component ---

export default function ViewMatches() {
  const [activeTab, setActiveTab] = useState("all");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [reviewMatch, setReviewMatch] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/api/matches"), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMatches(data);
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchMatches();
  }, []);

  const handleReview = async (status: string) => {
    if (!reviewMatch) return;
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/matches/${reviewMatch.match_id}/status`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setReviewMatch(null);
        await fetchMatches(); // Refresh list
      } else {
        const errorData = await res.json();
        console.error("Failed to update status:", errorData);
        alert(errorData.error || "Failed to update match status");
      }
    } catch (err) {
      console.error("Failed to update match status:", err);
      alert("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!window.confirm("Are you sure you want to delete this match record? This cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/matches/${matchId}`), {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchMatches();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete match");
      }
    } catch (err) {
      console.error("Delete match error:", err);
      alert("Network error. Please try again.");
    }
  };

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  const filteredMatches = matches.filter(m => {
    // Only show pending matches or all if needed? For now just filter by confidence
    const score = (m.match_score || 0) * 100;
    if (activeTab === "high") return score >= 90;
    if (activeTab === "medium") return score >= 70 && score < 90;
    if (activeTab === "low") return score < 70;
    return true;
  });

  const getConfidenceInfo = (score: number) => {
    const pct = score * 100;
    if (pct >= 90) return { 
      label: "High", 
      color: "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/30",
      confColor: "text-green-500 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/30"
    };
    if (pct >= 70) return { 
      label: "Medium", 
      color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/30",
      confColor: "text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/30"
    };
    return { 
      label: "Low", 
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30",
      confColor: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30"
    };
  };

  const dynamicTabs = [
    { id: "all", label: "All Matches", count: matches.length },
    { id: "high", label: "High Confidence", count: matches.filter(m => (m.match_score * 100) >= 90).length },
    { id: "medium", label: "Medium Confidence", count: matches.filter(m => (m.match_score * 100) >= 70 && (m.match_score * 100) < 90).length },
    { id: "low", label: "Low Confidence", count: matches.filter(m => (m.match_score * 100) < 70).length },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-600 text-white px-6 py-4 rounded-[24px] flex items-center justify-between shadow-lg shadow-purple-200 dark:shadow-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Admin Management Mode</h3>
              <p className="text-purple-100 text-xs font-medium">Viewing and managing all potential matches across the platform.</p>
            </div>
          </div>
          <Badge className="bg-white text-purple-600 hover:bg-white border-0 font-black px-4 py-1.5 rounded-xl">PLATFORM VIEW</Badge>
        </motion.div>
      )}

      {/* Premium Pill Tabs */}
      <div className="bg-white dark:bg-[#1A2234] border border-slate-100 dark:border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
        {dynamicTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap z-10 ${
              activeTab === tab.id
                ? "text-purple-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-purple-600/10 ring-1 ring-purple-600/20 rounded-xl z-[-1]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab.label}
            <span className={`px-2 py-0.5 rounded-xl text-[11px] transition-colors ${
              activeTab === tab.id ? "bg-purple-600 text-white" : "bg-gray-200 dark:bg-slate-800 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Scanning for matches...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1A2234] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
             <PawPrint className="w-10 h-10 text-slate-300" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No matches found yet</h3>
            <p className="text-gray-500 max-w-sm mt-2">Our matching engine is scanning every new report. You'll get a notification as soon as we find a potential hit!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match, index) => {
              const info = getConfidenceInfo(match.match_score);
              const isPending = match.match_status === 'PENDING';
              const isConfirmed = match.match_status === 'CONFIRMED';
              const isRejected = match.match_status === 'REJECTED';

              return (
                <motion.div
                  key={match.match_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow relative ${isRejected ? 'opacity-60 grayscale' : ''}`}>
                    
                    {/* Status Overlays */}
                    {isConfirmed && (
                      <div className="absolute top-4 right-4 z-20">
                         <Badge className="bg-green-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-lg border-0 animate-in zoom-in duration-300">
                           <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
                         </Badge>
                      </div>
                    )}
                    {isRejected && (
                      <div className="absolute top-4 right-4 z-20">
                         <Badge className="bg-red-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-lg border-0">
                           <X className="w-3.5 h-3.5" /> REJECTED
                         </Badge>
                      </div>
                    )}

                    {/* Header: Badges */}
                    <div className="p-4 flex justify-between items-center">
                      <Badge className={`px-3 py-1 rounded-lg text-[11px] font-bold border-0 ${info.color}`}>
                        {Math.round(match.match_score * 100)}% Match
                      </Badge>
                      {!isConfirmed && !isRejected && (
                        <Badge className={`px-3 py-1 rounded-lg text-[11px] font-bold border-0 ${info.confColor}`}>
                          <Star className="w-3 h-3 mr-1.5 fill-current" /> {info.label} Confidence
                        </Badge>
                      )}
                    </div>

                    {/* Main Content: Side-by-side comparison */}
                    <div className="px-4 pb-4 grid grid-cols-11 gap-1 relative">
                      {/* Lost Pet Panel */}
                      <div className="col-span-4 p-3 rounded-xl bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/10 flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-red-500 mb-3">Lost</span>
                        <img 
                          src={match.lost_img || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300"} 
                          alt="Lost" 
                          className="w-full aspect-square rounded-lg object-cover mb-3 shadow-sm" 
                        />
                        <h4 className="text-[12px] font-bold text-gray-900 dark:text-white mb-3 text-center leading-tight truncate w-full">{match.lost_breed}</h4>
                        
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <Activity className="w-3 h-3 text-purple-400" />
                            <span className="truncate capitalize">{match.lost_gender} • {match.lost_age || 'Adult'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <MapPin className="w-3 h-3 text-purple-400" />
                            <span className="truncate">{match.lost_city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center Score */}
                      <div className="col-span-3 flex flex-col items-center justify-center pt-8">
                         <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90">
                               <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                               <motion.circle 
                                  initial={{ strokeDashoffset: 175.9 }}
                                  animate={{ strokeDashoffset: 175.9 - (175.9 * match.match_score) }}
                                  transition={{ duration: 1.5 }}
                                  cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" fill="transparent" strokeDasharray={175.9} 
                                  className={isConfirmed ? "text-green-500" : isRejected ? "text-red-400" : "text-green-500"} 
                               />
                            </svg>
                            <span className={`absolute inset-0 flex items-center justify-center text-[15px] font-bold ${isConfirmed ? 'text-green-600' : isRejected ? 'text-red-500' : 'text-green-600'} dark:text-green-400`}>
                               {Math.round(match.match_score * 100)}%
                            </span>
                         </div>
                         <span className={`uppercase tracking-tighter text-center mt-2 text-[9px] font-bold ${
                           isConfirmed ? 'text-green-600' : isRejected ? 'text-red-500' : 'text-green-600 dark:text-green-400'
                         }`}>Score</span>
                         {match.lost_lat && match.found_lat && (
                           <div className="mt-2 text-[10px] font-black text-gray-500 flex items-center gap-1">
                             <MapPin className="w-3 h-3" />
                             {calculateDistance(match.lost_lat, match.lost_lng, match.found_lat, match.found_lng)?.toFixed(1)} km
                           </div>
                         )}
                      </div>

                      {/* Found Pet Panel */}
                      <div className="col-span-4 p-3 rounded-xl bg-green-50/50 dark:bg-green-950/10 border border-green-100/50 dark:border-green-900/10 flex flex-col items-center">
                        <span className="text-[10px] font-bold uppercase text-green-500 mb-3">Found</span>
                        <img 
                          src={match.found_img || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300"} 
                          alt="Found" 
                          className="w-full aspect-square rounded-lg object-cover mb-3 shadow-sm" 
                        />
                        <h4 className="text-[12px] font-bold text-gray-900 dark:text-white mb-3 text-center leading-tight truncate w-full">{match.found_breed}</h4>
                        
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            <span className="truncate capitalize">{match.found_gender} • {match.found_age || 'Adult'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span className="truncate">{match.found_city}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Date & Actions */}
                    <div className="mt-auto p-4 pt-2 border-t border-slate-50 dark:border-slate-800/50 flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        Matched {new Date(match.matched_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 h-9 rounded-xl border-purple-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 font-bold text-[11px] hover:bg-purple-50"
                          onClick={() => setSelectedMatch(match)}
                        >
                          View Details
                        </Button>
                        <Button 
                          className={`flex-1 h-9 rounded-xl font-bold text-[11px] shadow-sm ${
                            isConfirmed ? 'bg-green-600 hover:bg-green-700 text-white' : 
                            isRejected ? 'bg-red-500 hover:bg-red-600 text-white' : 
                            'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                          onClick={() => isConfirmed ? setSelectedMatch(match) : setReviewMatch(match)}
                          disabled={isRejected}
                        >
                          {isConfirmed ? 'View Contact Details' : isRejected ? 'Rejected' : 'Review Match'}
                        </Button>
                        {isAdmin && (
                          <Button 
                            variant="outline"
                            size="icon"
                            className="w-9 h-9 rounded-xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 shrink-0"
                            onClick={() => handleDeleteMatch(match.match_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Helper Tip */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-[#6366f1]/5 border border-[#6366f1]/10 rounded-[24px] p-6 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-[#6366f1]" />
        </div>
        <p className="text-sm text-[#6366f1]/80 font-medium leading-relaxed">
          <span className="font-bold">Tip:</span> Review the details carefully before confirming a match. You can contact the other party securely through the platform using the Review Match button.
        </p>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailsDialog 
            match={selectedMatch} 
            currentUser={currentUser}
            onClose={() => setSelectedMatch(null)} 
            onStatusUpdate={() => {
              fetchMatches();
              setSelectedMatch(null);
            }}
          />
        )}
        {reviewMatch && (
          <ReviewMatchDialog 
            match={reviewMatch} 
            onReview={handleReview}
            isProcessing={isProcessing}
            onClose={() => setReviewMatch(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
