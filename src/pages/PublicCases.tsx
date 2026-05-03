import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, MapPin, Calendar, Heart, PawPrint, Coins, Filter, ChevronRight, Loader2, Info, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { format } from "date-fns";
import { getApiUrl } from "@/lib/api";
import { useTheme } from "@/components/providers/theme-provider";

export default function PublicCases({ isPublicView = true }: { isPublicView?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ all: 0, lost: 0, found: 0 });
  const LIMIT = 9;

  const fetchStats = async () => {
    try {
      const res = await fetch(getApiUrl("/api/public/cases/stats"));
      if (res.ok) setStats(await res.json());
    } catch (err) {}
  };

  const fetchCases = async (isLoadMore = false, currentFilter = filter) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const currentOffset = isLoadMore ? (page + 1) * LIMIT : 0;
      const res = await fetch(
        getApiUrl(`/api/public/cases?limit=${LIMIT}&offset=${currentOffset}&type=${currentFilter}&search=${searchQuery}`)
      );

      if (res.ok) {
        const data = await res.json();
        const updatedCases = isLoadMore ? [...cases, ...data] : data;
        setCases(updatedCases);
        
        if (isLoadMore) setPage(prev => prev + 1);
        else setPage(0);

        setHasMore(data.length === LIMIT);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCases(false, filter);
  }, [filter, searchParams.get("search")]);

  // Sync internal state if URL search changes
  useEffect(() => {
    const urlQuery = searchParams.get("search") || "";
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCases(false, filter);
  };

  return (
    <div className={`min-h-screen ${isPublicView ? 'bg-white dark:bg-[#0f172a]' : ''}`}>
      {/* Navbar for Public View only */}
      {isPublicView && (
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2 font-bold text-2xl text-gray-900 dark:text-white cursor-pointer" onClick={() => navigate('/')}>
            <PawPrint className="w-8 h-8 text-black dark:text-white fill-current" />
            <span className="flex items-center">Paw<span className="text-green-500">Connect</span></span>
          </div>
          <Button variant="ghost" className="rounded-xl font-bold gap-2" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </nav>
      )}

      {/* Hero Header - Only for Public View */}
      {isPublicView && (
        <div className="bg-gradient-to-br from-green-500 to-green-700 py-16 md:py-24 relative overflow-hidden border-y border-green-400/20">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10"><PawPrint className="w-24 h-24 rotate-12" /></div>
            <div className="absolute bottom-10 right-20"><Heart className="w-32 h-32 -rotate-12" /></div>
            <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl opacity-20"></div>
          </div>
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10 text-center">
            <Badge className="bg-green-400/30 text-white border-white/20 mb-6 px-4 py-1 rounded-full backdrop-blur-md">Community Registry</Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-sm">Active Recovery Cases</h1>
            <p className="text-green-50 text-lg md:text-xl max-w-2xl mx-auto opacity-90 font-medium leading-relaxed">
              Every second counts. Help us spot these pets and reunite them with their families.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${isPublicView ? 'container mx-auto px-6 max-w-6xl -mt-10 pb-24 relative z-20' : 'space-y-8'}`}>
        {/* Filters & Search Bar */}
        <div className={`bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 shadow-2xl shadow-green-900/10 border border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row gap-6 items-center ${isPublicView ? 'mb-12' : ''}`}>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-[1.8rem] w-full lg:w-auto">
            <Button 
              onClick={() => setFilter('ALL')}
              variant="ghost"
              className={`rounded-[1.4rem] px-6 h-12 font-bold transition-all ${filter === 'ALL' ? 'bg-white dark:bg-slate-800 shadow-md text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-900'}`}
            >
              All ({stats.all})
            </Button>
            <Button 
              onClick={() => setFilter('LOST')}
              variant="ghost"
              className={`rounded-[1.4rem] px-6 h-12 font-bold transition-all ${filter === 'LOST' ? 'bg-white dark:bg-slate-800 shadow-md text-red-500' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Lost ({stats.lost})
            </Button>
            <Button 
              onClick={() => setFilter('FOUND')}
              variant="ghost"
              className={`rounded-[1.4rem] px-6 h-12 font-bold transition-all ${filter === 'FOUND' ? 'bg-white dark:bg-slate-800 shadow-md text-blue-500' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Found ({stats.found})
            </Button>
          </div>

          <form onSubmit={handleSearch} className="flex-1 w-full relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by breed, city, or area..." 
              className="pl-14 h-16 bg-gray-50 dark:bg-slate-900/50 border-none rounded-[1.8rem] focus-visible:ring-2 focus-visible:ring-green-500 text-lg font-medium"
            />
            <Button type="submit" className="absolute right-3 top-3 h-10 bg-green-500 hover:bg-green-600 text-white rounded-2xl px-6 font-bold shadow-lg shadow-green-500/20">
              Find Pets
            </Button>
          </form>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-xl">Scanning active cases...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-32 bg-gray-50 dark:bg-slate-900/30 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800 text-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
               <Info className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No active cases found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cases.map((caseItem) => (
              <Card 
                key={caseItem.case_id} 
                className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#1e293b] cursor-pointer active:scale-[0.98]"
                onClick={() => navigate(isPublicView ? `/cases/${caseItem.case_id}` : `/app/cases/${caseItem.case_id}`)}
              >
                <div className="relative h-80 overflow-hidden">
                  <img 
                    src={caseItem.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600'} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt={caseItem.breed}
                  />
                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                    <Badge className={`px-5 py-2 rounded-full text-[10px] font-black shadow-lg uppercase tracking-widest ${
                      caseItem.case_type === 'LOST' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {caseItem.case_type}
                    </Badge>
                    {Number(caseItem.reward) > 0 && (
                      <Badge className="bg-amber-400 text-amber-900 px-5 py-2 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1.5 uppercase tracking-widest">
                        <Coins className="w-3.5 h-3.5" /> REWARD: ${caseItem.reward}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <div className="flex items-center gap-2 text-white/90 text-sm font-bold">
                       <MapPin className="w-4 h-4 text-green-400" /> {caseItem.city}, {caseItem.area}
                    </div>
                  </div>
                </div>

                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                        {caseItem.pet_name || 'Unnamed Pet'}
                      </h3>
                      <p className="text-green-600 dark:text-green-400 font-bold text-sm uppercase tracking-widest mt-1">
                        {caseItem.breed}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold border-gray-100 dark:border-gray-700 uppercase px-3 py-1 rounded-lg">
                      {caseItem.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-6 py-5 border-y border-gray-50 dark:border-gray-800 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider">Reported</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5" /> {format(new Date(caseItem.report_date), 'MMM dd')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider">Color</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300 mt-1">{caseItem.color}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider">Gender</span>
                      <span className="font-bold text-gray-700 dark:text-gray-300 capitalize mt-1">{caseItem.gender.toLowerCase()}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-8 h-14 bg-gray-50 dark:bg-slate-800 hover:bg-green-500 dark:hover:bg-green-600 hover:text-white text-gray-900 dark:text-white font-black rounded-2xl transition-all group/btn border border-gray-100 dark:border-gray-700 shadow-sm">
                    View Full Case Details <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="mt-16 text-center">
            <Button 
              onClick={() => fetchCases(true)}
              disabled={loadingMore}
              className="h-16 px-16 rounded-[2rem] bg-white dark:bg-[#1e293b] border-2 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white font-black hover:border-green-500 dark:hover:border-green-500 transition-all shadow-2xl shadow-green-900/10 active:scale-95"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Bringing more pets...
                </>
              ) : (
                "Load More Active Cases"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Footer - Only for Public View */}
      {isPublicView && (
        <footer className="mt-24 py-12 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-gray-500 text-sm font-medium">© 2024 PawConnect Platform. Every pet deserves to be home.</p>
        </footer>
      )}
    </div>
  );
}
