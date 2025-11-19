import React from 'react';

interface SectionProps {
    children: React.ReactNode;
    isVisible?: boolean;
    extraClasses?: string;
}

const Section: React.FC<SectionProps> = ({ children, isVisible = true, extraClasses = '' }) => {
    const visibilityClasses = isVisible ? 'max-h-[5000px] opacity-100 py-12 transform-none' : 'max-h-0 opacity-0 overflow-hidden py-0 transform translate-y-5';

    return (
        <section className={`transition-[max-height,opacity,transform,padding] duration-700 ease-in-out ${visibilityClasses} ${extraClasses}`}>
            {children}
        </section>
    );
};

export default Section;