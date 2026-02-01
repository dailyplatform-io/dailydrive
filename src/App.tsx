import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';
import { DisableNumberInputScroll } from './components/DisableNumberInputScroll';
import { AuthProvider } from './context/AuthContext';
import { BrandProvider } from './context/BrandContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { LanguageProvider } from './context/LanguageContext';
import { features } from './config/features';
import { About } from './pages/about/About';
import { CarDetailsPage } from './pages/car-details/CarDetailsPage';
import { Home } from './pages/home/Home';
import { AuctionsPage } from './pages/auction/AuctionsPage';
import { PaymentPage } from './pages/payment/PaymentPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { DashboardCars } from './pages/dashboard/DashboardCars';
import { DashboardProfile } from './pages/dashboard/DashboardProfile';
import { DashboardReservations } from './pages/dashboard/DashboardReservations';
import { DashboardAuctions } from './pages/dashboard/DashboardAuctions';
import { DashboardAnalytics } from './pages/dashboard/DashboardAnalytics';
import { DashboardRevenue } from './pages/dashboard/DashboardRevenue';
import { DealerPage } from './pages/dealer/DealerPage';
import { RequireOwnerAuth } from './components/RequireOwnerAuth';
import { Favorites } from './pages/favorites/Favorites';
import { OwnerLogin } from './pages/owner/OwnerLogin';
import { OwnerRegister } from './pages/owner/OwnerRegister';
import { OwnerEmailVerification } from './pages/owner/OwnerEmailVerification';
import { OwnerForgotPassword } from './pages/owner/OwnerForgotPassword';
import { OwnerResetPassword } from './pages/owner/OwnerResetPassword';

function App() {
  const defaultBrowsePath = features.rent ? '/rent' : features.buy ? '/buy' : '/';

  return (
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>
          <BrandProvider>
            <BrowserRouter>
              <ScrollToTop />
              <DisableNumberInputScroll />
              <AppRoutes defaultBrowsePath={defaultBrowsePath} />
            </BrowserRouter>
          </BrandProvider>
        </FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

function AppRoutes({ defaultBrowsePath }: { defaultBrowsePath: string }) {
  const { pathname } = useLocation();
  const hideNavbar =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home variant="home" />} />
        <Route path="/cars" element={<Navigate to={defaultBrowsePath} replace />} />
        {features.rent ? (
          <Route path="/rent" element={<Home variant="cars" defaultMode="rent" />} />
        ) : (
          <Route path="/rent" element={<Navigate to={defaultBrowsePath} replace />} />
        )}
        {features.buy ? (
          <Route path="/buy" element={<Home variant="cars" defaultMode="buy" />} />
        ) : (
          <Route path="/buy" element={<Navigate to={defaultBrowsePath} replace />} />
        )}
        {features.auctions ? (
          <Route path="/auctions" element={<AuctionsPage />} />
        ) : (
          <Route path="/auctions" element={<Navigate to={defaultBrowsePath} replace />} />
        )}
        {features.auctions ? (
          <Route path="/auction/:id" element={<CarDetailsPage />} />
        ) : (
          <Route path="/auction/:id" element={<Navigate to={defaultBrowsePath} replace />} />
        )}
        <Route path="/dealer/:slug" element={<DealerPage />} />
        <Route path="/cars/:id" element={<CarDetailsPage />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/about" element={<About />} />

        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<OwnerRegister />} />
        <Route path="/verify-email" element={<OwnerEmailVerification />} />
        <Route path="/forgot-password" element={<OwnerForgotPassword />} />
        <Route path="/reset-password" element={<OwnerResetPassword />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireOwnerAuth>
              <DashboardLayout />
            </RequireOwnerAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard/cars" replace />} />
          <Route path="cars" element={<DashboardCars />} />
          {features.auctions ? (
            <Route path="auctions" element={<DashboardAuctions />} />
          ) : (
            <Route path="auctions" element={<Navigate to="/dashboard/cars" replace />} />
          )}
          <Route path="profile" element={<DashboardProfile />} />
          <Route path="reservations" element={<DashboardReservations />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
          <Route path="revenue" element={<DashboardRevenue />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
