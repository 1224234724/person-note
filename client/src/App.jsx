import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Archive from './pages/Archive.jsx';
import Messages from './pages/Messages.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';
import AdminEdit from './pages/AdminEdit.jsx';
import { isLoggedIn } from './lib/api.js';

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Admin />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/edit/:id?"
        element={
          <RequireAuth>
            <AdminEdit />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
