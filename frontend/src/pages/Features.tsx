import React, { useState } from 'react';
import {
  Package,
  Bot,
  FileText,
  Bell,
  TrendingUp,
  Mic,
  MessageSquare,
  BarChart3,
  Shield,
  Smartphone,
  Cloud,
  Zap,
} from 'lucide-react';
import { FeatureCard } from '../components/FeatureCard';
import { FAQItem } from '../components/FAQItem';

export const Features: React.FC = () => {
  // State for collapsible Feature Questions (all 6 open by default matching screenshots 3 & 4)
  const [openFaqItems, setOpenFaqItems] = useState<Record<string, boolean>>({
    'fq-1': true,
    'fq-2': true,
    'fq-3': true,
    'fq-4': true,
    'fq-5': true,
    'fq-6': true,
  });

  const toggleFaq = (id: string) => {
    setOpenFaqItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const featureCards = [
    {
      icon: Package,
      title: 'AI Stock Scanning',
      description:
        'Scan barcodes or QR codes to automatically add products with complete details including brand, price, and specifications.',
    },
    {
      icon: Bot,
      title: 'Auto Product Info',
      description:
        'Our AI automatically fills in product details, brand names, MRP, and categories based on barcode data.',
    },
    {
      icon: FileText,
      title: 'Invoice Scan & OCR',
      description:
        'Upload purchase invoices and let AI extract all product information to update your stock instantly.',
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description:
        "Get real-time notifications via WhatsApp when stock runs low or when it's time to reorder.",
    },
    {
      icon: TrendingUp,
      title: 'AI Demand Forecast',
      description:
        'Predictive analytics to forecast demand trends and suggest optimal reorder quantities.',
    },
    {
      icon: Mic,
      title: 'Voice Commands',
      description:
        'Add stock, check inventory, or create bills using natural voice commands in Hindi or English.',
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Integration',
      description:
        'Send reorder requests to suppliers directly via WhatsApp with pre-filled product details.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Track sales patterns, identify fast-moving items, and get actionable business insights.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description:
        'Bank-grade security with automatic backups and a 99.9% uptime guarantee.',
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description:
        'Access your inventory from anywhere using our mobile app for iOS and Android.',
    },
    {
      icon: Cloud,
      title: 'Cloud Sync',
      description:
        'All your data synced in real-time across all devices with automatic cloud backups.',
    },
    {
      icon: Zap,
      title: 'Fast & Easy',
      description:
        'Lightning-fast performance with an intuitive interface designed for Indian retailers.',
    },
  ];

  const faqItems = [
    {
      id: 'fq-1',
      question: 'How accurate is the AI barcode scanning?',
      answer:
        'SmartStock.AI recognizes over 95% of Indian product barcodes instantly. For unrecognized items, the AI suggests the closest match from our database of 10 lakh+ products, and you can confirm with one tap.',
    },
    {
      id: 'fq-2',
      question: 'Can SmartStock.AI scan purchase invoices automatically?',
      answer:
        'Yes. Upload a photo of any purchase invoice or bill, and our OCR + AI engine extracts product names, quantities, prices, and supplier details automatically. It then updates your stock in seconds.',
    },
    {
      id: 'fq-3',
      question: 'How does demand forecasting work?',
      answer:
        'Our AI analyzes your past sales data, seasonal trends, and market patterns to predict which products will sell next. It recommends optimal reorder quantities and timing so you never face stock-outs or overstock.',
    },
    {
      id: 'fq-4',
      question: 'Does voice entry support Hindi?',
      answer:
        'Yes! You can use voice commands in Hindi or English to add stock, check inventory levels, or create bills. Just speak naturally — the AI understands context and product names.',
    },
    {
      id: 'fq-5',
      question: 'How does WhatsApp reordering work?',
      answer:
        'When stock runs low, SmartStock.AI generates a pre-filled WhatsApp message with product details, quantities, and your last purchase price. Tap send to forward it to your supplier directly.',
    },
    {
      id: 'fq-6',
      question: 'What analytics and reports are available?',
      answer:
        'SmartStock.AI provides sales trend analysis, dead stock identification, fast-moving item tracking, profit margin reports, stock health scores, supplier performance ratings, and custom date-range reports — all with visual charts.',
    },
  ];

  return (
    <div className="bg-[#F5F7FA] text-[#191919] min-h-screen">
      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Centered Heading */}
        <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-[#191919] tracking-tight leading-[1.15]">
            Powerful Features for <span className="gradient-heading">Modern Retailers</span>
          </h1>
          <p className="mt-3.5 text-base sm:text-lg text-[#667085] max-w-2xl mx-auto leading-relaxed">
            Everything you need to manage your inventory efficiently with AI-powered automation
          </p>
        </div>

        {/* 12 Feature Cards in 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
          {featureCards.map((feat) => (
            <FeatureCard
              key={feat.title}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
            />
          ))}
        </div>
      </section>

      {/* Feature Questions / FAQ Section */}
      <section className="pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-[#191919] text-center tracking-tight mb-8 sm:mb-12">
          Feature Questions
        </h2>

        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
          {faqItems.map((item) => (
            <FAQItem
              key={item.id}
              id={item.id}
              question={item.question}
              answer={item.answer}
              isOpen={Boolean(openFaqItems[item.id])}
              onToggle={toggleFaq}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
