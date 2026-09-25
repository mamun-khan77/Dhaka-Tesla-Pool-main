/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './client/components/Navbar.tsx';
import { Footer } from './client/components/Footer.tsx';
import { LandingPage } from './client/components/LandingPage.tsx';
import { PassengerDashboard } from './client/components/PassengerDashboard.tsx';
import { DriverDashboard } from './client/components/DriverDashboard.tsx';
import { AdminDashboard } from './client/components/AdminDashboard.tsx';
import { PoolsView } from './client/components/PoolsView.tsx';
import { AuthModal } from './client/components/AuthModal.tsx';
import { GeminiChatbot } from './client/components/GeminiChatbot.tsx';
import { GoogleMapsGroundingModal } from './client/components/GoogleMapsGroundingModal.tsx';
import { api, authStorage } from './client/api.ts';
import { User } from './client/types.ts';
import { testFirestoreConnection } from './client/firebase.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'passenger' | 'driver' | 'admin' | 'pools'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [mapsModalOpen, setMapsModalOpen] = useState(false);
  const [geminiChatOpen, setGeminiChatOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Check persistent session and test Firestore connection on mount
  useEffect(() => {
    // Validate Firestore connection per firebase-integration skill
    testFirestoreConnection();

    const initUser = async () => {
      const token = authStorage.getToken();
      if (token) {
        try {
          const res = await api.getMe();
          setCurrentUser(res.user);
        } catch (err) {
          authStorage.clearToken();
          setCurrentUser(null);
        }
      }
      setInitializing(false);
    };

    initUser();
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'DRIVER') {
      setCurrentTab('driver');
    } else if (user.role === 'ADMIN') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('passenger');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onUserChange={setCurrentUser}
        onOpenMapsExplorer={() => setMapsModalOpen(true)}
        onOpenGeminiChat={() => setGeminiChatOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <LandingPage
            onStartBooking={() => setCurrentTab('passenger')}
            onDriveWithUs={() => {
              if (currentUser?.role === 'DRIVER') {
                setCurrentTab('driver');
              } else {
                handleOpenAuth('login');
              }
            }}
            onExplorePools={() => setCurrentTab('pools')}
          />
        )}

        {currentTab === 'passenger' && (
          <PassengerDashboard
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'driver' && (
          <DriverDashboard
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'pools' && (
          <PoolsView
            onBookRide={() => setCurrentTab('passenger')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}
      </main>

      {/* Mandatory Footer with Mamun Khan Link on Every Page */}
      <Footer />

      {/* Auth Modal with Firebase Google Sign-In and Demo Personas */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Google Maps Grounding Explorer Modal (powered by gemini-3.5-flash with googleMaps) */}
      <GoogleMapsGroundingModal
        isOpen={mapsModalOpen}
        onClose={() => setMapsModalOpen(false)}
        currentUser={currentUser}
        onSelectLocation={(locName) => {
          setMapsModalOpen(false);
          setCurrentTab('passenger');
        }}
      />

      {/* Gemini AI Transit Copilot Multi-Turn Chatbot */}
      <GeminiChatbot
        currentUser={currentUser}
        isOpen={geminiChatOpen}
        onClose={() => setGeminiChatOpen(false)}
      />
    </div>
  );
}
