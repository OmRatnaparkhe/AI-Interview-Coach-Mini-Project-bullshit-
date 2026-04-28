import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.tsx";
import MCQ from "./pages/MCQ.tsx";
import Voice from "./pages/Voice.tsx";
import ResumeReview from "./pages/ResumeReview.tsx";
import { Protected } from "./components/Protected.tsx";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { SignInPage, SignUpPage } from "./pages/Auth.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Sidebar from "./components/Sidebar.tsx";
import Landing from "./pages/Landing.tsx";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="md:ml-64">
        {children}
      </div>
    </div>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in/*" element={<AuthLayout><SignInPage /></AuthLayout>} />
        <Route path="/sign-up/*" element={<AuthLayout><SignUpPage /></AuthLayout>} />
        <Route path="/landing" element={<AuthLayout><Landing /></AuthLayout>} />
        
        {/* Conditional routing based on authentication */}
        <Route
          path="/"
          element={
            <>
              <SignedOut>
                <AuthLayout><Landing /></AuthLayout>
              </SignedOut>
              <SignedIn>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </SignedIn>
            </>
          }
        />
        
        <Route
          path="/onboarding"
          element={
            <Protected>
              <MainLayout>
                <Onboarding />
              </MainLayout>
            </Protected>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Protected>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </Protected>
          }
        />
        <Route
          path="/mcq"
          element={
            <Protected>
              <MainLayout>
                <MCQ />
              </MainLayout>
            </Protected>
          }
        />
        <Route
          path="/voice"
          element={
            <Protected>
              <MainLayout>
                <Voice />
              </MainLayout>
            </Protected>
          }
        />
        <Route
          path="/resume"
          element={
            <Protected>
              <MainLayout>
                <ResumeReview />
              </MainLayout>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;