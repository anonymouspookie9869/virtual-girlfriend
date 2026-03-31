import React, { useEffect, useState } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import ChatView from './components/ChatView';
import SetupView from './components/SetupView';
import type { UserProfile, RelationshipStatus } from './types';
import { RelationshipStatus as RSEnum } from './types';
import { requestNotificationPermission } from './services/notificationService';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('virtual-girlfriend-profile', null);
  const [relationshipStatus, setRelationshipStatus] = useLocalStorage<RelationshipStatus>('virtual-girlfriend-relationship-status', RSEnum.UNKNOWN);
  const [messageCount, setMessageCount] = useLocalStorage<number>('virtual-girlfriend-message-count', 0);
  const [followUpCount, setFollowUpCount] = useLocalStorage<number>('virtual-girlfriend-followup-count', 0);

  useEffect(() => {
    // Request permission on first load if profile is set
    if (userProfile) {
      requestNotificationPermission();
    }
  }, [userProfile]);

  if (!userProfile) {
    return <SetupView setUserProfile={setUserProfile} />;
  }

  const [isBackendReady, setIsBackendReady] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          console.log("Backend health check passed:", data);
          setIsBackendReady(true);
        } else {
          console.error("Backend health check failed with status:", res.status);
          setIsBackendReady(false);
        }
      } catch (err) {
        console.error("Backend health check error:", err);
        setIsBackendReady(false);
      }
    };
    checkHealth();
  }, []);

  if (isBackendReady === false) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-4 text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-4">Connection Error</h1>
        <p className="text-slate-400 mb-6 max-w-md">
          We're having trouble connecting to the backend server. This might be because the server is still starting up or there's a configuration issue.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-rose-500 hover:bg-rose-600 rounded-full font-bold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isBackendReady === null) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0f172a] text-white">
        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 animate-pulse">Initializing server...</p>
      </div>
    );
  }

  return (
    <ChatView
        userProfile={userProfile} 
        setUserProfile={setUserProfile}
        relationshipStatus={relationshipStatus}
        setRelationshipStatus={setRelationshipStatus}
        messageCount={messageCount}
        setMessageCount={setMessageCount}
        followUpCount={followUpCount}
        setFollowUpCount={setFollowUpCount}
    />
  );
};

export default App;