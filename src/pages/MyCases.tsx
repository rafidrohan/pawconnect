import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  Search, 
  Plus, 
  MapPin, 
  SearchCode, 
  Calendar, 
  Clock, 
  MoreVertical, 
  FolderOpen,
  Loader2, 
  Info 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { format } from "date-fns";
import { getApiUrl } from "@/lib/api";

export default function MyCases() {
  const navigate = useNavigate();
  const [cases, setCases] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [filter, setFilter] = React.useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState("newest");
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [stats, setStats] = React.useState({ all: 0, lost: 0, found: 0 });
  const LIMIT = 10;
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role?.toUpperCase() === 'ADMIN';

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/api/my-cases/stats"), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (err) {}
  };

  const fetchMyCases = async (isLoadMore = false, currentFilter = filter) => {
    if (isLoadMore) setLoadingMore(true);
    else {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem("token");
      const currentOffset = isLoadMore ? (page + 1) * LIMIT : 0;
      
      const [statsRes, casesRes] = await Promise.all([
        fetch(getApiUrl("/api/my-cases/stats"), { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(getApiUrl(`/api/my-cases?limit=${LIMIT}&offset=${currentOffset}&type=${currentFilter}&search=${searchQuery}`), {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      let currentStats = stats;
      if (statsRes.ok) {
        currentStats = await statsRes.json();
        setStats(currentStats);
      }

      if (casesRes.ok) {
        const data = await casesRes.json();
        const updatedCases = isLoadMore ? [...cases, ...data] : data;
        
        setCases(updatedCases);
        if (isLoadMore) setPage(prev => prev + 1);
        else setPage(0);

        // Determine hasMore based on total count from stats
        const totalForFilter = currentFilter === 'ALL' ? currentStats.all : 
                             currentFilter === 'LOST' ? currentStats.lost : 
                             currentStats.found;
        setHasMore(updatedCases.length < totalForFilter);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  React.useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchMyCases(false, filter);
  }, [filter]);

  const handleFilterChange = (newFilter: 'ALL' | 'LOST' | 'FOUND') => {
    setFilter(newFilter);
    // useEffect handles the rest
  };

  const handleMarkAsSolved = async (caseId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/cases/${caseId}/status`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'RECOVERED' })
      });
      if (res.ok) {
        fetchStats();
        fetchMyCases();
      }
    } catch (err) {
      console.error("Error marking as solved:", err);
    }
  };

  const handleDelete = async (caseId: number) => {
    if (!confirm("Are you sure you want to delete this case?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/api/cases/${caseId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStats();
        setCases(prev => prev.filter(c => c.case_id !== caseId));
      }
    } catch (err) {
      console.error("Error deleting case:", err);
    }
  };

  const sortedCases = [...cases].sort((a, b) => {
    const dateA = new Date(a.report_date).getTime();
    const dateB = new Date(b.report_date).getTime();
    return sortBy === "newest" ? dateB - dateA : dateA - dateB;
  });

  const getStatusBadge = (status: string) => {
    switch(status.toUpperCase()) {
      case 'REPORTED': return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-500 py-1">Reported</Badge>;
      case 'UNDER_REVIEW': return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-500 py-1">Under Review</Badge>;
      case 'MATCH_FOUND': return <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400 py-1">Potential Match</Badge>;
      case 'RECOVERED': return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-500 py-1">Recovered</Badge>;
      case 'CLOSED': return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-slate-800 dark:text-gray-400 py-1">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1A2234] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isAdmin ? "System Case Management" : "My Case Reports"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isAdmin 
              ? "Administrator view: Managing all pet recovery cases across the platform" 
              : "Track and manage the pets you've reported as lost or found"}
          </p>
        </div>
        {isAdmin && (
           <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Admin Live Monitor</span>
           </div>
        )}
      </div>
      
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 w-full sm:w-auto">
          <Button 
            onClick={() => handleFilterChange('ALL')}
            disabled={stats.all === 0}
            className={`rounded-full px-6 py-2 h-11 border transition-all flex items-center gap-3 font-bold ${
              filter === 'ALL' 
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-[#064e3b]/30 dark:border-[#10b981]/50 dark:text-[#10b981]' 
                : 'bg-white border-gray-200 text-gray-900 dark:bg-[#111827] dark:border-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/60'
            }`}
          >
            All Cases
            <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-black ${
              filter === 'ALL' 
                ? 'bg-green-200 text-green-800 dark:bg-[#065f46] dark:text-[#d1fae5]' 
                : 'bg-gray-100 text-gray-900 dark:bg-[#1f2937] dark:text-gray-300'
            }`}>
              {stats.all}
            </span>
          </Button>
          <Button 
            onClick={() => handleFilterChange('LOST')}
            disabled={stats.lost === 0}
            className={`rounded-full px-6 py-2 h-11 border transition-all flex items-center gap-3 font-bold ${
              filter === 'LOST' 
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-[#451212]/30 dark:border-[#ef4444]/50 dark:text-[#ef4444]' 
                : 'bg-white border-gray-200 text-gray-900 dark:bg-[#111827] dark:border-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Lost
            <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-black ${
              filter === 'LOST' 
                ? 'bg-red-200 text-red-800 dark:bg-[#7f1d1d] dark:text-[#fee2e2]' 
                : 'bg-gray-100 text-gray-900 dark:bg-[#1f2937] dark:text-gray-300'
            }`}>
              {stats.lost}
            </span>
          </Button>
          <Button 
            onClick={() => handleFilterChange('FOUND')}
            disabled={stats.found === 0}
            className={`rounded-full px-6 py-2 h-11 border transition-all flex items-center gap-3 font-bold ${
              filter === 'FOUND' 
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-[#172554]/30 dark:border-[#3b82f6]/50 dark:text-[#3b82f6]' 
                : 'bg-white border-gray-200 text-gray-900 dark:bg-[#111827] dark:border-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Found
            <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-black ${
              filter === 'FOUND' 
                ? 'bg-blue-200 text-blue-800 dark:bg-[#1e3a8a] dark:text-[#dbeafe]' 
                : 'bg-gray-100 text-gray-900 dark:bg-[#1f2937] dark:text-gray-300'
            }`}>
              {stats.found}
            </span>
          </Button>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto ml-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-800 h-10 rounded-lg">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort by: Newest</SelectItem>
              <SelectItem value="oldest">Sort by: Oldest</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 sm:w-64 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMyCases()}
              placeholder="Search by breed or city..." 
              className="pl-9 bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-800 rounded-lg h-10 focus-visible:ring-green-500" 
            />
          </div>
          {!isAdmin && (
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 h-10 shrink-0" onClick={() => navigate('/app/report/lost')}>
              <Plus className="w-5 h-5 mr-1" /> New Report
            </Button>
          )}
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white dark:bg-[#1A2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">Pet Info</th>
                <th className="px-6 py-4 font-medium">Case Details</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto" />
                    <p className="text-gray-500 mt-4 font-medium">Loading cases...</p>
                  </td>
                </tr>
              ) : sortedCases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <FolderOpen className="w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">No cases found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {sortedCases.map((caseItem, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group" onClick={() => navigate(`/app/cases/${caseItem.case_id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-14 h-14 rounded-xl border border-gray-100 dark:border-gray-800">
                            <AvatarImage src={caseItem.photo_url} className="object-cover" />
                            <AvatarFallback className="bg-gray-50 dark:bg-slate-800 text-gray-400 font-bold text-xs">PET</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                               {caseItem.breed}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 text-xs">
                               <span className="capitalize">{caseItem.gender.toLowerCase()}</span>
                               <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                               <span>{caseItem.age || 'Unknown'}</span>
                               <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                               <span>{caseItem.color}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
                            <MapPin className="w-4 h-4 text-gray-400" /> {caseItem.city}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-[10px] font-mono tracking-tight bg-gray-50 dark:bg-slate-800/50 px-2 py-0.5 rounded w-fit">
                            <SearchCode className="w-3.5 h-3.5 text-gray-400" /> #{String(caseItem.case_id).padStart(6, '0')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
                            <Calendar className="w-4 h-4 text-gray-400" /> {format(new Date(caseItem.report_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                            <Clock className="w-4 h-4 text-gray-400" /> {format(new Date(caseItem.report_date), 'hh:mm a')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(caseItem.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" className="h-9 bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 group-hover:border-gray-300 dark:group-hover:border-gray-600 rounded-lg text-xs" onClick={() => navigate(`/app/cases/${caseItem.case_id}`)}>
                            View Details
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-9 w-9 p-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                              <DropdownMenuItem className="cursor-pointer font-medium" onClick={() => navigate(`/app/report/${caseItem.case_type.toLowerCase()}?edit=${caseItem.case_id}`)}>Edit Case</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-medium text-green-600" onClick={() => handleMarkAsSolved(caseItem.case_id)}>Mark as Solved</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-medium text-red-600" onClick={() => handleDelete(caseItem.case_id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center border-t border-gray-100 dark:border-gray-800">
                      <Button 
                        onClick={() => fetchMyCases(true)} 
                        disabled={loadingMore || !hasMore}
                        variant="outline"
                        className={`h-11 px-8 rounded-xl border font-bold shadow-sm transition-all active:scale-95 ${
                          hasMore 
                            ? 'border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white hover:border-green-600'
                            : 'border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : !hasMore ? (
                          'All reports loaded'
                        ) : (
                          'Load More Reports'
                        )}
                      </Button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
