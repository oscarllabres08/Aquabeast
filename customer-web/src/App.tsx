import { Navigate, Route, Routes } from 'react-router-dom';

import { BottomNavLayout } from './ui/BottomNavLayout';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { OrderPage } from './pages/OrderPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<BottomNavLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
