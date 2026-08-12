
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, logActivity } from '../services/supabase';
import { Application, ApplicationStatus, Job, Candidate } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  ChevronRight,
  UserPlus,
  Users,
  X,
  Linkedin,
  Loader2,
  CheckCircle2,
  Briefcase,
  Target,
  ArrowUpDown,
  Calendar,
  Globe,
  Smartphone,
  User,
  Hash,
  Info,
  Trash2
} from 'lucide-react';

const STAGES: { label: string; value: ApplicationStatus; color: string }[] = [
  { label: 'Applied', value: 'applied', color: 'bg-slate-300 dark:bg-slate-600' },
  { label: 'Shortlisted', value: 'shortlisted', color: 'bg-blue-500' },
  { label: 'Interviewing', value: 'interview_scheduled', color: 'bg-indigo-600' },
  { label: 'Selected', value: 'selected', color: 'bg-emerald-500' },
  { label: 'Rejected', value: 'rejected', color: 'bg-rose-500' },
];

const SOURCES = ['LinkedIn', 'Indeed', 'Referral', 'Career Page', 'Agency', 'Other'];

type SortField = 'full_name' | 'created_at' | 'status';

const Candidates: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [formLoading, setFormLoading] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    professional_role: '',
    source: 'LinkedIn',
    job_id: ''
  });

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidates:candidate_id (*),
        jobs:job_id (*)
      `);

    if (error) {
      console.error(error);
    } else {
      setApplications(data as any);
    }
    setLoading(false);
  };

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').eq('status', 'open');
    if (data) setJobs(data);
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { data: candidate, error: candError } = await supabase
        .from('candidates')
        .insert([{
          full_name: newCandidate.full_name,
          email: newCandidate.email.toLowerCase().trim(),
          phone: newCandidate.phone,
          linkedin_url: newCandidate.linkedin_url,
          professional_role: newCandidate.professional_role,
          source: newCandidate.source
        }])
        .select()
        .single();

      if (candError) throw candError;

      const { error: appError } = await supabase
        .from('applications')
        .insert([{
          candidate_id: candidate.id,
          job_id: newCandidate.job_id || null,
          status: 'applied'
        }]);
      
      if (appError) throw appError;

      const jobTitle = jobs.find(j => j.id === newCandidate.job_id)?.title || 'General Pipeline';
      await logActivity('Candidate Enrolled', `${newCandidate.full_name} added to ${jobTitle}`, 'success');

      await fetchApplications();
      setShowAddModal(false);
      setNewCandidate({ full_name: '', email: '', phone: '', linkedin_url: '', professional_role: '', source: 'LinkedIn', job_id: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to add candidate.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    const candName = applications.find(a => a.candidate_id === candidateId)?.candidates?.full_name || 'Candidate';
    setDeletingId(candidateId);
    try {
      const { error: appError } = await supabase
        .from('applications')
        .delete()
        .eq('candidate_id', candidateId);

      if (appError) console.error('Error deleting applications:', appError);

      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;

      await logActivity('Candidate Deleted', `${candName} was removed from the system`, 'warning');
      await fetchApplications();
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert('Failed to delete candidate: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const updateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    const app = applications.find(a => a.id === appId);
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId);
    
    if (error) alert('Failed to update status');
    else {
      await logActivity('Stage Updated', `${app?.candidates?.full_name} moved to ${newStatus.replace('_', ' ')}`, 'info');
      fetchApplications();
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedAndFilteredApps = [...applications]
    .filter(app => 
      app.candidates?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.jobs?.title || 'General Talent Pool').toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidates?.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'full_name') {
        comparison = (a.candidates?.full_name || '').localeCompare(b.candidates?.full_name || '');
      } else if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
              <Users size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Candidates
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-1">
            Manage your recruitment pipeline • {applications.length} Active Candidates
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 text-sm"
        >
          <UserPlus size={18} strokeWidth={2.5} />
          Add Candidate
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/50 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm transition-colors duration-300">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search name, role, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider">Sort:</span>
          {(['full_name', 'created_at', 'status'] as SortField[]).map(field => (
            <button 
              key={field}
              onClick={() => handleSort(field)}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                sortBy === field 
                ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-slate-600' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {field.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-slate-400 text-sm font-medium">Syncing candidates...</p>
          </div>
        ) : sortedAndFilteredApps.length === 0 ? (
          <div className="py-20 text-center bg-white/60 dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Users className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={64} />
            <p className="text-slate-400 dark:text-slate-500 font-bold">No candidates found</p>
          </div>
        ) : (
          sortedAndFilteredApps.map((app) => (
            <div 
              key={app.id} 
              className="bg-white/80 dark:bg-slate-900 backdrop-blur-sm p-5 rounded-[2rem] border border-white/50 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-indigo-500/5 group flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div 
                className="flex items-center gap-5 flex-1 cursor-pointer"
                onClick={() => navigate(`/candidates/${app.id}`)}
              >
                <div className="relative shrink-0">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${app.candidates?.full_name}&background=6366f1&color=fff&size=128&bold=true`} 
                    className="w-16 h-16 rounded-[1.4rem] shadow-sm border-2 border-white dark:border-slate-700 object-cover group-hover:scale-105 transition-transform duration-300"
                    alt=""
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-lg tracking-tight">
                    {app.candidates?.full_name}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 items-center">
                    <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                      <Briefcase size={14} strokeWidth={2.5} /> {app.jobs?.title || 'General Talent Pool'}
                    </span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Mail size={14} strokeWidth={2} /> {app.candidates?.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 min-w-[200px]">
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5 border border-slate-100 dark:border-slate-700 p-0.5">
                  {STAGES.map((s, idx) => {
                    const currentIdx = STAGES.findIndex(st => st.value === app.status);
                    return (
                      <div 
                        key={s.value} 
                        className={`flex-1 h-full rounded-full transition-all duration-700 ${idx <= currentIdx ? s.color : 'bg-transparent'}`}
                      />
                    );
                  })}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                  app.status === 'rejected' ? 'text-rose-600 dark:text-rose-400 border-rose-50 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20' : 
                  app.status === 'selected' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-50 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20' : 
                  'text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                }`}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 border-t dark:border-slate-800 lg:border-t-0 lg:border-l border-slate-50 pt-4 lg:pt-0 lg:pl-6">
                <select 
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                  className="appearance-none bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 border-none px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-all cursor-pointer shadow-lg shadow-slate-100 dark:shadow-none"
                >
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button 
                  onClick={() => navigate(`/interviews/new?application_id=${app.id}`)}
                  className="p-3 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white dark:hover:text-white rounded-xl transition-all border border-indigo-100/50 dark:border-indigo-500/20"
                  title="Schedule Interview"
                >
                  <Calendar size={20} strokeWidth={2} />
                </button>
                <button 
                  onClick={() => handleDeleteCandidate(app.candidate_id)}
                  disabled={deletingId === app.candidate_id}
                  className="p-3 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white dark:hover:text-white rounded-xl transition-all border border-rose-100/50 dark:border-rose-500/20 disabled:opacity-50"
                  title="Delete Candidate"
                >
                  {deletingId === app.candidate_id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} strokeWidth={2} />}
                </button>
                <button 
                  onClick={() => navigate(`/candidates/${app.id}`)}
                  className="p-3 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300 border border-white/20 dark:border-slate-800">
            
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
                   <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Enroll Candidate</h2>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pipeline Module v1.5</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <X size={20} className="text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Candidate Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                    <input 
                      required
                      placeholder="e.g. Leonardo Da Vinci"
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold dark:text-white transition-all"
                      value={newCandidate.full_name}
                      onChange={(e) => setNewCandidate({...newCandidate, full_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                    <input 
                      required
                      type="email"
                      placeholder="leo@design.it"
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold dark:text-white transition-all"
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate({...newCandidate, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Phone</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                    <input 
                      placeholder="+39 000 0000 00"
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold dark:text-white transition-all"
                      value={newCandidate.phone}
                      onChange={(e) => setNewCandidate({...newCandidate, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Role/Expertise</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                    <input 
                      placeholder="e.g. Senior Architect"
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold dark:text-white transition-all"
                      value={newCandidate.professional_role}
                      onChange={(e) => setNewCandidate({...newCandidate, professional_role: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Source</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                    <select 
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 text-sm font-bold dark:text-white transition-all appearance-none cursor-pointer"
                      value={newCandidate.source}
                      onChange={(e) => setNewCandidate({...newCandidate, source: e.target.value})}
                    >
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">LinkedIn/Portfolio</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400" size={18} strokeWidth={2.5} />
                    <input 
                      placeholder="https://linkedin.com/in/..."
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm font-bold dark:text-white transition-all"
                      value={newCandidate.linkedin_url}
                      onChange={(e) => setNewCandidate({...newCandidate, linkedin_url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-500/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <Target size={14} strokeWidth={3} />
                    </div>
                    <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Target Position</label>
                  </div>
                  <select 
                    className="w-full px-5 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-indigo-100 dark:border-slate-700 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold transition-all appearance-none cursor-pointer"
                    value={newCandidate.job_id}
                    onChange={(e) => setNewCandidate({...newCandidate, job_id: e.target.value})}
                  >
                    <option value="">General Talent Pool</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title} — {job.department}</option>
                    ))}
                  </select>
                </div>
              </div>
            </form>

            <div className="px-8 py-6 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-700 flex gap-4 shrink-0">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCandidate}
                disabled={formLoading}
                className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] text-white py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50 active:scale-95 text-xs"
              >
                {formLoading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <CheckCircle2 size={18} />
                    Finalize Enrollment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Candidates;
