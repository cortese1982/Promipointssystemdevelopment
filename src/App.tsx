import { useState, useEffect } from 'react';
import { User } from './types';
import { storage, initializeDemoData } from './utils/storage';
import { Login } from './components/Login';
import { UserDashboard } from './components/UserDashboard';
import { PeopleDashboard } from './components/PeopleDashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize demo data
    initializeDemoData();

    // Check for existing session
    const user = storage.getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {currentUser.role === 'people' || currentUser.role === 'superadmin' ? (
        <PeopleDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <UserDashboard user={currentUser} onLogout={handleLogout} />
      )}
      <Toaster 
        position="top-center" 
        expand={false}
        richColors
        toastOptions={{
          style: {
            padding: '16px',
          },
          className: 'text-sm sm:text-base',
        }}
      />
    </>
  );
}