import { Navigate, Route, Routes } from 'react-router-dom';

import { BottomNavLayout } from './ui/BottomNavLayout';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { OrderPage } from './pages/OrderPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { EditProfilePage } from './pages/EditProfilePage';
import { AddressesPage } from './pages/AddressesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { AboutPage } from './pages/AboutPage';
import { LegalPage } from './pages/LegalPage';
import { HelpPage } from './pages/HelpPage';

export default function App() {
  return (
    <Routes>
      <Route element={<BottomNavLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/addresses" element={<AddressesPage />} />
        <Route path="/profile/notifications" element={<NotificationsPage />} />
        <Route path="/profile/password" element={<ChangePasswordPage />} />
        <Route path="/profile/orders/:orderId" element={<OrderDetailsPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/legal/:type" element={<LegalPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
