import './style.css';
import Play from './Play'
import Host from './Host'
import Login from './Login';
import Create from './Create';
import HostDashboard from './HostDashboard';
import Dashboard from './Dashboard'
import Overlay from './Overlay';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

function RankRumble() {
  return (
    <Router>
      <Routes>
          <Route path='/' element={<Login />} />
          <Route path='/hostdashboard' element={<HostDashboard />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/create' element={<Create />} />
          <Route path='/play' element={<Play />} />
          <Route path='/host' element={<Host />} />
          <Route path='/overlay' element={<Overlay />} />
      </Routes>
    </Router>

  );
}

export default RankRumble;
