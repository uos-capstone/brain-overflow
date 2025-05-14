import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import MainPage from "./components/MainPage";
import ViewerPage from "./components/ViewerPage";

function AnimatedRoutes({ isAuthenticated }: { isAuthenticated: boolean }) {
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={
              <PageTransition>
                <LoginPage onLogin={() => {}} />
              </PageTransition>
            }
          />
          <Route
            path="/signup"
            element={
              <PageTransition>
                <SignUpPage />
              </PageTransition>
            }
          />
          <Route
            path="/generator"
            element={
              <PageTransition>
                {/* {isAuthenticated ? <MainPage /> : <Navigate to="/login" replace />} */}
                {isAuthenticated ? <MainPage /> : <MainPage />}
              </PageTransition>
            }
          />
          <Route
            path="/viewer"
            element={
              <PageTransition>
                <ViewerPage />
              </PageTransition>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

function App() {
  const [isAuthenticated] = React.useState(false);

  return (
    <Router>
      <AnimatedRoutes isAuthenticated={isAuthenticated} />
    </Router>
  );
}

export default App;
