import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { RefreshCcw, FileText, Clock, CheckCircle2, Heart, MapPin, Loader2 } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { getApiUrl } from "@/lib/api";

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/api/admin/analytics"), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        <p className="text-gray-500 font-medium">Gathering insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-800">
          Error: {error}
        </div>
        <Button onClick={fetchAnalytics} variant="outline">Try Again</Button>
      </div>
    );
  }

  const overviewStats = [
    { icon: FileText, label: 'Total Cases', value: data.overview.totalCases, sub: 'All reported cases', trend: 'Live', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', path: '/app/cases' },
    { icon: Clock, label: 'Active Cases', value: data.overview.activeCases, sub: 'Currently open cases', trend: 'Live', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', path: '/app/cases' },
    { icon: CheckCircle2, label: 'Recovered', value: data.overview.recoveredCases, sub: 'Successfully reunited', trend: 'Live', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', path: '/app/cases' },
    { icon: Heart, label: 'Matches', value: data.overview.confirmedMatches, sub: 'Confirmed reunions', trend: 'Live', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', path: '/app/matches' },
    { icon: Heart, label: 'Success Rate', value: `${Math.round((data.overview.recoveredCases / (data.overview.totalCases || 1)) * 100)}%`, sub: 'Overall recovery', trend: 'Live', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Insights</h2>
          <p className="text-sm text-gray-500">Real-time platform performance data</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchAnalytics} variant="outline" className="bg-white dark:bg-[#1A2234] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 gap-2">
            <RefreshCcw className="w-4 h-4" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {overviewStats.map((stat, i) => (
          <Card 
            key={i} 
            className={`border-0 shadow-sm bg-white dark:bg-[#1A2234] ${stat.path ? 'cursor-pointer hover:ring-2 hover:ring-green-500/50 transition-all active:scale-95' : ''}`}
            onClick={() => stat.path && navigate(stat.path)}
          >
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
                 </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                 <span className="text-gray-400 dark:text-gray-500">{stat.sub}</span>
                 <span className="text-green-500 font-bold">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Over Time */}
        <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-[#1A2234]">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Cases Over Time</h3>
            <Select defaultValue="monthly">
              <SelectTrigger className="w-[120px] h-8 bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-gray-800 text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-5 h-[300px]">
             <div className="flex gap-4 mb-6 text-xs font-bold dark:text-gray-300">
               <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div> Lost Cases</span>
               <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div> Found Cases</span>
               <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div> Recovered</span>
             </div>
             {(() => {
               const maxVal = Math.max(...data.trends.map((t: any) => Math.max(t.lost || 0, t.found || 0, t.recovered || 0)), 5);
               return (
                 <ResponsiveContainer width="100%" height="80%">
                   <LineChart data={data.trends}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} domain={[0, maxVal]} allowDecimals={false} />
                     <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                     <Line type="monotone" dataKey="lost" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                     <Line type="monotone" dataKey="found" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                     <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                   </LineChart>
                 </ResponsiveContainer>
               );
             })()}
          </div>
        </Card>

        {/* Most Common Breeds */}
        <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Most Common Breeds</h3>
          </div>
          <div className="p-5 flex flex-col justify-center items-center h-[300px]">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={data.breeds} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                  {data.breeds.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full mt-4 space-y-2">
               {data.breeds.map((entry: any, i: number) => (
                 <div key={i} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></div>
                     {entry.name}
                   </div>
                   <span className="font-medium">{entry.value} reports</span>
                 </div>
               ))}
               {data.breeds.length === 0 && <p className="text-xs text-gray-400 text-center">No breed data available</p>}
            </div>
          </div>
        </Card>

        {/* Average Recovery Time */}
        <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Average Recovery Time</h3>
          </div>
          <div className="p-5 h-[200px] flex items-center justify-center gap-6">
             <div className="w-24 h-24 rounded-full border-8 border-green-100 dark:border-green-900/30 border-t-green-500 flex items-center justify-center relative">
               <Clock className="w-8 h-8 text-green-500 absolute" />
             </div>
             <div>
               <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{data.avgRecoveryTime}</p>
               <p className="text-gray-500 font-medium">Avg. Days</p>
               <p className="text-xs text-green-500 font-bold mt-2">Reunion speed</p>
             </div>
          </div>
        </Card>

        {/* Cases by Species */}
        <Card className="border-0 shadow-sm bg-white dark:bg-[#1A2234]">
           <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Cases by Species</h3>
          </div>
          <div className="p-5 h-[200px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={data.species} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                  {data.species.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
             <div className="w-[50%] pl-4 space-y-3">
               {data.species.map((entry: any, i: number) => {
                 const total = data.species.reduce((sum: number, s: any) => sum + s.value, 0);
                 const percentage = Math.round((entry.value / (total || 1)) * 100);
                 return (
                   <div key={i} className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                     <div className="flex items-center gap-2 font-semibold">
                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
                       {entry.name}
                     </div>
                     <span className="font-bold">{percentage}%</span>
                   </div>
                 );
               })}
            </div>
          </div>
        </Card>

         {/* Recovery Efficiency */}
         <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-[#1A2234]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
             <h3 className="font-bold text-gray-900 dark:text-white">Recovery Efficiency</h3>
           </div>
           <div className="p-5 h-[200px]">
             {(() => {
               const maxVal = Math.max(...data.trends.map((t: any) => t.recovered), 5);
               return (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data.trends} barSize={30}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 12, fill: '#64748b'}} 
                        domain={[0, maxVal]} 
                        allowDecimals={false}
                     />
                     <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}}/>
                     <Bar dataKey="recovered" fill="#10b981" radius={[4,4,0,0]} />
                   </BarChart>
                 </ResponsiveContainer>
               );
             })()}
           </div>
         </Card>

         {/* Combined Case Locations Card - Fixed Height & Scrollable */}
         <Card className="lg:row-start-2 lg:row-span-2 lg:col-start-3 border-0 shadow-sm bg-white dark:bg-[#1A2234] h-[520px] flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Top Case Locations</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-6 overflow-hidden">
             {/* Top Section: Progress Bars (50%) */}
             <div className="h-[45%] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-5">
                  {data.locations.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{item.loc}</span>
                            <span className="text-[10px] font-black text-gray-900 dark:text-white">{item.val}</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{width: `${(item.val / (data.locations[0]?.val || 1)) * 100}%`}}></div>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* Bottom Section: High Risk Areas (50%) */}
             <div className="h-[55%] flex flex-col bg-green-50/50 dark:bg-green-900/5 rounded-2xl p-5 border border-green-100/50 dark:border-green-900/20 overflow-hidden">
                <h4 className="font-bold text-[10px] text-gray-400 uppercase mb-4 flex items-center gap-2 tracking-widest shrink-0">
                  <MapPin className="w-3 h-3 text-red-500" /> Risk Distribution
                </h4>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {data.locations.map((item: any, i: number) => {
                    const total = data.locations.reduce((sum: number, l: any) => sum + l.val, 0);
                    const percentage = Math.round((item.val / (total || 1)) * 100);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-black/40 rounded-xl border border-gray-100/50 dark:border-white/5 shadow-sm shrink-0">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.loc}</span>
                        <span className="text-xs font-black text-red-500">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
