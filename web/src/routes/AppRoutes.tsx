import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path='/admin/login' element={<Login />} />
      <Route path='/admin/register' element={<Register />} />

      <Route path='/' element={<Navigate to='/admin/login' replace />} />

      <Route path='*' element={<Navigate to='/admin/login' replace />} />
    </Routes>
  );
}
