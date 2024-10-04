import './style.css';
import Play from './Play'
import Host from './Host'
import {Routes, Route} from 'react-router-dom'

function RankRumble() {
  return (
    <Routes>
        <Route path='/play/:userID' element={<Play />} />
        <Route path='/host/:uuid' element={<Host />} />
    </Routes>
  );
}

export default RankRumble;
