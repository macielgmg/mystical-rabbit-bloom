import React from "react"; // Adicionado explicitamente
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import StudyLibrary from "./pages/StudyLibrary";
import Store from "./pages/Store";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import { SessionProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import StudyDetail from "./pages/StudyDetail";
import ChapterDetail from "./pages/ChapterDetail";
import Today from "./pages/Today";
import PersonalData from "./pages/PersonalData";
import SpiritualJournalPage from "./pages/SpiritualJournalPage";
import VerseOfTheDayPage from "./pages/VerseOfTheDayPage";
import AchievementsPage from "./pages/Achievements";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OnboardingQuiz from "./pages/OnboardingQuiz";
import { ThemeProvider } from "./components/theme-provider";
import ManageSubscriptionPage from "./pages/ManageSubscriptionPage";
import PreferencesPage from "./pages/PreferencesPage";
import SettingsPage from "./pages/SettingsPage";
import DailyStudyPage from "./pages/DailyStudyPage";
import QuickReflectionPage from "./pages/QuickReflectionPage";
import InspirationalQuotePage from "./pages/InspirationalQuotePage";
import MyPrayerPage from "./pages/MyPrayerPage";
import AboutAppPage from "./pages/AboutAppPage";
import AccountSecurityPage from "./pages/AccountSecurityPage";
import DailyHistoryPage from "./pages/DailyHistoryPage";
import HelpAndSupportPage from "./pages/HelpAndSupportPage"; // Import HelpAndSupportPage


const queryClient = new QueryClient();

const App = () => (
  <React.Fragment> {/* Adicionado React.Fragment aqui */}
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter> {/* BrowserRouter agora envolve SessionProvider e Sonner */}
            <SessionProvider>
              <Sonner /> {/* Movido para dentro do BrowserRouter */}
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                {/* Rota do OnboardingQuiz fora do Layout */}
                <Route path="/onboarding-quiz" element={<ProtectedRoute><OnboardingQuiz /></ProtectedRoute>} />
                <Route 
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/library" element={<StudyLibrary />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/personal-data" element={<PersonalData />} />
                  <Route path="/manage-subscription" element={<ManageSubscriptionPage />} />
                  <Route path="/preferences" element={<PreferencesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/about-app" element={<AboutAppPage />} />
                  <Route path="/account-security" element={<AccountSecurityPage />} />
                  <Route path="/help-and-support" element={<HelpAndSupportPage />} /> {/* New route for HelpAndSupportPage */}
                  <Route path="/study/:studyId" element={<StudyDetail />} />
                  <Route path="/study/:studyId/chapter/:chapterId" element={<ChapterDetail />} />
                  <Route path="/today" element={<Today />} />
                  <Route path="/today/spiritual-journal" element={<SpiritualJournalPage />} />
                  <Route path="/today/verse-of-the-day" element={<VerseOfTheDayPage />} />
                  <Route path="/today/daily-study" element={<DailyStudyPage />} />
                  <Route path="/today/quick-reflection" element={<QuickReflectionPage />} />
                  <Route path="/today/inspirational-quote" element={<InspirationalQuotePage />} />
                  <Route path="/today/my-prayer" element={<MyPrayerPage />} />
                  <Route path="/today/history/:date" element={<DailyHistoryPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SessionProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.Fragment> 
);

export default App;