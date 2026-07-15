import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';

import { Dashboard } from './pages/Dashboard';
import { AddProblem } from './pages/AddProblem';
import { Revision } from './pages/Revision';
import { ProblemDetail } from './pages/ProblemDetail';
import { CategoryDetail } from './pages/CategoryDetail';
import { ZettelkastenMap } from './pages/ZettelkastenMap';
import { ProblemNotes } from './pages/ProblemNotes';
import { Scratchpad } from './pages/Scratchpad';
import { useStore } from './store/useStore';
import classes from './App.module.css';

function App() {
  const fetchData = useStore(state => state.fetchData);
  const isLoading = useStore(state => state.isLoading);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading cloud data...</div>;
  }

  return (
    <BrowserRouter>
      <div className={classes.appContainer}>
        <header className={classes.header}>
          <Link to="/" className={classes.logo}>LeetFlash</Link>
          <nav className={classes.nav}>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? `${classes.navLink} ${classes.navLinkActive}` : classes.navLink}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/add" 
              className={({ isActive }) => isActive ? `${classes.navLink} ${classes.navLinkActive}` : classes.navLink}
            >
              Add Problem
            </NavLink>
            <NavLink 
              to="/map" 
              className={({ isActive }) => isActive ? `${classes.navLink} ${classes.navLinkActive}` : classes.navLink}
            >
              Graph
            </NavLink>
            <NavLink 
              to="/scratchpad" 
              className={({ isActive }) => isActive ? `${classes.navLink} ${classes.navLinkActive}` : classes.navLink}
            >
              Scratchpad
            </NavLink>
          </nav>
        </header>
        <main className={classes.mainContent}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddProblem />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="/problem/:id" element={<ProblemDetail />} />
            <Route path="/problem/:id/notes" element={<ProblemNotes />} />
            <Route path="/category/:pattern" element={<CategoryDetail />} />
            <Route path="/map" element={<ZettelkastenMap />} />
            <Route path="/scratchpad" element={<Scratchpad />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
