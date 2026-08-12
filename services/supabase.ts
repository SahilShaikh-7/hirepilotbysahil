// MOCK/PROXY CLIENT REPLACING SUPABASE CLIENT FOR MONGODB BACKEND
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4001/api';

// Helper to perform API Requests with Auth headers
const apiRequest = async (method: string, path: string, body?: any) => {
  const token = localStorage.getItem('hirepilot_token');
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Server request failed');
  }

  return response.json();
};

// Mock Supabase Auth listeners
let authListener: ((event: string, session: any) => void) | null = null;

export const supabase = {
  auth: {
    getSession: async () => {
      const token = localStorage.getItem('hirepilot_token');
      const userJSON = localStorage.getItem('hirepilot_user');
      if (token && userJSON) {
        try {
          const user = JSON.parse(userJSON);
          return { data: { session: { user, access_token: token } }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },
    
    getUser: async () => {
      const token = localStorage.getItem('hirepilot_token');
      const userJSON = localStorage.getItem('hirepilot_user');
      if (token && userJSON) {
        try {
          const user = JSON.parse(userJSON);
          return { data: { user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      }
      return { data: { user: null }, error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      authListener = callback;
      // Trigger initial check
      supabase.auth.getSession().then(({ data: { session } }) => {
        callback('INITIAL_SESSION', session);
      });

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListener = null;
            }
          }
        }
      };
    },

    signOut: async () => {
      localStorage.removeItem('hirepilot_token');
      localStorage.removeItem('hirepilot_user');
      if (authListener) {
        authListener('SIGNED_OUT', null);
      }
      return { error: null };
    }
  },

  // Mock table query builder mapping SQL tables to MongoDB/Express routes
  from: (table: string): any => {
    let filters: any = {};
    let orderClause: any = null;
    let limitVal: number | null = null;
    let updateFields: any = null;
    let insertData: any = null;
    let deleteQuery = false;

    const builder = {
      select: (selectQuery?: string, options?: any) => {
        // Just chain
        return builder;
      },
      eq: (field: string, value: any) => {
        filters[field] = value;
        return builder;
      },
      in: (field: string, values: any[]) => {
        filters[field] = { $in: values };
        return builder;
      },
      maybeSingle: async () => {
        const result = await builder.execute();
        const data = result?.data;
        if (Array.isArray(data)) {
          return { data: data[0] || null, error: null };
        }
        return { data: data || null, error: null };
      },
      single: async () => {
        const result = await builder.execute();
        const data = result?.data;
        if (Array.isArray(data)) {
          if (data.length === 0) return { data: null, error: new Error('Not found') };
          return { data: data[0], error: null };
        }
        return { data: data || null, error: null };
      },
      order: (field: string, options?: any) => {
        orderClause = { field, ...options };
        return builder;
      },
      limit: (val: number) => {
        limitVal = val;
        return builder;
      },
      gte: (field: string, value: any) => {
        filters[field] = { ...filters[field], $gte: value };
        return builder;
      },
      lte: (field: string, value: any) => {
        filters[field] = { ...filters[field], $lte: value };
        return builder;
      },
      update: (fields: any) => {
        updateFields = fields;
        return builder;
      },
      insert: (data: any) => {
        insertData = data;
        return builder;
      },
      delete: (options?: any) => {
        deleteQuery = true;
        return builder;
      },
      
      // Execute the API request based on query build
      execute: async () => {
        try {
          // 1. Log Activity Logs
          if (table === 'activity_logs') {
            if (insertData) {
              const data = Array.isArray(insertData) ? insertData[0] : insertData;
              await apiRequest('POST', '/activities', {
                action: data.action,
                details: data.details,
                type: data.type
              });
              return { data: null, error: null };
            }
            // Fetch activities
            const logs = await apiRequest('GET', `/activities?limit=${limitVal || 10}`);
            return { data: logs, error: null };
          }

          // 2. Jobs
          if (table === 'jobs') {
            if (insertData) {
              const data = Array.isArray(insertData) ? insertData[0] : insertData;
              const res = await apiRequest('POST', '/jobs', {
                title: data.title,
                department: data.department,
                description: data.description,
                skills: data.skills,
                experienceRange: data.experience_range,
                hiringManagerId: data.hiring_manager_id,
                status: data.status
              });
              return { data: res, error: null };
            }
            if (updateFields) {
              const res = await apiRequest('PUT', `/jobs/${filters.id}`, {
                title: updateFields.title,
                department: updateFields.department,
                description: updateFields.description,
                skills: updateFields.skills,
                experienceRange: updateFields.experience_range,
                hiringManagerId: updateFields.hiring_manager_id,
                status: updateFields.status
              });
              return { data: res, error: null };
            }
            if (deleteQuery) {
              await apiRequest('DELETE', `/jobs/${filters.id}`);
              return { data: null, error: null };
            }
            const statusFilter = filters.status;
            const res = await apiRequest('GET', `/jobs${statusFilter ? `?status=${statusFilter}` : ''}`);
            // Map keys back to match UI (experienceRange -> experience_range)
            const mapped = res.map((j: any) => ({
              ...j,
              id: j._id,
              experience_range: j.experienceRange,
              hiring_manager_id: j.hiringManagerId?._id || j.hiringManagerId
            }));
            return { data: mapped, count: mapped.length, error: null };
          }

          // 3. Candidates
          if (table === 'candidates') {
            if (insertData) {
              const data = Array.isArray(insertData) ? insertData[0] : insertData;
              const res = await apiRequest('POST', '/candidates', {
                fullName: data.full_name,
                email: data.email,
                phone: data.phone,
                resumeUrl: data.resume_url,
                linkedinUrl: data.linkedin_url,
                professionalRole: data.professional_role,
                source: data.source
              });
              return { data: res, error: null };
            }
            if (updateFields) {
              const res = await apiRequest('PUT', `/candidates/${filters.id}`, {
                fullName: updateFields.full_name,
                email: updateFields.email,
                phone: updateFields.phone,
                resumeUrl: updateFields.resume_url,
                linkedinUrl: updateFields.linkedin_url,
                professionalRole: updateFields.professional_role,
                source: updateFields.source
              });
              return { data: res, error: null };
            }
            if (deleteQuery) {
              await apiRequest('DELETE', `/candidates/${filters.id}`);
              return { data: null, error: null };
            }
            if (filters.id) {
              const res = await apiRequest('GET', `/candidates/${filters.id}`);
              const mapped = {
                ...res,
                id: res._id,
                full_name: res.fullName,
                resume_url: res.resumeUrl,
                linkedin_url: res.linkedinUrl,
                professional_role: res.professionalRole
              };
              return { data: mapped, error: null };
            }
            const res = await apiRequest('GET', '/candidates');
            const mapped = res.map((c: any) => ({
              ...c,
              id: c._id,
              full_name: c.fullName,
              resume_url: c.resumeUrl,
              linkedin_url: c.linkedinUrl,
              professional_role: c.professionalRole
            }));
            return { data: mapped, error: null };
          }

          // 4. Applications
          if (table === 'applications') {
            if (insertData) {
              const data = Array.isArray(insertData) ? insertData[0] : insertData;
              const res = await apiRequest('POST', '/applications', {
                jobId: data.job_id,
                candidateId: data.candidate_id,
                status: data.status,
                currentStageIndex: data.current_stage_index,
                notes: data.notes
              });
              return { data: res, error: null };
            }
            if (updateFields) {
              const appId = filters.id || filters.job_id; // Check both fallback styles
              const res = await apiRequest('PUT', `/applications/${appId}`, {
                status: updateFields.status,
                currentStageIndex: updateFields.current_stage_index,
                notes: updateFields.notes
              });
              return { data: res, error: null };
            }
            if (deleteQuery) {
              await apiRequest('DELETE', `/applications/${filters.id}`);
              return { data: null, error: null };
            }
            let res = await apiRequest('GET', '/applications');
            // If single fetch filter by candidate or id
            if (filters.id) {
              const singleApp = res.find((a: any) => a.id === filters.id);
              return { data: singleApp || null, error: null };
            }
            if (filters.candidate_id) {
              res = res.filter((a: any) => a.candidate_id === filters.candidate_id);
            }
            if (filters.job_id) {
              res = res.filter((a: any) => a.job_id === filters.job_id);
            }
            return { data: res, count: res.length, error: null };
          }

          // 5. Interviews
          if (table === 'interviews') {
            if (insertData) {
              const data = Array.isArray(insertData) ? insertData[0] : insertData;
              const res = await apiRequest('POST', '/interviews', {
                applicationId: data.application_id,
                title: data.title,
                startTime: data.start_time,
                endTime: data.end_time,
                type: data.type,
                status: data.status,
                meetingLink: data.meeting_link,
                location: data.location,
                participants: [] // Set in separate step if needed, or initialized empty
              });
              // Return matching structure
              return { data: { ...res, id: res._id }, error: null };
            }
            if (updateFields) {
              const res = await apiRequest('PUT', `/interviews/${filters.id}`, {
                applicationId: updateFields.application_id,
                title: updateFields.title,
                startTime: updateFields.start_time,
                endTime: updateFields.end_time,
                type: updateFields.type,
                status: updateFields.status,
                meetingLink: updateFields.meeting_link,
                location: updateFields.location
              });
              return { data: res, error: null };
            }
            if (deleteQuery) {
              await apiRequest('DELETE', `/interviews/${filters.id}`);
              return { data: null, error: null };
            }
            if (filters.application_id) {
              // Get interviews and filter locally for simplicity
              const all = await apiRequest('GET', '/interviews');
              const filtered = all.filter((i: any) => i.application_id === filters.application_id);
              return { data: filtered, error: null };
            }
            const res = await apiRequest('GET', '/interviews');
            return { data: res, count: res.length, error: null };
          }

          // 6. Interview Participants (Mapping MongoDB array to separate SQL actions)
          if (table === 'interview_participants') {
            if (deleteQuery) {
              // In our MongoDB schema, participants are updated directly inside the Interview model.
              // So, delete participants is a no-op or handled on the backend put.
              return { data: null, error: null };
            }
            if (insertData) {
              const data = Array.isArray(insertData) ? insertData : [insertData];
              const interviewId = data[0].interview_id;
              const participantIds = data.map((d: any) => d.interviewer_id);
              
              // Call API PUT to append participants to Interview
              await apiRequest('PUT', `/interviews/${interviewId}`, {
                participants: participantIds
              });
              return { data: null, error: null };
            }
            return { data: [], error: null };
          }

          // 7. Feedback
          if (table === 'feedback') {
            if (insertData) {
              const data = Array.isArray(insertData) ? insertData[0] : insertData;
              const res = await apiRequest('POST', `/interviews/${data.interview_id}/feedback`, {
                interviewerId: data.interviewer_id,
                rating: data.rating,
                comments: data.comments
              });
              return { data: res, error: null };
            }
            // Fetch feedback
            const interviewId = filters.interview_id?.$in ? filters.interview_id.$in[0] : filters.interview_id;
            if (interviewId) {
              const res = await apiRequest('GET', `/interviews/${interviewId}/feedback`);
              return { data: res, error: null };
            }
            return { data: [], error: null };
          }

          // 8. Profiles (Users)
          if (table === 'profiles') {
            if (updateFields) {
              const res = await apiRequest('PUT', `/users/${filters.id}/role`, {
                role: updateFields.role
              });
              return { data: res, error: null };
            }
            if (filters.id) {
              const users = await apiRequest('GET', '/users');
              const user = users.find((u: any) => u.id === filters.id);
              return { data: user || null, error: null };
            }
            const roleFilter = filters.role?.$in || filters.role;
            let path = '/users';
            if (roleFilter) {
              const roles = Array.isArray(roleFilter) ? roleFilter.join(',') : roleFilter;
              path += `?role=${roles}`;
            }
            let res = await apiRequest('GET', path);
            if (filters.email) {
              res = res.filter((u: any) => u.email?.toLowerCase() === filters.email?.toLowerCase());
            }
            return { data: res, error: null };
          }

          return { data: [], error: null };
        } catch (err: any) {
          console.error(`Mock database execution error on table ${table}:`, err);
          return { data: null, error: err };
        }
      },
      // Make builder thenable to act as a promise
      then: function(onfulfilled: any, onrejected: any) {
        return builder.execute().then(onfulfilled, onrejected);
      }
    };

    return builder;
  },

  // Mock RPC calls
  rpc: async (functionName: string, params: any) => {
    try {
      if (functionName === 'detect_interview_conflicts') {
        const res = await apiRequest('POST', '/interviews/detect-conflicts', {
          interviewerId: params.p_interviewer_id,
          startTime: params.p_start,
          endTime: params.p_end
        });
        return { data: res.conflict, error: null };
      }
      return { data: null, error: new Error('RPC not implemented') };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  // Mock Channel removals
  removeChannel: (channel: any) => {
    // No-op
  },

  // Mock Channel creation for logs
  channel: (channelName: string) => {
    return {
      on: (event: string, filter: any, callback: any) => {
        // In MongoDB we'll mock real-time with standard UI actions, or it will just sync on refresh
        return {
          subscribe: () => {
            return { unsubscribe: () => {} };
          }
        };
      },
      subscribe: () => {
        return { unsubscribe: () => {} };
      }
    };
  }
};

// Activity logger helper
export const logActivity = async (action: string, details: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await apiRequest('POST', '/activities', {
      action,
      details,
      type
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// Auth helper functions
export const signInWithGoogle = async () => {
  // Mock Google sign in by opening Google OAuth popup or credential collection.
  // In development, we can prompt for custom testing credentials or redirect to auth provider.
  // Let's implement Google sign in via prompt to type Google JWT token or simulated auth for local development.
  const name = prompt("Please enter your name for Simulated Google Auth:", "Google Admin User");
  const email = prompt("Please enter your Google Email for login:", "sahil68shaikh68@gmail.com");
  
  if (!name || !email) {
    throw new Error("Simulated Google Auth cancelled");
  }

  // Generate a mock JWT representing Google's token payload
  const mockHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const mockPayload = btoa(JSON.stringify({ email, name, picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` }));
  const mockToken = `${mockHeader}.${mockPayload}.signature`;

  const data = await apiRequest('POST', '/auth/google', { idToken: mockToken });
  
  localStorage.setItem('hirepilot_token', data.token);
  localStorage.setItem('hirepilot_user', JSON.stringify(data.user));

  if (authListener) {
    authListener('SIGNED_IN', { user: data.user, access_token: data.token });
  }

  return data;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  const data = await apiRequest('POST', '/auth/signup', {
    email,
    password,
    fullName
  });

  localStorage.setItem('hirepilot_token', data.token);
  localStorage.setItem('hirepilot_user', JSON.stringify(data.user));

  if (authListener) {
    authListener('SIGNED_IN', { user: data.user, access_token: data.token });
  }

  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const data = await apiRequest('POST', '/auth/signin', {
    email,
    password
  });

  localStorage.setItem('hirepilot_token', data.token);
  localStorage.setItem('hirepilot_user', JSON.stringify(data.user));

  if (authListener) {
    authListener('SIGNED_IN', { user: data.user, access_token: data.token });
  }

  return data;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
