import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';
import { DisableNumberInputScroll } from './components/DisableNumberInputScroll';
import { AuthProvider } from './context/AuthContext';
import { BrandProvider } from './context/BrandContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { LanguageProvider } from './context/LanguageContext';
import { features } from './config/features';
import { About } from './pages/About';
import { CarDetailsPage } from './pages/CarDetailsPage';
import { Contact } from './pages/Contact';
import { Favorites } from './pages/Favorites';
import { Home } from './pages/Home';
import { AuctionsPage } from './pages/AuctionsPage';
import { OwnerLogin } from './pages/OwnerLogin';
import { OwnerRegister } from './pages/OwnerRegister';
import { PaymentPage } from './pages/PaymentPage';
import { DashboardLayout } from './pages/DashboardLayout';
import { DashboardCars } from './pages/dashboard/DashboardCars';
import { DashboardProfile } from './pages/dashboard/DashboardProfile';
import { DashboardReservations } from './pages/dashboard/DashboardReservations';
import { DashboardAuctions } from './pages/dashboard/DashboardAuctions';
import { RequireOwnerAuth } from './components/RequireOwnerAuth';

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
  const hideNavbar = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/payment');

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
        {features.buy ? (
          <Route path="/auctions" element={<AuctionsPage />} />
        ) : (
          <Route path="/auctions" element={<Navigate to={defaultBrowsePath} replace />} />
        )}
        {features.buy ? (
          <Route path="/auction/:id" element={<CarDetailsPage />} />
        ) : (
          <Route path="/auction/:id" element={<Navigate to={defaultBrowsePath} replace />} />
        )}
        <Route path="/cars/:id" element={<CarDetailsPage />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/login" element={<OwnerLogin />} />
        <Route path="/register" element={<OwnerRegister />} />
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
          <Route path="auctions" element={<DashboardAuctions />} />
          <Route path="profile" element={<DashboardProfile />} />
          <Route path="reservations" element={<DashboardReservations />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
