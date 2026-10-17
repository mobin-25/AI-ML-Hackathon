import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scan,
  Bot,
  FileText,
  Bell,
  TrendingUp,
  Mic,
  MessageSquare,
  Wrench,
  Smartphone,
  Zap,
  HardHat,
  Car,
  Laptop,
  Package,
  Hammer,
} from 'lucide-react';
import { FeatureCard } from '../components/FeatureCard';
import { IndustryCard } from '../components/IndustryCard';
import { FAQItem } from '../components/FAQItem';

export const Home: React.FC = () => {
  // Controlled accordion state matching Screenshot 5 where answers can be expanded
  const [openFaqItems, setOpenFaqItems] = useState<Record<string, boolean>>({
    'faq-4': true,
    'faq-5': true,
    'faq-6': true,
    'faq-7': true,
  });

  const toggleFaq = (id: string) => {
    setOpenFaqItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const featureCards = [
    {
      icon: Scan,
      title: 'AI Stock Scanning',
      description: 'Scan barcodes to automatically add products with complete details',
    },
    {
      icon: Bot,
      title: 'Auto Product Info',
      description: 'Brand, title, and price automatically filled by AI',
    },
    {
      icon: FileText,
      title: 'Invoice Scan',
      description: 'Upload purchase bills to instantly update stock levels',
    },
    {
      icon: Bell,
      title: 'Low Stock Alerts',
      description: 'Get WhatsApp notifications when inventory runs low',
    },
    {
      icon: TrendingUp,
      title: 'Demand Forecast',
      description: 'AI predicts what products will sell next',
      isHovered: true, // Matching Screenshot 2 hover state
    },
    {
      icon: Mic,
      title: 'Voice Entry',
      description: 'Add stock hands-free with voice commands',
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Ordering',
      description: 'Reorder from suppliers instantly via WhatsApp',
    },
  ];

  const industryCards = [
    { name: 'Appliance Spares', icon: Wrench },
    { name: 'Mobile Spares', icon: Smartphone },
    { name: 'Electrical Shops', icon: Zap },
    { name: 'Hardware & Plumbing', icon: HardHat },
    { name: 'Automotive Spares', icon: Car },
    { name: 'Tool Dealers', icon: Hammer },
    { name: 'Laptop Accessories', icon: Laptop, isHovered: true }, // Matching Screenshot 4 hover state
    { name: 'General Retail', icon: Package },
  ];

  const faqItems = [
    {
      id: 'faq-1',
      question: 'What is SmartStock.AI?',
      answer: 'SmartStock.AI is an AI-powered inventory management software built specifically for Indian retailers. It automates stock tracking, demand forecasting, and reordering for spare parts shops, hardware stores, electrical retailers, and more.',
    },
    {
      id: 'faq-2',
      question: 'How does AI barcode scanning work?',
      answer: 'Simply scan any product barcode using your phone camera. Our AI instantly identifies the product and auto-fills brand name, MRP, category, and specifications — saving you hours of manual data entry.',
    },
    {
      id: 'faq-3',
      question: 'Which industries does SmartStock.AI support?',
      answer: 'SmartStock.AI is designed for mobile spare parts shops, laptop accessories stores, electrical supply dealers, hardware & plumbing stores, automotive parts retailers, tool dealers, CCTV equipment stores, and ecommerce sellers across India.',
    },
    {
      id: 'faq-4',
      question: 'Does SmartStock.AI work on mobile phones?',
      answer: 'Yes! SmartStock.AI is fully cloud-based and works on any smartphone, tablet, or computer. You can manage your inventory from anywhere — at the shop counter, warehouse, or on the go.',
    },
    {
      id: 'faq-5',
      question: 'How much does SmartStock.AI cost?',
      answer: 'SmartStock.AI offers a forever-free plan for up to 50 products. Paid plans start at ₹499/month (Starter, up to 500 products). The Pro plan at ₹1,999/month includes advanced AI features, invoice scanning, and demand forecasting. No credit card required to get started.',
    },
    {
      id: 'faq-6',
      question: 'Can I get WhatsApp alerts for low stock?',
      answer: 'Yes! SmartStock.AI sends automatic WhatsApp notifications when any product drops below your set reorder level. You can also reorder from suppliers directly via WhatsApp with pre-filled product details.',
    },
    {
      id: 'faq-7',
      question: 'Is my data safe with SmartStock.AI?',
      answer: 'Absolutely. We use bank-grade encryption, automatic cloud backups, and enterprise-level security. Your inventory data is stored on secure servers with 99.9% uptime guarantee.',
    },
    {
      id: 'faq-8',
      question: 'How long does setup take?',
      answer: 'Most retailers are up and running within 5 minutes. Simply sign up, scan your first products, and you\'re ready. We also offer free onboarding assistance for larger inventories.',
    },
  ];

  return (
    <div className="bg-[#F5F7FA] text-[#191919]">
      
      {/* ------------------------------------------------------------- */}
      {/* Section 1: Hero Section (Matching Screenshot 1)               */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-16 md:pt-24 pb-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[60px] font-extrabold text-[#191919] tracking-tight leading-[1.12]">
              Automate Your Retail <br />
              <span className="gradient-heading inline-block">Inventory with AI</span>
            </h1>

            <p className="text-[17px] sm:text-[18px] text-[#667085] leading-relaxed max-w-xl font-normal">
              Just scan your stock — our AI fills in brand, price, and details instantly. Built for Indian retailers.
            </p>

            <div className="pt-2 flex flex-row items-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-3.5 rounded-xl bg-[#FF642D] hover:bg-[#E8531C] text-white text-[15px] font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
              >
                Start Free Trial
              </Link>

              <Link
                to="/dashboard"
                className="px-7 py-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#191919] border border-[#E5E7EB] text-[15px] font-medium shadow-2xs hover:border-[#CBD5E1] transition-all"
              >
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Illustration Matching Screenshot 1 */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-white/60">
              <img
                src="/hero-shopkeeper.jpg"
                alt="SmartStock AI Retail Shopkeeper Illustration"
                className="w-full h-auto object-cover block"
                loading="eager"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Section 2: Features Section (Matching Screenshot 2 & 3)       */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E5E7EB]/60">
        
        {/* Centered Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#191919] tracking-tight leading-tight">
            Smarter Inventory for <span className="gradient-heading">Every Retailer</span>
          </h2>
          <p className="text-[16px] sm:text-[17px] text-[#667085]">
            Powerful AI features designed specifically for Indian retail businesses
          </p>
        </div>

        {/* 3-Column Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
          {featureCards.map((feat) => (
            <FeatureCard
              key={feat.title}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
              isHovered={feat.isHovered}
            />
          ))}
        </div>

        {/* Centered 'See Full Feature List' Button */}
        <div className="mt-12 text-center">
          <Link
            to="/features"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#191919] border border-[#E5E7EB] hover:border-[#FF642D] text-[14.5px] font-semibold shadow-xs transition-all"
          >
            <span>See Full Feature List</span>
            <span className="text-[#FF642D]">→</span>
          </Link>
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* Section 3: Industries Section (Matching Screenshot 3 & 4)     */}
      {/* ------------------------------------------------------------- */}
      <section id="industries" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E5E7EB]/60">
        
        {/* Centered Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#191919] tracking-tight leading-tight">
            Built for <span className="gradient-heading">Your Industry</span>
          </h2>
          <p className="text-[16px] sm:text-[17px] text-[#667085]">
            Trusted by retailers across diverse sectors in India
          </p>
        </div>

        {/* 4-Column Grid on Desktop (8 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {industryCards.map((ind) => (
            <IndustryCard
              key={ind.name}
              icon={ind.icon}
              name={ind.name}
              isHovered={ind.isHovered}
            />
          ))}
        </div>

        {/* Customization Callout */}
        <div className="mt-12 text-center text-[15px] text-[#667085]">
          Your shop type not listed?{' '}
          <Link to="/contact" className="font-bold text-[#FF642D] hover:underline">
            We'll customize for you!
          </Link>
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* Section 4: FAQ Section (Matching Screenshot 5)                */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E5E7EB]/60">
        
        {/* Centered Container limited to ~800px max width */}
        <div className="max-w-[800px] mx-auto space-y-12">
          
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#191919] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <FAQItem
                key={item.id}
                id={item.id}
                question={item.question}
                answer={item.answer}
                isOpen={!!openFaqItems[item.id]}
                onToggle={toggleFaq}
              />
            ))}
          </div>

        </div>

      </section>

    </div>
  );
};
