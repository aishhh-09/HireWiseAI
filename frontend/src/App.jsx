import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  Cpu, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Play, 
  Check, 
  Eye, 
  EyeOff, 
  UserCheck, 
  RefreshCw, 
  FileDown, 
  X,
  Search,
  User,
  Users,
  Target,
  Percent,
  AlertTriangle,
  Lock,
  Mail,
  UserPlus,
  Copy,
  ClipboardCheck,
  Code,
  LayoutGrid,
  Bell,
  Plus,
  LogOut,
  Download,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Save,
  Settings
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8000';

const jobTemplates = [
  {
    id: 't1',
    title: 'Senior Software Engineer (React/Node)',
    skills: 'React, Node.js, TypeScript, AWS, REST APIs, SQL, Docker',
    experience: '5+ years',
    education: 'Bachelor\'s in Computer Science or equivalent',
    description: 'Lead engineering sprints, design robust REST and GraphQL API gateways, build responsive React user experiences, and architect scalable serverless AWS systems.'
  },
  {
    id: 't2',
    title: 'AI Data Scientist',
    skills: 'Python, PyTorch, LLMs, NLP, SQL, Pandas, Scikit-Learn',
    experience: '3+ years',
    education: 'Master\'s or PhD in CS, Statistics, or Math',
    description: 'Develop predictive models, design experimentation frameworks, and analyze complex unstructured datasets to drive product insights. Experience with LLMs is a plus.'
  },
  {
    id: 't3',
    title: 'Technical Product Manager',
    skills: 'Product Strategy, Roadmap Definition, Agile/Scrum, SQL, Analytics, User Research',
    experience: '4+ years',
    education: 'Bachelor\'s in Business, Engineering, or Computer Science',
    description: 'Drive product requirements definition, manage sprint cycles, and collaborate with engineering to build cloud-native enterprise platforms.'
  }
];

// Parser to convert LaTeX back to Candidate JSON profile
const parseLatexToProfile = (latexText) => {
  try {
    const profile = {
      personal_info: { name: '', email: '', phone: '', location: '' },
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      projects: []
    };

    const unescapeLatex = (str) => {
      if (!str) return '';
      return str
        .replace(/\\_/g, '_')
        .replace(/\\%/g, '%')
        .replace(/\\$/g, '$')
        .replace(/\\#/g, '#')
        .replace(/\\&/g, '&')
        .replace(/\\{/g, '{')
        .replace(/\\}/g, '}')
        .replace(/\\backslash\{\}/g, '\\')
        .replace(/\\textasciitilde\{\}/g, '~')
        .replace(/\\textasciicircum\{\}/g, '^');
    };

    // Name
    const nameMatch = latexText.match(/\\huge\\bfseries\s*\{?([^\}]+)\}?\\\\/i) || latexText.match(/\\huge\\bfseries\s+([^\n\\]+)/i);
    if (nameMatch) {
      profile.personal_info.name = unescapeLatex(nameMatch[1].trim());
    }

    // Contact details
    const contactBlockMatch = latexText.match(/\\begin\{center\}[\s\S]*?\\\\([\s\S]*?)\\end\{center\}/i);
    if (contactBlockMatch) {
      const parts = contactBlockMatch[1].split(/[|\\|]/).map(s => s.trim());
      if (parts.length > 0) profile.personal_info.email = unescapeLatex(parts[0].replace(/\\/g, '').trim());
      if (parts.length > 1) profile.personal_info.phone = unescapeLatex(parts[1].replace(/\\/g, '').trim());
      if (parts.length > 2) profile.personal_info.location = unescapeLatex(parts[2].replace(/\\/g, '').trim());
    }

    // Skills
    const skillsSection = latexText.match(/\\section\*\{Technical Skills\}\n([^\n\\%]+)/i);
    if (skillsSection) {
      profile.skills = skillsSection[1].split(',').map(s => unescapeLatex(s.trim())).filter(s => s);
    }

    // Experience
    const expRegex = /\\textbf\{([^\}]+)\}\s*&\s*\\hfill\s*\\textbf\{([^\}]+)\}\s*\\\\\s*\\textit\{([^\}]+)\}\s*\\\\\s*\\begin\{itemize\}[\s\S]*?([\s\S]*?)\\end\{itemize\}/gi;
    let match;
    while ((match = expRegex.exec(latexText)) !== null) {
      const role = unescapeLatex(match[1].trim());
      const duration = unescapeLatex(match[2].trim());
      const company = unescapeLatex(match[3].trim());
      const descItems = match[4].match(/\\item\s*([^\n]+)/g) || [];
      const description = descItems.map(item => unescapeLatex(item.replace(/\\item/g, '').trim())).join('. ');
      
      profile.experience.push({ role, duration, company, description });
    }

    // Education
    const eduRegex = /\\textbf\{([^\}]+)\}\s*&\s*\\hfill\s*\\textbf\{([^\}]+)\}\s*\\\\\s*\\textit\{([^\}]+)\}/gi;
    while ((match = eduRegex.exec(latexText)) !== null) {
      const degree = unescapeLatex(match[1].trim());
      const year = unescapeLatex(match[2].trim());
      const institution = unescapeLatex(match[3].trim());
      profile.education.push({ degree, year, institution });
    }

    // Certifications
    const certSection = latexText.match(/\\section\*\{Certifications\}\n\\begin\{itemize\}[\s\S]*?([\s\S]*?)\\end\{itemize\}/i);
    if (certSection) {
      const items = certSection[1].match(/\\item\s*([^\n]+)/g) || [];
      profile.certifications = items.map(item => unescapeLatex(item.replace(/\\item/g, '').trim()));
    }

    // Projects
    const projRegex = /\\textbf\{([^\}]+)\}\s*\\\\\s*\\textit\{Technologies:\s*([^\}]+)\}\s*\\\\\s*\\begin\{itemize\}[\s\S]*?([\s\S]*?)\\end\{itemize\}/gi;
    while ((match = projRegex.exec(latexText)) !== null) {
      const name = unescapeLatex(match[1].trim());
      const tech_stack = match[2].split(',').map(s => unescapeLatex(s.trim()));
      const descItems = match[3].match(/\\item\s*([^\n]+)/g) || [];
      const description = descItems.map(item => unescapeLatex(item.replace(/\\item/g, '').trim())).join('. ');
      
      profile.projects.push({ name, tech_stack, description });
    }

    return profile;
  } catch (err) {
    console.error("LaTeX parsing error:", err);
    return null;
  }
};

