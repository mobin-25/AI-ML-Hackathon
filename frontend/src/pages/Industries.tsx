import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Smartphone,
  Zap,
  HardHat,
  Car,
  Laptop,
  Package,
  Hammer,
} from 'lucide-react';
import { IndustryCard } from '../components/IndustryCard';

export const Industries: React.FC = () => {
  const industryCards = [
    { name: 'Appliance Spares', icon: Wrench },
    { name: 'Mobile Spares', icon: Smartphone },
    { name: 'Electrical Shops', icon: Zap },
    { name: 'Hardware & Plumbing', icon: HardHat },
    { name: 'Automotive Spares', icon: Car },
    { name: 'Tool Dealers', icon: Hammer },
    { name: 'Laptop Accessories', icon: Laptop, isHovered: true },
    { name: 'General Retail', icon: Package },
  ];

  return (
    <div className="bg-[#F5F7FA] text-[#191919] py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* Centered Heading */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#191919] tracking-tight leading-tight">
          Built for <span className="gradient-heading">Your Industry</span>
        </h1>
        <p className="text-[16px] sm:text-[17px] text-[#667085]">
          Trusted by retailers across diverse sectors in India
        </p>
      </div>

      {/* 4-Column Grid on Desktop */}
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
      <div className="text-center text-[15px] text-[#667085] pt-4">
        Your shop type not listed?{' '}
        <Link to="/contact" className="font-bold text-[#FF642D] hover:underline">
          We'll customize for you!
        </Link>
      </div>

    </div>
  );
};
