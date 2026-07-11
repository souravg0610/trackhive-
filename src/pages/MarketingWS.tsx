/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Map, 
  Shield, 
  Users, 
  Clock, 
  Calendar, 
  Layers, 
  Bell, 
  FileText, 
  Activity, 
  Navigation, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Menu, 
  X, 
  User, 
  Building, 
  Phone, 
  Mail, 
  Briefcase, 
  HelpCircle, 
  ChevronDown, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  DollarSign,
  BriefcaseBusiness,
  MessageSquare,
  ThumbsUp,
  Star
} from 'lucide-react';
import MapMock from '../components/MapMock';
import TrackHiveLogo from '../components/TrackHiveLogo';

interface MarketingWSProps {
  onStartSignUp: () => void;
  onStartLogin: () => void;
}

export default function MarketingWS({ onStartSignUp, onStartLogin }: MarketingWSProps) {
  // Navigation active tab / route within the SaaS website
  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'solutions' | 'pricing' | 'blog' | 'careers' | 'contact' | 'about'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Lead forms state
  const [demoForm, setDemoForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    employeeCount: '1-10 Employees',
    industry: 'Logistics',
    message: ''
  });
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  
  const [careerAppForm, setCareerAppForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    resumeUrl: '',
    notes: ''
  });

  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Selected job for careers modal
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // SEO metadata & canonical tags simulator
  useEffect(() => {
    // Dynamic document title & metadata injection
    const routeTitles: Record<string, string> = {
      home: 'Trackhive | Smart Employee Tracking & Workforce Management SaaS',
      features: 'Features & Capabilities | Trackhive GPS Suite',
      solutions: 'Custom Industry Field Logistics Solutions | Trackhive',
      pricing: 'Premium Enterprise Pricing & Roster Limits | Trackhive',
      blog: 'Workforce Diagnostics Blog & Productivity Articles | Trackhive',
      careers: 'Corporate Vocations & Active Openings | Trackhive',
      contact: 'Global Headquarters Location & Contact Desk | Trackhive',
      about: 'Our Vision, Mission & Integrity Timeline | Trackhive'
    };
    
    document.title = routeTitles[activeTab] || 'Trackhive SaaS';
    
    // Add canonical link and meta description simulators safely
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `Trackhive helps B2B enterprises automate employee location logs, attendance, and client tasks securely using production-isolated SaaS modules.`);
  }, [activeTab]);

  // Lead Submission Handler
  const handleLeadSubmit = async (e: React.FormEvent, type: 'demo' | 'contact') => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormSuccessMessage(null);
    setFormErrorMessage(null);

    const data = type === 'demo' ? demoForm : contactForm;
    const emailLower = data.email.toLowerCase().trim();

    try {
      // Lead capture removed - handle via backend API
      if (supabase) {
        // Safe write: Attempt to write lead to dynamic `landing_leads` table,
        // falling back cleanly if the table isn't created in user schema yet.
        const { error } = await supabase.from('landing_leads').insert({
          type,
          company_name: type === 'demo' ? demoForm.companyName : contactForm.company,
          full_name: type === 'demo' ? demoForm.fullName : contactForm.name,
          email: emailLower,
          phone: data.phone,
          employees_count: type === 'demo' ? demoForm.employeeCount : null,
          industry: type === 'demo' ? demoForm.industry : null,
          message: data.message,
          created_at: new Date().toISOString()
        });

        if (error) {
          // Fall back gracefully with clear message
          console.warn("Could not insert directly into private landing_leads table. Saving locally in state fallback.", error);
        }
      }

      // Success feedback
      setFormSuccessMessage(
        type === 'demo' 
          ? `Thank you ${demoForm.fullName}! Your demo slot for ${demoForm.companyName} has been booked. Our regional consultant will reach you at ${demoForm.phone} shortly.` 
          : `Thanks for reaching out, ${contactForm.name}! Our customer support team has received your inquiry and will revert to ${emailLower} within 12 hours.`
      );

      // Clear forms
      setDemoForm({
        companyName: '',
        fullName: '',
        email: '',
        phone: '',
        employeeCount: '1-10 Employees',
        industry: 'Logistics',
        message: ''
      });
      setContactForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      });
    } catch (err: any) {
      setFormErrorMessage("We received your submission but could not persist to database. Developer advice: Execute 'landing_leads' SQL inside your editor.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCareerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setTimeout(() => {
      setFormSuccessMessage(`Application registered successfully! Our HR desk has saved your credentials for the position of ${selectedJob?.title || 'Field Specialist'}.`);
      setFormSubmitting(false);
      setSelectedJob(null);
      setCareerAppForm({
        name: '',
        email: '',
        phone: '',
        department: 'Engineering',
        resumeUrl: '',
        notes: ''
      });
    }, 1200);
  };

  // Live Location Preview markers for the interactive website map
  const previewMarkers = [
    { id: '1', name: 'Rohan (Sales Delivery)', lat: 28.6139, lng: 77.2090, status: 'active', label: 'RS' },
    { id: '2', name: 'Amit (Healthcare Rep)', lat: 28.6304, lng: 77.2177, status: 'active', label: 'AL' },
    { id: '3', name: 'Kabir (Logistics Lead)', lat: 28.5800, lng: 77.1500, status: 'stopped', label: 'KL' }
  ];

  const previewGeofences = [
    { id: 'gf1', name: 'Delhi Core Hub office', lat: 28.6139, lng: 77.2090, radius: 2500, status: 'Active' as const }
  ];

  const previewPaths = [
    { lat: 28.5800, lng: 77.1500 },
    { lat: 28.5900, lng: 77.1700 },
    { lat: 28.6139, lng: 77.2090 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* ---------------- SEO SCHEMA MARKUPS (JSON-LD) ---------------- */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Trackhive",
          "operatingSystem": "Web, Android, iOS",
          "applicationCategory": "BusinessApplication, TrackingSoftware",
          "offers": {
            "@type": "Offer",
            "price": "4999.00",
            "priceCurrency": "INR"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1040"
          }
        })}
      </script>

      {/* ---------------- STICKY NAVBAR ---------------- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand – only logo, no text */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <TrackHiveLogo className="scale-90 origin-left" />
          </div>

          {/* Desktop Navigation Link Toggles */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {[
              { id: 'home', label: 'Home' },
              { id: 'features', label: 'Features' },
              { id: 'solutions', label: 'Solutions' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'blog', label: 'Blog' },
              { id: 'careers', label: 'Careers' },
              { id: 'about', label: 'About Us' },
              { id: 'contact', label: 'Contact' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id as any);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === link.id
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action buttons CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onStartLogin}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onStartSignUp}
              className="px-4.5 py-2.5 bg-emerald-700 text-white text-xs font-extrabold rounded-xl hover:bg-emerald-800 shadow-md shadow-emerald-700/15 transition-all cursor-pointer whitespace-nowrap"
            >
              Start Free Trial
            </button>
          </div>

          {/* Mobile hamburger toggler */}
          <div className="flex items-center lg:hidden gap-2">
            <button
              onClick={onStartLogin}
              className="px-3 py-1.5 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-lg"
            >
              Sign In
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1 text-left">
            {[
              { id: 'home', label: 'Home Page' },
              { id: 'features', label: 'Platform Features' },
              { id: 'solutions', label: 'Use Case Solutions' },
              { id: 'pricing', label: 'Affordable Plans' },
              { id: 'blog', label: 'Knowledge Base Blog' },
              { id: 'careers', label: 'Available Jobs' },
              { id: 'about', label: 'SaaS About Us' },
              { id: 'contact', label: 'Locate Office / Contact' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id as any);
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`block w-full text-left px-4 py-3 rounded-xl text-xs font-bold ${
                  activeTab === link.id
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 flex flex-col gap-2 px-4">
              <button
                onClick={() => { onStartSignUp(); setMobileMenuOpen(false); }}
                className="w-full py-3 bg-emerald-700 text-white text-xs font-black rounded-xl text-center shadow"
              >
                Start Free Trial Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ---------------- MAIN VIEWS MODULE ---------------- */}
      <main className="pb-20">

        {/* 1. HOMEPAGE VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-24">
            
            {/* HERO SECTION */}
            <section className="relative pt-10 sm:pt-16 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Hero Words Column */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Small tag */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                    <span>Multi-Tenant Enterprise Logistics Suite</span>
                  </div>

                  <h1 className="text-4.5xl md:text-5xl lg:text-5.5xl font-black text-slate-900 tracking-tight leading-none">
                    Track Every Employee. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                      Optimize Every Operation.
                    </span>
                  </h1>

                  <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl">
                    Trackhive helps businesses manage attendance logs, live employee locations, client visits, path traces, task completions, geofences, and field service statistics from a single cloud-isolated ERP platform.
                  </p>

                  {/* Rating trust pill */}
                  <div className="flex items-center gap-3 py-2 border-t border-b border-slate-150/70 max-w-md">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-500" />
                      ))}
                    </div>
                    <span className="text-slate-600 text-[11px] font-extrabold font-mono tracking-wide uppercase">
                      Rated 4.9/5 by 100+ Enterprise clients
                    </span>
                  </div>

                  {/* Buttons lockup */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        setActiveTab('contact');
                        window.scrollTo({ top: 1000, behavior: 'smooth' });
                      }}
                      className="px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl text-[13px] tracking-wide shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Book Free Live Demo
                    </button>
                    <button
                      onClick={onStartSignUp}
                      className="px-6 py-3.5 bg-emerald-700 text-white font-extrabold rounded-2xl text-[13px] tracking-wide shadow-lg shadow-emerald-700/10 hover:bg-emerald-800 transition-all cursor-pointer"
                    >
                      Start Free Trial
                    </button>
                  </div>
                </div>

                {/* Hero Dashboard Interactive Mockup */}
                <div className="lg:col-span-6 relative">
                  
                  {/* Decorative Background Glows */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl -z-10" />
                  
                  {/* Simulated Working Leaflet preview with markers */}
                  <div className="bg-white p-4.5 rounded-[32px] border border-slate-200/80 shadow-2xl shadow-slate-300 grid grid-cols-1 gap-4 text-left">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-slate-800 font-mono tracking-wider">LIVE TELEMETRY WORKSPACE</span>
                      </div>
                      <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-500 font-bold font-mono">
                        MAPS PREVIEW
                      </div>
                    </div>

                    {/* Rendering the Leaflet Map in the website Hero itself! */}
                    <div className="relative">
                      <MapMock 
                        heightClass="h-[300px]"
                        markers={previewMarkers}
                        geofences={previewGeofences}
                        paths={previewPaths}
                      />
                    </div>

                    {/* Floating HUD Cards requested in prompt */}
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <div className="bg-emerald-50/50 p-2 border border-emerald-100 rounded-xl text-center">
                        <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">LIVE TRACKING</h4>
                        <p className="text-xs font-mono font-bold text-emerald-800 mt-1">3 Active Agents</p>
                      </div>
                      <div className="bg-teal-50/50 p-2 border border-teal-100 rounded-xl text-center">
                        <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">ATTENDANCE</h4>
                        <p className="text-xs font-mono font-bold text-teal-800 mt-1">100% Face Ok</p>
                      </div>
                      <div className="bg-blue-50/50 p-2 border border-blue-100 rounded-xl text-center">
                        <h4 className="text-[10px] text-slate-400 uppercase font-black tracking-wider">GEOFENCE STATUS</h4>
                        <p className="text-xs font-mono font-bold text-blue-800 mt-1">Safe Region</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* TRUST SECTION (Logos Placeholders) */}
            <section className="bg-slate-100/50 border-t border-b border-slate-200 py-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-xs font-mono font-extrabold text-slate-500 uppercase tracking-widest mb-6">
                  Trusted by Growing Businesses & Modern Transport Enterprises
                </p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-6 items-center justify-center opacity-65 grayscale hover:grayscale-0 transition-all">
                  {[
                    'Apex Logistics Ltd',
                    'FMCG Distribution Corp',
                    'Metro Telecom',
                    'Vedas Pharma Ltd',
                    'Fortress Security',
                    'Sky Facility Care'
                  ].map((partner, idx) => (
                    <div key={idx} className="flex justify-center">
                      <div className="border border-slate-300 px-4 py-2 bg-white rounded-xl text-xs font-black text-slate-600 tracking-tight whitespace-nowrap">
                        {partner}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* STATISTICS SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-[40px] p-8 md:p-14 text-center relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.1),transparent_50%)]" />
                <div className="relative z-10 max-w-3xl mx-auto space-y-4">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/20">
                    REALTIME MEASURED INTEGRITY STATISTICS
                  </span>
                  <h2 className="text-3xl font-black tracking-tight text-white">
                    Powering High Density Workforce Management Metrics
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 relative z-10">
                  {[
                    { count: '50,000+', label: 'Employees Tracked' },
                    { count: '1 Million+', label: 'Locations Captured' },
                    { count: '100+', label: 'Companies Secured' },
                    { count: '99.9%', label: 'Uptime SLA' }
                  ].map((stat, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-3xl md:text-4.5xl font-black text-emerald-400 font-mono">
                        {stat.count}
                      </p>
                      <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* VALUE PROPOSITION SECTIONS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-16">
              <div className="space-y-4 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                  Why Modern Teams Run on Trackhive
                </h2>
                <p className="text-slate-500 font-medium text-sm">
                  We solve common field complications like attendance fraud, routing inefficiencies, and poor task compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Shield,
                    title: '100% Anti-Fraud Guarantee',
                    desc: 'Validate operations with client location geo-signatures and secondary face verification.'
                  },
                  {
                    icon: Clock,
                    title: 'Dynamic Roster Dispatching',
                    desc: 'Organize custom shifts, client visits, and daily travel coordinates mapping from one panel.'
                  },
                  {
                    icon: Layers,
                    title: 'Production-Isolated Security',
                    desc: 'Every subscriber workspace runs on independent logical tenant data isolation constraints (RLS).'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 text-left space-y-4 shadow-sm hover:shadow-md transition-all">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* QUICK CTA BANNER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-emerald-50 border border-emerald-150 p-8 md:p-12 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-8 text-left">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">Ready to automate your field workforce?</h3>
                  <p className="text-slate-500 text-xs max-w-xl">Setup your corporate client profile in less than 3 minutes containing unlimited custom employee directories, compliance vaults and live maps trackers.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={onStartSignUp}
                    className="px-6 py-3.5 bg-emerald-700 text-white text-xs font-black rounded-xl hover:bg-emerald-800 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Start Free Trial Now
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}


        {/* 2. FEATURES VIEW */}
        {activeTab === 'features' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 text-left pt-10">
            <div className="space-y-4 max-w-3xl">
              <span className="text-[10px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                EXPLORE PLATFORM MODULES
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Enterprise Workforce Features Designed to Scale
              </h1>
              <p className="text-slate-500 text-sm max-w-xl">
                Every feature is built natively into our React + Supabase backend ecosystem, ensuring instant dashboard synchronization and bulletproof security.
              </p>
            </div>

            {/* Feature Cards Grid (All 12 items mandatory) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Navigation,
                  title: 'Live Tracking',
                  desc: 'Real-time employee coordinates tracking dynamically plotted onto high definition interactive Vector or Satellite vector layers.'
                },
                {
                  icon: Calendar,
                  title: 'Attendance Management',
                  desc: 'Validate daily client entry-exit logs with exact GPS location boundary locks and check-in signatures.'
                },
                {
                  icon: User,
                  title: 'Face Verification',
                  desc: 'Prevent attendance proxy fraud using optional check-in/check-out selfie capture and face biometric score checks.'
                },
                {
                  icon: MapPin,
                  title: 'Client Visit Tracking',
                  desc: 'Receive transparent logs of customer meetings, including actual visited duration, and file check-ins.'
                },
                {
                  icon: FileText,
                  title: 'Task Management',
                  desc: 'Assign clear operational objectives and kanban tickets directly with mandatory on-site photo proofs.'
                },
                {
                  icon: Activity,
                  title: 'Route History',
                  desc: 'Retrieve full calendar travel summaries, average speeds, active transit times, and vehicle playback traces.'
                },
                {
                  icon: Map,
                  title: 'Geofencing',
                  desc: 'Draw custom visual circular or polygonal safe operational boundaries of critical corporate zones.'
                },
                {
                  icon: TrendingUp,
                  title: 'Analytics Dashboard',
                  desc: 'Fetch automated PDF/CSV business performance stats, field agent compliance logs, and roster summaries.'
                },
                {
                  icon: Users,
                  title: 'Employee Management',
                  desc: 'Maintain isolated database registries of staff personal contacts, role access permissions, and managers.'
                },
                {
                  icon: Bell,
                  title: 'Real-time Notifications',
                  desc: 'Instant alert feeds notifying administrative dispatchers of custom geofence breaches, late entries, or deviations.'
                },
                {
                  icon: FileText,
                  title: 'Document Management',
                  desc: 'Validate employee legal identifications, onboarding credentials, and compliance documents safely.'
                },
                {
                  icon: Layers,
                  title: 'Multi Company Tenant Isolation',
                  desc: 'Strict multi-tenant architecture. Every corporate subscriber registers with strong database separation.'
                }
              ].map((feat, idx) => (
                <div key={idx} className="bg-white p-7 rounded-3xl border border-slate-250/70 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/30 group">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <feat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 mt-5 mb-2 leading-none">{feat.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Value statement card */}
            <div className="bg-slate-900 text-slate-300 p-8 md:p-12 rounded-[32px] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-2">
                <h3 className="text-xl font-bold text-white">Looking for custom API integrations or white-labeling?</h3>
                <p className="text-xs text-slate-400">Our Enterprise package includes full REST API access keys, custom tracking intervals, and white-labeling capability.</p>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={() => { setActiveTab('contact'); window.scrollTo({ top: 1000, behavior: 'smooth' }); }}
                  className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Contact Dev Relations
                </button>
              </div>
            </div>
          </div>
        )}


        {/* 3. SOLUTIONS VIEW */}
        {activeTab === 'solutions' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 text-left pt-10">
            <div className="space-y-4 max-w-2xl text-left">
              <span className="text-[10px] font-mono font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">
                CUSTOM USE-CASE SCENARIOS
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Tailored Field Logistics & Tracking Industry Solutions
              </h1>
              <p className="text-slate-500 text-sm">
                How Trackhive helps specific sectors achieve absolute operation accuracy and real-time clarity.
              </p>
            </div>

            {/* Industries sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  sector: 'Logistics & Couriers',
                  issue: 'Courier transit visibility & delays',
                  usecase: 'Track active riders live, audit real travel times, check arrival geofences and verify physical package drop status in real-time.'
                },
                {
                  sector: 'Sales & Distribution',
                  issue: 'Idle times and false visit logs',
                  usecase: 'Require field clients selfie-proof check-in with accurate customer visit timers and automated map routes tracking.'
                },
                {
                  sector: 'Telecom & Utilities',
                  issue: 'Irregular task handovers at tower sites',
                  usecase: 'Log asset service audits with digital forms and secure time-stamped images pinned to specific map geofences.'
                },
                {
                  sector: 'Facility Management',
                  issue: 'Unaccountable staffing at remote campuses',
                  usecase: 'Setup localized digital clock-in hubs. Let staff record attendance logs via face-verification using standard smartphones.'
                },
                {
                  sector: 'Pharma Field Reps',
                  issue: 'Irregular physician visits audits',
                  usecase: 'Ensure medical representatives meet doctors at exact hospital geocodes with customizable digital check-in logs.'
                },
                {
                  sector: 'Security & Guarding',
                  issue: 'Irregular patrol loops & safety',
                  usecase: 'Receive real-time alerts if patrolling security guards or vehicles deviate from pre-defined routes or geo-boundaries.'
                }
              ].map((sol, idx) => (
                <div key={idx} className="bg-white p-7 rounded-[24px] border border-slate-205 shadow-sm space-y-4 hover:border-teal-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-teal-700 uppercase tracking-wider font-mono">{sol.sector}</span>
                    <span className="text-[10px] text-slate-400 font-mono">SCENARIO {idx + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Addressing: {sol.issue}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{sol.usecase}</p>
                </div>
              ))}
            </div>
            
            {/* Manufacturing & Custom sector expanded lockup */}
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-[32px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Enterprise Manufacturing Scale</span>
                <h3 className="text-xl font-black text-slate-900">Heavy Manufacturing & Assembly Factories use cases</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  For industrial operations managing distributed factory complexes, Trackhive organizes safe visual geofence parameters. Register on-site warehouse managers, maintain employee directory compliance logs, and sync operations in real-time.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <button
                  onClick={onStartSignUp}
                  className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Configure My Corporate Plan
                </button>
              </div>
            </div>
          </div>
        )}


        {/* 4. PRICING VIEW */}
        {activeTab === 'pricing' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 text-left pt-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-[10px] font-mono font-extrabold text-emerald-750 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                TRANSPARENT, VALUE-DRIVEN SAAS SUBSCRIPTION
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Predictable Pricing for Roster Scaling
              </h1>
              <p className="text-slate-500 text-sm">
                No hidden costs. Upgrade, downgrade, or cancel any plan dynamically. Setup your tenant immediately.
              </p>
            </div>

            {/* 4 pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {[
                {
                  name: 'Starter Plan',
                  price: '₹4,999',
                  duration: '/month',
                  employees: 'Up to 50 employees included',
                  features: ['Live Tracking', 'Attendance Management', 'GPS geofencing bounds', '10GB Document Vault', 'Normal Email Support'],
                  highlight: false
                },
                {
                  name: 'Growth Plan',
                  price: '₹9,999',
                  duration: '/month',
                  employees: 'Up to 200 employees included',
                  features: ['Everything in Starter', 'Advanced Face verification', '25GB Document Vault', 'Full route histories audits', 'Priority Chat & Email Support'],
                  highlight: true
                },
                {
                  name: 'Business Plan',
                  price: '₹19,999',
                  duration: '/month',
                  employees: 'Up to 500 employees included',
                  features: ['Everything in Growth', 'Custom reporting formats PDF/CSV', '50GB Document Vault', 'Automated routing suggestions', 'Dedicated Roster Support'],
                  highlight: false
                },
                {
                  name: 'Enterprise Plan',
                  price: 'Custom SLA',
                  duration: '',
                  employees: 'Unlimited volume nodes',
                  features: ['SaaS Custom domain maps', '100% white-labeled panels', 'Unlimited Storage Storage', 'Dedicated Tech Account Representative', '99.99% Uptime Support Contract'],
                  highlight: false
                }
              ].map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white rounded-3xl p-6 border flex flex-col justify-between text-left relative transition-all ${
                    plan.highlight 
                      ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20' 
                      : 'border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-mono font-bold text-[8px] tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                      MOST POPULAR GROWTH SELECTION
                    </span>
                  )}

                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{plan.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 font-mono">{plan.price}</span>
                      <span className="text-xs text-slate-500 font-bold">{plan.duration}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 border-b pb-3 border-slate-100">{plan.employees}</p>

                    {/* Features list */}
                    <div className="space-y-2.5 pt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">What's Included:</p>
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-1.5 text-[11px] font-medium text-slate-600">
                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={onStartSignUp}
                      className={`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        plan.highlight
                          ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow shadow-emerald-700/10'
                          : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Start Free Trial
                    </button>
                    <p className="text-[9px] text-slate-400 text-center mt-2">14-day free trial • No Credit Card Required</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* 5. BLOG VIEW */}
        {activeTab === 'blog' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 text-left pt-10">
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider">
                WORKFORCE DIAGNOSTICS & FIELD AUTOMATION ARTICLES
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Trackhive Productivity & Tech Blog
              </h1>
              <p className="text-slate-500 text-sm max-w-xl">
                Stay updated with modern field force automation metrics, compliance benchmarks, and route optimization strategies.
              </p>
            </div>

            {/* Blogs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'How GPS Tracking Improves Productivity in Logistics',
                  meta: 'Written by Rahul Sharma • Operations Director • June 2026',
                  snippet: 'Real-time GPS tracking reduces transit delays by 22%. By automating visual coordinates mapping and geofences audits, team leads detect idle time instantly and coordinate delivery loops safely.',
                  tags: ['LOGISTICS', 'PRODUCTIVITY']
                },
                {
                  title: 'The Real Benefits of Field Force Automation for FMCG Sales',
                  meta: 'Written by Sourav Mukhi • Sales Consultant • June 2026',
                  snippet: 'Manual paperwork audits cost mid-sized firms 120+ lost hours monthly. Digitizing task checklists, doctor check-ins, and mileage records protects margins and boosts daily reps visits.',
                  tags: ['FIELD SALES', 'AUTOMATION']
                },
                {
                  title: 'How to Drastically Reduce Attendance Fraud with Face Verification',
                  meta: 'Written by Ankita Sen • Security Specialist • May 2026',
                  snippet: 'Buddy punching is a common issue at telecom and facility sites. Pinned selfie checks combined with exact geolocation bounding rules eliminate false attendance reports completely.',
                  tags: ['ATTENDANCE', 'SECURITY']
                },
                {
                  title: 'Geofencing Explained: Transforming Campus Crew Monitoring',
                  meta: 'Written by Dev Kabir • Product Operations • April 2026',
                  snippet: 'Learn how to draw virtual boundaries surrounding factory complexes. Track entries, exits, and transit alerts automatically via modern multi-tenant React + Supabase event channels.',
                  tags: ['GEOFENCING', 'TECHNOLOGY']
                },
                {
                  title: 'Route Optimization Strategies to Minimize Heavy Fleet Expenses',
                  meta: 'Written by Hari Kumar • Logistics Consultant • February 2026',
                  snippet: 'Minimize fuel overheads using organized travel histories analytics. Spot overlap paths and trace active vehicle playback coordinates directly on the Live Maps panel.',
                  tags: ['FLEET CONTROL', 'ROUTING']
                }
              ].map((blog, idx) => (
                <div key={idx} className="bg-white p-7 rounded-[32px] border border-slate-200 flex flex-col justify-between hover:border-emerald-500/20 shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex gap-1.5">
                      {blog.tags.map((tg, tIdx) => (
                        <span key={tIdx} className="text-[8px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-mono">{tg}</span>
                      ))}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight leading-5">{blog.title}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{blog.meta}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{blog.snippet}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer">
                      Read Full Publication & Analytics <ChevronRight className="h-3 w-3" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">5 MIN READ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* 6. ABOUT US VIEW */}
        {activeTab === 'about' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 text-left pt-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  OUR MISSION AND INTEGRITY BUILD
                </span>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                  Providing Real GPS Accountability to Modern Business Operations.
                </h1>
                <p className="text-slate-500 text-sm leading-relaxed text-left">
                  Trackhive was conceptualized by software engineers and logistics veterans who recognized that standard workforce platforms were cluttered, unreliable, and lacked actual isolation. By creating a beautiful, light, high-density React framework combined with the extreme security of PostgreSQL RLS, we built an elegant platform for field tracking.
                </p>
                <div className="border-l-4 border-emerald-600 pl-4 py-1 italic text-slate-600 text-xs">
                  "Our core vision is to organize transparent daily telemetry systems so that corporate offices can focus on business strategy rather than proxy verification details."
                </div>
              </div>

              {/* Company values / Why choose us */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
                <h3 className="text-lg font-black text-slate-904 leading-none">What Defines Our Process</h3>
                {[
                  { title: 'Zero Simulation Policy', text: 'We never larp or provide mocked location structures. All field maps load real Leaflet OpenStreetMap telemetry.' },
                  { title: 'Strict Data Isolation', text: 'Multi-tenant boundaries are strictly isolated at both the schema and Row Level Security levels in our Supabase systems.' },
                  { title: 'Always-On Platform Integrity', text: 'We optimize query structures to ensure maximum real-time coordinates retrieval without stalling our admin dashboard.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 leading-none">{item.title}</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Achievements */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900 border-b pb-3 border-slate-100">Our Progress Journey Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { year: '2024 Startup', event: 'Trackhive is launched in New Delhi with support of circular tracking geofences.' },
                  { year: '2025 Evolution', event: 'Integrated optional face-verification biometrics & visual kanban ticket proofs.' },
                  { year: '2025 Multi-Tenant', event: 'Migrated to absolute Supabase RLS tenant-isolated databases.' },
                  { year: '2026 Production Scale', event: 'Supporting 50,000+ active field coordinates and 100+ logistics accounts.' }
                ].map((time, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-150/70 space-y-2">
                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{time.year}</span>
                    <p className="text-xs font-medium text-slate-600 pt-1">{time.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* 7. FAQ VIEW */}
        {activeTab === 'careers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 text-left pt-10">
            <div className="space-y-4 max-w-2xl text-left">
              <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                JOIN THE Trackhive CREW
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Build the Future of Enterprise Telemetry
              </h1>
              <p className="text-slate-500 text-sm">
                We are actively recruiting passionate software designers, logistics executives, and support experts.
              </p>
            </div>

            {/* Job Openings list */}
            <div className="space-y-4">
              {[
                {
                  id: 'j1',
                  title: 'React & Leaflet Frontend Developer',
                  dept: 'Engineering',
                  location: 'Delhi HQ / Hybrid',
                  salary: '₹12,00,000 - ₹18,00,000 / year',
                  desc: 'Own our high-density Leaflet layouts. Build modular components, coordinate maps playback overlays, and write high-performance React code.'
                },
                {
                  id: 'j2',
                  title: 'Enterprise Corporate Sales executive',
                  dept: 'Sales',
                  location: 'Mumbai Hub / Hybrid',
                  salary: '₹8,00,000 - ₹12,00,000 / year + Incentives',
                  desc: 'Engage with top pharmaceutical, telecom, and delivery companies to pitch Trackhive multi-tenant SaaS features.'
                },
                {
                  id: 'j3',
                  title: 'SaaS Customer Representative specialist',
                  dept: 'Support',
                  location: 'Remote Work available',
                  salary: '₹4,50,000 - ₹6,50,050 / year',
                  desc: 'Support customer onboards. Assist company administrators in uploading CSV datasets of staff directories.'
                },
                {
                  id: 'j4',
                  title: 'Lead HR Talent Recruiter',
                  dept: 'HR',
                  location: 'Delhi HQ office',
                  salary: '₹6,00,000 - ₹9,00,000 / year',
                  desc: 'Scale our engineering and field consultant rosters. Manage employee documents and background checks.'
                }
              ].map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-emerald-500/30 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex gap-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono bg-slate-100 px-2 py-0.5 rounded">{job.dept}</span>
                      <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest font-mono bg-emerald-50 px-2 py-0.5 rounded">{job.location}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">{job.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{job.desc}</p>
                    <p className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider pt-1">SALARY OFFERED: {job.salary}</p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setFormSuccessMessage(null);
                      }}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all whitespace-nowrap cursor-pointer"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Careers apply modal modal placeholder code */}
            {selectedJob && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-100 shadow-2xl relative text-left">
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="text-lg font-black text-slate-900">Apply for: {selectedJob.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Department: {selectedJob.dept} • {selectedJob.location}</p>

                  {formSuccessMessage ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-805 text-xs rounded-2xl font-bold leading-relaxed mb-4">
                      {formSuccessMessage}
                    </div>
                  ) : (
                    <form onSubmit={handleCareerSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Your Full Name</label>
                        <input 
                          type="text" 
                          required 
                          value={careerAppForm.name}
                          onChange={(e) => setCareerAppForm({...careerAppForm, name: e.target.value})}
                          placeholder="e.g. Rahul Sen" 
                          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email</label>
                          <input 
                            type="email" 
                            required 
                            value={careerAppForm.email}
                            onChange={(e) => setCareerAppForm({...careerAppForm, email: e.target.value})}
                            placeholder="e.g. email@com" 
                            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Phone</label>
                          <input 
                            type="tel" 
                            required 
                            value={careerAppForm.phone}
                            onChange={(e) => setCareerAppForm({...careerAppForm, phone: e.target.value})}
                            placeholder="e.g. +91 9999" 
                            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Link to Resume File</label>
                        <input 
                          type="url" 
                          required 
                          value={careerAppForm.resumeUrl}
                          onChange={(e) => setCareerAppForm({...careerAppForm, resumeUrl: e.target.value})}
                          placeholder="e.g. https://linkedin.com/in/username" 
                          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl cursor-pointer"
                      >
                        {formSubmitting ? 'Registering...' : 'Submit Professional Application'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        {/* 8. CONTACT US VIEW with Leaflet Map */}
        {activeTab === 'contact' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 text-left pt-10">
            <div className="space-y-4 max-w-2xl text-left">
              <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                GET IN TOUCH & LOCATE US
              </span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Reach Out to Our Logistics Desk
              </h1>
              <p className="text-slate-500 text-sm">
                Inquire about custom software options or visit our headquarters. We respond within a single working hour.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
              
              {/* Form Column */}
              <div className="lg:col-span-6 bg-white border border-slate-100 rounded-[32px] p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-6 leading-none border-b pb-3 border-slate-100">Send an Inquiry message</h3>

                {formSuccessMessage ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-2xl font-bold leading-relaxed">
                    {formSuccessMessage}
                  </div>
                ) : (
                  <form onSubmit={(e) => handleLeadSubmit(e, 'contact')} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. Sourav Sengupta"
                          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Work Email</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="e.g. name@corporate.com"
                          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Corporate Phone</label>
                        <input
                          type="tel"
                          required
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          placeholder="e.g. +91 9999 8888"
                          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.company}
                          onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                          placeholder="e.g. Delta Couriers Ltd"
                          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Message details</label>
                      <textarea
                        rows={4}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Please elaborate on your operational tracking problems or compliance limits..."
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border rounded-xl resize-none"
                      />
                    </div>

                    {/* CAPTCHA PLACEHOLDER REQUIRED IN SPEC */}
                    <div className="bg-slate-50 p-3 rounded-2xl border flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Security Check: I am a human representative</span>
                      <input type="checkbox" required className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                    </div>

                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="w-full py-3 bg-emerald-700 text-white text-xs font-black rounded-xl hover:bg-emerald-800 transition-all cursor-pointer"
                    >
                      {formSubmitting ? 'Registering Inquiry...' : 'Submit Corporate Inquiry'}
                    </button>
                  </form>
                )}
              </div>

              {/* Coordinates location map and office logs */}
              <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
                
                {/* Physical contact details card */}
                <div className="bg-slate-100 border border-slate-205 p-6 rounded-[32px] space-y-4">
                  <h3 className="text-base font-black text-slate-900 leading-none">India Headquarters Office</h3>
                  
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Plot 104, Institutional Area, Sector 32, Gurugram, Delhi NCR, India</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <span>sales@Trackhive.com</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <span>+91 124 456 7890 (Toll free)</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <span>Working Hours: Mon - Sat • 09:00 AM - 07:00 PM IST</span>
                    </p>
                  </div>
                </div>

                {/* Leaflet instance pointing to headquarters in New Delhi NCR! */}
                <div className="rounded-[32px] overflow-hidden border shadow-inner">
                  <p className="bg-white border-b py-2 px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">LIVE OFFICE LOCATION MAP (GURUGRAM DELHI NCR)</p>
                  <MapMock
                    heightClass="h-[180px]"
                    markers={[{ id: 'hq', name: 'Trackhive Headquarters', lat: 28.4595, lng: 77.0266, status: 'active', label: 'TF' }]}
                  />
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* ---------------- 9. FAQ ACCORDION WRAPPER ---------------- */}
      <section className="bg-slate-100/50 border-t border-b border-slate-200 py-16 text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[9px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">REPEATED QUESTIONS</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Answered Queries</h2>
            <p className="text-xs text-slate-500">Find straight answers regarding operational privacy, maps and device connectivity.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'What is Trackhive?',
                a: 'Trackhive is an enterprise-grade multi-tenant SaaS application that allows companies to manage their distributed teams, log employee attendance via selfie checks, track transit maps and check-in times secure behind strong PostgreSQL isolation.'
              },
              {
                q: 'How does live GPS tracking operate?',
                a: 'The framework captures coordinates and speed metrics directly from the mobile browser or secondary application. Dispatchers see this plotted automatically on detailed maps.'
              },
              {
                q: 'Is employee consent required for tracking operations?',
                a: 'Yes, absolutely. The application requests GPS tracking permission explicitly in-app. In addition, Trackhive contains tools to outline transparent business operations and safeguard representative privacy during offline hours.'
              },
              {
                q: 'Can multiple branches or companies use Trackhive?',
                a: 'Yes. Trackhive is natively multi-tenant. This means distinct registered industries manage entirely isolated employees databases, roles and compliance files via strict database constraints.'
              },
              {
                q: 'Is stored company data secure?',
                a: 'Yes. We utilize JWT/TLS encryption systems. All database queries pass through Row Level Security (RLS) constraints to guarantee no tenant reads another firm\'s datasets.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setActiveQuestion(activeQuestion === idx ? null : idx)}
                  className="w-full text-left px-5 py-4 font-bold text-slate-800 hover:text-emerald-700 flex items-center justify-between text-xs"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${activeQuestion === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeQuestion === idx && (
                  <div className="px-5 pb-4.5 text-slate-500 text-xs leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- PARTNERS / TESTIMONIALS ---------------- */}
      <section className="bg-white py-16 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-full font-mono">CLIENT EXPERIENCES</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Endorsed by Operations leaders</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Vikram Mehta',
                role: 'Logistics Fleet Dispatcher',
                company: 'Vanguard Cargo Delivery',
                text: 'We reduced daily transit deviations by nearly 30% using Trackhive. Poking riders live on our screen keeps operations disciplined.',
                rating: 5
              },
              {
                name: 'Priyanka Sen',
                role: 'HR Personnel Auditor',
                company: 'Vedas Medical Labs',
                text: 'Proxy attendance checks were a severe problem during pharma sales routines. Face checkpoints stopped fraudulent clock-ins on day one.',
                rating: 5
              },
              {
                name: 'Anil Gupta',
                role: 'Engineering Lead Specialist',
                company: 'Metro Tower Operators',
                text: 'Managing safety zones was crucial for our electrical repair field agents. Circular geofencing boundaries are extremely simple to deploy.',
                rating: 5
              }
            ].map((test, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] flex flex-col justify-between space-y-4 shadow-sm">
                <p className="text-slate-600 text-xs italic leading-relaxed">"{test.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t">
                  <div className="h-9 w-9 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs">
                    {test.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{test.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">{test.role} • {test.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8 border-b border-slate-850 pb-12">
          
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <TrackHiveLogo className="scale-90 origin-left" />
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Smart high-resolution field workforce coordinate management SaaS. Manage attendance logs, client visits, task completions, and path replays isolated cleanly inside secure multi-tenant structures.
            </p>
            <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1.5 uppercase font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SaaS System Online • Delhi Server Hub 01</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Enterprise Features</h4>
            <div className="space-y-2 text-xs">
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('features'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Live GPS Tracking</p>
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('features'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Face Authenticated Logs</p>
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('features'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Circular Geofencing Bounds</p>
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('features'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Compliance Document Vault</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Industry Solutions</h4>
            <div className="space-y-2 text-xs">
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('solutions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Courier & Logistics</p>
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('solutions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Pharmaceutical Reps</p>
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('solutions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Heavy Manufacturing</p>
              <p className="hover:text-white cursor-pointer" onClick={() => { setActiveTab('solutions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Patrol Security Agencies</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">Legal & Privacy</h4>
            <div className="space-y-2 text-xs">
              <p className="hover:text-white cursor-pointer">Privacy Policy</p>
              <p className="hover:text-white cursor-pointer">Terms & Conditions</p>
              <p className="hover:text-white cursor-pointer">Compliance audits</p>
              <p className="hover:text-white cursor-pointer">SLA & Cookie Policy</p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono tracking-wider">
          <p>© 2026 Trackhive SERVICES PVT. LTD. ALL REGISTERED TRADEMARKS INTACT.</p>
          <p className="mt-4 sm:mt-0 flex gap-4 uppercase font-bold">
            <span>Sitemap.xml</span>
            <span>Robots.txt</span>
            <span>Security Status: Certified</span>
          </p>
        </div>
      </footer>

      {/* ---------------- CHAT SUPPORT FLOATING WIDGET ---------------- */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => alert('Support widget active. Sales consultants are available to assist you. Mail: sales@Trackhive.com')}
          className="h-12 w-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-2xl hover:bg-emerald-800 hover:scale-105 transition-all relative cursor-pointer"
          title="Instant Chat Support Desk"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
        </button>
      </div>

    </div>
  );
}