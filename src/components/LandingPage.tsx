import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Smartphone,
  CreditCard,
  Briefcase,
  TrendingUp,
  UserCheck,
  KeyRound,
  Headphones,
  Landmark,
  Globe2,
  HelpCircle,
  Eye,
  PlusCircle
} from 'lucide-react';
import { ScamCategory } from '../types';

interface LandingPageProps {
  onOpenReportModal: (category?: ScamCategory) => void;
  onOpenTrackerModal: (ref?: string) => void;
  onOpenAuthModal: (tab?: 'login' | 'register') => void;
}

const CATEGORY_ITEMS: {
  title: ScamCategory;
  icon: React.ReactNode;
  desc: string;
  example: string;
}[] = [
  {
    title: 'Phishing and fake websites',
    icon: <Globe2 className="w-5 h-5 text-blue-600" />,
    desc: 'Spoofed websites mimicking banking portals, postal delivery services, or tax agencies designed to steal credentials.',
    example: 'e.g. secure-loginn-bank.com domain pretending to be official net banking.',
  },
  {
    title: 'UPI and digital payment scams',
    icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
    desc: 'Fraudulent QR codes, fake refund links, or payment gateway prompts disguised as incoming money receipts.',
    example: 'e.g. Scammer says "scan this QR to receive $200" which actually debits your balance.',
  },
  {
    title: 'Online shopping fraud',
    icon: <Smartphone className="w-5 h-5 text-emerald-600" />,
    desc: 'Unregistered ecommerce stores running social media clearance ads that take payment and never dispatch merchandise.',
    example: 'e.g. 80% discount electronics store with bogus tracking IDs and unreachable support.',
  },
  {
    title: 'Job and employment scams',
    icon: <Briefcase className="w-5 h-5 text-purple-600" />,
    desc: 'Fake work-from-home or remote data entry offers requiring payment for training kits, laptops, or verification checks.',
    example: 'e.g. Telegram group demanding $150 deposit before releasing high-paying daily tasks.',
  },
  {
    title: 'Investment and cryptocurrency scams',
    icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
    desc: 'Ponzi schemes, automated arbitrage bots, and fake exchange apps promising guaranteed astronomical weekly yields.',
    example: 'e.g. Fake crypto wallet dashboard that freezes withdrawals demanding tax fees.',
  },
  {
    title: 'Social media impersonation',
    icon: <UserCheck className="w-5 h-5 text-cyan-600" />,
    desc: 'Hijacked or duplicate social profiles messaging family and friends posing as a loved one in an emergency distress.',
    example: 'e.g. Fake Instagram account of a friend asking for urgent medical bill transfer.',
  },
  {
    title: 'OTP and account takeover scams',
    icon: <KeyRound className="w-5 h-5 text-rose-600" />,
    desc: 'Social engineering tricks prompting victims to share one-time authentication codes or screen-sharing access.',
    example: 'e.g. Scammer claiming "we are stopping unauthorized login, read me the SMS code".',
  },
  {
    title: 'Fake customer support scams',
    icon: <Headphones className="w-5 h-5 text-teal-600" />,
    desc: 'Toll-free numbers planted on search engines or forums claiming to be tech support for airlines, banks, or telecom.',
    example: 'e.g. Fake flight booking hotline demanding remote AnyDesk or TeamViewer installation.',
  },
  {
    title: 'Loan and financial scams',
    icon: <Landmark className="w-5 h-5 text-orange-600" />,
    desc: 'Predatory instant loan apps demanding upfront processing fees or blackmailing using harvested smartphone contacts.',
    example: 'e.g. Instant cash app requiring a $75 "file sanction fee" before disbursement.',
  },
  {
    title: 'Other online scams',
    icon: <AlertTriangle className="w-5 h-5 text-slate-600" />,
    desc: 'Lottery notifications, romance fraud, blackmail sextortion schemes, or rogue browser ransomware locks.',
    example: 'e.g. Romance partner on dating app asking for wire funds for emergency customs release.',
  },
];

