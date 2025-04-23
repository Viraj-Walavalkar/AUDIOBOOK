import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Landing from './components/Landing';
import BookViewer from './components/BookViewer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/upload" element={<Landing />} />
          <Route path="/read" element={<BookViewer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;