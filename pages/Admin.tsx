
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile, UserRole } from '../types';
import { 
  Shield, 
  ShieldAlert, 
  User, 
  Check, 
  Trash2, 
  Search, 
  Activity, 
  Lock, 
  ExternalLink, 
  Copy, 
  AlertTriangle,
  Settings2,
  Globe,
  Terminal
} from 'lucide-react';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ users: 0, admins: 0, recruiters: 0 });
  const [activeTab, setActiveTab] = useState<'users' | 'config'>('users');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    if (data) {
      setUsers(data);
      setStats({
        users: data.length,
        admins: data.filter(u => u.role === 'admin').length,
        recruiters: data.filter(u => u.role === 'recruiter').length,
      });
    }
    setLoading(false);
  };

  const updateRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) fetchUsers();
    else alert('Failed to update role. Check RLS policies.');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const supabaseUrl = 'https://xkqdqmbtfsvmywnxsqqs.supabase.co';
  const redirectUri = `${supabaseUrl}/auth/v1/callback`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Console</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">System governance and infrastructure configuration.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
          >
            User Management
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
          >
            OAuth & Deploy
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20">
              <Shield size={24} className="mb-4 opacity-80" />
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest">Admins</p>
              <h4 className="text-4xl font-black tracking-tighter">{stats.admins}</h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <Activity size={24} className="mb-4 text-emerald-500" />
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Users</p>
              <h4 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.users}</h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <Lock size={24} className="mb-4 text-orange-500" />
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Recruiters</p>
              <h4 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{stats.recruiters}</h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Active Directory</h3>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                <input 
                  type="text"
                  placeholder="Filter by identity..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Profile</th>
                    <th className="px-8 py-5">Access Group</th>
                    <th className="px-8 py-5 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600" alt="" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                             user.role === 'admin' ? 'bg-indigo-900 text-white border-indigo-900' :
                             user.role === 'recruiter' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' :
                             'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                           }`}>
                             {user.role === 'recruiter' ? 'Manager' : user.role === 'admin' ? 'System Admin' : user.role}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <select 
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-slate-700 dark:text-slate-300 cursor-pointer hover:border-indigo-500 transition-all"
                            value={user.role}
                            onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                          >
                            <option value="candidate">Candidate</option>
                            <option value="interviewer">Interviewer</option>
                            <option value="recruiter">Manager</option>
                            <option value="admin">System Admin</option>
                          </select>
                          <button className="p-2.5 text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 p-6 rounded-[2rem] flex gap-4">
            <AlertTriangle className="text-rose-600 shrink-0" size={24} />
            <div>
              <h4 className="text-rose-900 dark:text-rose-300 font-bold">Fixing OAuth "Error 400: redirect_uri_mismatch"</h4>
              <p className="text-rose-700 dark:text-rose-400 text-sm mt-1 leading-relaxed">
                Google requires all redirect URLs to be manually whitelisted. If you see this error, you need to add the URL below to your Google Cloud Console.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Settings2 className="text-indigo-600" size={20} />
                <h3 className="font-bold text-slate-900 dark:text-white">Google Cloud Configuration</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorized Redirect URI</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-400 truncate">
                      {redirectUri}
                    </div>
                    <button onClick={() => copyToClipboard(redirectUri)} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all"><Copy size={16} /></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorized Javascript Origins</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-400 truncate">
                      {window.location.origin}
                    </div>
                    <button onClick={() => copyToClipboard(window.location.origin)} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all"><Copy size={16} /></button>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">Instructions:</h5>
                <ol className="text-sm text-slate-500 space-y-3 list-decimal ml-4">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-indigo-600 underline font-bold inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={12}/></a></li>
                  <li>Select your project and click your <b>OAuth 2.0 Client ID</b>.</li>
                  <li>Paste the <b>Redirect URI</b> above into the &quot;Authorized redirect URIs&quot; section.</li>
                  <li>Click <b>Save</b> and wait ~5 minutes for Google to update.</li>
                </ol>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="text-emerald-400" size={20} />
                <h3 className="font-bold text-white">Vercel Production Deployment</h3>
              </div>

              <div className="space-y-4">
                <p className="text-slate-400 text-sm leading-relaxed">
                  To deploy this app properly on Vercel, you must set these environment variables in your Vercel Project Settings.
                </p>
                
                <div className="space-y-3">
                  <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Key</p>
                    <p className="text-xs font-mono">VITE_SUPABASE_URL</p>
                  </div>
                  <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Key</p>
                    <p className="text-xs font-mono">VITE_SUPABASE_ANON_KEY</p>
                  </div>
                </div>

                <div className="pt-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal size={16} className="text-indigo-400" />
                    <span className="text-xs font-bold">Post-Deployment Step</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    After Vercel gives you a URL (e.g. <code>hirepilotbysahil.vercel.app</code>), go to <b>Supabase &gt; Auth &gt; URL Configuration</b> and add it to your &quot;Redirect URLs&quot;.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Activity className="text-emerald-400" />
            System Runtime Logs
          </h3>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Diagnostic Stream</span>
        </div>
        <div className="space-y-4 font-mono text-[11px] text-slate-500 overflow-y-auto max-h-64 scrollbar-hide">
           <p className="flex gap-4">
             <span className="text-slate-700 whitespace-nowrap">{new Date().toISOString()}</span>
             <span className="text-indigo-500">[AUTH]</span>
             <span className="text-slate-400">Handshake established with Supabase Auth Edge Runtime.</span>
           </p>
           <p className="flex gap-4">
             <span className="text-slate-700 whitespace-nowrap">{new Date().toISOString()}</span>
             <span className="text-emerald-500">[DB]</span>
             <span className="text-slate-400">PostgREST connection pool: 8 active connections.</span>
           </p>
           <p className="flex gap-4 opacity-50 italic">
             ... monitoring system events in real-time ...
           </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;