const FAQS = [
  {
    q: 'What should I do immediately after realizing I was scammed?',
    a: 'Immediately contact your bank or payment issuer to freeze your account, cards, or digital wallets. Preserve all evidence including chat transcripts, transaction reference numbers (TXID/UTR), sender phone numbers, and bogus URLs. Then file an incident report on this platform.',
  },
  {
    q: 'How does the report reference ID work?',
    a: 'Every complaint receives a secure, non-sequential reference code (such as SCAM-2026-8K401). You can use this code to track investigation progression on the portal without revealing personal identity details.',
  },
  {
    q: 'Can I submit evidence after I already filed a complaint?',
    a: 'Yes. If the investigating officer reviews your case and changes the status to "Additional Information Required", you will receive an in-app notification and an active response box on your case timeline where you can attach supplementary files and notes.',
  },
  {
    q: 'Is this system an official law enforcement agency?',
    a: 'No. CyberShield is an academic software engineering complaint management and tracking platform. While it follows real-world forensic categorization standards, in active emergencies or physical danger, please contact local emergency authorities and national cyber police hotlines immediately.',
  },
  {
    q: 'Are my uploaded documents and private data safe?',
    a: 'Yes. Files are stored on a secured backend server with restricted MIME-type checking and file size bounds. Only authenticated case investigators and the original reporting citizen can access uploaded evidence.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenReportModal,
  onOpenTrackerModal,
  onOpenAuthModal,
}) => {
  const [trackRef, setTrackRef] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackRef.trim()) {
      onOpenTrackerModal(trackRef.trim());
    }
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-radial-at-t from-blue-900/30 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="max-w-3xl">
            
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-950/80 border border-blue-800/80 px-3 py-1 rounded-full mb-6">
              <Shield className="w-3.5 h-3.5" />
              <span>National Cyber Fraud Registry & Complaint Tracking</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Report Cyber Fraud & Online Scams with Confidence
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed font-normal">
              A secure, transparent incident reporting platform designed to catalog digital fraud, preserve forensic evidence, and enable systematic case review and progress tracking.
            </p>

            {/* Quick Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => onOpenReportModal()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report a Scam Incident</span>
              </button>

              <button
                onClick={() => onOpenTrackerModal()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Track Existing Case</span>
              </button>
            </div>

            {/* Quick Reference Tracker Bar right inside hero */}
            <div className="mt-10 p-4 bg-slate-800/90 border border-slate-700/80 rounded-xl max-w-xl shadow-xl">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Instant Reference Code Lookup</span>
              </div>
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  placeholder="Enter reference ID (e.g. SCAM-2026-8K401)"
                  className="flex-1 text-xs font-mono px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  Track Status
                </button>
              </form>
              <div className="mt-2 text-[10px] text-slate-400">
                Sample reference: <button type="button" onClick={() => setTrackRef('SCAM-2026-8K401')} className="font-mono text-blue-400 hover:underline">SCAM-2026-8K401</button> (UPI Scam) or <button type="button" onClick={() => setTrackRef('SCAM-2026-9M102')} className="font-mono text-blue-400 hover:underline">SCAM-2026-9M102</button> (Crypto Arbitrage)
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4-Step Incident Lifecycle ("How It Works") */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How the Reporting Process Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            A structured four-phase workflow to ensure every complaint is verified, triaged, and communicated transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4 font-mono">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Submit Complaint & Evidence</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fill in the incident details, platform, suspect coordinates, and upload screenshots or payment receipts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-4 font-mono">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Triage & Classification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Case officers assess risk, tag priority levels, verify evidence validity, and correlate suspect entities.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-4 font-mono">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Two-Way Clarification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If further wallet TXIDs or bank transaction statements are needed, officers request info directly in your timeline.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-4 font-mono">
              04
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Resolution & Chargeback Dossier</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive verified incident summaries for bank chargebacks, legal escalations, and registrar domain takedowns.
            </p>
          </div>
        </div>
      </section>

      {/* 10 Scam Categories Grid */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Scam Categories Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select any cyber fraud category below to launch a targeted complaint submission.
            </p>
          </div>
          <button
            onClick={() => onOpenReportModal()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
          >
            <span>Open standard form</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_ITEMS.map((cat, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    {cat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {cat.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {cat.desc}
                </p>
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic mb-4">
                  {cat.example}
                </div>
              </div>

              <button
                onClick={() => onOpenReportModal(cat.title)}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Report this Scam</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Cybersecurity Awareness Tips & Red Flags */}
      <section id="cyber-tips" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-3 py-1 rounded-full mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cybersecurity Defense & Awareness</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
              Top Digital Fraud Red Flags to Watch Out For
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8">
              Recognizing deception tactics early is the most effective deterrent against financial and identity loss.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                <span className="font-bold text-red-400 block">🚨 Artificial Urgency & Threats</span>
                <p className="text-slate-300 leading-relaxed">
                  Callers claiming your SIM card will be deactivated, net banking locked, or power disconnected within 2 hours are fabricating pressure to disable critical reasoning.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                <span className="font-bold text-amber-400 block">⚠️ Remote Access Tool Demands</span>
                <p className="text-slate-300 leading-relaxed">
                  Never install AnyDesk, TeamViewer, RustDesk, or QuickSupport on instructions from an unsolicited customer agent claiming to assist with a transaction.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                <span className="font-bold text-blue-400 block">🔒 OTP & Password Requests</span>
                <p className="text-slate-300 leading-relaxed">
                  Bank personnel will never request your one-time passwords, debit card PINs, or net banking passwords over phone calls, SMS, or WhatsApp.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                <span className="font-bold text-emerald-400 block">💸 Guaranteed Investment Returns</span>
                <p className="text-slate-300 leading-relaxed">
                  Any trading syndicate, telegram VIP signal group, or cloud bot offering risk-free 10-20% weekly gains is an algorithmic Ponzi construct.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Answers to common questions regarding filing, evidence submission, and tracking.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Official Disclaimer & Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-slate-200">
        <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2 mb-8">
          <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Important System Disclaimer & Emergency Information</span>
          </div>
          <p>
            The <strong>Online Scam Reporting System (CyberShield)</strong> is an academic full-stack software engineering project designed to catalog, evaluate, and trace cyber fraud reports with forensic rigor. This application is a reporting and tracking platform and is <strong>not itself a direct law-enforcement agency or police dispatcher</strong>.
          </p>
          <p>
            If you are in immediate physical danger, experiencing an ongoing life threat, or actively suffering an authorized account drain in real-time, please dial your official local police emergency dispatcher or contact your national cybercrime reporting hotline immediately.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 pb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">CyberShield Online Scam Reporting System</span>
            <span>· Academic Engineering Capstone</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Secure SQLite Persistence</span>
            <span>·</span>
            <span>Bcrypt Auth & RBAC</span>
            <span>·</span>
            <span>Forensic Evidence Handling</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
