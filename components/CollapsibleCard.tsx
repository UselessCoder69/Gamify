import React, { useState } from 'react';

interface CollapsibleCardProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2} 
        stroke="currentColor" 
        className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);


const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-[#AEA3D9] border border-[#A691F2] rounded-2xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-5 text-left font-semibold text-lg text-[#3805F2] hover:bg-[#A691F2]/60 focus:outline-none focus:bg-[#A691F2]/60 transition-colors duration-200"
            >
                <span className="truncate pr-4">{title}</span>
                <ChevronIcon isOpen={isOpen} />
            </button>
            <div className={`transition-[max-height] duration-300 ease-in-out ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                {children}
            </div>
        </div>
    );
};

export default CollapsibleCard;