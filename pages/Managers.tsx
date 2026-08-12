
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { 
  UserPlus, 
  Search, 
  Mail, 
  RefreshCw, 
  Loader2,
  Users,
  X,
  ShieldAlert,
  UserCheck,
  Building2,
  ShieldCheck,
  Send,
  Copy,
  Check
} from 'lucide-react';

const Managers: React.FC = () => {
  const [managers, setManagers] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTab, setModalTab] = useState<'invite' | 'promote'>('invite');
  
  const [inviteForm, setInviteForm] = useState({ fullName: '', email: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const [promoteSearch, setPromoteSearch] = useState('');

  useEffect(() => {
    fetchManagers();
    fetchAllUsers();
  }, []);

  const fetchManagers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'recruiter'])
      .order('full_name');
    
    if (error) {
      console.error("Error fetching managers:", error);
    } else {
      setManagers(data || []);
    }
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    if (data) setAllUsers(data);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', inviteForm.email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        if (['admin', 'recruiter'].includes(existing.role)) {
          throw new Error('This user is already a manager.');
        } else {
          throw new Error('User already exists in the system. Please use the "Promote Existing" tab.');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setInviteSent(true);

    } catch (err: any) {
      setError(err.message || 'Failed to process invitation.');
    } finally {
      setFormLoading(false);
    }
  };

  const promoteUser = async (userId: string) => {
    setFormLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'recruiter' })
      .eq('id', userId);
    
    if (error) {
      alert('Error promoting user: ' + error.message);
    } else {
      await fetchManagers();
      await fetchAllUsers();
      setShowAddModal(false);
    }
    setFormLoading(false);
  };

  const filteredManagers = managers.filter(m => 
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eligibleUsers = allUsers.filter(u => 
    u.role === 'candidate' || u.role === 'interviewer'
  ).filter(u => 
    u.full_name.toLowerCase().includes(promoteSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(promoteSearch.toLowerCase())
  );

  const inviteLink = `${window.location.origin}/#/signup?ref=manager_invite`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Managers
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-1">
            Hiring Manager • Authorized Recruitment Leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchManagers} 
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => { setError(null); setInviteSent(false); setInviteForm({ fullName: '', email: '' }); setShowAddModal(true); }} 
            className="flex items-center gap-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-95 text-sm"
          >
            <UserPlus size={18} strokeWidth={2.5} />
            Add Member
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center shadow-sm transition-colors duration-300">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search team members by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-50 dark:bg-slate-800 rounded-[2rem] animate-pulse" />)}
        </div>
      ) : filteredManagers.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
          <Users className="mx-auto mb-4 text-slate-100 dark:text-slate-700" size={64} />
          <p className="text-slate-400 dark:text-slate-500 font-bold">No managers configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredManagers.map((manager) => (
            <div key={manager.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/10 relative overflow-hidden">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={manager.avatar_url || `https://ui-avatars.com/api/?name=${manager.full_name}&background=6366f1&color=fff&bold=true`} 
                      className="w-16 h-16 rounded-[1.4rem] shadow-sm border-2 border-white dark:border-slate-700 object-cover group-hover:scale-105 transition-transform duration-300" 
                      alt=""
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full shadow-sm">
                      <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-lg tracking-tight truncate">{manager.full_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                      <Mail size={12} className="text-slate-300 dark:text-slate-600" />
                      {manager.email}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                  manager.role === 'admin' 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' 
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'
                }`}>
                  {manager.role}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                  <UserCheck size={12} />
                  Authorized
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20 dark:border-slate-800">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <UserPlus size={18} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enroll Manager</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm"><X size={18} className="text-slate-400 dark:text-slate-500" /></button>
            </div>

            <div className="flex bg-slate-50/50 dark:bg-slate-800/50 p-2 border-b border-slate-100 dark:border-slate-800">
              <button onClick={() => {setModalTab('invite'); setError(null); setInviteSent(false);}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalTab === 'invite' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>Invite New</button>
              <button onClick={() => {setModalTab('promote'); setError(null);}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalTab === 'promote' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>Promote Existing</button>
            </div>
            
            <div className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold rounded-2xl flex gap-3 items-start animate-in shake duration-500">
                  <ShieldAlert size={16} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {modalTab === 'invite' ? (
                inviteSent ? (
                  <div className="text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100 dark:border-emerald-900/50">
                      <Send size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invitation Ready!</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                        Since this is a secured workspace, the user needs to sign up themselves. Send them this link:
                      </p>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center gap-3">
                      <code className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate font-mono">{inviteLink}</code>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Copied!'); }}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-indigo-600 dark:text-indigo-400"
                        title="Copy to Clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <a 
                       href={`mailto:${inviteForm.email}?subject=Join%20HirePilot%20as%20Manager&body=Hi%20${inviteForm.fullName},%0D%0A%0D%0APlease%20join%20our%20recruitment%20platform%20here:%20${inviteLink}%0D%0A%0D%0AOnce%20you%20sign%20up,%20let%20me%20know%20so%20I%20can%20promote%20you%20to%20Manager.`}
                       className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 dark:shadow-none transition-all text-center"
                    >
                      Open Email Client
                    </a>

                    <button 
                      onClick={() => setInviteSent(false)} 
                      className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Send another invite
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInvite} className="space-y-5">
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50 text-[11px] font-medium text-indigo-800 dark:text-indigo-300 flex gap-2">
                       <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                       <p>This will generate a secure invitation link for the new manager to create their own account.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Full Name</label>
                      <input required placeholder="Enter full name" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-all" value={inviteForm.fullName} onChange={(e) => setInviteForm({...inviteForm, fullName: e.target.value})}/>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Email Address</label>
                      <input required type="email" placeholder="official@company.com" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-all" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}/>
                    </div>
                    <button type="submit" disabled={formLoading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 dark:shadow-none hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50">
                      {formLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Generate Invitation'}
                    </button>
                  </form>
                )
              ) : (
                <div className="space-y-5">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                    <input placeholder="Search users to grant access..." className="w-full pl-11 pr-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 dark:text-white" value={promoteSearch} onChange={(e) => setPromoteSearch(e.target.value)}/>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {eligibleUsers.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <Users size={32} className="mx-auto text-slate-200 dark:text-slate-700" />
                        <p className="text-slate-300 dark:text-slate-600 text-xs font-medium">No eligible candidates found.</p>
                      </div>
                    ) : (
                      eligibleUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{user.full_name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block truncate">{user.email}</span>
                          </div>
                          <button onClick={() => promoteUser(user.id)} className="text-[9px] font-black uppercase tracking-widest bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-600 px-4 py-2 rounded-xl group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">Promote</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default Managers;
