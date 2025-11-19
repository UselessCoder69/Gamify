import React from 'react';
import Button from './Button';

interface ApiKeyPromptProps {
    onKeySelected: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onKeySelected }) => {
    const handleSelectKey = async () => {
        // The openSelectKey promise resolves when the dialog is closed.
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Optimistically assume a key was selected. The app will fail gracefully
            // if the API call fails later.
            onKeySelected();
        }
    };

    return (
        <div className="bg-[#EAF2CE] text-[#3805F2] min-h-screen font-sans flex items-center justify-center">
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="bg-[#AEA3D9] border border-[#A691F2] rounded-2xl shadow-lg p-8 max-w-lg mx-auto">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#7D5CF2] to-[#3805F2] mb-4">
                        Welcome!
                    </h1>
                    <p className="text-[#3805F2]/90 mb-6">
                        To use the AI Game Generator, you need to select a Google AI API key. This enables the application to make requests to the Gemini models on your behalf.
                    </p>
                    <Button onClick={handleSelectKey} size="lg">
                        Select API Key
                    </Button>
                    <p className="text-xs text-[#3805F2]/70 mt-6">
                        Project usage is subject to billing. For more information, please see the{" "}
                        <a 
                            href="https://ai.google.dev/gemini-api/docs/billing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#3805F2] font-semibold hover:underline"
                        >
                            Gemini API billing documentation
                        </a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyPrompt;