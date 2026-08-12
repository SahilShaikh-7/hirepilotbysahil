
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Job } from '../types';
import { 
  Plus, 
  Search, 
  Briefcase, 
  Building2,
  Clock,
  Filter,
  ChevronRight,
  Loader2,
  Target
} from 'lucide-react';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        profiles:hiring_manager_id (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setJobs(data || []);
    setLoading(false);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Briefcase size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Jobs
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-1">
            Open Roles • Global Opportunities Dashboard
          </p>
        </div>
        <button 
          onClick={() => navigate('/jobs/new')}
          className="flex items-center gap-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 text-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          Create Posting
        </button>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/50 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm transition-colors duration-300">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by role or department..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
          <Filter size={14} />
          Refine
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-24 text-center bg-white/60 dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
          <Briefcase className="mx-auto mb-4 text-slate-300 dark:text-slate-800" size={64} />
          <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-sm">No active listings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="group bg-white/80 dark:bg-slate-900 backdrop-blur-sm p-7 rounded-[2.5rem] border border-white/50 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 dark:shadow-none relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-2 h-full transition-all duration-500 ${job.status === 'open' ? 'bg-indigo-500 group-hover:w-3' : 'bg-slate-300 dark:bg-slate-700'}`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Target size={22} strokeWidth={2.5} />
                </div>
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                  job.status === 'open' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                }`}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tighter leading-tight">
                  {job.title}
                </h3>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <Building2 size={14} className="text-indigo-400" />
                    {job.department}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <Clock size={14} />
                    {job.experience_range} EXP.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-5 border-t border-slate-50 dark:border-slate-800">
                {job.skills?.slice(0, 3).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm">
                    {skill}
                  </span>
                ))}
                {job.skills?.length > 3 && (
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase">
                    +{job.skills.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
