import React from 'react';

interface AlertProps {
    message: string;
}

const Alert: React.FC<AlertProps> = ({ message }) => {
    if (!message) {
        return null;
    }

    const alertClasses = 'p-4 rounded-xl text-center text-sm bg-[#3805F2] border border-[#7D5CF2] text-[#EAF2CE]';

    return (
        <div className={alertClasses} role="alert">
            {message}
        </div>
    );
};

export default Alert;