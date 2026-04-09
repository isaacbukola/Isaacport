import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Edit3, X, ExternalLink, Code, Search, Layout, Mail, Phone, MapPin, Menu, Zap, Database, ShoppingBag, Plus, Trash2, LogIn, LogOut, Loader2, FileCode, Eye, Briefcase, BookOpen, ThumbsUp, Clock, Users, ChevronDown } from 'lucide-react';
import { db, auth, signIn, logout, OperationType, handleFirestoreError, signInEmail } from './firebase';
import { doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- Types ---
interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  platform: string;
  brand: string;
  image: string;
  link?: string;
  htmlContent?: string;
  stats?: {
    label: string;
    value: string;
  }[];
  badge?: string;
  type?: string;
}

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: 'Code' | 'Search' | 'Layout' | 'Zap' | 'Database' | 'ShoppingBag';
}

interface PolicyItem {
  id: string;
  title: string;
  content: string;
}

interface CaseStudy {
  id: string;
  title: string;
  client: string;
  challenge: string;
  solution: string;
  results: string;
  image: string;
}

interface EmploymentHistory {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

interface Pillar {
  id: string;
  title: string;
  content: string;
  icon: string;
}

interface AppContent {
  heroTitle: string;
  heroSub: string;
  pillars: Pillar[];
  portfolio: PortfolioItem[];
  services: ServiceItem[];
  techStack: string[];
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  aboutText: string;
  aboutImage: string;
  upworkUrl: string;
  policies: PolicyItem[];
  caseStudies: CaseStudy[];
  employmentHistory: EmploymentHistory[];
  platforms: string[];
}

// --- Default Content ---
const DEFAULT_CONTENT: AppContent = {
  heroTitle: "Architecting High-Performance Digital Ecosystems.",
  heroSub: "I help high-stakes brands automate their operations and elevate their digital presence. Specializing in Service Automation, Luxury Art Galleries, and Corporate CRM Systems.",
  pillars: [
    { 
      id: 'pill1', 
      title: 'Service & Booking', 
      content: 'Frictionless booking flows that reduce admin work by 40% for local service businesses.',
      icon: 'Zap'
    },
    { 
      id: 'pill2', 
      title: 'Luxury & Art', 
      content: 'Minimalist digital galleries designed to justify premium pricing and storytelling.',
      icon: 'Layout'
    },
    { 
      id: 'pill3', 
      title: 'Systems & Integration', 
      content: 'Deep HubSpot, API, and CRM integrations to turn your site into a 24/7 sales employee.',
      icon: 'Database'
    }
  ],
  portfolio: [
    { 
      id: 'p1', 
      title: 'Residential Cleaning Hub', 
      category: 'Service Automation', 
      platform: 'Web Architecture', 
      brand: 'CleanCo', 
      image: 'https://picsum.photos/seed/cleaning/800/600', 
      link: 'https://',
      badge: 'Advanced Level',
      type: 'Automation',
      stats: [
        { label: 'Conversion', value: '+45%' },
        { label: 'Admin Time', value: '-12hrs/wk' },
        { label: 'Users', value: '2.5k+' }
      ]
    },
    { 
      id: 'p2', 
      title: 'Pulse to Palette Gallery', 
      category: 'Luxury Art', 
      platform: 'Shopify', 
      brand: 'Artisan', 
      image: 'https://picsum.photos/seed/gallery/800/600', 
      link: 'https://',
      badge: 'Premium Design',
      type: 'E-commerce',
      stats: [
        { label: 'Sales', value: '+120%' },
        { label: 'Load Time', value: '0.8s' },
        { label: 'AOV', value: '$450' }
      ]
    },
    { 
      id: 'p3', 
      title: 'UK Financial Advisor Site', 
      category: 'Corporate CRM', 
      platform: 'WordPress', 
      brand: 'FinancePro', 
      image: 'https://picsum.photos/seed/finance/800/600', 
      link: 'https://',
      badge: 'Enterprise',
      type: 'CRM System',
      stats: [
        { label: 'Leads', value: '500+/mo' },
        { label: 'Security', value: 'ISO 27001' },
        { label: 'Uptime', value: '99.9%' }
      ]
    },
    { 
      id: 'p4', 
      title: 'Diploma in Health and Social Care', 
      category: 'LMS Platform', 
      platform: 'Alison', 
      brand: 'Alison', 
      image: 'https://picsum.photos/seed/health/800/600', 
      link: 'https://',
      badge: 'Advanced Level',
      type: 'Diploma',
      stats: [
        { label: 'Likes', value: '2.3k' },
        { label: 'Duration', value: '10-15 hrs' },
        { label: 'Learners', value: '87k' }
      ]
    },
    { 
      id: 'p5', 
      title: 'Diploma in Workplace Safety', 
      category: 'LMS Platform', 
      platform: 'Alison', 
      brand: 'Alison', 
      image: 'https://picsum.photos/seed/safety/800/600', 
      link: 'https://',
      badge: 'Beginner Level',
      type: 'Diploma',
      stats: [
        { label: 'Likes', value: '3.5k' },
        { label: 'Duration', value: '6-10 hrs' },
        { label: 'Learners', value: '195k' }
      ]
    },
    { 
      id: 'p6', 
      title: 'Diploma in Nursing Care', 
      category: 'LMS Platform', 
      platform: 'Alison', 
      brand: 'Alison', 
      image: 'https://picsum.photos/seed/nursing/800/600', 
      link: 'https://',
      badge: 'Beginner Level',
      type: 'Diploma',
      stats: [
        { label: 'Likes', value: '4.1k' },
        { label: 'Duration', value: '10-15 hrs' },
        { label: 'Learners', value: '346k' }
      ]
    },
    { 
      id: 'p7', 
      title: 'Alzheimer\'s Patient Care', 
      category: 'LMS Platform', 
      platform: 'Alison', 
      brand: 'Alison', 
      image: 'https://picsum.photos/seed/care/800/600', 
      link: 'https://',
      badge: 'Advanced Level',
      type: 'Diploma',
      stats: [
        { label: 'Likes', value: '308' },
        { label: 'Duration', value: '10-15 hrs' },
        { label: 'Learners', value: '10k' }
      ]
    }
  ],
  services: [
    { id: 's1', title: 'Web Architecture', description: 'Custom, high-performance ecosystems built with advanced functionality.', icon: 'Code' },
    { id: 's2', title: 'CRM & API Integration', description: 'Deep HubSpot, Stripe, and custom API integrations for seamless business operations.', icon: 'Database' },
    { id: 's3', title: 'Conversion Optimization', description: 'Data-driven UI/UX design focused on turning visitors into high-value leads.', icon: 'Zap' },
  ],
  techStack: ['React', 'TypeScript', 'HubSpot', 'Stripe', 'POPIA Compliance'],
  footerEmail: "isaac@isaacweb.com",
  footerPhone: "+1 (555) 000-0000",
  footerAddress: "London, United Kingdom",
  aboutText: "Isaac is a Senior Web Architect specializing in high-performance digital ecosystems. With a focus on automation and luxury design, he helps brands scale their operations through intelligent web systems. His approach combines technical expertise with strategic conversion copywriting to deliver results that justify premium positioning.",
  aboutImage: "https://picsum.photos/seed/isaac/600/800",
  upworkUrl: "https://www.upwork.com/freelancers/~0165dad1c178243d4b",
  policies: [
    {
      id: 'pol1',
      title: 'Project Alignment',
      content: 'I conduct a thorough discovery phase to ensure 100% alignment on goals before any contract begins.'
    }
  ],
  caseStudies: [],
  employmentHistory: [],
  platforms: ['React', 'TypeScript', 'HubSpot', 'Stripe', 'POPIA Compliance']
};

export default function App() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<AppContent>(DEFAULT_CONTENT);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'portfolio' | 'services' | 'about' | 'policies' | 'contact' | 'case-studies' | 'experience'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [showWorkDropdown, setShowWorkDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorkDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.email === 'isaacmason928@gmail.com';

  const filteredPortfolio = content.portfolio.filter(item => {
    const platformMatch = selectedPlatform === 'All' || item.platform === selectedPlatform;
    const brandMatch = selectedBrand === 'All' || item.brand === selectedBrand;
    return platformMatch && brandMatch;
  });

  const uniquePlatforms = ['All', ...new Set(content.portfolio.map(item => item.platform))];
  const uniqueBrands = ['All', ...new Set(content.portfolio.map(item => item.brand))];

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'settings', 'content'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsEditMode(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen for Content changes
  useEffect(() => {
    const contentRef = doc(db, 'settings', 'content');
    const unsubscribe = onSnapshot(contentRef, (snapshot) => {
      // Only update local state if we are NOT in edit mode
      // This prevents overwriting unsaved changes
      if (snapshot.exists() && !isEditMode) {
        const data = snapshot.data();
        setContent({ 
          ...DEFAULT_CONTENT, 
          ...data,
          portfolio: data.portfolio || DEFAULT_CONTENT.portfolio,
          services: data.services || DEFAULT_CONTENT.services,
          policies: data.policies || DEFAULT_CONTENT.policies,
          caseStudies: data.caseStudies || DEFAULT_CONTENT.caseStudies,
          employmentHistory: data.employmentHistory || DEFAULT_CONTENT.employmentHistory,
          platforms: data.platforms || DEFAULT_CONTENT.platforms,
          pillars: data.pillars || DEFAULT_CONTENT.pillars,
          techStack: data.techStack || DEFAULT_CONTENT.techStack
        } as AppContent);
      } else if (!snapshot.exists()) {
        // If no data exists yet, use default
        setContent(DEFAULT_CONTENT);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/content');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isEditMode]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    // Hidden key combo listener: Ctrl + Shift + E
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        if (isEditMode) {
          setIsEditMode(false);
        } else if (isAdmin) {
          setIsEditMode(true);
        } else {
          setShowLoginModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, isAdmin]);

  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    setShowMobileMenu(false);
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signIn();
      setShowLoginModal(false);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // Ignore these errors as they are user-initiated or side effects
        console.log("Login popup closed or cancelled");
      } else {
        console.error("Login failed", error);
        alert(`Login failed: ${error.message || 'Unknown error'}. If you are on Netlify, make sure to add your domain to Firebase Authorized Domains.`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInEmail(emailInput, passwordInput);
      setShowLoginModal(false);
      setEmailInput('');
      setPasswordInput('');
    } catch (error: any) {
      console.error("Email login failed", error);
      alert(`Email login failed: ${error.message || 'Unknown error'}. Make sure Email/Password auth is enabled in Firebase Console.`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsEditMode(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const saveChanges = async () => {
    if (!isAdmin || isSaving) return;
    
    // Basic size check for Firestore (1MB limit)
    const contentSize = JSON.stringify(content).length;
    if (contentSize > 1000000) {
      alert("The total size of your content (including images) is too large for the database. Please use smaller images or fewer items.");
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'content'), content);
      setIsEditMode(false);
      alert('Changes saved successfully to the cloud!');
    } catch (error: any) {
      console.error("Save failed", error);
      handleFirestoreError(error, OperationType.WRITE, 'settings/content');
      alert(`Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateContent = (key: keyof AppContent, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const updatePortfolioItem = (id: string, field: keyof PortfolioItem, value: string) => {
    setContent(prev => ({
      ...prev,
      portfolio: prev.portfolio.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const updateServiceItem = (id: string, field: keyof ServiceItem, value: string) => {
    setContent(prev => ({
      ...prev,
      services: prev.services.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const updatePolicyItem = (id: string, field: keyof PolicyItem, value: string) => {
    setContent(prev => ({
      ...prev,
      policies: prev.policies.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 500KB per image to be safe)
      if (file.size > 500000) {
        alert("Image is too large. Please choose an image smaller than 500KB to ensure it can be saved to the database.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHtmlUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 300000) {
        alert("HTML file is too large. Please keep it under 300KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        updatePortfolioItem(id, 'htmlContent' as any, content);
      };
      reader.readAsText(file);
    }
  };

  const addPortfolioItem = () => {
    const newItem: PortfolioItem = {
      id: `p${Date.now()}`,
      title: 'New Project',
      category: 'Category',
      platform: 'Platform',
      brand: 'Brand',
      image: 'https://picsum.photos/seed/new/800/600',
      link: 'https://'
    };
    setContent(prev => ({ ...prev, portfolio: [...prev.portfolio, newItem] }));
  };

  const removePortfolioItem = (id: string) => {
    setContent(prev => ({ ...prev, portfolio: prev.portfolio.filter(item => item.id !== id) }));
  };

  const addServiceItem = () => {
    const newItem: ServiceItem = {
      id: `s${Date.now()}`,
      title: 'New Service',
      description: 'Service description goes here.',
      icon: 'Code'
    };
    setContent(prev => ({ ...prev, services: [...prev.services, newItem] }));
  };

  const removeServiceItem = (id: string) => {
    setContent(prev => ({ ...prev, services: prev.services.filter(item => item.id !== id) }));
  };

  const updateCaseStudy = (id: string, field: keyof CaseStudy, value: string) => {
    setContent(prev => ({
      ...prev,
      caseStudies: (prev.caseStudies || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addCaseStudy = () => {
    const newItem: CaseStudy = {
      id: `cs${Date.now()}`,
      title: 'New Case Study',
      client: 'Client Name',
      challenge: 'What was the problem?',
      solution: 'How did you fix it?',
      results: 'What were the results?',
      image: 'https://picsum.photos/seed/cs/800/600'
    };
    setContent(prev => ({ ...prev, caseStudies: [...(prev.caseStudies || []), newItem] }));
  };

  const removeCaseStudy = (id: string) => {
    setContent(prev => ({ ...prev, caseStudies: (prev.caseStudies || []).filter(item => item.id !== id) }));
  };

  const updateEmployment = (id: string, field: keyof EmploymentHistory, value: string) => {
    setContent(prev => ({
      ...prev,
      employmentHistory: (prev.employmentHistory || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addEmployment = () => {
    const newItem: EmploymentHistory = {
      id: `eh${Date.now()}`,
      role: 'Role Name',
      company: 'Company Name',
      period: 'Jan 2020 - Present',
      description: 'Role description goes here.'
    };
    setContent(prev => ({ ...prev, employmentHistory: [...(prev.employmentHistory || []), newItem] }));
  };

  const removeEmployment = (id: string) => {
    setContent(prev => ({ ...prev, employmentHistory: (prev.employmentHistory || []).filter(item => item.id !== id) }));
  };

  const addPlatform = () => {
    const name = prompt("Enter platform name:");
    if (name) {
      setContent(prev => ({ ...prev, platforms: [...(prev.platforms || []), name] }));
    }
  };

  const removePlatform = (index: number) => {
    setContent(prev => ({ ...prev, platforms: (prev.platforms || []).filter((_, i) => i !== index) }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-white/5 py-8 sticky top-0 bg-bg/80 backdrop-blur-xl z-40">
        <div className="content-container flex justify-between items-center">
          <button 
            onClick={() => navigateTo('home')}
            className="text-2xl font-black tracking-tighter font-serif"
          >
            ISAAC<span className="text-brand">WEB</span>
          </button>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-12 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            <button onClick={() => navigateTo('services')} className={`hover:text-white transition-colors ${currentView === 'services' ? 'text-white' : ''}`}>Services</button>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowWorkDropdown(!showWorkDropdown)}
                className={`flex items-center space-x-2 hover:text-white transition-colors ${['portfolio', 'case-studies', 'experience'].includes(currentView) ? 'text-white' : ''}`}
              >
                <span>Work</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showWorkDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showWorkDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-4 w-64 bg-surface border border-white/5 rounded-sm shadow-2xl p-4 flex flex-col space-y-4 z-50"
                  >
                    <button 
                      onClick={() => { navigateTo('portfolio'); setShowWorkDropdown(false); }}
                      className={`text-left hover:text-brand transition-colors ${currentView === 'portfolio' ? 'text-brand' : ''}`}
                    >
                      Portfolio
                    </button>
                    <button 
                      onClick={() => { navigateTo('case-studies'); setShowWorkDropdown(false); }}
                      className={`text-left hover:text-brand transition-colors ${currentView === 'case-studies' ? 'text-brand' : ''}`}
                    >
                      Case Studies
                    </button>
                    <button 
                      onClick={() => { navigateTo('experience'); setShowWorkDropdown(false); }}
                      className={`text-left hover:text-brand transition-colors ${currentView === 'experience' ? 'text-brand' : ''}`}
                    >
                      Employment History
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => navigateTo('about')} className={`hover:text-white transition-colors ${currentView === 'about' ? 'text-white' : ''}`}>About</button>
            <button onClick={() => navigateTo('policies')} className={`hover:text-white transition-colors ${currentView === 'policies' ? 'text-white' : ''}`}>Process</button>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`p-2 rounded-full transition-colors ${isEditMode ? 'bg-brand text-bg' : 'hover:bg-white/5 text-gray-500'}`}
                  title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                title="Admin Login"
              >
                <LogIn size={18} className="text-gray-500" />
              </button>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              {showMobileMenu ? <X size={24} className="text-gray-500" /> : <Menu size={24} className="text-gray-500" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-surface border-b border-white/5 md:hidden overflow-hidden"
            >
              <div className="flex flex-col p-8 space-y-6 text-lg font-bold uppercase tracking-widest">
                <button onClick={() => navigateTo('home')} className={currentView === 'home' ? 'text-brand' : 'text-gray-500'}>Home</button>
                <button onClick={() => navigateTo('portfolio')} className={currentView === 'portfolio' ? 'text-brand' : 'text-gray-500'}>Portfolio</button>
                <button onClick={() => navigateTo('case-studies')} className={currentView === 'case-studies' ? 'text-brand' : 'text-gray-500'}>Case Studies</button>
                <button onClick={() => navigateTo('experience')} className={currentView === 'experience' ? 'text-brand' : 'text-gray-500'}>Experience</button>
                <button onClick={() => navigateTo('services')} className={currentView === 'services' ? 'text-brand' : 'text-gray-500'}>Services</button>
                <button onClick={() => navigateTo('about')} className={currentView === 'about' ? 'text-brand' : 'text-gray-500'}>About</button>
                <button onClick={() => navigateTo('policies')} className={currentView === 'policies' ? 'text-brand' : 'text-gray-500'}>Policies</button>
                <button onClick={() => navigateTo('contact')} className={currentView === 'contact' ? 'text-brand' : 'text-gray-500'}>Contact</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow">
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <section className="py-32 md:py-56 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none"></div>
              <div className="content-container relative z-10">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  contentEditable={isEditMode}
                  onBlur={(e) => updateContent('heroTitle', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                  className="text-5xl md:text-8xl font-bold leading-[1.1] tracking-tight mb-10 font-serif max-w-5xl"
                >
                  {content.heroTitle}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  contentEditable={isEditMode}
                  onBlur={(e) => updateContent('heroSub', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                  className="text-xl md:text-2xl text-gray-400 max-w-3xl font-light leading-relaxed mb-16"
                >
                  {content.heroSub}
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-6"
                >
                  <a 
                    href={content.upworkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand text-bg px-10 py-5 text-lg font-bold hover:bg-brand/90 transition-all rounded-sm text-center"
                  >
                    Book Strategy Call
                  </a>
                  <button 
                    onClick={() => navigateTo('portfolio')}
                    className="border border-white/10 text-white px-10 py-5 text-lg font-bold hover:bg-white/5 transition-all rounded-sm"
                  >
                    View My Work
                  </button>
                </motion.div>
              </div>
            </section>

            {/* Three Pillars Section */}
            <section className="py-24 border-t border-white/5">
              <div className="content-container">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {content.pillars.map((pillar) => (
                    <div key={pillar.id} className="bg-surface p-10 rounded-sm border border-white/5 hover:border-brand/30 transition-all group">
                      <div className="w-12 h-12 bg-brand/10 text-brand flex items-center justify-center mb-8 rounded-sm">
                        {pillar.icon === 'Zap' && <Zap size={24} />}
                        {pillar.icon === 'Layout' && <Layout size={24} />}
                        {pillar.icon === 'Database' && <Database size={24} />}
                      </div>
                      <h3 
                        contentEditable={isEditMode}
                        onBlur={(e) => {
                          const newPillars = content.pillars.map(p => p.id === pillar.id ? { ...p, title: e.currentTarget.innerText } : p);
                          updateContent('pillars', newPillars);
                        }}
                        suppressContentEditableWarning
                        className="text-2xl font-bold mb-4 font-serif"
                      >
                        {pillar.title}
                      </h3>
                      <p 
                        contentEditable={isEditMode}
                        onBlur={(e) => {
                          const newPillars = content.pillars.map(p => p.id === pillar.id ? { ...p, content: e.currentTarget.innerText } : p);
                          updateContent('pillars', newPillars);
                        }}
                        suppressContentEditableWarning
                        className="text-gray-400 leading-relaxed"
                      >
                        {pillar.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Portfolio Section */}
            <section id="work" className="py-24 border-t border-white/5 bg-bg">
              <div className="content-container">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-brand mb-4">Selected Work</h2>
                    <h3 className="text-4xl md:text-6xl font-bold font-serif">Web Masterpieces</h3>
                  </div>
                  <button 
                    onClick={() => navigateTo('portfolio')}
                    className="text-sm font-bold uppercase tracking-widest border-b border-brand pb-1 hover:text-brand transition-colors"
                  >
                    View All Projects
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {content.portfolio.slice(0, 3).map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-surface mb-6 relative rounded-sm">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-bg/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center p-8">
                          <div className="text-center">
                            <p className="text-brand text-xs font-bold uppercase tracking-widest mb-2">{item.category}</p>
                            <h4 className="text-2xl font-bold font-serif mb-6">{item.title}</h4>
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-sm font-bold uppercase tracking-widest border border-white/20 px-6 py-3 hover:bg-white hover:text-bg transition-all text-white"
                            >
                              <span>View Project</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Tech Stack Section */}
            <section className="py-20 border-t border-white/5 bg-surface/30">
              <div className="content-container">
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                  {content.techStack.map((tech, index) => (
                    <span key={index} className="text-xl md:text-2xl font-bold tracking-tighter uppercase">{tech}</span>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {currentView === 'portfolio' && (
          <section id="work" className="py-24 bg-bg min-h-[70vh]">
            <div className="content-container">
              <div className="flex justify-between items-end mb-16">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">Selected Work</h2>
                  <h3 className="text-4xl font-bold font-serif">Web Masterpieces</h3>
                </div>
                <div className="hidden md:block h-[1px] flex-grow mx-12 bg-white/5"></div>
              </div>

              <div className="flex flex-col md:flex-row gap-12 mb-16 p-8 bg-surface/50 border border-white/5 rounded-sm">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-4 text-gray-500">
                    <Layout size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Filter by Platform</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniquePlatforms.map(platform => (
                      <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                          selectedPlatform === platform 
                            ? 'bg-brand border-brand text-bg' 
                            : 'border-white/10 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hidden md:block w-[1px] bg-white/5"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-4 text-gray-500">
                    <Briefcase size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Filter by Brand</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uniqueBrands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                          selectedBrand === brand 
                            ? 'bg-brand border-brand text-bg' 
                            : 'border-white/10 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedPlatform !== 'All' || selectedBrand !== 'All') && (
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        setSelectedPlatform('All');
                        setSelectedBrand('All');
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-brand hover:text-white transition-colors flex items-center space-x-2"
                    >
                      <X size={14} />
                      <span>Clear All</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredPortfolio.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-surface mb-6 relative rounded-sm group">
                      {item.badge && (
                        <div className="absolute top-4 left-4 z-10 bg-brand/90 text-bg text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
                          {item.badge}
                        </div>
                      )}
                      {item.type && (
                        <div className="absolute top-4 right-4 z-10 bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm backdrop-blur-sm border border-white/10">
                          {item.type}
                        </div>
                      )}
                      <a 
                        href={item.link || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`block w-full h-full ${!item.link ? 'pointer-events-none' : ''}`}
                      >
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-brand text-bg p-3 rounded-full">
                            <ExternalLink size={20} />
                          </div>
                        </div>
                      </a>
                      {isEditMode && (
                        <div className="absolute top-16 right-4 flex flex-col space-y-2 z-20">
                          <div className="flex space-x-2">
                            <label className="bg-surface p-2 rounded shadow-lg cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-center border border-white/10" title="Upload Image">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, (base64) => updatePortfolioItem(item.id, 'image', base64))}
                                className="hidden"
                              />
                              <Edit3 size={14} className="text-gray-400" />
                            </label>
                            <label className="bg-brand p-2 rounded shadow-lg cursor-pointer hover:bg-brand/90 transition-colors flex items-center justify-center" title="Upload HTML Design">
                              <input 
                                type="file" 
                                accept=".html"
                                onChange={(e) => handleHtmlUpload(e, item.id)}
                                className="hidden"
                              />
                              <FileCode size={14} className="text-bg" />
                            </label>
                            <button 
                              onClick={() => removePortfolioItem(item.id)}
                              className="bg-red-500 text-white p-2 rounded shadow-lg hover:bg-red-600 transition-colors"
                              title="Remove Project"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-grow">
                          <h4 
                            contentEditable={isEditMode}
                            onBlur={(e) => updatePortfolioItem(item.id, 'title', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-xl font-bold mb-1 group-hover:text-brand transition-colors"
                          >
                            {item.title}
                          </h4>
                          <p 
                            contentEditable={isEditMode}
                            onBlur={(e) => updatePortfolioItem(item.id, 'category', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-xs text-gray-400 uppercase tracking-widest"
                          >
                            {item.category}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5 mb-6">
                        {item.stats?.map((stat, i) => (
                          <div key={i} className="flex flex-col">
                            <div className="flex items-center space-x-1 mb-1 text-gray-500">
                              {stat.label.toLowerCase().includes('like') && <ThumbsUp size={10} />}
                              {stat.label.toLowerCase().includes('duration') && <Clock size={10} />}
                              {stat.label.toLowerCase().includes('user') || stat.label.toLowerCase().includes('learner') ? <Users size={10} /> : null}
                              <span className="text-[9px] font-bold uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <span className="text-xs font-bold text-white">{stat.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <button className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border border-white/10 rounded-sm hover:bg-white/5 transition-all">
                          More Info
                        </button>
                        <a 
                          href={item.link || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-brand text-bg rounded-sm hover:bg-brand/90 transition-all text-center"
                        >
                          Start Project
                        </a>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-6">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded text-gray-500">
                          Platform: {item.platform}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-white/5 rounded text-gray-500">
                          Brand: {item.brand}
                        </span>
                      </div>
                        {item.htmlContent && (
                          <button 
                            onClick={() => setPreviewHtml(item.htmlContent || null)}
                            className="mt-4 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-brand hover:text-white transition-colors"
                          >
                            <Eye size={14} />
                            <span>View Design</span>
                          </button>
                        )}
                      </div>
                      {isEditMode && (
                        <div className="ml-4 flex flex-col items-end">
                          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Live Link</p>
                          <input 
                            type="text"
                            value={item.link || ''}
                            onChange={(e) => updatePortfolioItem(item.id, 'link', e.target.value)}
                            className="text-xs p-1 bg-bg border border-white/10 rounded w-32 outline-none focus:border-brand text-white"
                            placeholder="https://..."
                          />
                          <div className="mt-4 grid grid-cols-1 gap-2">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Platform</p>
                              <input 
                                type="text"
                                value={item.platform}
                                onChange={(e) => updatePortfolioItem(item.id, 'platform', e.target.value)}
                                className="text-[10px] p-1 bg-bg border border-white/10 rounded w-32 outline-none focus:border-brand text-white"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Brand</p>
                              <input 
                                type="text"
                                value={item.brand}
                                onChange={(e) => updatePortfolioItem(item.id, 'brand', e.target.value)}
                                className="text-[10px] p-1 bg-bg border border-white/10 rounded w-32 outline-none focus:border-brand text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                ))}
                {isEditMode && (
                  <button 
                    onClick={addPortfolioItem}
                    className="aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand transition-all"
                  >
                    <Edit3 size={32} className="mb-2" />
                    <span className="font-bold uppercase tracking-widest text-xs">Add Project</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {currentView === 'about' && (
          <section id="about" className="py-24 bg-bg min-h-[70vh]">
            <div className="content-container">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <div className="aspect-[3/4] bg-surface overflow-hidden rounded-sm relative border border-white/5">
                    <img 
                      src={content.aboutImage} 
                      alt="Isaac" 
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    {isEditMode && (
                      <div className="absolute bottom-4 left-4 right-4 bg-surface p-4 rounded-sm shadow-2xl border border-white/10">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Profile Photo</p>
                        <div className="flex flex-col space-y-4">
                          <label className="w-full flex items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-sm cursor-pointer hover:border-brand hover:bg-brand/5 transition-all">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, (base64) => updateContent('aboutImage', base64))}
                              className="hidden"
                            />
                            <div className="flex flex-col items-center">
                              <Edit3 size={20} className="text-gray-500 mb-1" />
                              <span className="text-xs font-bold text-gray-500">Upload File</span>
                            </div>
                          </label>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Or Paste Image URL</span>
                            <input 
                              type="text"
                              value={content.aboutImage}
                              onChange={(e) => updateContent('aboutImage', e.target.value)}
                              className="text-xs p-2 bg-bg border border-white/10 rounded-sm outline-none focus:border-brand text-white"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand rounded-full flex items-center justify-center font-bold text-center p-4 leading-tight transform rotate-12 text-bg">
                    100% Success Score
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">About Me</h2>
                  <h3 className="text-4xl md:text-5xl font-bold mb-8 font-serif">Isaac <span className="text-brand">Expert Web Architect</span></h3>
                  <p 
                    contentEditable={isEditMode}
                    onBlur={(e) => updateContent('aboutText', e.currentTarget.innerText)}
                    suppressContentEditableWarning
                    className="text-lg text-gray-400 leading-relaxed mb-8"
                  >
                    {content.aboutText}
                  </p>
                  <div className="flex space-x-8">
                    <div>
                      <p className="text-3xl font-bold text-white">2+</p>
                      <p className="text-xs uppercase tracking-widest text-gray-500">Years Exp.</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">London</p>
                      <p className="text-xs uppercase tracking-widest text-gray-500">United Kingdom</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">Elite</p>
                      <p className="text-xs uppercase tracking-widest text-gray-500">Professional</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {currentView === 'case-studies' && (
          <section id="case-studies" className="py-24 min-h-[70vh] bg-bg text-white">
            <div className="content-container">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">Success Stories</h2>
              <h1 className="text-5xl md:text-7xl font-bold mb-16 font-serif">Case <span className="text-brand">Studies</span></h1>
              
              <div className="grid grid-cols-1 gap-24">
                {(content.caseStudies || []).map((cs, index) => (
                  <motion.div 
                    key={cs.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center group relative"
                  >
                    {isEditMode && (
                      <button 
                        onClick={() => removeCaseStudy(cs.id)}
                        className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full z-10"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className={`aspect-video bg-surface rounded-sm overflow-hidden relative border border-white/5 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <img 
                        src={cs.image} 
                        alt={cs.title} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                      {isEditMode && (
                        <div className="absolute inset-0 bg-bg/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-surface p-4 rounded-sm shadow-2xl w-64 border border-white/10">
                            <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Image URL</p>
                            <input 
                              type="text"
                              value={cs.image}
                              onChange={(e) => updateCaseStudy(cs.id, 'image', e.target.value)}
                              className="text-xs p-2 bg-bg border border-white/10 rounded-sm w-full outline-none focus:border-brand text-white"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 
                        contentEditable={isEditMode}
                        onBlur={(e) => updateCaseStudy(cs.id, 'title', e.currentTarget.innerText)}
                        suppressContentEditableWarning
                        className="text-3xl font-bold mb-2 font-serif"
                      >
                        {cs.title}
                      </h3>
                      <p 
                        contentEditable={isEditMode}
                        onBlur={(e) => updateCaseStudy(cs.id, 'client', e.currentTarget.innerText)}
                        suppressContentEditableWarning
                        className="text-brand font-bold uppercase tracking-widest text-sm mb-8"
                      >
                        {cs.client}
                      </p>
                      
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">The Challenge</h4>
                          <p 
                            contentEditable={isEditMode}
                            onBlur={(e) => updateCaseStudy(cs.id, 'challenge', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-gray-400 leading-relaxed"
                          >
                            {cs.challenge}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">The Solution</h4>
                          <p 
                            contentEditable={isEditMode}
                            onBlur={(e) => updateCaseStudy(cs.id, 'solution', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-gray-400 leading-relaxed"
                          >
                            {cs.solution}
                          </p>
                        </div>
                        <div className="p-6 bg-brand/5 border-l-4 border-brand rounded-sm">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">The Results</h4>
                          <p 
                            contentEditable={isEditMode}
                            onBlur={(e) => updateCaseStudy(cs.id, 'results', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-lg font-bold text-white"
                          >
                            {cs.results}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isEditMode && (
                  <button 
                    onClick={addCaseStudy}
                    className="w-full py-12 border-2 border-dashed border-white/10 rounded-sm text-gray-500 hover:border-brand hover:text-brand transition-all flex flex-col items-center justify-center"
                  >
                    <Plus size={48} className="mb-4" />
                    <span className="font-bold uppercase tracking-widest text-sm">Add Case Study</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {currentView === 'experience' && (
          <section id="experience" className="py-24 min-h-[70vh] bg-bg text-white">
            <div className="content-container">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">My Journey</h2>
              <h1 className="text-5xl md:text-7xl font-bold mb-16 font-serif">Employment <span className="text-brand">History</span></h1>
              
              <div className="max-w-4xl space-y-12">
                {(content.employmentHistory || []).map((job) => (
                  <div key={job.id} className="relative pl-12 border-l-2 border-white/10 group">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-4 border-bg shadow-sm"></div>
                    {isEditMode && (
                      <button 
                        onClick={() => removeEmployment(job.id)}
                        className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 
                          contentEditable={isEditMode}
                          onBlur={(e) => updateEmployment(job.id, 'role', e.currentTarget.innerText)}
                          suppressContentEditableWarning
                          className="text-2xl font-bold font-serif"
                        >
                          {job.role}
                        </h3>
                        <p 
                          contentEditable={isEditMode}
                          onBlur={(e) => updateEmployment(job.id, 'company', e.currentTarget.innerText)}
                          suppressContentEditableWarning
                          className="text-brand font-bold"
                        >
                          {job.company}
                        </p>
                      </div>
                      <p 
                        contentEditable={isEditMode}
                        onBlur={(e) => updateEmployment(job.id, 'period', e.currentTarget.innerText)}
                        suppressContentEditableWarning
                        className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2 md:mt-0"
                      >
                        {job.period}
                      </p>
                    </div>
                    <p 
                      contentEditable={isEditMode}
                      onBlur={(e) => updateEmployment(job.id, 'description', e.currentTarget.innerText)}
                      suppressContentEditableWarning
                      className="text-gray-400 leading-relaxed"
                    >
                      {job.description}
                    </p>
                  </div>
                ))}
                
                {isEditMode && (
                  <button 
                    onClick={addEmployment}
                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-sm text-gray-500 hover:border-brand hover:text-brand transition-all flex flex-col items-center justify-center"
                  >
                    <Plus size={32} className="mb-2" />
                    <span className="font-bold uppercase tracking-widest text-xs">Add Experience</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {currentView === 'services' && (
          <section id="services" className="py-24 min-h-[70vh] bg-bg text-white">
            <div className="content-container">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">What I Do</h2>
              <h1 className="text-5xl md:text-7xl font-bold mb-16 font-serif">My <span className="text-brand">Services</span></h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                {content.services.map((service) => (
                  <div key={service.id} className="flex flex-col group relative">
                    {isEditMode && (
                      <button 
                        onClick={() => removeServiceItem(service.id)}
                        className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="w-16 h-16 bg-brand/10 text-brand flex items-center justify-center mb-8 relative rounded-sm">
                      {service.icon === 'Code' && <Code size={32} />}
                      {service.icon === 'Search' && <Search size={32} />}
                      {service.icon === 'Layout' && <Layout size={32} />}
                      {service.icon === 'Zap' && <Zap size={32} />}
                      {service.icon === 'Database' && <Database size={32} />}
                      {service.icon === 'ShoppingBag' && <ShoppingBag size={32} />}
                      
                      {isEditMode && (
                        <select 
                          value={service.icon}
                          onChange={(e) => updateServiceItem(service.id, 'icon', e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        >
                          <option value="Code">Code</option>
                          <option value="Search">Search</option>
                          <option value="Layout">Layout</option>
                          <option value="Zap">Zap</option>
                          <option value="Database">Database</option>
                          <option value="ShoppingBag">ShoppingBag</option>
                        </select>
                      )}
                    </div>
                    <h3 
                      contentEditable={isEditMode}
                      onBlur={(e) => updateServiceItem(service.id, 'title', e.currentTarget.innerText)}
                      suppressContentEditableWarning
                      className="text-2xl font-bold mb-4 font-serif"
                    >
                      {service.title}
                    </h3>
                    <p 
                      contentEditable={isEditMode}
                      onBlur={(e) => updateServiceItem(service.id, 'description', e.currentTarget.innerText)}
                      suppressContentEditableWarning
                      className="text-gray-400 leading-relaxed"
                    >
                      {service.description}
                    </p>
                  </div>
                ))}
                {isEditMode && (
                  <button 
                    onClick={addServiceItem}
                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-sm text-gray-500 hover:border-brand hover:text-brand transition-all"
                  >
                    <Plus size={48} className="mb-4" />
                    <span className="font-bold uppercase tracking-widest text-sm">Add Service</span>
                  </button>
                )}
              </div>

              {/* Platform Slider */}
              <div className="mt-32 pt-16 border-t border-white/5 overflow-hidden">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-12 text-center">Platforms I Master</h2>
                
                <div className="relative">
                  <div className="flex space-x-12 whitespace-nowrap animate-marquee">
                    {/* Duplicate platforms for infinite scroll effect */}
                    {[...(content.platforms || []), ...(content.platforms || []), ...(content.platforms || [])].map((platform, index) => (
                      <div 
                        key={`${platform}-${index}`} 
                        className="text-4xl md:text-6xl font-black text-white/5 hover:text-brand transition-colors cursor-default select-none relative group font-serif"
                      >
                        {platform}
                        {isEditMode && index < (content.platforms || []).length && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlatform(index);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {isEditMode && (
                    <div className="flex justify-center mt-12">
                      <button 
                        onClick={addPlatform}
                        className="flex items-center space-x-2 px-6 py-3 bg-surface rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-brand hover:text-bg transition-colors border border-white/5"
                      >
                        <Plus size={16} />
                        <span>Add Platform</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {currentView === 'policies' && (
          <section className="py-24 md:py-40 min-h-[70vh] bg-bg text-white">
            <div className="content-container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">Service Standards</h2>
                <h1 className="text-5xl md:text-7xl font-bold mb-16 font-serif">My <span className="text-brand">Policies</span></h1>
                
                <div className="grid grid-cols-1 gap-12 max-w-4xl">
                  {content.policies.map((policy, index) => (
                    <motion.div 
                      key={policy.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-l-4 border-brand pl-8 py-4 bg-surface/30 rounded-r-sm"
                    >
                      <h3 
                        contentEditable={isEditMode}
                        onBlur={(e) => updatePolicyItem(policy.id, 'title', e.currentTarget.innerText)}
                        suppressContentEditableWarning
                        className="text-2xl font-bold mb-4 font-serif"
                      >
                        {policy.title}
                      </h3>
                      <p 
                        contentEditable={isEditMode}
                        onBlur={(e) => updatePolicyItem(policy.id, 'content', e.currentTarget.innerText)}
                        suppressContentEditableWarning
                        className="text-lg text-gray-400 leading-relaxed"
                      >
                        {policy.content}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-24 p-12 bg-surface rounded-sm border border-white/5">
                  <h3 className="text-3xl font-bold mb-6 font-serif">My Service Standards Summary:</h3>
                  <ul className="space-y-4 text-lg text-gray-400">
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full"></div>
                      <span><strong>Satisfaction Guarantee:</strong> We finalize project scope before the contract begins.</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full"></div>
                      <span><strong>Clear Communication:</strong> Daily updates and a 24-hour response time.</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full"></div>
                      <span><strong>Inclusive Revisions:</strong> 3 rounds of edits included in every milestone.</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-brand rounded-full"></div>
                      <span><strong>Support:</strong> 1 week of technical assistance post-launch.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {currentView === 'contact' && (
          <section id="contact" className="py-24 md:py-40 min-h-[70vh] bg-black text-white overflow-hidden relative">
            <div className="content-container relative z-10">
              <div className="max-w-4xl">
                <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-12">
                  Ready to elevate your <span className="text-brand">digital presence?</span>
                </h2>
                <div className="flex flex-col space-y-4">
                  {isEditMode && (
                    <div className="bg-white/10 p-4 rounded-xl mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Upwork URL</p>
                      <input 
                        type="text" 
                        value={content.upworkUrl}
                        onChange={(e) => updateContent('upworkUrl', e.target.value)}
                        className="w-full p-2 bg-transparent border border-white/20 rounded text-sm text-white"
                        placeholder="Upwork Profile URL"
                      />
                    </div>
                  )}
                  <a 
                    href={content.upworkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-4 bg-brand text-bg px-12 py-6 text-xl font-bold hover:scale-105 transition-transform w-fit"
                  >
                    <span>Start a Project</span>
                    <ExternalLink size={24} />
                  </a>
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-brand font-bold uppercase tracking-widest text-xs mb-4">Email Me</h4>
                    <p className="text-2xl font-light">{content.footerEmail}</p>
                  </div>
                  <div>
                    <h4 className="text-brand font-bold uppercase tracking-widest text-xs mb-4">Call Me</h4>
                    <p className="text-2xl font-light">{content.footerPhone}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-brand/10 rounded-full blur-3xl"></div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-32 border-t border-white/5 bg-bg relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="content-container relative z-10">
          <div className="max-w-4xl mb-24">
            <h2 className="text-5xl md:text-8xl font-bold font-serif leading-[1.1] mb-12">
              Ready to automate your <span className="text-brand">operations?</span>
            </h2>
            <a 
              href={content.upworkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-4 bg-brand text-bg px-12 py-6 text-xl font-bold hover:bg-brand/90 transition-all rounded-sm group"
            >
              <span>Claim Your Strategy Session</span>
              <ExternalLink size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 pt-16 border-t border-white/5">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-black tracking-tighter font-serif mb-6">
                ISAAC<span className="text-brand">WEB</span>
              </div>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                Architecting high-performance digital ecosystems that turn websites into 24/7 sales employees.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-8 uppercase text-xs tracking-[0.2em] text-gray-500">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3 text-gray-400">
                  <Mail size={16} className="text-brand" />
                  <span 
                    contentEditable={isEditMode}
                    onBlur={(e) => updateContent('footerEmail', e.currentTarget.innerText)}
                    suppressContentEditableWarning
                  >
                    {content.footerEmail}
                  </span>
                </li>
                <li className="flex items-center space-x-3 text-gray-400">
                  <Phone size={16} className="text-brand" />
                  <span 
                    contentEditable={isEditMode}
                    onBlur={(e) => updateContent('footerPhone', e.currentTarget.innerText)}
                    suppressContentEditableWarning
                  >
                    {content.footerPhone}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-8 uppercase text-xs tracking-[0.2em] text-gray-500">Location</h4>
              <p className="text-gray-400 leading-relaxed">
                <span 
                  contentEditable={isEditMode}
                  onBlur={(e) => updateContent('footerAddress', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                >
                  {content.footerAddress}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
            <p>© {new Date().getFullYear()} ISAACWEB. ALL RIGHTS RESERVED.</p>
            <div className="flex space-x-8">
              <button onClick={() => navigateTo('policies')} className="hover:text-brand transition-colors">Privacy Policy</button>
              <button onClick={() => navigateTo('policies')} className="hover:text-brand transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Save Button */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex space-x-4"
          >
            <button 
              onClick={saveChanges}
              disabled={isSaving}
              className={`flex items-center space-x-2 bg-brand text-bg px-8 py-4 rounded-full font-bold shadow-2xl transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button 
              onClick={() => setIsEditMode(false)}
              className="flex items-center justify-center bg-surface text-white w-14 h-14 rounded-full shadow-2xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface p-8 md:p-12 max-w-md w-full rounded-sm shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold font-serif">Admin Access</h2>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="text-center">
                <div className="flex border-b border-white/5 mb-8">
                  <button 
                    onClick={() => setLoginMethod('google')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${loginMethod === 'google' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}
                  >
                    Google
                  </button>
                  <button 
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${loginMethod === 'email' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}
                  >
                    Email
                  </button>
                </div>

                {loginMethod === 'google' ? (
                  <>
                    <p className="text-gray-400 mb-8">Login with your Google account to enable live editing mode. Only authorized admins can save changes.</p>
                    <button 
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className={`w-full flex items-center justify-center space-x-3 bg-brand text-bg py-4 rounded-sm font-bold transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand/90'}`}
                    >
                      {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                      <span>{isLoggingIn ? 'Logging in...' : 'Login with Google'}</span>
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleEmailLogin} className="text-left">
                    <div className="mb-4">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full p-4 bg-bg border-2 border-white/5 rounded-sm focus:border-brand outline-none transition-colors text-white"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div className="mb-8">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full p-4 bg-bg border-2 border-white/5 rounded-sm focus:border-brand outline-none transition-colors text-white"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoggingIn}
                      className={`w-full flex items-center justify-center space-x-3 bg-brand text-bg py-4 rounded-sm font-bold transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand/90'}`}
                    >
                      {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                      <span>{isLoggingIn ? 'Logging in...' : 'Login with Email'}</span>
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HTML Preview Modal */}
      <AnimatePresence>
        {previewHtml && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-12"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full h-full rounded-sm shadow-2xl overflow-hidden flex flex-col border border-white/10"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-xs font-bold uppercase tracking-widest text-gray-500">Design Preview</span>
                </div>
                <button 
                  onClick={() => setPreviewHtml(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow bg-bg">
                <iframe 
                  srcDoc={previewHtml}
                  title="Design Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-bg"
          >
            <div className="flex flex-col items-center">
              <Loader2 size={48} className="text-brand animate-spin mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Syncing with Cloud...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
