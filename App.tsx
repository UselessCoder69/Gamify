import React, { useState, useCallback, useEffect } from 'react';
import { generateMarketAnalysis, generateGameLevels, generatePrototype } from './services/geminiService';
import { MarketAnalysis, GameLevel, PrototypeResult, AppState, ApiServiceError, ApiErrorType } from './types';
import Section from './components/Section';
import Button from './components/Button';
import Card from './components/Card';
import CollapsibleCard from './components/CollapsibleCard';
import Spinner from './components/Spinner';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import Alert from './components/Alert';

const App: React.FC = () => {
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [appState, setAppState] = useState<AppState>(AppState.HERO);
    const [genre, setGenre] = useState<string>('');
    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
    const [gameIdeas, setGameIdeas] = useState<GameLevel[] | null>(null);
    const [prototypeResult, setPrototypeResult] = useState<PrototypeResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setIsApiKeySelected(true);
            }
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        if (appState !== AppState.PROTOTYPE_COMPLETE) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key === ' ' ? 'Space' : e.key;
            if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp'].includes(key)) {
                e.preventDefault();
                setActiveKeys(prevKeys => new Set(prevKeys).add(key));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key === ' ' ? 'Space' : e.key;
            if (['ArrowLeft', 'ArrowRight', 'Space', 'ArrowUp'].includes(key)) {
                 e.preventDefault();
                setActiveKeys(prevKeys => {
                    const newKeys = new Set(prevKeys);
                    newKeys.delete(key);
                    return newKeys;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            setActiveKeys(new Set()); // Reset on cleanup
        };
    }, [appState]);


    const handleStartAnalysis = () => {
        setAppState(AppState.ANALYSIS_INPUT);
    };

    const handleAnalyzeGenre = useCallback(async () => {
        if (!genre.trim()) {
            setError('Please enter a game genre.');
            setAppState(AppState.ANALYSIS_INPUT);
            return;
        }
        setError(null);
        setAppState(AppState.ANALYSIS_LOADING);

        try {
            const analysis = await generateMarketAnalysis(genre);
            setMarketAnalysis(analysis);
            setAppState(AppState.IDEA_LOADING); // Automatically proceed to next step
            
            const ideas = await generateGameLevels(genre, analysis);
            setGameIdeas(ideas);
            setAppState(AppState.IDEA_COMPLETE);

        } catch (err) {
            console.error(err);
            let errorMessage = 'An unexpected error occurred. Please try again.';
            let resetApiKey = false;

            if (err instanceof ApiServiceError) {
                switch (err.type) {
                    case ApiErrorType.INVALID_KEY:
                        errorMessage = 'Your API Key is invalid or missing permissions. Please select a valid API key to continue.';
                        resetApiKey = true;
                        break;
                    case ApiErrorType.RATE_LIMIT:
                        errorMessage = "You've exceeded the API rate limit. Please wait a moment and try again.";
                        break;
                    case ApiErrorType.NETWORK:
                        errorMessage = 'A network error occurred. Please check your connection and try again.';
                        break;
                    case ApiErrorType.BAD_RESPONSE:
                        errorMessage = "The AI returned a response that couldn't be understood. Please try again.";
                        break;
                    case ApiErrorType.RESPONSE_BLOCKED:
                        errorMessage = "The AI's response was blocked due to content safety policies. Please try modifying your prompt.";
                        break;
                    default: // UNKNOWN
                        errorMessage = 'An unknown error occurred while contacting the AI service. Please try again.';
                        break;
                }
            }

            setError(errorMessage);
            if (resetApiKey) {
                setIsApiKeySelected(false);
            }
            setAppState(AppState.ANALYSIS_INPUT);
        }
    }, [genre]);

    const handleGeneratePrototype = useCallback(async (ideaToPrototype: GameLevel) => {
        setAppState(AppState.PROTOTYPE_LOADING);
        setError(null);

        try {
            const result = await generatePrototype(ideaToPrototype);
            setPrototypeResult(result);
            setAppState(AppState.PROTOTYPE_COMPLETE);
        } catch (err) {
            console.error(err);
            let errorMessage = 'Failed to generate prototype. Please try again.';
            let resetApiKey = false;

            if (err instanceof ApiServiceError) {
                 switch (err.type) {
                    case ApiErrorType.INVALID_KEY:
                        errorMessage = 'Your API Key is invalid or missing permissions. Please select a valid API key to continue.';
                        resetApiKey = true;
                        break;
                    case ApiErrorType.RATE_LIMIT:
                        errorMessage = "You've exceeded the API rate limit. Please wait a moment and try again.";
                        break;
                    case ApiErrorType.NETWORK:
                        errorMessage = 'A network error occurred. Please check your connection and try again.';
                        break;
                    case ApiErrorType.RESPONSE_BLOCKED:
                         errorMessage = "The AI's response for the prototype was blocked due to content safety policies. This can sometimes happen with code generation. Please try again.";
                        break;
                    default: // UNKNOWN or BAD_RESPONSE
                        errorMessage = 'An unknown error occurred while generating the prototype. Please try again.';
                        break;
                }
            }
            
            setError(errorMessage);
            if (resetApiKey) {
                setIsApiKeySelected(false);
                setAppState(AppState.ANALYSIS_INPUT);
            } else {
                setAppState(AppState.IDEA_COMPLETE);
            }
        }
    }, []);

    if (!isApiKeySelected) {
        return <ApiKeyPrompt onKeySelected={() => setIsApiKeySelected(true)} />;
    }

    return (
        <div className="bg-[#EAF2CE] text-[#3805F2] min-h-screen font-sans antialiased">
            <div className="container mx-auto px-4 py-8 md:py-16">
                
                {/* Hero Section */}
                <Section extraClasses={`text-center transition-all duration-700 ease-in-out ${appState !== AppState.HERO ? 'max-h-0 py-0 opacity-0' : 'max-h-screen py-16'}`}>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#7D5CF2] to-[#3805F2] mb-4">
                        AI Game Idea & Prototype Generator
                    </h1>
                    <p className="text-lg md:text-xl text-[#3805F2]/80 max-w-2xl mx-auto mb-8">
                        Analyze trends, generate ideas, and test gameplay instantly.
                    </p>
                    <Button onClick={handleStartAnalysis} size="lg">
                        Start Analysis
                    </Button>
                </Section>
                
                {/* Analysis Input Section */}
                <Section isVisible={appState >= AppState.ANALYSIS_INPUT} extraClasses="flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-center mb-6">Market Analysis</h2>
                    <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            placeholder="Enter Genre (e.g., 'Cozy Farming Sim')"
                            className="flex-grow bg-[#AEA3D9]/40 border border-[#A691F2] rounded-xl px-4 py-3 text-[#3805F2] placeholder:text-[#3805F2]/60 focus:ring-2 focus:ring-[#3805F2] focus:outline-none transition-shadow"
                            disabled={appState > AppState.ANALYSIS_INPUT}
                        />
                        <Button onClick={handleAnalyzeGenre} disabled={appState > AppState.ANALYSIS_INPUT} isLoading={appState === AppState.ANALYSIS_LOADING}>
                            Analyze Genre
                        </Button>
                    </div>
                     {error && appState === AppState.ANALYSIS_INPUT && <div className="w-full max-w-md mt-4"><Alert message={error} /></div>}
                </Section>
                
                {/* Analysis Results & Idea Section */}
                <Section isVisible={appState >= AppState.IDEA_LOADING}>
                     {(appState === AppState.ANALYSIS_LOADING || appState === AppState.IDEA_LOADING) && (
                        <div className="flex justify-center items-center flex-col">
                            <Spinner />
                            <p className="mt-4 text-[#7D5CF2]">
                                {appState === AppState.ANALYSIS_LOADING ? 'Analyzing market trends...' : 'Generating brilliant game ideas...'}
                            </p>
                        </div>
                    )}
                    
                    {marketAnalysis && (
                        <div className={`transition-[opacity,transform] duration-500 ease-in-out ${appState >= AppState.IDEA_COMPLETE ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h3 className="text-2xl font-bold text-center mb-6">Analysis for "{genre}"</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <Card title="Market Trends" items={marketAnalysis.trends} extraClasses="transition-all" style={{ transitionDelay: '150ms' }}/>
                                <Card title="Popular Mechanics" items={marketAnalysis.mechanics} extraClasses="transition-all" style={{ transitionDelay: '300ms' }}/>
                                <Card title="Monetization Patterns" items={marketAnalysis.monetization} extraClasses="transition-all" style={{ transitionDelay: '450ms' }}/>
                            </div>
                        </div>
                    )}

                    {gameIdeas && (
                         <div className={`transition-[opacity,transform] duration-500 ease-in-out delay-200 ${appState >= AppState.IDEA_COMPLETE ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h2 className="text-3xl font-bold text-center mb-6">AI-Generated Game Ideas</h2>
                             {error && appState === AppState.IDEA_COMPLETE && (
                                <div className="max-w-3xl mx-auto mb-4">
                                    <Alert message={error} />
                                </div>
                            )}
                             <div className="max-w-3xl mx-auto space-y-4">
                                {gameIdeas.map((idea, index) => (
                                    <CollapsibleCard key={index} title={`Game Idea #${index + 1}`} defaultOpen={index === 0}>
                                        <div className="p-5 pt-0 text-[#3805F2]/90 space-y-4">
                                            <div>
                                                <h5 className="font-semibold text-[#3805F2] mb-2">Level Description</h5>
                                                <p className="whitespace-pre-wrap">{idea.level_description}</p>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-[#3805F2] mb-2">Tilemap</h5>
                                                <pre className="bg-[#EAF2CE]/50 border border-[#A691F2] p-2 rounded-md text-sm font-mono overflow-x-auto text-[#3805F2]">
                                                    {idea.tilemap.map(row => row.join('')).join('\n')}
                                                </pre>
                                            </div>
                                            <div className="text-center pt-4">
                                                <Button onClick={() => handleGeneratePrototype(idea)} disabled={appState === AppState.PROTOTYPE_LOADING}>
                                                   Generate Prototype for Idea #{index + 1}
                                                </Button>
                                            </div>
                                        </div>
                                    </CollapsibleCard>
                                ))}
                             </div>
                        </div>
                    )}
                </Section>
                
                {/* Prototype Section */}
                <Section isVisible={appState >= AppState.PROTOTYPE_LOADING} extraClasses="flex flex-col items-center">
                    <div className="w-full max-w-3xl text-center mt-12">
                        {appState === AppState.PROTOTYPE_LOADING && (
                            <div className="flex justify-center items-center flex-col">
                                <Spinner />
                                <p className="mt-4 text-[#7D5CF2]">Building your prototype... this might take a moment.</p>
                            </div>
                        )}
                        
                        {appState === AppState.PROTOTYPE_COMPLETE && prototypeResult && (
                            <Card title="Playable Prototype">
                                {prototypeResult.type === 'html' ? (
                                    <>
                                        <div className="w-full max-h-[80vh] aspect-video bg-[#3805F2] rounded-2xl overflow-hidden border border-[#A691F2]">
                                            <iframe
                                                srcDoc={prototypeResult.content}
                                                className="w-full h-full"
                                                title="Game Prototype"
                                                sandbox="allow-scripts"
                                            />
                                        </div>
                                        <div className="text-center text-[#3805F2]/80 mt-4 text-sm md:text-base">
                                            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-6 gap-y-3" aria-label="Game controls">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">Move:</span>
                                                    <kbd className={`font-sans bg-[#A691F2] text-[#3805F2] rounded-md px-2 py-1 transition-[transform,background-color,color] duration-150 ease-in-out ${activeKeys.has('ArrowLeft') ? '!bg-[#3805F2] !text-[#EAF2CE] scale-110' : ''}`}>←</kbd>
                                                    <kbd className={`font-sans bg-[#A691F2] text-[#3805F2] rounded-md px-2 py-1 transition-[transform,background-color,color] duration-150 ease-in-out ${activeKeys.has('ArrowRight') ? '!bg-[#3805F2] !text-[#EAF2CE] scale-110' : ''}`}>→</kbd>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">Jump:</span>
                                                    <kbd className={`font-sans bg-[#A691F2] text-[#3805F2] rounded-md px-2 py-1 transition-[transform,background-color,color] duration-150 ease-in-out ${activeKeys.has('Space') ? '!bg-[#3805F2] !text-[#EAF2CE] scale-110' : ''}`}>Space</kbd>
                                                    <span className="mx-1 text-xs opacity-75">/</span>
                                                    <kbd className={`font-sans bg-[#A691F2] text-[#3805F2] rounded-md px-2 py-1 transition-[transform,background-color,color] duration-150 ease-in-out ${activeKeys.has('ArrowUp') ? '!bg-[#3805F2] !text-[#EAF2CE] scale-110' : ''}`}>↑</kbd>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-[#3805F2]/90 p-4 bg-[#AEA3D9] rounded-lg">{prototypeResult.content}</p>
                                )}
                            </Card>
                        )}
                    </div>
                </Section>

            </div>
        </div>
    );
};

export default App;