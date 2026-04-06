import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Edit3, X, ExternalLink, Code, Search, Layout, Mail, Phone, MapPin, Menu, Zap, Database, ShoppingBag, Plus, Trash2, LogIn, LogOut, Loader2 } from 'lucide-react';
import { db, auth, signIn, logout, OperationType, handleFirestoreError } from './firebase';
import { doc, onSnapshot, setDoc, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- Types ---
interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  link?: string;
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
  ]
};

export default function App() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<AppContent>(DEFAULT_CONTENT);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'portfolio' | 'services' | 'about' | 'policies' | 'contact'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      if (snapshot.exists()) {
        setContent(snapshot.data() as AppContent);
      } else {
        // If no data exists yet, use default
        setContent(DEFAULT_CONTENT);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/content');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    try {
      await signIn();
      setShowLoginModal(false);
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please try again.");
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
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'settings', 'content'), content);
      setIsEditMode(false);
      alert('Changes saved successfully to the cloud!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/content');
      alert('Failed to save changes. Check console for details.');
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
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
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
                          <label className="bg-white p-2 rounded shadow-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, (base64) => updatePortfolioItem(item.id, 'image', base64))}
                              className="hidden"
                            />
                            <Edit3 size={14} className="text-gray-600" />
                          </label>
                          <button 
                            onClick={() => removePortfolioItem(item.id)}
                            className="bg-red-500 text-white p-2 rounded shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
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
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Upload Profile Photo</p>
                        <label className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-brand hover:bg-brand/5 transition-all">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, (base64) => updateContent('aboutImage', base64))}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center">
                            <Edit3 size={20} className="text-gray-400 mb-1" />
                            <span className="text-xs font-bold text-gray-400">Choose File</span>
                          </div>
                        </label>
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
              className="flex items-center space-x-2 bg-brand text-black px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform"
            >
              <Save size={20} />
              <span>Save Changes</span>
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
                <p className="text-gray-500 mb-8">Login with your Google account to enable live editing mode. Only authorized admins can save changes.</p>
                <button 
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center space-x-3 bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                  <LogIn size={20} />
                  <span>Login with Google</span>
                </button>
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
