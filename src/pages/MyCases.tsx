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
  const [filter, setFilter] = React.useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState("newest");

  const fetchMyCases = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/api/my-cases"), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setCases(data);
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMyCases();
  }, []);

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
        fetchMyCases(); // Refresh list
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
        setCases(prev => prev.filter(c => c.case_id !== caseId));
      }
    } catch (err) {
      console.error("Error deleting case:", err);
    }
  };

  const filteredCases = cases
    .filter(c => filter === 'ALL' || c.case_type === filter)
    .filter(c => 
      c.breed.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
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
    <div className="space-y-6">
      
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
          <Button 
            onClick={() => setFilter('ALL')}
            className={`${filter === 'ALL' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500 border-green-200 dark:border-green-800' : 'bg-white dark:bg-[#1A2234] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'} rounded-xl px-5 border shadow-none`}
          >
            All Cases <span className={`ml-2 ${filter === 'ALL' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'} text-xs px-2 py-0.5 rounded-lg font-bold`}>{cases.length}</span>
          </Button>
          <Button 
            onClick={() => setFilter('LOST')}
            variant="outline" 
            className={`${filter === 'LOST' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 border-red-200 dark:border-red-800' : 'bg-white dark:bg-[#1A2234] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'} rounded-xl px-5 border shadow-none`}
          >
            Lost <span className={`ml-2 ${filter === 'LOST' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'} text-xs px-2 py-0.5 rounded-lg font-bold`}>{cases.filter(c => c.case_type === 'LOST').length}</span>
          </Button>
          <Button 
            onClick={() => setFilter('FOUND')}
            variant="outline" 
            className={`${filter === 'FOUND' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-500 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-[#1A2234] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'} rounded-xl px-5 border shadow-none`}
          >
            Found <span className={`ml-2 ${filter === 'FOUND' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'} text-xs px-2 py-0.5 rounded-lg font-bold`}>{cases.filter(c => c.case_type === 'FOUND').length}</span>
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
              placeholder="Search by breed or city..." 
              className="pl-9 bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-800 rounded-lg h-10 focus-visible:ring-green-500" 
            />
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 h-10 shrink-0" onClick={() => navigate('/app/report/lost')}>
            <Plus className="w-5 h-5 mr-1" /> New Report
          </Button>
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
                    <p className="text-gray-500 mt-4 font-medium">Loading your cases...</p>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <FolderOpen className="w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">No cases match your filters</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem, i) => (
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
                             <span>{caseItem.age || 'Unknown'} yr</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