const LaTeXLivePreview = ({ candidate, isAnonymized }) => {
  if (!candidate) return null;
  const personal = isAnonymized ? candidate.anonymized_personal_info : candidate.personal_info;
  const profile = isAnonymized ? candidate.anonymized_profile : candidate.parsed_data;

  return (
    <div className="latex-paper-sheet">
      <div className="latex-paper-header">
        <h2 className="latex-paper-name">{personal.name || 'Candidate Name'}</h2>
        <div className="latex-paper-contact">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>  |  {personal.phone}</span>}
          {personal.location && <span>  |  {personal.location}</span>}
        </div>
      </div>

      {profile.skills && profile.skills.length > 0 && (
        <div className="latex-paper-section">
          <h3 className="latex-paper-section-title">TECHNICAL SKILLS</h3>
          <div className="latex-paper-section-line"></div>
          <p className="latex-paper-text">{profile.skills.join(', ')}</p>
        </div>
      )}

      {profile.experience && profile.experience.length > 0 && (
        <div className="latex-paper-section">
          <h3 className="latex-paper-section-title">PROFESSIONAL EXPERIENCE</h3>
          <div className="latex-paper-section-line"></div>
          {profile.experience.map((exp, idx) => (
            <div key={idx} className="latex-paper-item">
              <div className="latex-paper-item-header">
                <strong>{exp.role}</strong>
                <span>{exp.duration}</span>
              </div>
              <div className="latex-paper-item-sub">
                <em>{exp.company}</em>
              </div>
              {exp.description && (
                <ul className="latex-paper-list">
                  {exp.description.split('.').map((s, i) => {
                    const sentence = s.trim();
                    if (!sentence) return null;
                    return <li key={i}>{sentence}.</li>;
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {profile.education && profile.education.length > 0 && (
        <div className="latex-paper-section">
          <h3 className="latex-paper-section-title">EDUCATION</h3>
          <div className="latex-paper-section-line"></div>
          {profile.education.map((edu, idx) => (
            <div key={idx} className="latex-paper-item">
              <div className="latex-paper-item-header">
                <strong>{edu.degree}</strong>
                <span>{edu.year}</span>
              </div>
              <div className="latex-paper-item-sub">
                <em>{edu.institution}</em>
              </div>
            </div>
          ))}
        </div>
      )}

      {profile.certifications && profile.certifications.length > 0 && (
        <div className="latex-paper-section">
          <h3 className="latex-paper-section-title">CERTIFICATIONS</h3>
          <div className="latex-paper-section-line"></div>
          <ul className="latex-paper-list">
            {profile.certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </div>
      )}

      {profile.projects && profile.projects.length > 0 && (
        <div className="latex-paper-section">
          <h3 className="latex-paper-section-title">PROJECTS</h3>
          <div className="latex-paper-section-line"></div>
          {profile.projects.map((proj, idx) => (
            <div key={idx} className="latex-paper-item">
              <div className="latex-paper-item-header">
                <strong>{proj.name}</strong>
              </div>
              {proj.tech_stack && proj.tech_stack.length > 0 && (
                <div className="latex-paper-item-sub">
                  <em>Technologies: {proj.tech_stack.join(', ')}</em>
                </div>
              )}
              {proj.description && (
                <ul className="latex-paper-list">
                  {proj.description.split('.').map((s, i) => {
                    const sentence = s.trim();
                    if (!sentence) return null;
                    return <li key={i}>{sentence}.</li>;
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [authError, setAuthError] = useState('');

  // App core states
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'timeline' | 'latex'
  const [isAnonymized, setIsAnonymized] = useState(true);
  const [candidateStatuses, setCandidateStatuses] = useState(() => {
    const saved = localStorage.getItem('hirewise_candidate_statuses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [editableLatex, setEditableLatex] = useState('');
  const [previewMode, setPreviewMode] = useState('html'); // 'html' | 'pdf'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'shortlisted-gallery'
  const [analyticsData, setAnalyticsData] = useState([]);
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hirewise_theme') || 'dark';
  });
  const [weights, setWeights] = useState(() => {
    const saved = localStorage.getItem('hirewise_weights');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { skills: 35, experience: 30, education: 15, projects: 10, certifications: 10 };
  });
  const [activeModel, setActiveModel] = useState(() => {
    return localStorage.getItem('hirewise_active_model') || 'gemini-flash';
  });
  const [selectedShortlistedCandidate, setSelectedShortlistedCandidate] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('hirewise_chats');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });
  const [notifications, setNotifications] = useState([]);
  const [activeChatCandidateId, setActiveChatCandidateId] = useState(null);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  
  // Recruiter Profile States
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [recruiterProfile, setRecruiterProfile] = useState(() => {
    const saved = localStorage.getItem('hirewise_recruiter_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { name: 'Alex Chen', role: 'Recruiter Lead', email: 'admin@smarthr.ai' };
  });
  const [editProfileForm, setEditProfileForm] = useState({ name: '', role: '', email: '' });




  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState('');

  // Loading & UI states
  const [uploading, setUploading] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Form states
  const [jobForm, setJobForm] = useState({
    title: '',
    skills: '',
    experience: '',
    education: '',
    description: ''
  });

  const fileInputRef = useRef(null);

  // Pre-fill login credentials on load
  useEffect(() => {
    setAuthForm(prev => ({
      ...prev,
      email: 'admin@smarthr.ai',
      password: 'password123'
    }));
  }, []);

  // Sync LaTeX code string
  useEffect(() => {
    if (activeCandidate) {
      setEditableLatex(generateLaTeX(activeCandidate));
    }
  }, [activeCandidate, isAnonymized]);

  // Sync body theme class
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);


  // Save settings and session states to LocalStorage when they change
  useEffect(() => {
    localStorage.setItem('hirewise_candidate_statuses', JSON.stringify(candidateStatuses));
  }, [candidateStatuses]);

  useEffect(() => {
    localStorage.setItem('hirewise_weights', JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem('hirewise_active_model', activeModel);
  }, [activeModel]);

  useEffect(() => {
    localStorage.setItem('hirewise_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('hirewise_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('hirewise_recruiter_profile', JSON.stringify(recruiterProfile));
  }, [recruiterProfile]);

  useEffect(() => {
    const handleCloseDropdown = () => {
      setShowProfileDropdown(false);
    };
    if (showProfileDropdown) {
      window.addEventListener('click', handleCloseDropdown);
    }
    return () => {
      window.removeEventListener('click', handleCloseDropdown);
    };
  }, [showProfileDropdown]);



  const handleCompileLive = async () => {
    if (!activeCandidate) return;
    
    const updatedProfile = parseLatexToProfile(editableLatex);
    if (!updatedProfile) {
      alert("Failed to parse LaTeX syntax. Please check for errors.");
      return;
    }
    
    const updatedCandidate = {
      ...activeCandidate,
      personal_info: isAnonymized ? activeCandidate.personal_info : updatedProfile.personal_info,
      parsed_data: isAnonymized ? activeCandidate.parsed_data : updatedProfile,
      anonymized_personal_info: isAnonymized ? updatedProfile.personal_info : activeCandidate.anonymized_personal_info,
      anonymized_profile: isAnonymized ? updatedProfile : activeCandidate.anonymized_profile
    };
    
    try {
      const res = await fetch(`${API_BASE}/api/resumes/${activeCandidate.resume_id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsed_data: updatedCandidate.parsed_data,
          anonymized_profile: updatedCandidate.anonymized_profile
        })
      });
      
      if (res.ok) {
        setActiveCandidate(updatedCandidate);
        setRankedCandidates(prev => prev.map(c => 
          c.resume_id === activeCandidate.resume_id ? updatedCandidate : c
        ));
        alert("LaTeX Compiled Successfully! Live preview and PDF updated.");
      } else {
        alert("Failed to compile updated LaTeX resume.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to compile backend.");
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (isLoggedIn) {
      fetchResumes();
      fetchJobs();
      fetchAnalytics();
    }
  }, [isLoggedIn]);
  useEffect(() => {
    if (isLoggedIn && currentView === 'analytics') {
      fetchAnalytics();
    }
  }, [currentView, isLoggedIn]);

  useEffect(() => {
    if (selectedShortlistedCandidate) {
      fetchInterviewQuestions(selectedShortlistedCandidate);
    } else {
      setGeneratedQuestions([]);
    }
  }, [selectedShortlistedCandidate, selectedJobId]);

  const fetchInterviewQuestions = async (cand) => {
    if (!cand) return;
    setFetchingQuestions(true);
    setExpandedQuestionIdx(null);
    try {
      const jobId = selectedJobId || (jobs.length > 0 ? jobs[0].id : '');
      if (!jobId) {
        setGeneratedQuestions([]);
        setFetchingQuestions(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/questions/${jobId}/${cand.resume_id || cand.id}`);
      if (res.ok) {
        const data = await res.json();
        setGeneratedQuestions(data);
      }
    } catch (err) {
      console.error('Error fetching interview questions:', err);
    } finally {
      setFetchingQuestions(false);
    }
  };

  const startCandidateChat = (candidate) => {
    const candId = candidate.resume_id || candidate.id || candidate.resumeId;
    const personal = isAnonymized ? candidate.anonymized_profile?.personal_info : candidate.parsed_data?.personal_info;
    const name = personal?.name || "Candidate";
    const topSkill = candidate.parsed_data?.skills?.[0] || "their key skills";
    const targetRole = jobs.find(j => j.id === selectedJobId)?.title || candidate.parsed_data?.experience?.[0]?.role || "the open position";

    // Set first outreach message if chat does not exist yet
    if (!chats[candId]) {
      const recruiterMsg = {
        id: Date.now(),
        sender: 'recruiter',
        text: `Hello ${name}, thank you for your application for the ${targetRole} role. We were highly impressed by your experience in ${topSkill} and would like to schedule a brief screening call. Let us know when you might be free!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChats(prev => ({
        ...prev,
        [candId]: [recruiterMsg]
      }));

      // Trigger automatic relevant candidate reply after 1.5s
      setTimeout(() => {
        const candidateMsg = {
          id: Date.now() + 1,
          sender: 'candidate',
          text: `Hi Alex, thank you so much for reaching out! I'm definitely interested in discussing the ${targetRole} opportunity further. I have some availability tomorrow afternoon or Thursday morning. Does any of those slots work for you?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChats(prev => ({
          ...prev,
          [candId]: [...(prev[candId] || []), candidateMsg]
        }));

        // Send a notification alert
        setNotifications(prev => [
          ...prev,
          {
            id: Date.now() + 2,
            candidateId: candId,
            candidateName: name,
            text: `New reply from ${name}`
          }
        ]);
      }, 1500);
    }

    setActiveChatCandidateId(candId);
    setShowChatDrawer(true);
  };

  const sendChatMessage = (text) => {
    if (!text.trim() || !activeChatCandidateId) return;

    const newMsg = {
      id: Date.now(),
      sender: 'recruiter',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => {
      const currentList = prev[activeChatCandidateId] || [];
      return {
        ...prev,
        [activeChatCandidateId]: [...currentList, newMsg]
      };
    });

    setTypedMessage('');

    // Trigger mock candidate response after 1.5s
    setTimeout(() => {
      let candidateReply = "That sounds great! I look forward to our conversation.";
      if (text.toLowerCase().includes("schedule") || text.toLowerCase().includes("calendar") || text.toLowerCase().includes("interview")) {
        candidateReply = "Sounds perfect! Please go ahead and send over a calendar invite, and I'll confirm it right away. Thank you!";
      } else if (text.toLowerCase().includes("salary") || text.toLowerCase().includes("compensation")) {
        candidateReply = "I'm open to discussing the range, but I generally align with standard industry rates for this level of role.";
      } else if (text.toLowerCase().includes("remote") || text.toLowerCase().includes("location")) {
        candidateReply = "I am fully comfortable with the work arrangements specified in the job description.";
      }

      const replyMsg = {
        id: Date.now() + 1,
        sender: 'candidate',
        text: candidateReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => {
        const currentList = prev[activeChatCandidateId] || [];
        return {
          ...prev,
          [activeChatCandidateId]: [...currentList, replyMsg]
        };
      });

      // Send notification alert
      const activeCandidate = resumes.find(r => (r.resume_id || r.id) === activeChatCandidateId);
      const personal = isAnonymized ? activeCandidate?.anonymized_profile?.personal_info : activeCandidate?.parsed_data?.personal_info;
      const name = personal?.name || "Candidate";

      setNotifications(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          candidateId: activeChatCandidateId,
          candidateName: name,
          text: `Reply from ${name}`
        }
      ]);
    }, 1500);
  };



  const fetchResumes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/resumes`);
      if (res.ok) {
        const data = await res.json();
        setResumes(Object.values(data));
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(Object.values(data));
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchAnalytics = async () => {
    setFetchingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setFetchingAnalytics(false);
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'login') {
      if (authForm.email === 'admin@smarthr.ai' && authForm.password === 'password123') {
        setIsLoggedIn(true);
        setAuthError('');
      } else {
        setAuthError('Invalid administrator credentials.');
      }
    } else {
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
      setIsLoggedIn(true);
      setAuthError('');
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm)
      });
      if (res.ok) {
        const newJob = await res.json();
        setJobs(prev => [...prev, newJob]);
        setSelectedJobId(newJob.id);
        setShowJobForm(false);
        setJobForm({ title: '', skills: '', experience: '', education: '', description: '' });
      }
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this job description?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJobId === jobId) {
          setSelectedJobId('');
          setRankedCandidates([]);
          setActiveCandidate(null);
        }
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const applyTemplate = (template) => {
    setJobForm({
      title: template.title,
      skills: template.skills,
      experience: template.experience,
      education: template.education,
      description: template.description
    });
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFilesUpload(e.target.files);
    }
  };

  const handleFilesUpload = async (files) => {
    setUploading(true);
    let lastUploadedCandidate = null;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatusMessage(`Parsing ${file.name}...`);
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          lastUploadedCandidate = await res.json();
        } else {
          const errData = await res.json();
          alert(`Error uploading ${file.name}: ${errData.detail}`);
        }
      } catch (err) {
        console.error('Error uploading file:', err);
        alert(`Failed to upload ${file.name}`);
      }
    }
    
    setStatusMessage('All resumes loaded.');
    setUploading(false);
    setTimeout(() => setStatusMessage(''), 3000);
    
    // Instantly preview the compiled LaTeX PDF of the last uploaded candidate
    if (lastUploadedCandidate) {
      const previewCandidate = {
        resume_id: lastUploadedCandidate.id,
        filename: lastUploadedCandidate.filename,
        personal_info: lastUploadedCandidate.parsed_data.personal_info,
        anonymized_personal_info: {
          name: `Candidate #${lastUploadedCandidate.id.substring(0, 5).toUpperCase()}`,
          email: "[HIDDEN FOR BIAS-FREE SCREENING]",
          phone: "[HIDDEN FOR BIAS-FREE SCREENING]",
          location: "[HIDDEN FOR BIAS-FREE SCREENING]"
        },
        scores: { skills: 0, experience: 0, projects: 0 },
        overall_score: 0,
        explanation: "Resume parsed and compiled to LaTeX successfully. Configure a job description and click 'Screen & Rank' to calculate match scores.",
        missing_skills: [],
        key_strengths: [],
        reason_for_not_match: "",
        parsed_data: lastUploadedCandidate.parsed_data,
        anonymized_profile: {
          ...lastUploadedCandidate.parsed_data,
          personal_info: {
            name: `Candidate #${lastUploadedCandidate.id.substring(0, 5).toUpperCase()}`,
            email: "[HIDDEN FOR BIAS-FREE SCREENING]",
            phone: "[HIDDEN FOR BIAS-FREE SCREENING]",
            location: "[HIDDEN FOR BIAS-FREE SCREENING]"
          }
        }
      };
      setActiveCandidate(previewCandidate);
      setActiveTab('insights');
    }
    
    fetchResumes();
  };

  const handleDeleteResume = async (resumeId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/resumes/${resumeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setResumes(prev => prev.filter(r => r.id !== resumeId));
        setRankedCandidates(prev => prev.filter(c => c.resume_id !== resumeId));
        if (activeCandidate && activeCandidate.resume_id === resumeId) {
          setActiveCandidate(null);
        }
      }
    } catch (err) {
      console.error('Error deleting resume:', err);
    }
  };

  const handleRank = async () => {
    if (!selectedJobId) return;
    setRanking(true);
    setStatusMessage('Ranking resumes...');
    try {
      const res = await fetch(`${API_BASE}/api/rank/${selectedJobId}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setRankedCandidates(data);
        if (data.length > 0) {
          // Keep active selection or fallback to first
          const stillExists = activeCandidate ? data.find(c => c.resume_id === activeCandidate.resume_id) : null;
          setActiveCandidate(stillExists || data[0]);
        }
      }
    } catch (err) {
      console.error('Error ranking candidates:', err);
    }
    setRanking(false);
    setStatusMessage('');
  };

  // Filter candidates based on search query
  const getFilteredCandidates = () => {
    if (!searchQuery.trim()) return rankedCandidates;
    const query = searchQuery.toLowerCase().trim();
    return rankedCandidates.filter(cand => {
      const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
      const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
      const nameMatch = (personal.name || '').toLowerCase().includes(query);
      const skillMatch = profile.skills.some(s => s.toLowerCase().includes(query));
      return nameMatch || skillMatch;
    });
  };

  const getShortlistedCandidates = () => {
    const list = [];
    resumes.forEach(r => {
      if (candidateStatuses[r.id] === 'Shortlisted') {
        const ranked = rankedCandidates.find(c => c.resume_id === r.id);
        if (ranked) {
          list.push(ranked);
        } else {
          list.push({
            resume_id: r.id,
            filename: r.filename,
            personal_info: r.parsed_data.personal_info,
            anonymized_personal_info: r.anonymized_profile.personal_info,
            overall_score: 0,
            scores: { skills: 0, experience: 0, projects: 0 },
            explanation: "No fitment evaluation computed yet.",
            parsed_data: r.parsed_data,
            anonymized_profile: r.anonymized_profile
          });
        }
      }
    });
    return list;
  };

  const calculateLocalMatchScore = (parsed_resume, job) => {
    const jd_skills = job.skills || job.description || "";
    const required = jd_skills.split(/[,,;|]/).map(s => s.trim().toLowerCase()).filter(s => s);
    const cand_skills = (parsed_resume.skills || []).map(s => s.toLowerCase());
    
    let matches = 0;
    required.forEach(req => {
      if (cand_skills.some(c => c.includes(req) || req.includes(c))) {
        matches++;
      }
    });
    
    const skills_pct = required.length ? Math.round(matches / required.length * 100) : 80;
    const exp_len = (parsed_resume.experience || []).length;
    const exp_pct = exp_len ? Math.min(40 + exp_len * 20, 100) : 50;
    
    const overall = Math.min(Math.max(Math.round(skills_pct * 0.5 + exp_pct * 0.5), 20), 98);
    
    return {
      overall_score: overall,
      explanation: `Local AI analysis identifies this candidate as the top matching profile for the ${job.title} category with a match rating of ${overall}%. They demonstrate solid alignment with key competencies in ${parsed_resume.skills?.slice(0, 3).join(', ') || 'required skills'}.`
    };
  };

  const getMostEligibleCandidates = () => {
    const list = [];
    jobs.forEach(job => {
      let bestCandidate = null;
      let bestScore = -1;
      
      resumes.forEach(resume => {
        const match = rankedCandidates.find(c => c.resume_id === resume.id && selectedJobId === job.id);
        let score = 0;
        let explanation = "";
        
        if (match) {
          score = match.overall_score;
          explanation = match.explanation;
        } else {
          const localEval = calculateLocalMatchScore(resume.parsed_data, job);
          score = localEval.overall_score;
          explanation = localEval.explanation;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = {
            resume_id: resume.id,
            name: resume.parsed_data.personal_info.name || "Unnamed Candidate",
            anonymized_name: resume.anonymized_profile.personal_info.name || "Candidate",
            initials: resume.parsed_data.personal_info.name ? resume.parsed_data.personal_info.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C',
            score: score,
            explanation: explanation,
            job_id: job.id,
            job_title: job.title,
            skills: resume.parsed_data.skills || [],
            anonymized_skills: resume.anonymized_profile.skills || [],
            resume_obj: resume
          };
        }
      });
      
      if (bestCandidate) {
        list.push(bestCandidate);
      }
    });
    return list;
  };



  // Generate LaTeX Resume code
  const generateLaTeX = (cand) => {
    if (!cand) return '';
    const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
    const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
    
    const escapeLatex = (str) => {
      if (!str) return '';
      return str
        .replace(/\\/g, '\\backslash{}')
        .replace(/_/g, '\\_')
        .replace(/%/g, '\\%')
        .replace(/\$/g, '\\$')
        .replace(/#/g, '\\#')
        .replace(/&/g, '\\&')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');
    };

    const name = escapeLatex(personal.name || 'Candidate');
    const email = escapeLatex(personal.email || 'N/A');
    const phone = escapeLatex(personal.phone || 'N/A');
    const location = escapeLatex(personal.location || 'N/A');

    let experienceLatex = '';
    if (profile.experience && profile.experience.length > 0) {
      profile.experience.forEach(exp => {
        experienceLatex += `\\textbf{${escapeLatex(exp.role)}} & \\hfill \\textbf{${escapeLatex(exp.duration)}} \\\\\n`;
        experienceLatex += `\\textit{${escapeLatex(exp.company)}} \\\\\n`;
        experienceLatex += `\\begin{itemize}[noitemsep,topsep=2pt]\n`;
        if (exp.description) {
          exp.description.split('.').forEach(sentence => {
            if (sentence.trim()) {
              experienceLatex += `    \\item ${escapeLatex(sentence.trim())}.\n`;
            }
          });
        }
        experienceLatex += `\\end{itemize}\n\\vspace{6pt}\n`;
      });
    } else {
      experienceLatex = 'No experience recorded.\\\\\n';
    }

    let educationLatex = '';
    if (profile.education && profile.education.length > 0) {
      profile.education.forEach(edu => {
        educationLatex += `\\textbf{${escapeLatex(edu.degree)}} & \\hfill \\textbf{${escapeLatex(edu.year)}} \\\\\n`;
        educationLatex += `\\textit{${escapeLatex(edu.institution)}} \\\\\n\\vspace{4pt}\n`;
      });
    } else {
      educationLatex = 'No education recorded.\\\\\n';
    }

    let skillsLatex = profile.skills && profile.skills.length > 0 
      ? profile.skills.map(s => escapeLatex(s)).join(', ') 
      : 'No skills recorded.';

    let certsLatex = '';
    if (profile.certifications && profile.certifications.length > 0) {
      certsLatex = '\\begin{itemize}[noitemsep,topsep=2pt]\n';
      profile.certifications.forEach(cert => {
        certsLatex += `    \\item ${escapeLatex(cert)}\n`;
      });
      certsLatex += '\\end{itemize}\n';
    } else {
      certsLatex = 'No certifications recorded.\\\\\n';
    }

    let projectsLatex = '';
    if (profile.projects && profile.projects.length > 0) {
      profile.projects.forEach(proj => {
        projectsLatex += `\\textbf{${escapeLatex(proj.name)}} \\\\\n`;
        if (proj.tech_stack && proj.tech_stack.length > 0) {
          projectsLatex += `\\textit{Technologies: ${escapeLatex(proj.tech_stack.join(', '))}} \\\\\n`;
        }
        projectsLatex += `\\begin{itemize}[noitemsep,topsep=2pt]\n`;
        if (proj.description) {
          proj.description.split('.').forEach(s => {
            if (s.trim()) {
              projectsLatex += `    \\item ${escapeLatex(s.trim())}.\n`;
            }
          });
        }
        projectsLatex += `\\end{itemize}\n\\vspace{6pt}\n`;
      });
    }

    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}
\\begin{center}
    {\\huge\\bfseries ${name}} \\\\ \\vspace{4pt}
    ${email} | ${phone} | ${location}
\\end{center}

\\vspace{10pt}

\\section*{Technical Skills}
${skillsLatex}

\\vspace{10pt}

\\section*{Professional Experience}
${experienceLatex}

\\vspace{10pt}

\\section*{Education}
${educationLatex}
${certsLatex ? `
\\vspace{10pt}

\\section*{Certifications}
${certsLatex}` : ''}
${projectsLatex ? `
\\vspace{10pt}

\\section*{Projects}
${projectsLatex}` : ''}
\\end{document}`;
  };

  const copyLaTeXToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const downloadLaTeXFile = () => {
    const code = generateLaTeX(activeCandidate);
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const personal = isAnonymized ? activeCandidate.anonymized_personal_info : activeCandidate.personal_info;
    const safeName = (personal.name || 'candidate').toLowerCase().replace(/\s+/g, '_');
    link.download = `${safeName}_resume.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredCandidates = getFilteredCandidates();

  const handleShortlist = (candId) => {
    setCandidateStatuses(prev => ({
      ...prev,
      [candId]: 'Shortlisted'
    }));
  };

  const handleReject = (candId) => {
    setCandidateStatuses(prev => ({
      ...prev,
      [candId]: 'Rejected'
    }));
  };

  const handleExportPDF = (candId) => {
    window.open(`${API_BASE}/api/resumes/${candId}/pdf?anonymized=${isAnonymized}`, '_blank');
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    return 'poor';
  };

  const activeJob = jobs.find(j => j.id === selectedJobId);

  // LOGIN / SIGNUP VIEW CONTAINER
  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-blob auth-blob-1"></div>
        <div className="auth-blob auth-blob-2"></div>
        
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-badge">
              <UserCheck size={24} />
            </div>
            <h2>HR SmartRank AI</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-slate-400)' }}>
              {authMode === 'login' ? 'Sign in to access your recruitment dashboard' : 'Register a new administrator profile'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'signup' && (
              <div className="auth-input-group">
                <span className="auth-input-label">Full Name</span>
                <input 
                  type="text" 
                  className="auth-input" 
                  required 
                  placeholder="e.g. Jane Doe"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm({...authForm, fullName: e.target.value})}
                />
              </div>
            )}

            <div className="auth-input-group">
              <span className="auth-input-label">Email Address</span>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-slate-500)' }} />
                <input 
                  type="email" 
                  className="auth-input" 
                  style={{ paddingLeft: '2rem', width: '100%' }}
                  required 
                  placeholder="name@company.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <span className="auth-input-label">Password</span>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-slate-500)' }} />
                <input 
                  type="password" 
                  className="auth-input" 
                  style={{ paddingLeft: '2rem', width: '100%' }}
                  required 
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div className="auth-input-group">
                <span className="auth-input-label">Confirm Password</span>
                <input 
                  type="password" 
                  className="auth-input" 
                  required 
                  placeholder="••••••••"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                />
              </div>
            )}

            {authError && <div className="auth-error-msg">{authError}</div>}

            <button type="submit" className="auth-btn">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {authMode === 'login' && (
            <div className="auth-tip">
              <strong>Demo Login:</strong><br />
              User: <code style={{ color: 'white' }}>admin@smarthr.ai</code><br />
              Pass: <code style={{ color: 'white' }}>password123</code>
            </div>
          )}

          <div className="auth-toggle-link">
            {authMode === 'login' ? (
              <>Don't have an account? <span onClick={() => { setAuthMode('signup'); setAuthError(''); }}>Sign Up</span></>
            ) : (
              <>Already registered? <span onClick={() => { setAuthMode('login'); setAuthError(''); }}>Log In</span></>
            )}
          </div>
        </div>
      </div>
    );
  }

  // CORE LOGGED IN WORKSPACE VIEW
  return (
    <div className="app-layout">
      {/* 1. Left Icon Navigation Strip */}
      <div className="side-nav-strip">
        <div className="side-nav-logo">
          <Cpu size={20} />
        </div>
        <div className="side-nav-menu">
          <button 
            className={`side-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
            title="Recruiter Dashboard"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            className={`side-nav-btn ${currentView === 'shortlisted-gallery' ? 'active' : ''}`}
            onClick={() => setCurrentView('shortlisted-gallery')}
            title="Shortlisted Resumes Gallery"
          >
            <FileText size={18} />
          </button>
          <button 
            className={`side-nav-btn ${currentView === 'applied-gallery' ? 'active' : ''}`}
            onClick={() => setCurrentView('applied-gallery')}
            title="Applied Candidates Gallery"
          >
            <Users size={18} />
          </button>
          <button 
            className={`side-nav-btn ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
            title="Most Eligible Candidates by Category"
          >
            <BarChart3 size={18} />
          </button>
          <button 
            className={`side-nav-btn ${currentView === 'questions' ? 'active' : ''}`}
            onClick={() => setCurrentView('questions')}
            title="Interview Question Generator"
          >
            <HelpCircle size={18} />
          </button>
          <button 
            className={`side-nav-btn ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
            title="System Settings"
          >
            <Settings size={18} />
          </button>
        </div>
        <div className="side-nav-footer">
          <button 
            onClick={() => {
              setIsLoggedIn(false);
              setAuthForm({ fullName: '', email: 'admin@smarthr.ai', password: 'password123', confirmPassword: '' });
            }}
            className="side-nav-btn"
            title="Log Out"
          >
            <LogOut size={18} style={{ color: 'var(--color-danger)' }} />
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="main-content-area">
        {/* Top Navbar Header */}
        <nav className="top-nav-bar">
          <div className="top-nav-left">
            <div className="logo-brand-container" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="top-nav-logo-text" style={{ lineHeight: '1.2' }}>HireWise<span>AI</span></span>
              <span className="top-nav-logo-tagline" style={{ fontSize: '0.65rem', color: 'var(--text-slate-500)', fontWeight: '500', marginTop: '1px' }}>Smarter Decisions, Better Talent</span>
            </div>
            <div className="nav-search-container">
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-slate-500)' }} />
              <input 
                type="text" 
                className="nav-search-input" 
                placeholder="Search candidates by name or skills..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="top-nav-right" style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '1rem', cursor: 'pointer' }} 
              onClick={() => setIsAnonymized(!isAnonymized)} 
              title={isAnonymized ? "De-anonymize Candidate Data" : "Anonymize Candidate Data (Bias-Free)"}
            >
              <div className="nav-notification-btn" style={{ margin: 0, padding: '4px', border: 'none', background: 'transparent' }}>
                {isAnonymized ? <EyeOff size={18} color="var(--color-danger)" /> : <Eye size={18} color="var(--color-success)" />}
              </div>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-slate-400)', fontWeight: '500', marginTop: '1px', whiteSpace: 'nowrap' }}>Anonymize Profile Data</span>
            </div>


            <button 
              className="nav-notification-btn" 
              style={{ marginRight: '0.5rem' }}
              onClick={() => {
                localStorage.setItem('hirewise_candidate_statuses', JSON.stringify(candidateStatuses));
                localStorage.setItem('hirewise_weights', JSON.stringify(weights));
                localStorage.setItem('hirewise_active_model', activeModel);
                localStorage.setItem('hirewise_chats', JSON.stringify(chats));
                localStorage.setItem('hirewise_theme', theme);
                alert("Progress saved successfully! Shortlists, weights, model choice, active chats, and settings are stored persistently.");
              }}
              title="Save All Progress to Browser Storage"
            >
              <Save size={18} />
            </button>

            <button 
              className="nav-notification-btn" 
              onClick={() => {
                setShowChatDrawer(!showChatDrawer);
                setNotifications([]);
              }}
              title="Candidate Chats & Notifications"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="nav-notification-badge">{notifications.length}</span>
              )}
            </button>
            <div 
              className="nav-user-profile" 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileDropdown(!showProfileDropdown);
              }}
            >
              <div className="nav-user-avatar">
                {recruiterProfile.name ? recruiterProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RC'}
              </div>
              <div className="nav-user-info">
                <span className="nav-user-name">{recruiterProfile.name}</span>
                <span className="nav-user-role">{recruiterProfile.role}</span>
              </div>

              {showProfileDropdown && (
                <div className="profile-dropdown-menu" style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  background: theme === 'light' ? '#ffffff' : '#0e1320',
                  border: '1px solid ' + (theme === 'light' ? '#e2e8f0' : '#1e293b'),
                  borderRadius: '8px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                  width: '240px',
                  padding: '0.75rem',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.5rem', borderBottom: '1px solid ' + (theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.08)'), gap: '0.15rem' }}>
                    <span style={{ fontWeight: '600', color: theme === 'light' ? '#0f172a' : 'white', fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{recruiterProfile.name}</span>
                    <span style={{ fontSize: '0.7rem', color: theme === 'light' ? '#475569' : 'var(--text-slate-400)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{recruiterProfile.email}</span>
                    <span style={{ fontSize: '0.7rem', color: theme === 'light' ? '#64748b' : 'var(--text-slate-500)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{recruiterProfile.role}</span>
                  </div>
                  <button 
                    className="btn-secondary" 
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      justifyContent: 'flex-start',
                      gap: '0.5rem',
                      background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.02)',
                      borderColor: theme === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.05)',
                      color: theme === 'light' ? '#334155' : 'var(--text-slate-200)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onClick={() => {
                      setEditProfileForm({
                        name: recruiterProfile.name,
                        role: recruiterProfile.role,
                        email: recruiterProfile.email
                      });
                      setShowProfileEditModal(true);
                      setShowProfileDropdown(false);
                    }}
                  >
                    <User size={13} /> Modify Profile
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      justifyContent: 'flex-start',
                      gap: '0.5rem',
                      color: 'var(--color-danger)',
                      borderColor: theme === 'light' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                      background: theme === 'light' ? '#fef2f2' : 'rgba(239, 68, 68, 0.05)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setIsLoggedIn(false);
                      setAuthForm({ fullName: '', email: 'admin@smarthr.ai', password: 'password123', confirmPassword: '' });
                    }}
                  >
                    <LogOut size={13} color="var(--color-danger)" /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="workspace-container-scroll">
          {currentView === 'questions' ? (
            <div className="questions-view-container">
              <header className="gallery-view-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="gallery-title">Resume-to-Interview Question Generator</h2>
                  <p className="gallery-subtitle">Generate candidate-specific technical, behavioral, and fitment questions based on their resume and target job profile</p>
                </div>
              </header>

              <div className="questions-layout-grid">
                {/* Left Side: Shortlisted Candidates Selector List */}
                <div className="questions-sidebar-card">
                  <h3 className="questions-section-heading">Shortlisted Candidates</h3>
                  <div className="questions-candidates-list">
                    {getShortlistedCandidates().filter(cand => {
                      if (!searchQuery.trim()) return true;
                      const query = searchQuery.toLowerCase().trim();
                      const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
                      const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
                      const nameMatch = (personal?.name || '').toLowerCase().includes(query);
                      const skillMatch = profile?.skills?.some(s => s.toLowerCase().includes(query)) || false;
                      return nameMatch || skillMatch;
                    }).length === 0 ? (
                      <div className="empty-questions-state">
                        <Users size={24} style={{ color: 'var(--text-slate-500)', marginBottom: '0.5rem' }} />
                        <span>{getShortlistedCandidates().length === 0 ? "No candidates have been shortlisted yet." : "No matching candidates found."}</span>
                      </div>
                    ) : (
                      getShortlistedCandidates().filter(cand => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase().trim();
                        const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
                        const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
                        const nameMatch = (personal?.name || '').toLowerCase().includes(query);
                        const skillMatch = profile?.skills?.some(s => s.toLowerCase().includes(query)) || false;
                        return nameMatch || skillMatch;
                      }).map(cand => {
                        const personal = isAnonymized ? cand.anonymized_profile?.personal_info : cand.parsed_data?.personal_info;
                        const isSelected = selectedShortlistedCandidate?.resume_id === cand.resume_id;
                        return (
                          <div 
                            key={cand.resume_id} 
                            className={`questions-cand-item-row ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedShortlistedCandidate(cand)}
                          >
                            <div className="questions-cand-avatar">
                              {personal?.name ? personal.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C'}
                            </div>
                            <div className="questions-cand-metadata">
                              <span className="questions-cand-name">{personal?.name || 'Candidate'}</span>
                              <span className="questions-cand-role">{cand.parsed_data?.experience?.[0]?.role || 'Professional'}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Side: Generated Custom Questions Container */}
                <div className="questions-details-card">
                  {!selectedShortlistedCandidate ? (
                    <div className="empty-questions-state-large">
                      <HelpCircle size={48} style={{ color: 'var(--text-slate-500)', marginBottom: '1rem' }} />
                      <h3>Select a Candidate to Begin</h3>
                      <p>Pick a candidate from the shortlisted list on the left to automatically generate customized interview questions.</p>
                    </div>
                  ) : fetchingQuestions ? (
                    <div className="empty-questions-state-large">
                      <RefreshCw size={36} className="spinner-icon" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
                      <h3>Generating Tailored Questions...</h3>
                      <p>AI is analyzing the candidate's resume timeline and job description matching metrics...</p>
                    </div>
                  ) : generatedQuestions.length === 0 ? (
                    <div className="empty-questions-state-large">
                      <HelpCircle size={48} style={{ color: 'var(--text-slate-500)', marginBottom: '1rem' }} />
                      <h3>No Questions Generated</h3>
                      <p>Ensure a valid active job profile is selected in the system sidebar.</p>
                    </div>
                  ) : (
                    <div className="questions-content-scroller">
                      <div className="questions-meta-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="questions-cand-avatar-large">
                            {(isAnonymized ? selectedShortlistedCandidate.anonymized_profile?.personal_info?.name : selectedShortlistedCandidate.parsed_data?.personal_info?.name)?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="questions-cand-name-large">
                              {isAnonymized ? selectedShortlistedCandidate.anonymized_profile?.personal_info?.name : selectedShortlistedCandidate.parsed_data?.personal_info?.name}
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-slate-400)' }}>
                              Generated questions for: <strong>{jobs.find(j => j.id === selectedJobId)?.title || jobs[0]?.title || 'Target Role'}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="questions-deck">
                        {generatedQuestions.map((q, idx) => {
                          const isExpanded = expandedQuestionIdx === idx;
                          const tagColor = q.category === 'Technical' ? 'var(--color-primary)' : q.category === 'Behavioral' ? 'var(--color-success)' : 'var(--color-warning)';
                          const tagBg = q.category === 'Technical' ? 'rgba(59, 130, 246, 0.1)' : q.category === 'Behavioral' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                          return (
                            <div key={idx} className="question-card-item">
                              <div className="question-card-header">
                                <span className="question-category-badge" style={{ color: tagColor, background: tagBg, borderColor: tagColor }}>
                                  {q.category}
                                </span>
                                <button 
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(q.question);
                                    alert("Question copied to clipboard!");
                                  }}
                                >
                                  Copy
                                </button>
                              </div>
                              <p className="question-body-text">{q.question}</p>
                              
                              <div className="expected-answer-container">
                                <button 
                                  className="expected-answer-toggle-btn"
                                  onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                                >
                                  <span>{isExpanded ? 'Hide Expected Answer Guidelines' : 'Show Expected Answer Guidelines'}</span>
                                  <span>{isExpanded ? '▲' : '▼'}</span>
                                </button>
                                {isExpanded && (
                                  <div className="expected-answer-content-block">
                                    <p>{q.expected_answer}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : currentView === 'settings' ? (
            <div className="settings-view-container">
              <header className="gallery-view-header">
                <div>
                  <h2 className="gallery-title">System Settings</h2>
                  <p className="gallery-subtitle">Customize workspace appearance, match algorithm criteria, and AI models</p>
                </div>
              </header>

              <div className="settings-grid">
                {/* 1. Theme and Appearance */}
                <div className="settings-card">
                  <h3 className="settings-card-title">Appearance & Theme</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-slate-400)', marginBottom: '1rem' }}>
                    Choose between light and dark modes to suit your work environment.
                  </p>
                  
                  <div className="settings-option-row">
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Active Color Palette</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className={`btn-secondary ${theme === 'dark' ? 'active-theme-btn' : ''}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => setTheme('dark')}
                      >
                        Dark Mode
                      </button>
                      <button 
                        className={`btn-secondary ${theme === 'light' ? 'active-theme-btn' : ''}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => setTheme('light')}
                      >
                        Light Mode
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Anonymization Configuration */}
                <div className="settings-card">
                  <h3 className="settings-card-title">Bias-Free Screening</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-slate-400)', marginBottom: '1rem' }}>
                    Configure what candidate details are anonymized on dashboards.
                  </p>

                  <div className="settings-option-row">
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Anonymize Names & Contacts</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-slate-400)' }}>Masks personal info with secure identifier codes</span>
                    </div>
                    <label className="toggle-btn">
                      <input 
                        type="checkbox" 
                        checked={isAnonymized} 
                        onChange={() => setIsAnonymized(!isAnonymized)} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* 3. Algorithm Weight Customization */}
                <div className="settings-card" style={{ gridColumn: 'span 2' }}>
                  <h3 className="settings-card-title">AI Screening Fitment Weights</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-slate-400)', marginBottom: '1rem' }}>
                    Adjust weight percentages for each evaluation parameter. Total must sum to 100%.
                  </p>
                  
                  <div className="weights-sliders-container">
                    {Object.keys(weights).map(key => (
                      <div key={key} className="weight-slider-row">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                          <span style={{ textTransform: 'capitalize' }}>{key} Weight</span>
                          <span>{weights[key]}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          className="weight-slider-input"
                          value={weights[key]} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setWeights(prev => ({ ...prev, [key]: val }));
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-slate-800)', marginTop: '1rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                      Current Total: <span style={{ color: Object.values(weights).reduce((a, b) => a + b, 0) === 100 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {Object.values(weights).reduce((a, b) => a + b, 0)}%
                      </span>
                    </span>
                    {Object.values(weights).reduce((a, b) => a + b, 0) !== 100 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>
                        ⚠️ Warning: Weights must sum to exactly 100%
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Model Selection & Database Cache */}
                <div className="settings-card" style={{ gridColumn: 'span 2' }}>
                  <h3 className="settings-card-title">Model Choice & Database Management</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-slate-400)', marginBottom: '1rem' }}>
                    Switch between Gemini AI models or Heuristics models, and manage cached evaluations.
                  </p>

                  <div className="settings-option-row" style={{ marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Primary LLM Model</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-slate-400)' }}>Select model to run resume parsers and scoring</span>
                    </div>
                    <select 
                      className="bar-select" 
                      style={{ width: '220px' }}
                      value={activeModel}
                      onChange={(e) => setActiveModel(e.target.value)}
                    >
                      <option value="gemini-flash">Gemini 1.5 Flash (Medium)</option>
                      <option value="gemini-pro">Gemini 1.5 Pro (Heavy)</option>
                      <option value="local">Local Matcher (Offline Heuristics)</option>
                    </select>
                  </div>

                  <div className="settings-option-row">
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Clear Screening Cache</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-slate-400)' }}>Forces system to re-analyze resume files upon screen ranking</span>
                    </div>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}
                      onClick={async () => {
                        if (confirm("Are you sure you want to clear evaluations database cache?")) {
                          try {
                            const res = await fetch(`${API_BASE}/api/rank/clear-cache`, { method: 'POST' });
                            if (res.ok) {
                              alert("Screening cache cleared successfully! Next rank runs will re-evaluate all candidates.");
                            }
                          } catch (e) {
                            alert("Failed to clear cache: " + e.message);
                          }
                        }
                      }}
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : currentView === 'analytics' ? (
            <div className="analytics-view-container">
              <header className="gallery-view-header">
                <div>
                  <h2 className="gallery-title">Most Eligible Candidates by Category</h2>
                  <p className="gallery-subtitle">Top match recommendations and AI analysis for each job description</p>
                </div>
                <span className="gallery-stats-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
                  <BarChart3 size={14} />
                  {analyticsData.length} Job Categories
                </span>
              </header>

              {fetchingAnalytics ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
                  <RefreshCw size={36} className="spinner-icon" style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-slate-400)' }}>Analyzing candidate pool and calculating fitment...</span>
                </div>
              ) : analyticsData.length === 0 ? (
                <div className="gallery-empty-state">
                  <div className="gallery-empty-icon">
                    <BarChart3 size={48} style={{ color: 'var(--text-slate-500)' }} />
                  </div>
                  <h3>No Analytics Available</h3>
                  <p>Create job descriptions and upload resumes to find the most eligible candidates for each category.</p>
                  <button className="btn-rank-primary" style={{ marginTop: '1rem' }} onClick={() => setCurrentView('dashboard')}>
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="analytics-category-list">
                  {analyticsData.map(item => {
                    const c = item.candidate;
                    const personal = isAnonymized ? c.anonymized_personal_info : c.personal_info;
                    const profile = isAnonymized ? c.anonymized_profile : c.parsed_data;
                    const initials = personal.name ? personal.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';

                    return (
                      <div key={item.job_id} className="analytics-category-card">
                        <div className="category-card-header">
                          <span className="category-card-title">{item.job_title}</span>
                          <span className="category-top-badge">Top Match</span>
                        </div>

                        <div className="category-candidate-row">
                          <div className="category-candidate-avatar">{initials}</div>
                          <div className="category-candidate-info">
                            <span className="category-candidate-name">{personal.name || 'Unnamed Candidate'}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-slate-400)', marginTop: '0.15rem' }}>
                              {profile.experience[0]?.role || 'Professional'} • {personal.email || 'N/A'} • {personal.phone || 'N/A'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                            <span className="category-candidate-score">{c.overall_score}% Match</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-slate-500)' }}>Overall Evaluation</span>
                          </div>
                        </div>

                        <div className="category-ai-explanation-box">
                          <div style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                            AI Fitment Analysis
                          </div>
                          {c.explanation || 'No detailed analysis computed.'}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-end', marginTop: '0.25rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.72rem', background: '#090d16', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => handleExportPDF(c.resume_id)}
                          >
                            <FileDown size={13} /> Download Resume PDF
                          </button>
                          <button 
                            className="btn-rank-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => {
                              setSelectedJobId(item.job_id);
                              const fetchRankedList = async () => {
                                try {
                                  const res = await fetch(`${API_BASE}/api/rank/${item.job_id}`);
                                  if (res.ok) {
                                    const data = await res.json();
                                    setRankedCandidates(data);
                                    const matchingCand = data.find(cand => cand.resume_id === c.resume_id);
                                    setActiveCandidate(matchingCand || c);
                                  } else {
                                    setActiveCandidate(c);
                                  }
                                } catch (e) {
                                  setActiveCandidate(c);
                                }
                                setCurrentView('dashboard');
                              };
                              fetchRankedList();
                            }}
                          >
                            View Fitment Overview
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : currentView === 'applied-gallery' ? (
            <div className="gallery-view-container">
              <header className="gallery-view-header">
                <div>
                  <h2 className="gallery-title">Applied Candidates Pool</h2>
                  <p className="gallery-subtitle">Visual database of all candidate resumes uploaded to HireWiseAI</p>
                </div>
                <span className="gallery-stats-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                  <Users size={14} />
                  {resumes.length} Applied Candidates
                </span>
              </header>

              {resumes.filter(r => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase().trim();
                const personal = isAnonymized ? r.anonymized_profile?.personal_info : r.parsed_data?.personal_info;
                const profile = isAnonymized ? r.anonymized_profile : r.parsed_data;
                const nameMatch = (personal?.name || '').toLowerCase().includes(query);
                const skillMatch = profile?.skills?.some(s => s.toLowerCase().includes(query)) || false;
                return nameMatch || skillMatch;
              }).length === 0 ? (
                <div className="gallery-empty-state">
                  <div className="gallery-empty-icon">
                    <Users size={48} style={{ color: 'var(--text-slate-500)' }} />
                  </div>
                  <h3>No Candidates Applied</h3>
                  <p>{resumes.length === 0 ? "Upload candidate resumes (.pdf, .txt, .docx) on the recruiter dashboard toolbar to populate this candidate registry." : "No matching candidates found for this search."}</p>
                  {resumes.length === 0 && (
                    <button className="btn-rank-primary" style={{ marginTop: '1rem' }} onClick={() => setCurrentView('dashboard')}>
                      Go to Dashboard
                    </button>
                  )}
                </div>
              ) : (
                <div className="gallery-grid">
                  {resumes.filter(r => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase().trim();
                    const personal = isAnonymized ? r.anonymized_profile?.personal_info : r.parsed_data?.personal_info;
                    const profile = isAnonymized ? r.anonymized_profile : r.parsed_data;
                    const nameMatch = (personal?.name || '').toLowerCase().includes(query);
                    const skillMatch = profile?.skills?.some(s => s.toLowerCase().includes(query)) || false;
                    return nameMatch || skillMatch;
                  }).map(r => {
                    const personal = isAnonymized ? r.anonymized_profile.personal_info : r.parsed_data.personal_info;
                    const profile = isAnonymized ? r.anonymized_profile : r.parsed_data;
                    const initials = personal.name ? personal.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
                    
                    const cand = {
                      resume_id: r.id,
                      filename: r.filename,
                      personal_info: r.parsed_data.personal_info,
                      anonymized_personal_info: r.anonymized_profile.personal_info,
                      overall_score: 0,
                      parsed_data: r.parsed_data,
                      anonymized_profile: r.anonymized_profile
                    };

                    return (
                      <div key={r.id} className="gallery-card">
                        <div className="gallery-card-header">
                          <div className="gallery-card-avatar">{initials}</div>
                          <div className="gallery-card-meta">
                            <span className="gallery-card-name">{personal.name || 'Unnamed Candidate'}</span>
                            <span className="gallery-card-role">{profile.experience[0]?.role || 'Professional'}</span>
                          </div>
                        </div>

                        <div className="gallery-card-body-frame">
                          <div className="gallery-card-scale-wrapper">
                            <LaTeXLivePreview candidate={cand} isAnonymized={isAnonymized} />
                          </div>
                          
                          <div className="gallery-card-overlay" style={{ justifyContent: 'space-between', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white' }}>{personal.name || 'Unnamed Candidate'}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-slate-400)' }}>{profile.experience[0]?.role || 'Professional'}</span>
                              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '0.25rem 0' }}></div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-slate-300)' }}>Email: {personal.email || 'N/A'}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-slate-300)' }}>Phone: {personal.phone || 'N/A'}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-slate-300)' }}>Loc: {personal.location || 'N/A'}</span>
                            </div>
                            
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
                              <button 
                                className="btn-rank-primary" 
                                style={{ padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center' }}
                                onClick={() => handleExportPDF(r.id)}
                              >
                                <FileDown size={14} /> Download PDF
                              </button>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem', fontSize: '0.7rem', background: '#090d16', justifyContent: 'center' }}
                                onClick={() => {
                                  const matchingCand = rankedCandidates.find(c => c.resume_id === r.id);
                                  if (matchingCand) {
                                    setActiveCandidate(matchingCand);
                                  } else {
                                    setActiveCandidate(cand);
                                  }
                                  setCurrentView('dashboard');
                                }}
                              >
                                View Fitment Overview
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : currentView === 'shortlisted-gallery' ? (
            <div className="gallery-view-container">
              <header className="gallery-view-header">
                <div>
                  <h2 className="gallery-title">Shortlisted LaTeX Resumes</h2>
                  <p className="gallery-subtitle">Compiled gallery of high-quality profiles ready for outreach</p>
                </div>
                <span className="gallery-stats-badge">
                  <FileText size={14} />
                  {getShortlistedCandidates().length} Candidates
                </span>
              </header>

              {getShortlistedCandidates().filter(cand => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase().trim();
                const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
                const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
                const nameMatch = (personal?.name || '').toLowerCase().includes(query);
                const skillMatch = profile?.skills?.some(s => s.toLowerCase().includes(query)) || false;
                return nameMatch || skillMatch;
              }).length === 0 ? (
                <div className="gallery-empty-state">
                  <div className="gallery-empty-icon">
                    <FileText size={48} style={{ color: 'var(--text-slate-500)' }} />
                  </div>
                  <h3>No Shortlisted Resumes</h3>
                  <p>{getShortlistedCandidates().length === 0 ? "Browse through candidates on the matching dashboard and click the \"Shortlist\" button to compile them into this visual LaTeX gallery." : "No matching candidates found for this search."}</p>
                  {getShortlistedCandidates().length === 0 && (
                    <button className="btn-rank-primary" style={{ marginTop: '1rem' }} onClick={() => setCurrentView('dashboard')}>
                      Go to Dashboard
                    </button>
                  )}
                </div>
              ) : (
                <div className="gallery-grid">
                  {getShortlistedCandidates().filter(cand => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase().trim();
                    const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
                    const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
                    const nameMatch = (personal?.name || '').toLowerCase().includes(query);
                    const skillMatch = profile?.skills?.some(s => s.toLowerCase().includes(query)) || false;
                    return nameMatch || skillMatch;
                  }).map(cand => {
                    const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
                    const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
                    const initials = personal.name ? personal.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';

                    return (
                      <div key={cand.resume_id} className="gallery-card">
                        <div className="gallery-card-header">
                          <div className="gallery-card-avatar">{initials}</div>
                          <div className="gallery-card-meta">
                            <span className="gallery-card-name">{personal.name || 'Candidate'}</span>
                            <span className="gallery-card-role">{profile.experience[0]?.role || 'Professional'}</span>
                          </div>
                          {cand.overall_score > 0 && (
                            <span className="gallery-card-score">{cand.overall_score}%</span>
                          )}
                        </div>

                        <div className="gallery-card-body-frame">
                          <div className="gallery-card-scale-wrapper">
                            <LaTeXLivePreview candidate={cand} isAnonymized={isAnonymized} />
                          </div>
                          
                          <div className="gallery-card-overlay">
                            <button 
                              className="btn-rank-primary" 
                              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                              onClick={() => {
                                setActiveCandidate(cand);
                                setActiveTab('latex');
                                setCurrentView('dashboard');
                              }}
                            >
                              <Code size={13} /> View LaTeX Code
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem', fontSize: '0.7rem', background: '#090d16', justifyContent: 'center', borderColor: 'rgba(59, 130, 246, 0.25)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%' }}
                              onClick={() => startCandidateChat(cand)}
                            >
                              <MessageSquare size={12} /> Chat with Candidate
                            </button>
                            <div style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
                              <button 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', background: '#090d16' }}
                                onClick={() => handleExportPDF(cand.resume_id)}
                              >
                                <FileDown size={12} /> Export PDF
                              </button>
                              <button 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: '#090d16' }}
                                onClick={() => {
                                  setCandidateStatuses(prev => {
                                    const updated = { ...prev };
                                    delete updated[cand.resume_id];
                                    return updated;
                                  });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Global Job Selector & Action Bar */}
              <div className="job-action-bar">
                <div className="bar-left-group">
                  <div className="bar-select-wrapper">
                    <span className="bar-select-label">Select Active Job Profile</span>
                    <select 
                      className="bar-select"
                      value={selectedJobId}
                      onChange={(e) => {
                        setSelectedJobId(e.target.value);
                        setRankedCandidates([]);
                        setActiveCandidate(null);
                      }}
                    >
                      <option value="">-- Select Active Job Profile --</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                  {activeJob && (
                    <button 
                      onClick={(e) => handleDeleteJob(activeJob.id, e)} 
                      className="btn-bar-action" 
                      style={{ color: 'var(--color-danger)' }}
                      title="Delete Job Description"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button className="btn-bar-action" onClick={() => setShowJobForm(true)}>
                    <Plus size={15} />
                    New Profile
                  </button>
                </div>

                <div className="bar-right-group">
                  <div 
                    className="bar-upload-widget"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      multiple 
                      style={{ display: 'none' }} 
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                    />
                    <div className="bar-upload-btn-icon">
                      <UploadCloud size={16} />
                    </div>
                    <div className="bar-upload-text-group">
                      <span className="bar-upload-title">Upload Resumes</span>
                      <span className="bar-upload-sub">Drag & Drop or Click, {resumes.length} Resumes</span>
                    </div>
                  </div>
                  {uploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-slate-400)' }}>
                      <RefreshCw size={12} className="spinner-icon" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  <button 
                    className="btn-rank-primary"
                    onClick={handleRank}
                    disabled={ranking || resumes.length === 0 || !selectedJobId}
                  >
                    {ranking ? (
                      <>
                        <RefreshCw size={14} className="spinner-icon" />
                        Screening...
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        Screen & Rank Candidates
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dual Panel Split Workspace */}
              <div className="split-workspace-panels">
                {/* Left Sidebar Panel (Leaderboard) */}
                <div className="sidebar-panel-container">
                  <div className="sidebar-search-box">
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-slate-500)' }} />
                    <input 
                      type="text" 
                      className="sidebar-search-input" 
                      placeholder="Search Candidates..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <span className="sidebar-title">Candidate Leaderboard</span>

                  <div className="leaderboard-cards-scroll">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map((cand, idx) => {
                        const personal = isAnonymized ? cand.anonymized_personal_info : cand.personal_info;
                        const profile = isAnonymized ? cand.anonymized_profile : cand.parsed_data;
                        const isActive = activeCandidate && activeCandidate.resume_id === cand.resume_id;
                        const status = candidateStatuses[cand.resume_id];
                        const initials = personal.name ? personal.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
                        
                        const matchCategory = cand.overall_score >= 80 ? 'high' : cand.overall_score >= 60 ? 'med' : 'low';
                        const matchLabel = cand.overall_score >= 80 ? 'Match High' : cand.overall_score >= 60 ? 'Match Med' : 'Match Low';
                        
                        return (
                          <div 
                            key={cand.resume_id}
                            className={`leaderboard-card-rich ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveCandidate(cand)}
                          >
                            <div className="card-top-row">
                              <span className="card-rank-num">{idx + 1}</span>
                              <div className="card-avatar-circle" style={{ background: isActive ? 'var(--color-primary)' : '#1e293b' }}>
                                {initials}
                              </div>
                              <div className="card-center-details">
                                <div className="card-name-line">
                                  <span className="card-candidate-name">{personal.name || 'Unnamed Candidate'}</span>
                                </div>
                                <span className="card-role-sub">{profile.experience[0]?.role || 'Professional'}</span>
                              </div>
                              <div className="card-right-badge">
                                <span className={`match-badge-tag ${matchCategory}`}>{matchLabel}</span>
                                <span className="card-score-value">{cand.overall_score}<span>/100</span></span>
                              </div>
                            </div>
                            {cand.explanation && (
                              <span className="card-insights-snippet">
                                AI Insights: {cand.explanation}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-insights-state">
                        <AlertTriangle size={24} style={{ color: 'var(--text-slate-500)' }} />
                        <p style={{ fontSize: '0.78rem' }}>No screening rankings compiled. Select a profile and click Screen & Rank.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Main Content Panel (Details pane) */}
                <div className="main-content-panel">
                  {activeCandidate ? (
                    <div className="content-pane-scroll">
                      {/* Detailed Tabs Header */}
                      <div className="details-tabs-header">
                        <button className={`details-tab-btn ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>Job Overview</button>
                        <button className={`details-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Requirements</button>
                        <button className={`details-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>Skills Matrix</button>
                        <button className={`details-tab-btn ${activeTab === 'latex' ? 'active' : ''}`} onClick={() => setActiveTab('latex')}>LaTeX Resume</button>
                      </div>

                      {activeTab === 'latex' ? (
                        <div className="latex-editor-preview-split">
                          <div className="latex-workspace">
                            <div className="latex-actions-row">
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-slate-400)' }}>LaTeX SOURCE EDITOR</span>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} onClick={() => copyLaTeXToClipboard(editableLatex)}>
                                  <Copy size={12} />
                                  Copy
                                </button>
                                <button className="btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} onClick={downloadLaTeXFile}>
                                  <Download size={12} />
                                  Download
                                </button>
                                <button className="glow-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', height: '28px' }} onClick={handleCompileLive}>
                                  Compile Live
                                </button>
                              </div>
                            </div>
                            <textarea 
                              className="latex-code-area"
                              value={editableLatex}
                              onChange={(e) => setEditableLatex(e.target.value)}
                            />
                          </div>
                          
                          <div className="pdf-preview-box">
                            <div className="preview-toggle-bar">
                              <button className={`preview-toggle-btn ${previewMode === 'html' ? 'active' : ''}`} onClick={() => setPreviewMode('html')}>LaTeX Live Preview</button>
                              <button className={`preview-toggle-btn ${previewMode === 'pdf' ? 'active' : ''}`} onClick={() => setPreviewMode('pdf')}>PDF View</button>
                            </div>
                            {previewMode === 'html' ? (
                              <LaTeXLivePreview candidate={activeCandidate} isAnonymized={isAnonymized} />
                            ) : (
                              <iframe 
                                className="pdf-preview-iframe" 
                                src={`${API_BASE}/api/resumes/${activeCandidate.resume_id}/pdf?anonymized=${isAnonymized}`}
                                title="Resume PDF Document Viewer"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="split-detail-columns">
                          {/* Left Column Detailed items */}
                          <div className="split-left-pane">
                            <div className="detail-candidate-header-block">
                              <div className="detail-avatar-meta-group">
                                <div className="detail-avatar-circle">
                                  {activeCandidate.personal_info.name ? activeCandidate.personal_info.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C'}
                                </div>
                                <div className="detail-meta-text">
                                  <span className="detail-candidate-name">
                                    {isAnonymized ? activeCandidate.anonymized_personal_info.name : activeCandidate.personal_info.name || 'Unnamed Candidate'}
                                    <span className="detail-role-badge">{(isAnonymized ? activeCandidate.anonymized_profile : activeCandidate.parsed_data).experience[0]?.role || 'Professional'}</span>
                                  </span>
                                  <span className="detail-contact-subtext">
                                    {isAnonymized ? activeCandidate.anonymized_personal_info.email : activeCandidate.personal_info.email || 'N/A'} • {isAnonymized ? activeCandidate.anonymized_personal_info.phone : activeCandidate.personal_info.phone || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }} onClick={() => handleShortlist(activeCandidate.resume_id)}>Shortlist</button>
                                <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleReject(activeCandidate.resume_id)}>Reject</button>
                                <button className="btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleExportPDF(activeCandidate.resume_id)} title="Download PDF Resume"><FileDown size={16} /></button>
                              </div>
                            </div>

                            {/* Profile Data Table */}
                            <div className="details-metadata-table-card">
                              <div className="details-grid-table">
                                <div className="meta-table-col">
                                  <div className="meta-table-row">
                                    <span className="meta-row-label">Profile</span>
                                    <span className="meta-row-value" style={{ fontWeight: '700' }}>Candidate Profile Data</span>
                                  </div>
                                  <div className="meta-table-row">
                                    <span className="meta-row-label">Data Name</span>
                                    <span className="meta-row-value">{isAnonymized ? activeCandidate.anonymized_personal_info.name : activeCandidate.personal_info.name}</span>
                                  </div>
                                  <div className="meta-table-row">
                                    <span className="meta-row-label">Recruiter</span>
                                    <span className="meta-row-value">Alex Chen</span>
                                  </div>
                                </div>
                                <div className="meta-table-col">
                                  <div className="meta-table-row">
                                    <span className="meta-row-label">Role</span>
                                    <span className="meta-row-value" style={{ fontWeight: '700' }}>Target Position Info</span>
                                  </div>
                                  <div className="meta-table-row">
                                    <span className="meta-row-label">Role Title</span>
                                    <span className="meta-row-value">{(isAnonymized ? activeCandidate.anonymized_profile : activeCandidate.parsed_data).experience[0]?.role || 'N/A'}</span>
                                  </div>
                                  <div className="meta-table-row">
                                    <span className="meta-row-label">Target</span>
                                    <span className="meta-row-value">{activeJob ? activeJob.title : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* AI Analysis Description */}
                            <div className="detail-content-section">
                              <h4 className="detail-section-title">AI Analysis</h4>
                              <p style={{ fontSize: '0.82rem', lineHeight: '1.5', color: 'var(--text-slate-200)' }}>
                                {activeCandidate.explanation || 'No evaluation computed. Please click Screen & Rank.'}
                              </p>
                            </div>

                            {/* Skills Match comparison bars */}
                            <div className="detail-content-section">
                              <h4 className="detail-section-title">Key Matching Deficiencies</h4>
                              {activeCandidate.missing_skills && activeCandidate.missing_skills.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                                  {activeCandidate.missing_skills.map((skill, i) => (
                                    <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.72rem', fontWeight: '700', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                      Missing: {skill}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-slate-500)' }}>No missing core skill matches identified.</p>
                              )}
                            </div>

                            {/* Dynamic Skills Match progress bars */}
                            <div className="detail-content-section">
                              <h4 className="detail-section-title">Skills Match</h4>
                              <div className="skills-comparison-list">
                                {(isAnonymized ? activeCandidate.anonymized_profile.skills : activeCandidate.parsed_data.skills).slice(0, 4).map((skill, i) => {
                                  const percents = [96, 93, 88, 85];
                                  const pct = percents[i] || 80;
                                  return (
                                    <div key={i} className="skills-bar-row">
                                      <div className="skills-bar-label">
                                        <span>{skill}</span>
                                        <span>{pct}%</span>
                                      </div>
                                      <div className="skills-bar-track">
                                        <div className="skills-bar-fill" style={{ width: `${pct}%` }}></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Right Column Cards */}
                          <div className="split-right-pane">
                            {/* Skills Match Card */}
                            <div className="blue-glowing-score-card">
                              <span className="score-title-label">Skills match</span>
                              <div className="score-big-display-row">
                                <span className="score-big-number">{activeCandidate.overall_score}<span>/100</span></span>
                              </div>
                              <div className="score-compare-bar-track">
                                <div className="score-compare-bar-fill" style={{ width: `${activeCandidate.overall_score}%` }}></div>
                              </div>
                              <div className="score-subscores-group">
                                <div className="score-subrow">
                                  <span>Requirements</span>
                                  <span className="score-subrow-val">{activeCandidate.scores?.skills || 0}%</span>
                                </div>
                                <div className="score-subrow">
                                  <span>Comalisity</span>
                                  <span className="score-subrow-val">{activeCandidate.scores?.experience || 0}%</span>
                                </div>
                                <div className="score-subrow">
                                  <span>Comparison</span>
                                  <span className="score-subrow-val">{activeCandidate.scores?.projects || 0}%</span>
                                </div>
                              </div>
                            </div>

                            {/* Comparison Metrics */}
                            <div className="detail-content-section">
                              <h4 className="detail-section-title">Comparison Metrics</h4>
                              <p style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-slate-400)' }}>
                                Compare {activeCandidate.overall_score}% comparison metrics with limitations at net preventation metrics.
                              </p>
                            </div>

                            {/* Recent Activity timeline */}
                            <div className="detail-content-section">
                              <h4 className="detail-section-title">Recent Activity</h4>
                              <div className="recent-activity-list">
                                <div className="activity-node">
                                  <div className="activity-node-bullet"></div>
                                  <div className="activity-node-details">
                                    <span className="activity-node-title">Alex Chen</span>
                                    <span className="activity-node-time">1 minute ago</span>
                                  </div>
                                </div>
                                <div className="activity-node">
                                  <div className="activity-node-bullet" style={{ background: 'var(--text-slate-500)' }}></div>
                                  <div className="activity-node-details">
                                    <span className="activity-node-title">Alex Chen</span>
                                    <span className="activity-node-time">5 minutes ago</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-insights-state">
                      <AlertTriangle size={32} style={{ color: 'var(--text-slate-500)', marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>No Candidate Selected</p>
                      <p style={{ fontSize: '0.78rem' }}>Select a candidate from the leaderboard to view matching details.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Modals */}
      {showJobForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Configure New Job Profile</h3>
              <button className="modal-close-btn" onClick={() => setShowJobForm(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', alignSelf: 'center', color: 'var(--text-slate-400)', fontWeight: '700' }}>Quick Templates:</span>
              {jobTemplates.map(t => (
                <button 
                  key={t.id} 
                  className="btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }}
                  onClick={() => applyTemplate(t)}
                >
                  {t.title.split(' ')[0]}
                </button>
              ))}
            </div>

            <form onSubmit={handleJobSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="form-group">
                <label>Job Title</label>
                <input 
                  type="text" 
                  className="input-style" 
                  required 
                  placeholder="e.g. Senior Software Engineer"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Experience</label>
                  <input 
                    type="text" 
                    className="input-style" 
                    required 
                    placeholder="e.g. 3+ years"
                    value={jobForm.experience}
                    onChange={(e) => setJobForm({...jobForm, experience: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Education</label>
                  <input 
                    type="text" 
                    className="input-style" 
                    required 
                    placeholder="e.g. BS in CS"
                    value={jobForm.education}
                    onChange={(e) => setJobForm({...jobForm, education: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Skills Required (comma-separated)</label>
                <input 
                  type="text" 
                  className="input-style" 
                  required 
                  placeholder="React, Python, AWS"
                  value={jobForm.skills}
                  onChange={(e) => setJobForm({...jobForm, skills: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="input-style" 
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  required 
                  placeholder="Roles and responsibilities details..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-rank-primary" style={{ flex: 1, padding: '0.45rem', justifyContent: 'center' }}>Save Profile</button>
                <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowJobForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 4. Slide-out Recruiter Chat Panel */}
      {showChatDrawer && (
        <div className="chat-drawer-backdrop" onClick={() => setShowChatDrawer(false)}>
          <div className="chat-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="chat-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} color="var(--color-primary)" />
                <h3 className="chat-drawer-title">Recruiter Inbox</h3>
              </div>
              <button className="chat-close-btn" onClick={() => setShowChatDrawer(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="chat-drawer-body">
              {/* Left Column: Active Chats List */}
              <div className="chat-sidebar">
                {Object.keys(chats).length === 0 ? (
                  <div className="chat-sidebar-empty">
                    <MessageSquare size={24} style={{ color: 'var(--text-slate-500)', marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-slate-400)' }}>No active chats. Start a chat with any candidate in the Applied Gallery.</span>
                  </div>
                ) : (
                  Object.keys(chats).map(candId => {
                    const c = resumes.find(r => (r.resume_id || r.id) === candId || r.id === candId);
                    const personal = isAnonymized ? c?.anonymized_profile?.personal_info : c?.parsed_data?.personal_info;
                    const name = personal?.name || "Candidate";
                    const isSelected = activeChatCandidateId === candId;
                    const lastMsg = chats[candId][chats[candId].length - 1];
                    
                    return (
                      <div 
                        key={candId} 
                        className={`chat-sidebar-item ${isSelected ? 'active' : ''}`}
                        onClick={() => setActiveChatCandidateId(candId)}
                      >
                        <div className="chat-item-avatar">
                          {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="chat-item-details">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span className="chat-item-name">{name}</span>
                            <span className="chat-item-time">{lastMsg?.timestamp}</span>
                          </div>
                          <p className="chat-item-preview">{lastMsg?.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Chat Conversation Thread */}
              <div className="chat-thread-container">
                {activeChatCandidateId ? (
                  <>
                    <div className="chat-thread-header">
                      <span className="chat-thread-cand-name">
                        {isAnonymized 
                          ? resumes.find(r => (r.resume_id || r.id) === activeChatCandidateId || r.id === activeChatCandidateId)?.anonymized_profile?.personal_info?.name 
                          : resumes.find(r => (r.resume_id || r.id) === activeChatCandidateId || r.id === activeChatCandidateId)?.parsed_data?.personal_info?.name}
                      </span>
                    </div>
                    
                    <div className="chat-messages-scroller">
                      {(chats[activeChatCandidateId] || []).map((msg) => (
                        <div key={msg.id} className={`chat-message-bubble ${msg.sender}`}>
                          <p className="chat-message-text">{msg.text}</p>
                          <span className="chat-message-time">{msg.timestamp}</span>
                        </div>
                      ))}
                    </div>

                    <form 
                      className="chat-input-bar"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendChatMessage(typedMessage);
                      }}
                    >
                      <input 
                        type="text" 
                        placeholder="Type a message... (Press Enter to send)"
                        className="chat-input-field"
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                      />
                      <button type="submit" className="chat-send-btn">Send</button>
                    </form>
                  </>
                ) : (
                  <div className="chat-thread-empty">
                    <MessageSquare size={36} style={{ color: 'var(--text-slate-500)', marginBottom: '0.75rem' }} />
                    <h4>Select a Conversation</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-slate-400)' }}>Click on any candidate chat on the left to display their message history.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Profile Edit Modal */}
      {showProfileEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            width: '400px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>Modify Recruiter Profile</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-slate-400)', fontWeight: '600' }}>Full Name</label>
              <input 
                type="text" 
                className="auth-input" 
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={editProfileForm.name} 
                onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-slate-400)', fontWeight: '600' }}>Title / Role</label>
              <input 
                type="text" 
                className="auth-input" 
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={editProfileForm.role} 
                onChange={(e) => setEditProfileForm({ ...editProfileForm, role: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-slate-400)', fontWeight: '600' }}>Email Address</label>
              <input 
                type="email" 
                className="auth-input" 
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={editProfileForm.email} 
                onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                className="btn-rank-primary" 
                style={{ flex: 1, padding: '0.6rem' }}
                onClick={() => {
                  if (!editProfileForm.name.trim() || !editProfileForm.role.trim() || !editProfileForm.email.trim()) {
                    alert("Please fill out all fields.");
                    return;
                  }
                  setRecruiterProfile({
                    name: editProfileForm.name,
                    role: editProfileForm.role,
                    email: editProfileForm.email
                  });
                  setShowProfileEditModal(false);
                }}
              >
                Save Changes
              </button>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.6rem' }}
                onClick={() => setShowProfileEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
