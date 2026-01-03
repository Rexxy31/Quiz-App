"use client";

import { Shield, Lock, Target } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent -z-10 blur-3xl opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-10 inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-2xl glass-morphism animate-bounce-slow">
              <Shield className="w-16 h-16 text-indigo-600 drop-shadow-xl" />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-8 tracking-tight">
              Master the{' '}
              <span className="premium-text-gradient">
                CEH Exam
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-14 max-w-4xl mx-auto leading-relaxed font-medium">
              Elevate your cybersecurity career with our world-class practice environment.
              Interactive modules designed by experts for the modern ethical hacker.
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-8 mb-20">
              <Link
                href="/learn"
                className="group relative inline-flex items-center justify-center px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.5)] transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
              >
                <span className="relative z-10">Study Mode</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/test"
                className="group relative inline-flex items-center justify-center px-10 py-5 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 hover:bg-slate-50 active:scale-95"
              >
                <span className="relative z-10">Practice Test</span>
                <div className="absolute inset-0 border-indigo-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Engineered for Success
          </h2>
          <div className="w-24 h-1.5 premium-gradient mx-auto rounded-full mb-8" />
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">
            We provide more than just questions. We provide the mindset of an ethical hacker.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <div className="glass-card group hover:bg-white transition-all duration-500 transform hover:-translate-y-3 cursor-default">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm">
              <Shield className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Ethical Hacking</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              Explore complex penetration testing methodologies and vulnerability research through practical exam simulations.
            </p>
          </div>

          <div className="glass-card group hover:bg-white transition-all duration-500 transform hover:-translate-y-3 cursor-default">
            <div className="w-20 h-20 bg-cyan-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm">
              <Lock className="w-10 h-10 text-cyan-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Security Core</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              Solidify your grasp on networking protocols, cryptic systems, and defensive architecture with deep-dive analysis.
            </p>
          </div>

          <div className="glass-card group hover:bg-white transition-all duration-500 transform hover:-translate-y-3 cursor-default">
            <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm">
              <Target className="w-10 h-10 text-rose-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Elite Standards</h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              Prepare with content that maintains the highest industry standards, mirroring the rigor of the actual CEH certification.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center text-white">
            <div className="animate-fade-in-up">
              <div className="text-6xl font-black mb-4 text-indigo-400">500+</div>
              <div className="text-slate-400 text-lg font-bold tracking-widest uppercase">Practice Questions</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-6xl font-black mb-4 text-cyan-400">24/7</div>
              <div className="text-slate-400 text-lg font-bold tracking-widest uppercase">Expert Support</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-6xl font-black mb-4 text-rose-400">95%</div>
              <div className="text-slate-400 text-lg font-bold tracking-widest uppercase">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl font-bold text-slate-900 mb-6">
            Ready to become a Certified Ethical Hacker?
          </p>
          <p className="text-slate-500 font-medium">
            © 2024 CEH Quiz App. Crafted for excellence.
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
