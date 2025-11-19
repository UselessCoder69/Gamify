import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    isLoading?: boolean;
    size?: 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, isLoading = false, size = 'md', ...props }) => {
    const sizeClasses = size === 'lg' ? 'px-8 py-4 text-lg' : 'px-5 py-3';

    return (
        <button
            {...props}
            className={`
                relative inline-flex items-center justify-center font-semibold rounded-xl shadow-md 
                bg-[#3805F2] text-[#EAF2CE] 
                hover:bg-[#7D5CF2] 
                disabled:bg-[#AEA3D9] disabled:text-[#3805F2]/50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#EAF2CE] focus:ring-[#7D5CF2]
                transition-all duration-300 ease-in-out
                ${sizeClasses}
                ${props.className || ''}
            `}
            disabled={isLoading || props.disabled}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner size="sm" />
                </div>
            )}
            <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                {children}
            </span>
        </button>
    );
};

export default Button;