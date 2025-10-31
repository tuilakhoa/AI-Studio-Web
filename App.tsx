import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import HeadshotGenerator from './views/HeadshotGenerator';
import SceneComposer from './views/SceneComposer';
import VideoComposer from './views/VideoComposer';
import HistoryView from './views/HistoryView';
import PhotoRestorer from './views/PhotoRestorer';
import InspirationView from './views/InspirationView';
import CommunityGallery from './views/CommunityGallery';
import TutorialsView from './views/TutorialsView';
import FreestyleCreator from './views/FreestyleCreator';
import PhotoBlender from './views/PhotoBlender';
import { View, User } from './types';
import FullBodyGenerator from './views/FullBodyGenerator';
import OutfitTryOn from './views/OutfitTryOn';
import PoseTransfer from './views/PoseTransfer';
import BackgroundSwap from './views/BackgroundSwap';
import FaceSwap from './views/FaceSwap';
import PortraitStylizer from './views/PortraitStylizer';
import ArtMorph from './views/ArtMorph';
import Outpainting from './views/Outpainting';
import AnimeConverter from './views/AnimeConverter';
import Chatbot from './components/Chatbot';
import AuthView from './views/AuthView';
import AccountView from './views/AccountView';
import SettingsView from './views/SettingsView';
import LandingPage from './views/LandingPage';
import UpscalerView from './views/UpscalerView';
import ComingSoon from './views/ComingSoon';
import TrainYourModel from './views/TrainYourModel';
import TextureGenerator from './views/TextureGenerator';
import RealtimeCanvas from './views/RealtimeCanvas';
import CanvasEditor from './views/CanvasEditor';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // --- Apply persisted settings and session on initial load ---
    
    // 1. Session persistence
    try {
        const storedUser = localStorage.getItem('ai-studio-user');
        if (storedUser) {
            const user: User = JSON.parse(storedUser);
            // TODO: In a real app, you would validate the token with your backend here.
            // For now, we'll just restore the session.
            setCurrentUser(user);
        }
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('ai-studio-user');
    }

    // 2. Custom AI Theme
    const activeThemeId = localStorage.getItem('ai-studio-active-theme-id');
    if (activeThemeId) {
        const themesJson = localStorage.getItem('ai-studio-saved-themes');
        if(themesJson) {
            const themes = JSON.parse(themesJson);
            const activeTheme = themes.find((t: any) => t.id === activeThemeId);
            if(activeTheme && activeTheme.css) {
                const styleId = 'ai-theme-styles';
                let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
                if (!styleEl) {
                  styleEl = document.createElement('style');
                  styleEl.id = styleId;
                  document.head.appendChild(styleEl);
                }
                styleEl.innerHTML = activeTheme.css;
            }
        }
    }

    // 3. Reduce Motion
    const reduceMotion = localStorage.getItem('ai-studio-reduce-motion') === 'true';
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);

    // 4. Compact Mode
    const compactMode = localStorage.getItem('ai-studio-compact-mode') === 'true';
    document.documentElement.classList.toggle('compact-mode', compactMode);
    
    setIsAppLoading(false);

  }, []);

  useEffect(() => {
    // Close mobile sidebar on view change
    setIsMobileSidebarOpen(false);
  }, [currentView]);


  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ai-studio-user', JSON.stringify(user));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ai-studio-user');
    setCurrentView('landing');
  };
  
  const requireAuth = useCallback(() => {
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  }, [currentUser]);
  
  const handlePromptSelect = (prompt: string) => {
    setSharedPrompt(prompt);
    setCurrentView('freestyle');
  };

  if (isAppLoading) {
      return <div className="flex h-screen w-full items-center justify-center"></div>;
  }

  const renderCurrentView = () => {
    const generatorProps = { requireAuth };
    switch (currentView) {
      case 'landing':
        return <LandingPage setCurrentView={setCurrentView} onPromptSelect={handlePromptSelect} />;
      case 'headshot':
        return <HeadshotGenerator {...generatorProps} />;
      case 'scene':
        return <SceneComposer {...generatorProps} />;
      case 'blender':
        return <PhotoBlender {...generatorProps} />;
      case 'freestyle':
        return <FreestyleCreator {...generatorProps} initialPrompt={sharedPrompt} onClearInitialPrompt={() => setSharedPrompt(null)} />;
      case 'restore':
        return <PhotoRestorer {...generatorProps} />;
      // New Creative Suite
      case 'fullbody':
        return <FullBodyGenerator {...generatorProps} />;
      case 'outfit':
        return <OutfitTryOn {...generatorProps} />;
      case 'pose':
        return <PoseTransfer {...generatorProps} />;
      case 'backgroundswap':
        return <BackgroundSwap {...generatorProps} />;
      case 'faceswap':
        return <FaceSwap {...generatorProps} />;
      case 'stylizer':
        return <PortraitStylizer {...generatorProps} />;
      case 'animeConverter':
        return <AnimeConverter {...generatorProps} />;
      case 'morph':
        return <ArtMorph {...generatorProps} />;
      case 'outpainting':
        return <Outpainting {...generatorProps} />;
      // Video
      case 'video':
        return <VideoComposer {...generatorProps} />;
      // Canvas Tools
      case 'realtimeCanvas':
        return <RealtimeCanvas {...generatorProps} />;
      case 'canvasEditor':
        return <CanvasEditor {...generatorProps} />;
      case 'flowstate':
        return <ComingSoon featureName="Flow State" />;
      // Advanced Tools
      case 'upscaler':
        return <UpscalerView {...generatorProps} />;
      case 'trainmodel':
        return <TrainYourModel {...generatorProps} />;
      case 'texturegen':
        return <TextureGenerator {...generatorProps} />;
      // Library
      case 'history':
        return <HistoryView requireAuth={requireAuth} currentUser={currentUser} onPromptSelect={handlePromptSelect} />;
      case 'inspiration':
        return <InspirationView onPromptSelect={handlePromptSelect} />;
      case 'community':
        return <CommunityGallery onPromptSelect={handlePromptSelect} />;
      case 'tutorials':
        return <TutorialsView setCurrentView={setCurrentView} />;
      // Profile
      case 'account':
        return <AccountView setCurrentView={setCurrentView}/>;
      case 'settings':
        return <SettingsView setCurrentView={setCurrentView} />;
      default:
        return <LandingPage setCurrentView={setCurrentView} onPromptSelect={handlePromptSelect} />;
    }
  };

  return (
    <>
      {isMobileSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
        />
      )}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        isMobileOpen={isMobileSidebarOpen}
      />
      <div className={`flex-1 flex flex-col ${isSidebarExpanded ? 'lg:ml-64' : 'lg:ml-24'} transition-all duration-300 h-screen`}>
        <Header 
          currentView={currentView}
          currentUser={currentUser}
          onLogout={handleLogout}
          onLoginClick={() => setShowAuthModal(true)}
          setCurrentView={setCurrentView}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(v => !v)}
        />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
            {renderCurrentView()}
          </main>
          <Footer />
        </div>
      </div>
      <Chatbot requireAuth={requireAuth} currentUser={currentUser} />
      {showAuthModal && <AuthView onLoginSuccess={handleLoginSuccess} onClose={() => setShowAuthModal(false)} />}
    </>
  );
};

export default App;