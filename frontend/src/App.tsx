import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage';
import ViewerPage from './components/ViewerPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage onLogin={() => setIsAuthenticated(true)} />}
        />
        <Route
          path="/generator"
          element={
            isAuthenticated ? (
              <MainPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;