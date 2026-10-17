import React, { useState } from 'react';
import { Mail, MapPin, Send, CheckCircle2, Sparkles } from 'lucide-react';
import type { ContactFormData } from '../types';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    subject: 'Request Demo / Onboarding',
    message: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ContactFormData, string>> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.message.trim() || formData.message.length < 10) {
      errs.message = 'Message must be at least 10 characters long';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedMessage(
        `Thank you ${formData.name}! Your request has been validated in demo mode. In production, this connects to Mobin's FastAPI notification endpoint.`
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        subject: 'Request Demo / Onboarding',
        message: '',
      });
    }, 800);
  };

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF1EB] text-[#FF642B] text-xs font-bold uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5" />
          <span>Get In Touch</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
          Connect with <span className="gradient-heading">SmartStock AI</span>
        </h1>
        <p className="text-base sm:text-lg text-[#64748B]">
          Have questions about the ML forecasting models or want to schedule a walkthrough of the inventory dashboard?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto">
        
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h3 className="text-xl font-bold text-[#0F172A]">Direct Project Channels</h3>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Built as an AI/ML Hackathon full-stack prototype by the SmartStock AI engineering team.
          </p>

          <div className="space-y-4 text-sm text-[#475569]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1EB] text-[#FF642B] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] font-medium block">Team Inquiries</span>
                <span className="font-semibold text-[#0F172A]">team@smartstockai.in</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1EB] text-[#FF642B] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] font-medium block">Repository</span>
                <span className="font-semibold text-[#0F172A]">github.com/mobin-25/AI-ML-Hackathon</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1EB] text-[#FF642B] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] font-medium block">Lead UI Ownership</span>
                <span className="font-semibold text-[#0F172A]">Ajinkya (Member 2)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed">
            <strong>Demo Response Time:</strong> Inquiries submitted through this form are validated immediately in the browser console during prototype testing.
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs">
          
          {submittedMessage ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-bold text-emerald-900">Message Received (Demo Mode)</h4>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                {submittedMessage}
              </p>
              <button
                type="button"
                onClick={() => setSubmittedMessage(null)}
                className="mt-3 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:outline-none transition-colors ${
                      errors.name ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-[#CBD5E1] focus:border-[#FF642B]'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@business.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:outline-none transition-colors ${
                      errors.email ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-[#CBD5E1] focus:border-[#FF642B]'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-business" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Store / Business Name
                  </label>
                  <input
                    type="text"
                    id="contact-business"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Patel Supermarket"
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-sm text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:border-[#FF642B] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                    Subject *
                  </label>
                  <select
                    id="contact-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-sm text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:border-[#FF642B] focus:outline-none transition-colors"
                  >
                    <option value="Request Demo / Onboarding">Request Demo / Onboarding</option>
                    <option value="Question About ML Demand Forecast">Question About ML Demand Forecast</option>
                    <option value="Store Partnership & Feedback">Store Partnership & Feedback</option>
                    <option value="Technical Integration Question">Technical Integration Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your inventory challenge or what you would like to test..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-[#0F172A] bg-[#F8FAFC] focus:bg-white focus:outline-none transition-colors ${
                    errors.message ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-[#CBD5E1] focus:border-[#FF642B]'
                  }`}
                ></textarea>
                {errors.message && <p className="text-[11px] text-rose-500 mt-1">{errors.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FF642B] hover:bg-[#E8531C] text-white text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Validating Demo Submission...' : 'Submit Demo Message'}</span>
                </button>
              </div>

              <p className="text-[11px] text-[#94A3B8]">
                Note: Input is validated client-side with feedback states. No spam or marketing emails will be sent.
              </p>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
