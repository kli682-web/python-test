import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat'; // ✅ 新增这一行
import './index.css';

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

        {/* ✅ 新增 Chat 页面 */}
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;