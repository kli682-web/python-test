import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        {/* 首页 */}
        <Route path="/" element={<Homepage />} />
        
        {/* 登录页 */}
        <Route path="/login" element={<Login />} />
        
        {/* 注册页 */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;