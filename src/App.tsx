import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Edit3, X, ExternalLink, Code, Search, Layout, Mail, Phone, MapPin, Menu, Zap, Database, ShoppingBag, Plus, Trash2, LogIn, LogOut, Loader2, FileCode, Eye, Briefcase, BookOpen } from 'lucide-react';
import { db, auth, signIn, logout, OperationType, handleFirestoreError, signInEmail } from './firebase';
import { doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- Types ---
interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  link?: string;
  htmlContent?: string;
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

interface AppContent {
  heroTitle: string;
  heroSub: string;
  portfolio: PortfolioItem[];
  services: ServiceItem[];
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  aboutText: string;
  aboutImage: string;
  upworkUrl: string;
  policies: PolicyItem[];
  caseStudies: CaseStudy[];
  employmentHistory: EmploymentHistory[];
}

// --- Default Content ---
const DEFAULT_CONTENT: AppContent = {
  heroTitle: "Crafting High-Conversion Digital Experiences.",
  heroSub: "Specializing in high-end Wix development, SEO optimization, and intuitive UI/UX design for forward-thinking brands.",
  portfolio: [
    { id: 'p1', title: 'Luxury Real Estate', category: 'Wix Development', image: 'https://picsum.photos/seed/realestate/800/600', link: 'https://www.wix.com' },
    { id: 'p2', title: 'Modern E-commerce', category: 'UI/UX Design', image: 'https://picsum.photos/seed/shop/800/600', link: 'https://www.wix.com' },
    { id: 'p3', title: 'Tech Startup', category: 'SEO Strategy', image: 'https://picsum.photos/seed/tech/800/600', link: 'https://www.wix.com' },
  ],
  services: [
    { id: 's1', title: 'Wix Development', description: 'Custom, high-performance websites built on the Wix platform with advanced Velo functionality.', icon: 'Code' },
    { id: 's2', title: 'SEO Optimization', description: 'Data-driven strategies to improve your search rankings and drive organic traffic to your site.', icon: 'Search' },
    { id: 's3', title: 'UI/UX Design', description: 'Beautiful, user-centric interfaces designed to convert visitors into loyal customers.', icon: 'Layout' },
    { id: 's4', title: 'Wix Automation', description: 'Streamline your business workflows with custom Wix automations and third-party integrations.', icon: 'Zap' },
    { id: 's5', title: 'Wix CMS', description: 'Advanced content management solutions using Wix Data and Dynamic Pages for scalable sites.', icon: 'Database' },
    { id: 's6', title: 'Wix Store Setup', description: 'Complete e-commerce solutions including product configuration, payment gateways, and shipping.', icon: 'ShoppingBag' },
  ],
  footerEmail: "hello@websiteexpert.com",
  footerPhone: "+1 (555) 000-0000",
  footerAddress: "123 Digital Ave, Creative City, ST 12345",
  aboutText: "Bukola I. is a certified Wix Expert and Velo Specialist based in Lagos, Nigeria. With a perfect 100% Job Success Score and 'Elite Professional' status on Upwork, Bukola specializes in creating high-performing, custom-coded websites. With over two years of experience, they offer comprehensive services across Wix, WordPress, and Shopify, combining technical expertise in Velo development with strategic skills in SEO and lead generation to help businesses thrive online.",
  aboutImage: "https://picsum.photos/seed/bukola/600/800",
  upworkUrl: "https://www.upwork.com/freelancers/~0165dad1c178243d4b?mp_source=share",
  policies: [
    {
      id: 'pol1',
      title: 'Project Alignment Policy',
      content: 'To ensure I am the perfect fit for your vision, I prefer to conduct a thorough discovery phase and provide a clear project roadmap before we officially begin the contract. This ensures that both parties are 100% aligned on the goals and deliverables before any financial commitment is made.'
    },
    {
      id: 'pol2',
      title: 'Revision & Feedback Policy',
      content: 'Your satisfaction is my priority. Every project includes 3 rounds of major revisions. This allows us to fine-tune the design and functionality until it is exactly what you need, while keeping the project on schedule.'
    },
    {
      id: 'pol3',
      title: 'Communication & Response Policy',
      content: 'I believe clear communication is the key to a successful project. I am available for updates and discussions during regular business hours (9 AM - 6 PM GMT+1). I aim to respond to all inquiries within 24 hours.'
    }
  ],
  caseStudies: [
    {
      id: 'cs1',
      title: 'E-commerce Conversion Boost',
      client: 'Fashion Retailer',
      challenge: 'The client was experiencing high bounce rates and low mobile conversion on their existing Wix store.',
      solution: 'I implemented a custom Velo-powered filtering system and optimized the mobile checkout flow for speed and simplicity.',
      results: '35% increase in mobile conversions and a 20% reduction in bounce rate within the first 3 months.',
      image: 'https://picsum.photos/seed/case1/800/600'
    }
  ],
  employmentHistory: [
    {
      id: 'eh1',
      role: 'Senior Wix & Velo Developer',
      company: 'Freelance / Upwork',
      period: '2021 - Present',
      description: 'Developed over 50+ custom Wix websites for global clients, specializing in complex Velo integrations and SEO optimization.'
    }
  ]
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

  const isAdmin = user?.email === 'isaacmason928@gmail.com';

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
        setContent({ ...DEFAULT_CONTENT, ...data } as AppContent);
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-100 py-8 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <div className="content-container flex justify-between items-center">
          <button 
            onClick={() => navigateTo('home')}
            className="text-2xl font-extrabold tracking-tighter"
          >
            WEBSITE<span className="text-brand">.</span>EXPERT
          </button>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-12 text-sm font-medium uppercase tracking-widest text-gray-500">
            <button onClick={() => navigateTo('home')} className={`hover:text-black transition-colors ${currentView === 'home' ? 'text-black' : ''}`}>Home</button>
            <button onClick={() => navigateTo('portfolio')} className={`hover:text-black transition-colors ${currentView === 'portfolio' ? 'text-black' : ''}`}>Portfolio</button>
            <button onClick={() => navigateTo('case-studies')} className={`hover:text-black transition-colors ${currentView === 'case-studies' ? 'text-black' : ''}`}>Case Studies</button>
            <button onClick={() => navigateTo('experience')} className={`hover:text-black transition-colors ${currentView === 'experience' ? 'text-black' : ''}`}>Experience</button>
            <button onClick={() => navigateTo('services')} className={`hover:text-black transition-colors ${currentView === 'services' ? 'text-black' : ''}`}>Services</button>
            <button onClick={() => navigateTo('about')} className={`hover:text-black transition-colors ${currentView === 'about' ? 'text-black' : ''}`}>About</button>
            <button onClick={() => navigateTo('policies')} className={`hover:text-black transition-colors ${currentView === 'policies' ? 'text-black' : ''}`}>Policies</button>
            <button onClick={() => navigateTo('contact')} className={`hover:text-black transition-colors ${currentView === 'contact' ? 'text-black' : ''}`}>Contact</button>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`p-2 rounded-full transition-colors ${isEditMode ? 'bg-brand text-black' : 'hover:bg-gray-100 text-gray-400'}`}
                  title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Admin Login"
              >
                <LogIn size={18} className="text-gray-400" />
              </button>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
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
              className="absolute top-full left-0 w-full bg-white border-b border-gray-100 md:hidden overflow-hidden"
            >
              <div className="flex flex-col p-8 space-y-6 text-lg font-bold uppercase tracking-widest">
                <button onClick={() => navigateTo('home')} className={currentView === 'home' ? 'text-brand' : 'text-gray-400'}>Home</button>
                <button onClick={() => navigateTo('portfolio')} className={currentView === 'portfolio' ? 'text-brand' : 'text-gray-400'}>Portfolio</button>
                <button onClick={() => navigateTo('case-studies')} className={currentView === 'case-studies' ? 'text-brand' : 'text-gray-400'}>Case Studies</button>
                <button onClick={() => navigateTo('experience')} className={currentView === 'experience' ? 'text-brand' : 'text-gray-400'}>Experience</button>
                <button onClick={() => navigateTo('services')} className={currentView === 'services' ? 'text-brand' : 'text-gray-400'}>Services</button>
                <button onClick={() => navigateTo('about')} className={currentView === 'about' ? 'text-brand' : 'text-gray-400'}>About</button>
                <button onClick={() => navigateTo('policies')} className={currentView === 'policies' ? 'text-brand' : 'text-gray-400'}>Policies</button>
                <button onClick={() => navigateTo('contact')} className={currentView === 'contact' ? 'text-brand' : 'text-gray-400'}>Contact</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow">
        {currentView === 'home' && (
          <>
            {/* Hero Section */}
            <section className="py-24 md:py-40">
              <div className="content-container">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  contentEditable={isEditMode}
                  onBlur={(e) => updateContent('heroTitle', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                  className="text-5xl md:text-8xl font-bold leading-[0.9] tracking-tight mb-8"
                >
                  {content.heroTitle}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  contentEditable={isEditMode}
                  onBlur={(e) => updateContent('heroSub', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                  className="text-xl md:text-2xl text-gray-500 max-w-3xl font-light leading-relaxed"
                >
                  {content.heroSub}
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-12"
                >
                  <button 
                    onClick={() => setCurrentView('portfolio')}
                    className="bg-brand text-black px-12 py-6 text-xl font-bold hover:scale-105 transition-transform"
                  >
                    View Portfolio
                  </button>
                </motion.div>
              </div>
            </section>
          </>
        )}

        {currentView === 'portfolio' && (
          <section id="work" className="py-24 bg-gray-50 min-h-[70vh]">
            <div className="content-container">
              <div className="flex justify-between items-end mb-16">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Selected Work</h2>
                  <h3 className="text-4xl font-bold">Wix Masterpieces</h3>
                </div>
                <div className="hidden md:block h-[1px] flex-grow mx-12 bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {content.portfolio.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-gray-200 mb-6 relative">
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
                        {item.link && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-brand text-black p-3 rounded-full">
                              <ExternalLink size={20} />
                            </div>
                          </div>
                        )}
                      </a>
                      {isEditMode && (
                        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
                          <div className="flex space-x-2">
                            <label className="bg-white p-2 rounded shadow-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center" title="Upload Image">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, (base64) => updatePortfolioItem(item.id, 'image', base64))}
                                className="hidden"
                              />
                              <Edit3 size={14} className="text-gray-600" />
                            </label>
                            <label className="bg-brand p-2 rounded shadow-lg cursor-pointer hover:bg-brand/90 transition-colors flex items-center justify-center" title="Upload HTML Design">
                              <input 
                                type="file" 
                                accept=".html"
                                onChange={(e) => handleHtmlUpload(e, item.id)}
                                className="hidden"
                              />
                              <FileCode size={14} className="text-black" />
                            </label>
                            <button 
                              onClick={() => removePortfolioItem(item.id)}
                              className="bg-red-500 text-white p-2 rounded shadow-lg hover:bg-red-600 transition-colors"
                              title="Remove Project"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="bg-white p-2 rounded shadow-lg">
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Image URL</p>
                            <input 
                              type="text"
                              value={item.image}
                              onChange={(e) => updatePortfolioItem(item.id, 'image', e.target.value)}
                              className="text-[10px] p-1 border border-gray-200 rounded w-32 outline-none focus:border-brand"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <h4 
                          contentEditable={isEditMode}
                          onBlur={(e) => updatePortfolioItem(item.id, 'title', e.currentTarget.innerText)}
                          suppressContentEditableWarning
                          className="text-xl font-bold mb-1"
                        >
                          {item.title}
                        </h4>
                        <p 
                          contentEditable={isEditMode}
                          onBlur={(e) => updatePortfolioItem(item.id, 'category', e.currentTarget.innerText)}
                          suppressContentEditableWarning
                          className="text-sm text-gray-400 uppercase tracking-widest"
                        >
                          {item.category}
                        </p>
                        {item.htmlContent && (
                          <button 
                            onClick={() => setPreviewHtml(item.htmlContent || null)}
                            className="mt-4 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-brand hover:text-black transition-colors"
                          >
                            <Eye size={14} />
                            <span>View Design</span>
                          </button>
                        )}
                      </div>
                      {isEditMode && (
                        <div className="ml-4 flex flex-col items-end">
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Live Link</p>
                          <input 
                            type="text"
                            value={item.link || ''}
                            onChange={(e) => updatePortfolioItem(item.id, 'link', e.target.value)}
                            className="text-xs p-1 border border-gray-200 rounded w-32 outline-none focus:border-brand"
                            placeholder="https://..."
                          />
                        </div>
                      )}
                    </div>
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
          <section id="about" className="py-24 bg-white min-h-[70vh]">
            <div className="content-container">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <div className="aspect-[3/4] bg-gray-100 overflow-hidden rounded-2xl relative">
                    <img 
                      src={content.aboutImage} 
                      alt="Bukola I." 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isEditMode && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-2xl">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Profile Photo</p>
                        <div className="flex flex-col space-y-4">
                          <label className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-brand hover:bg-brand/5 transition-all">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, (base64) => updateContent('aboutImage', base64))}
                              className="hidden"
                            />
                            <div className="flex flex-col items-center">
                              <Edit3 size={20} className="text-gray-400 mb-1" />
                              <span className="text-xs font-bold text-gray-400">Upload File</span>
                            </div>
                          </label>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">Or Paste Image URL</span>
                            <input 
                              type="text"
                              value={content.aboutImage}
                              onChange={(e) => updateContent('aboutImage', e.target.value)}
                              className="text-xs p-2 border border-gray-200 rounded outline-none focus:border-brand"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand rounded-full flex items-center justify-center font-bold text-center p-4 leading-tight transform rotate-12">
                    100% Success Score
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">About Me</h2>
                  <h3 className="text-4xl md:text-5xl font-bold mb-8">Bukola I. <span className="text-brand">Expert Wix & Velo Developer</span></h3>
                  <p 
                    contentEditable={isEditMode}
                    onBlur={(e) => updateContent('aboutText', e.currentTarget.innerText)}
                    suppressContentEditableWarning
                    className="text-lg text-gray-600 leading-relaxed mb-8"
                  >
                    {content.aboutText}
                  </p>
                  <div className="flex space-x-8">
                    <div>
                      <p className="text-3xl font-bold">2+</p>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Years Exp.</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">Lagos</p>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Nigeria</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">Elite</p>
                      <p className="text-xs uppercase tracking-widest text-gray-400">Professional</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {currentView === 'case-studies' && (
          <section id="case-studies" className="py-24 min-h-[70vh]">
            <div className="content-container">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Success Stories</h2>
              <h1 className="text-5xl md:text-7xl font-bold mb-16">Case <span className="text-brand">Studies</span></h1>
              
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
                    <div className={`aspect-video bg-gray-100 rounded-3xl overflow-hidden relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <img 
                        src={cs.image} 
                        alt={cs.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isEditMode && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white p-4 rounded-xl shadow-2xl w-64">
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Image URL</p>
                            <input 
                              type="text"
                              value={cs.image}
                              onChange={(e) => updateCaseStudy(cs.id, 'image', e.target.value)}
                              className="text-xs p-2 border border-gray-200 rounded w-full outline-none focus:border-brand"
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
                        className="text-3xl font-bold mb-2"
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
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">The Challenge</h4>
                          <p 
                            contentEditable={isEditMode}
                            onBlur={(e) => updateCaseStudy(cs.id, 'challenge', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-gray-600 leading-relaxed"
                          >
                            {cs.challenge}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">The Solution</h4>
                          <p 
                            contentEditable={isEditMode}
                            onBlur={(e) => updateCaseStudy(cs.id, 'solution', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-gray-600 leading-relaxed"
                          >
                            {cs.solution}
                          </p>
                        </div>
                        <div className="p-6 bg-brand/5 border-l-4 border-brand rounded-r-xl">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">The Results</h4>
                          <p 
                            contentEditable={isEditMode}
                            onBlur={(e) => updateCaseStudy(cs.id, 'results', e.currentTarget.innerText)}
                            suppressContentEditableWarning
                            className="text-lg font-bold text-black"
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
                    className="w-full py-12 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:border-brand hover:text-brand transition-all flex flex-col items-center justify-center"
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
          <section id="experience" className="py-24 min-h-[70vh] bg-gray-50">
            <div className="content-container">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">My Journey</h2>
              <h1 className="text-5xl md:text-7xl font-bold mb-16">Employment <span className="text-brand">History</span></h1>
              
              <div className="max-w-4xl space-y-12">
                {(content.employmentHistory || []).map((job) => (
                  <div key={job.id} className="relative pl-12 border-l-2 border-gray-200 group">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand border-4 border-white shadow-sm"></div>
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
                          className="text-2xl font-bold"
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
                        className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2 md:mt-0"
                      >
                        {job.period}
                      </p>
                    </div>
                    <p 
                      contentEditable={isEditMode}
                      onBlur={(e) => updateEmployment(job.id, 'description', e.currentTarget.innerText)}
                      suppressContentEditableWarning
                      className="text-gray-600 leading-relaxed"
                    >
                      {job.description}
                    </p>
                  </div>
                ))}
                
                {isEditMode && (
                  <button 
                    onClick={addEmployment}
                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-brand hover:text-brand transition-all flex flex-col items-center justify-center"
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
          <section id="services" className="py-24 min-h-[70vh]">
            <div className="content-container">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">What I Do</h2>
              <h1 className="text-5xl md:text-7xl font-bold mb-16">My <span className="text-brand">Services</span></h1>
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
                    <div className="w-16 h-16 bg-brand flex items-center justify-center mb-8 relative">
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
                      className="text-2xl font-bold mb-4"
                    >
                      {service.title}
                    </h3>
                    <p 
                      contentEditable={isEditMode}
                      onBlur={(e) => updateServiceItem(service.id, 'description', e.currentTarget.innerText)}
                      suppressContentEditableWarning
                      className="text-gray-500 leading-relaxed"
                    >
                      {service.description}
                    </p>
                  </div>
                ))}
                {isEditMode && (
                  <button 
                    onClick={addServiceItem}
                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-brand hover:text-brand transition-all"
                  >
                    <Plus size={48} className="mb-4" />
                    <span className="font-bold uppercase tracking-widest text-sm">Add Service</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {currentView === 'policies' && (
          <section className="py-24 md:py-40 min-h-[70vh]">
            <div className="content-container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Service Standards</h2>
                <h1 className="text-5xl md:text-7xl font-bold mb-16">My <span className="text-brand">Policies</span></h1>
                
                <div className="grid grid-cols-1 gap-12 max-w-4xl">
                  {content.policies.map((policy, index) => (
                    <motion.div 
                      key={policy.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-l-4 border-brand pl-8 py-4"
                    >
                      <h3 
                        contentEditable={isEditMode}
                        onBlur={(e) => updatePolicyItem(policy.id, 'title', e.currentTarget.innerText)}
                        suppressContentEditableWarning
                        className="text-2xl font-bold mb-4"
                      >
                        {policy.title}
                      </h3>
                      <p 
                        contentEditable={isEditMode}
                        onBlur={(e) => updatePolicyItem(policy.id, 'content', e.currentTarget.innerText)}
                        suppressContentEditableWarning
                        className="text-lg text-gray-500 leading-relaxed"
                      >
                        {policy.content}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-24 p-12 bg-gray-50 rounded-3xl">
                  <h3 className="text-3xl font-bold mb-6">My Service Standards Summary:</h3>
                  <ul className="space-y-4 text-lg text-gray-600">
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
                    className="inline-flex items-center space-x-4 bg-brand text-black px-12 py-6 text-xl font-bold hover:scale-105 transition-transform w-fit"
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
      <footer className="py-20 border-t border-gray-100">
        <div className="content-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-extrabold tracking-tighter mb-6">
                WEBSITE<span className="text-brand">.</span>EXPERT
              </div>
              <p className="text-gray-400 max-w-sm">
                Building high-performance digital experiences that drive growth and engagement.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-gray-400">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <Mail size={16} className="text-brand" />
                  <span 
                    contentEditable={isEditMode}
                    onBlur={(e) => updateContent('footerEmail', e.currentTarget.innerText)}
                    suppressContentEditableWarning
                  >
                    {content.footerEmail}
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone size={16} className="text-brand" />
                  <span 
                    contentEditable={isEditMode}
                    onBlur={(e) => updateContent('footerPhone', e.currentTarget.innerText)}
                    suppressContentEditableWarning
                  >
                    {content.footerPhone}
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <MapPin size={16} className="text-brand" />
                  <span 
                    contentEditable={isEditMode}
                    onBlur={(e) => updateContent('footerAddress', e.currentTarget.innerText)}
                    suppressContentEditableWarning
                  >
                    {content.footerAddress}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-gray-400">Navigation</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><button onClick={() => navigateTo('home')} className="hover:text-brand transition-colors">Home</button></li>
                <li><button onClick={() => navigateTo('portfolio')} className="hover:text-brand transition-colors">Portfolio</button></li>
                <li><button onClick={() => navigateTo('services')} className="hover:text-brand transition-colors">Services</button></li>
                <li><button onClick={() => navigateTo('about')} className="hover:text-brand transition-colors">About</button></li>
                <li><button onClick={() => navigateTo('policies')} className="hover:text-brand transition-colors">Policies</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-brand transition-colors">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 uppercase tracking-widest font-medium">
            <p>&copy; 2026 Website Expert. All rights reserved.</p>
            <div className="flex space-x-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-black">Privacy Policy</a>
              <a href="#" className="hover:text-black">Terms of Service</a>
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
              className={`flex items-center space-x-2 bg-brand text-black px-8 py-4 rounded-full font-bold shadow-2xl transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button 
              onClick={() => setIsEditMode(false)}
              className="flex items-center justify-center bg-white text-black w-14 h-14 rounded-full shadow-2xl hover:bg-gray-100 transition-colors"
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
              className="bg-white p-8 md:p-12 max-w-md w-full rounded-2xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Admin Access</h2>
                <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="text-center">
                <div className="flex border-b border-gray-100 mb-8">
                  <button 
                    onClick={() => setLoginMethod('google')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${loginMethod === 'google' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
                  >
                    Google
                  </button>
                  <button 
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors ${loginMethod === 'email' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
                  >
                    Email
                  </button>
                </div>

                {loginMethod === 'google' ? (
                  <>
                    <p className="text-gray-500 mb-8">Login with your Google account to enable live editing mode. Only authorized admins can save changes.</p>
                    <button 
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className={`w-full flex items-center justify-center space-x-3 bg-black text-white py-4 rounded-xl font-bold transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                    >
                      {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
                      <span>{isLoggingIn ? 'Logging in...' : 'Login with Google'}</span>
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleEmailLogin} className="text-left">
                    <div className="mb-4">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-brand outline-none transition-colors"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div className="mb-8">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Password</label>
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-brand outline-none transition-colors"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoggingIn}
                      className={`w-full flex items-center justify-center space-x-3 bg-black text-white py-4 rounded-xl font-bold transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'}`}
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
              className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-4 text-xs font-bold uppercase tracking-widest text-gray-400">Design Preview</span>
                </div>
                <button 
                  onClick={() => setPreviewHtml(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow bg-gray-50">
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          >
            <div className="flex flex-col items-center">
              <Loader2 size={48} className="text-brand animate-spin mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Syncing with Cloud...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
