import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import MainLayout from './MainLayout';
import HomePage from './pages/Home/home';
import Login from './pages/Login/login';
import Chat from './pages/Chat/chat';
import NotFound from './pages/NotFound/notfound';

function App() {
  const [userInput, setUserInput] = useState('');

  return (
    <Router>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Routes with Navbar and Layout */}
        <Route element={<MainLayout />}>
          <Route
            path="/home"
            element={<HomePage setUserInput={setUserInput} />}
          />
          <Route
            path="/conversation"
            element={<Chat userInput={userInput} />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;
