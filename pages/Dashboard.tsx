
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  LayoutDashboard,
  TrendingUp,
  Activity,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  type: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeCandidates: 0,
    interviewsToday: 0,
    timeToHire: 14,
  });
  
  const [pipelineData, setPipelineData] = useState([
    { name: 'Applied', count: 0 },
    { name: 'Shortlisted', count: 0 },
    { name: 'Interviewing', count: 0 },
    { name: 'Selected', count: 0 },
    { name: 'Rejected', count: 0 },
  ]);

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [fetchingActivities, setFetchingActivities] = useState(true);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#22c55e', '#ef4444'];

  useEffect(() => {
    fetchData();
    fetchRecentActivities();
    
    // Subscribe to changes for live updates
    const subscription = supabase
      .channel('public:activity_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setActivities(prev => [payload.new as ActivityLog, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchData = async () => {
    const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open');
    const { count: appCount } = await supabase.from('applications').select('*', { count: 'exact', head: true });
    const { count: intCount } = await supabase.from('interviews')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', new Date().toISOString().split('T')[0])
      .lte('start_time', new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]);

    setStats({
      totalJobs: jobCount || 0,
      activeCandidates: appCount || 0,
      interviewsToday: intCount || 0,
      timeToHire: 12,
    });

    const { data: appData } = await supabase.from('applications').select('status');
    if (appData) {
      const counts = appData.reduce((acc: any, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, {});
      
      setPipelineData([
        { name: 'Applied', count: counts.applied || 0 },
        { name: 'Shortlisted', count: counts.shortlisted || 0 },
        { name: 'Interviewing', count: counts.interview_scheduled || 0 },
        { name: 'Selected', count: counts.selected || 0 },
        { name: 'Rejected', count: counts.rejected || 0 },
      ]);
    }
  };

  const fetchRecentActivities = async () => {
    setFetchingActivities(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setActivities(data);
    setFetchingActivities(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-1">
            Recruiter Overview • Performance Analytics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Briefcase className="text-indigo-600 dark:text-indigo-400" size={20} />} 
          label="Open Roles" 
          value={stats.totalJobs} 
          trend="Live"
          color="indigo"
        />
        <StatCard 
          icon={<Users className="text-purple-600 dark:text-purple-400" size={20} />} 
          label="Active Candidates" 
          value={stats.activeCandidates} 
          trend="Pipeline"
          color="purple"
        />
        <StatCard 
          icon={<Calendar className="text-emerald-600 dark:text-emerald-400" size={20} />} 
          label="Interviews Today" 
          value={stats.interviewsToday} 
          trend="Today"
          color="emerald"
        />
        <StatCard 
          icon={<Clock className="text-orange-600 dark:text-orange-400" size={20} />} 
          label="Avg. Time to Hire" 
          value={`${stats.timeToHire} Days`} 
          trend="Target"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white/50 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-slate-800 rounded-lg">
                <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Candidate Pipeline</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">Live Sync</span>
            </div>
          </div>
          <div className="h-[320px] w-full" style={{ minHeight: '320px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke="#94a3b8" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  tickFormatter={(value) => `${value}`.toUpperCase()} 
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm border border-white/50 dark:border-slate-800 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-orange-50 dark:bg-slate-800 rounded-lg">
              <Activity size={18} className="text-orange-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">System Activity</h3>
          </div>
          <div className="space-y-8 max-h-[400px] overflow-y-auto scrollbar-hide">
            {fetchingActivities ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">No recent activity found.</p>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="flex gap-4 group animate-in slide-in-from-right-2 duration-300">
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 group-hover:scale-150 transition-transform duration-300 ${
                    item.type === 'success' ? 'bg-emerald-500' : 
                    item.type === 'info' ? 'bg-indigo-500' : 
                    item.type === 'warning' ? 'bg-orange-500' : 'bg-rose-500'
                  }`} />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-bold leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.action}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {item.details}
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-black tracking-widest">
                      {formatTime(item.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={fetchRecentActivities}
            className="w-full mt-12 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            Refresh Logs
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color }: any) => {
  const bgColors: any = {
    indigo: 'bg-indigo-50/80 dark:bg-slate-900',
    purple: 'bg-purple-50/80 dark:bg-slate-900',
    emerald: 'bg-emerald-50/80 dark:bg-slate-900',
    orange: 'bg-orange-50/80 dark:bg-slate-900'
  };

  return (
    <div className={`${bgColors[color] || 'bg-white dark:bg-slate-900'} backdrop-blur-md p-6 rounded-[2.2rem] shadow-sm border border-white/50 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-none transition-all duration-300 group`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
        <p className="text-xs text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest">{label}</p>
      </div>
      <div className="flex items-end justify-between px-1">
        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h4>
        <div className="flex items-center gap-1.5 bg-white/60 dark:bg-slate-800 px-2 py-1 rounded-lg">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
