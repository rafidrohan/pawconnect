import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Heart, 
  MapPin, 
  ChevronRight, 
  ArrowRight,
  PawPrint,
  Clock,
  Users,
  HeadphonesIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Loader2
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import dashboardBanner from "@/assets/design/dashboard-banner.svg";
import supportDogSvg from "@/assets/design/support-dog.svg";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { getApiUrl } from "@/lib/api";

const recoveryData = [
  { name: 'Dec', value: 35 },
  { name: 'Jan', value: 45 },
  { name: 'Feb', value: 42 },
  { name: 'Mar', value: 55 },
  { name: 'Apr', value: 48 },
  { name: 'May', value: 72 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ 
    total: 0, 
    recovered: 0, 
    active: 0, 
    matches: 0, 
    recoveryRate: 0, 
    speciesDistribution: [], 
    locationDistribution: [] 
  });
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [casesRes, statsRes, matchesRes] = await Promise.all([
          fetch(getApiUrl("/api/cases?limit=4")),
          fetch(getApiUrl("/api/stats")),
          fetch(getApiUrl("/api/top-matches"), {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);
        
        const casesData = await casesRes.json();
        const statsData = await statsRes.json();
        const matchesData = await matchesRes.json();
        
        if (Array.isArray(casesData)) {
          setCases(casesData.slice(0, 4));
        } else {
          setCases([]);
        }

        if (statsData && !statsData.error) {
          setStats({
            total: statsData.total || 0,
            recovered: statsData.recovered || 0,
            active: statsData.active || 0,
            matches: statsData.matches || 0,
            recoveryRate: statsData.recoveryRate || 0,
            speciesDistribution: Array.isArray(statsData.speciesDistribution) ? statsData.speciesDistribution : [],
            locationDistribution: Array.isArray(statsData.locationDistribution) ? statsData.locationDistribution : []
          });
        }

        if (Array.isArray(matchesData)) {
          setMatches(matchesData);
        } else {
          setMatches([]);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const speciesColors: any = {
    'DOG': '#82ca9d',
    'CAT': '#94a3b8',
    'BIRD': '#6366f1',
    'OTHER': '#ff8082'
  };

  return (
    <div className="space-y-6">
      {/* Unified Banner Section */}
      <div className="bg-[#f2f8f3] dark:bg-green-950/20 rounded-2xl px-6 lg:px-8 py-4 flex flex-col lg:flex-row items-center gap-6 overflow-hidden relative min-h-[180px]">
        {/* Left: Pet Illustration (SVG) */}
        <div className="w-full lg:w-[20%] flex justify-center lg:justify-start">
          <img 
            src={dashboardBanner} 
            alt="Cute pets" 
            className="w-full max-w-[200px] lg:max-w-none h-auto object-contain transform lg:scale-150 lg:translate-x-[-10px] lg:translate-y-[15px]"
          />
        </div>

        {/* Middle: Content */}
        <div className="w-full lg:w-[40%] space-y-1.5 text-center lg:text-left z-10 lg:ml-2">
          <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 dark:text-white leading-tight">
            Let's Reunite Pets<br />with Their <span className="text-[#ff6b6b]">Families</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-[11px] font-medium leading-relaxed max-w-[260px] mx-auto lg:mx-0">
            Report lost or found pets and help us bring them home safely.
          </p>
        </div>

        {/* Right: Action Cards */}
        <div className="w-full lg:w-[40%] flex flex-row gap-4 z-10">
          <Card 
            className="flex-1 border border-red-100/50 dark:border-red-900/30 shadow-sm bg-[#fffafa] dark:bg-red-950/10 rounded-[16px] cursor-pointer group hover:shadow-md transition-all h-full"
            onClick={() => navigate('/app/report/lost')}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[140px]">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-[#fff1f1] dark:bg-red-950/30 flex items-center justify-center text-[#ff6b6b]">
                  <PawPrint className="w-4.5 h-4.5 fill-current" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-[15px] font-semibold text-[#c53030] dark:text-red-400">Report Lost Pet</h3>
                  <p className="text-[10px] text-gray-500 font-normal">Submit a report</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-[#fff1f1] dark:bg-red-950/30 flex items-center justify-center text-[#ff6b6b] group-hover:bg-[#ff6b6b] group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="flex-1 border border-green-100/50 dark:border-green-900/30 shadow-sm bg-[#f9fdfa] dark:bg-green-950/10 rounded-[16px] cursor-pointer group hover:shadow-md transition-all h-full"
            onClick={() => navigate('/app/report/found')}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[140px]">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-full bg-[#f2f8f3] dark:bg-green-950/30 flex items-center justify-center text-[#38a169]">
                  <PawPrint className="w-4.5 h-4.5 fill-current" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-[15px] font-medium text-[#2c7a7b] dark:text-teal-400">Found a Pet?</h3>
                  <p className="text-[10px] text-gray-500 font-normal">I've found one</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-[#f2f8f3] dark:bg-green-950/30 flex items-center justify-center text-[#38a169] group-hover:bg-[#38a169] group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Cases', value: stats.total, sub: 'All reported cases', trend: '12%', trendUp: true, icon: FileText, bg: 'bg-green-50/50 dark:bg-green-950/10', iconBg: 'bg-green-100 dark:bg-green-900/20', iconColor: 'text-green-600', waveColor: 'fill-green-100/30' },
          { label: 'Active Cases', value: stats.active, sub: 'Currently open cases', trend: '8%', trendUp: true, icon: Clock, bg: 'bg-amber-50/50 dark:bg-amber-950/10', iconBg: 'bg-amber-100 dark:bg-amber-900/20', iconColor: 'text-amber-600', waveColor: 'fill-amber-100/30' },
          { label: 'Recovered', value: stats.recovered, sub: 'Successfully reunited', trend: '15%', trendUp: true, icon: CheckCircle2, bg: 'bg-purple-50/50 dark:bg-purple-950/10', iconBg: 'bg-purple-100 dark:bg-purple-900/20', iconColor: 'text-purple-600', waveColor: 'fill-purple-100/30' },
          { label: 'Recovery Rate', value: `${stats.recoveryRate}%`, sub: 'Success percentage', trend: '9%', trendUp: true, icon: Activity, bg: 'bg-blue-50/50 dark:bg-blue-950/10', iconBg: 'bg-blue-100 dark:bg-blue-900/20', iconColor: 'text-blue-600', waveColor: 'fill-blue-100/30' },
          { label: 'Matches Found', value: stats.matches, sub: 'Potential match', trend: '20%', trendUp: true, icon: Users, bg: 'bg-rose-50/50 dark:bg-rose-950/10', iconBg: 'bg-rose-100 dark:bg-rose-900/20', iconColor: 'text-rose-600', waveColor: 'fill-rose-100/30' },
        ].map((stat, i) => (
          <Card key={i} className={`border-0 shadow-sm ${stat.bg} rounded-2xl overflow-hidden relative h-[150px]`}>
            <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                  <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200 mt-1 leading-tight">{stat.label}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{stat.sub}</p>
                <div className="flex items-center gap-1">
                   <ArrowUpRight className={`w-3 h-3 ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`} />
                   <span className={`text-[10px] font-bold ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                     {stat.trend} <span className="text-gray-400 font-medium ml-0.5">from last month</span>
                   </span>
                </div>
              </div>
            </CardContent>
            
            <div className="absolute bottom-0 right-0 left-0 h-12 opacity-10">
              <svg viewBox="0 0 1440 320" className="w-full h-full preserve-3d">
                <path className={stat.waveColor} d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,213.3C960,224,1056,192,1152,165.3C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid: Recent Cases + Top Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Recent Cases</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl px-5 h-9 border-green-200 dark:border-green-900/50 font-bold text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white hover:border-green-600 hover:shadow-md hover:shadow-green-500/20 active:scale-95 transition-all duration-200" 
              onClick={() => navigate('/app/cases')}
            >
              View All
            </Button>
          </div>
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
              </div>
            ) : cases.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
                <PawPrint className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-gray-500 font-medium">No recent cases reported yet.</p>
                <Button variant="link" className="text-green-500" onClick={() => navigate('/app/report/lost')}>Report a Case</Button>
              </div>
            ) : (
              cases.map((pet, i) => (
                <div key={i} className="relative">
                  {i !== 0 && <div className="mx-6 border-t border-gray-200 dark:border-gray-700" />}
                  <div className="p-5 flex items-center gap-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Pet Image */}
                    <Avatar className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-800 shadow-none">
                      <AvatarImage src={pet.photo_url || `https://ui-avatars.com/api/?name=${pet.species}&background=random`} className="object-cover"/>
                      <AvatarFallback className="bg-green-50 text-green-600 font-bold">{pet.species?.[0]}</AvatarFallback>
                    </Avatar>

                    {/* Case Type Badge (No Shadow, Proper Hover) */}
                    <div className="w-20 shrink-0">
                      <Badge className={`w-full py-1.5 text-[10px] uppercase font-bold border-0 rounded-xl flex justify-center tracking-wider shadow-none transition-colors ${
                        pet.case_type === 'LOST' 
                        ? 'bg-[#fff1f1] text-[#ff6b6b] dark:bg-red-950/40 hover:bg-[#ffe4e4] dark:hover:bg-red-900/40' 
                        : 'bg-[#f2f8f3] text-[#38a169] dark:bg-green-950/40 hover:bg-[#e6f4ea] dark:hover:bg-green-900/40'
                      }`}>
                        {pet.case_type}
                      </Badge>
                    </div>

                    {/* Pet Info & Location in Line */}
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <h4 className="font-bold text-[16px] text-gray-900 dark:text-white truncate">
                        {pet.breed || pet.species}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 font-medium truncate">
                         <MapPin className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                         {pet.area || pet.city}
                      </div>
                    </div>

                    {/* Status Badge (No Shadow, Proper Hover) */}
                    <div className="w-28 shrink-0">
                      <Badge variant="secondary" className={`w-full py-1.5 text-[10px] uppercase font-bold border-0 rounded-xl tracking-wider justify-center cursor-default shadow-none transition-colors ${
                        pet.status === 'REPORTED' ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40' : 
                        pet.status === 'RECOVERED' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40' : 
                        'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40'
                      }`}>
                        {pet.status === 'REPORTED' ? 'ACTIVE' : pet.status === 'MATCH_FOUND' ? 'MATCHED' : pet.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Top Matches</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl px-5 h-9 border-green-200 dark:border-green-900/50 font-bold text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white hover:border-green-600 hover:shadow-md hover:shadow-green-500/20 active:scale-95 transition-all duration-200" 
              onClick={() => navigate('/app/matches')}
            >
              View All
            </Button>
          </div>
          <div className="flex-1 flex flex-col">
             {loading ? (
               <div className="flex-1 flex items-center justify-center py-10">
                 <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
               </div>
             ) : matches.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-6">
                 <Heart className="w-12 h-12 text-gray-200 mb-4" />
                 <p className="text-gray-500 font-medium text-sm">No matches found yet.</p>
               </div>
             ) : (
               matches.map((item, i) => (
                <div key={i} className="relative">
                  {i !== 0 && <div className="mx-6 border-t border-gray-200 dark:border-gray-700" />}
                  <div className="p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors flex-1 min-h-[114px]">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                     <Avatar className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-gray-100 dark:border-gray-800">
                       <AvatarImage src={item.lost_img || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150"} className="object-cover"/>
                       <AvatarFallback>L</AvatarFallback>
                     </Avatar>
                     <div className="relative w-14 h-14 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="28" cy="28" r="25" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                          <circle cx="28" cy="28" r="25" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={157.1} strokeDashoffset={157.1 - (157.1 * item.match_score)} className="text-green-400" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#2d7a44] dark:text-green-400">{Math.round(item.match_score * 100)}%</span>
                     </div>
                     <Avatar className="w-20 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-gray-100 dark:border-gray-800">
                       <AvatarImage src={item.found_img || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150"} className="object-cover"/>
                       <AvatarFallback>F</AvatarFallback>
                     </Avatar>
                     <div className="min-w-0 ml-4 flex-1">
                        <h4 className="font-bold text-[15px] text-gray-900 dark:text-white truncate">{item.lost_breed} (Lost)</h4>
                        <p className="text-[13px] text-gray-500 font-semibold mb-1">& {item.found_breed} (Found)</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold whitespace-nowrap">
                           <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                           {item.lost_area}
                        </div>
                     </div>
                  </div>
                  <div className="flex-shrink-0 ml-6">
                     <Button 
                        onClick={() => navigate('/app/matches')}
                        className="h-10 px-6 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 font-bold text-[13px] hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all duration-200 border-0"
                     >
                       View Match
                     </Button>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </Card>
      </div>

      {/* Bottom Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Recovery Rate Card */}
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl p-6 h-[210px] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[18px] text-gray-900 dark:text-white mb-0.5">Recovery Rate</h3>
                <p className="text-[13px] text-gray-400 font-semibold uppercase tracking-wide">Last 6 Months</p>
              </div>
              <div className="flex-1 w-full my-2 min-h-[80px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={recoveryData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38a169" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#38a169" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#38a169" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, fill: '#38a169', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[28px] font-bold text-[#38a169] leading-none">{stats.recoveryRate}%</span>
                 <span className="text-[11px] font-bold text-[#38a169] uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">Success Rate</span>
              </div>
          </Card>

          {/* Species Distribution Card */}
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl p-6 h-[210px] flex flex-col">
              <h3 className="font-bold text-[18px] text-gray-900 dark:text-white mb-3">Species Distribution</h3>
              <div className="flex flex-row items-center gap-6 flex-1">
                <div className="w-[100px] h-[100px] min-h-[100px] relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie 
                        data={stats.speciesDistribution || []} 
                        innerRadius={30} 
                        outerRadius={45} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {(stats.speciesDistribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={speciesColors[entry.name?.toUpperCase()] || '#94a3b8'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[120px] pr-2">
                   {(stats.speciesDistribution || []).map((item: any, i: number) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                           <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: speciesColors[item.name?.toUpperCase()] || '#94a3b8' }} />
                           <span className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 capitalize">{item.name?.toLowerCase()}</span>
                        </div>
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white">{item.value}%</span>
                     </div>
                   ))}
                </div>
              </div>
          </Card>

          {/* Cases by Location Card */}
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1A2234] rounded-2xl p-6 h-[210px] flex flex-col">
              <h3 className="font-bold text-[18px] text-gray-900 dark:text-white mb-3">Cases by Location</h3>
              <div className="space-y-3.5 flex-1 flex flex-col justify-center overflow-y-auto max-h-[130px] pr-2">
                {(stats.locationDistribution || []).map((loc: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 min-w-[80px] truncate">{loc.name}</span>
                    <div className="flex-1 h-2 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-[#38a169]/60 rounded-full" style={{ width: `${loc.percentage}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-900 dark:text-white w-6 text-right">{loc.count}</span>
                  </div>
                ))}
              </div>
          </Card>

          {/* Need Help? Support Card - Pixel Perfect Heart Placement */}
          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-[#fafaf8] dark:bg-[#1A2234]/50 rounded-2xl p-6 h-[210px] relative overflow-hidden flex flex-col justify-center">
              <div className="z-10 max-w-[60%] space-y-3">
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white leading-tight">Need Help?</h3>
                <p className="text-[13px] text-gray-500 font-semibold leading-relaxed">
                  If you found a pet or lost your pet, we're here to help!
                </p>
                <div className="pt-2">
                  <Button 
                    onClick={() => window.location.href = 'mailto:support@pawconnect.pages.dev'}
                    className="h-10 px-5 rounded-xl bg-[#e6f4ea] dark:bg-green-900/30 text-[#38a169] dark:text-green-400 font-bold text-[13px] hover:bg-[#38a169] hover:text-white transition-all border-0 shadow-md flex items-center gap-2"
                  >
                    <HeadphonesIcon className="w-4 h-4" />
                    Contact Support
                  </Button>
                </div>
              </div>
              
              {/* SVG Dog Illustration - Heart precisely placed at his eye-line/nose level */}
              <div className="absolute right-[-15px] top-1/2 transform -translate-y-1/2 w-[150px] h-[150px] z-0">
                <img 
                  src={supportDogSvg} 
                  className="w-full h-full object-contain" 
                  alt="Support Dog" 
                />
                <Heart className="absolute top-[20px] left-[25px] w-4.5 h-4.5 text-pink-400 fill-current opacity-60 animate-pulse transform -rotate-12" />
              </div>
          </Card>
      </div>
    </div>
  );
}
