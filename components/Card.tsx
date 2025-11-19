import React from 'react';

interface CardProps {
    title: string;
    items?: string[];
    children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, items, children }) => {
    return (
        <div className="bg-[#AEA3D9] border border-[#A691F2] rounded-2xl shadow-lg p-6 w-full">
            <h4 className="font-bold text-xl mb-4 text-[#3805F2]">{title}</h4>
            {items && (
                <ul className="space-y-2 list-disc list-inside text-[#3805F2]/90">
                    {items.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            )}
            {children}
        </div>
    );
};

export default Card;