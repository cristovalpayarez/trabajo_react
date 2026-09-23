import React from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CarritoProvider } from './context/CarritoContext';
import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';
import Chatbot from './components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';

import Header from './components/Header';
import Carousel from './components/Carousel';
import ProductGrid from './components/ProductGrid';
import Carrito from './components/Carrito';
import Nosotros from './components/Nosotros';
import Contacto from './components/Contacto';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeForm from './pages/EmployeeForm';
import ClientDashboard from './pages/ClientDashboard';
import RecoverPassword from './pages/RecoverPassword';

import Footer from './components/Footer';

// Rutas que tienen su propio layout (sidebar) y no deben mostrar
// el Header ni el Footer del sitio público.
const PANEL_ROUTE_PREFIXES = ['/admin', '/empleado', '/client-dashboard'];

function AppContent() {
  const location = useLocation();
  const isPanelRoute = PANEL_ROUTE_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  );

  return (
    <div className="bg-gaming-dark min-h-screen text-white flex flex-col">

      {!isPanelRoute && <Header />}

      <main className={isPanelRoute ? 'flex-grow' : 'flex-grow pt-24'}>

        <Routes>

          {/* ================================= */}
          {/* INICIO */}
          {/* ================================= */}

          <Route
            path="/"
            element={
              <div className="space-y-16">

                <section className="px-6 sm:px-12 pt-6">
                  <Carousel />
                </section>

                <section>
                  <ProductGrid />
                </section>

              </div>
            }
          />

          <Route
            path="/catalogo"
            element={<ProductGrid />}
          />

          {/* ================================= */}
          {/* QUIÉNES SOMOS */}
          {/* ================================= */}

          <Route
            path="/quienes-somos"
            element={<Nosotros />}
          />

          {/* ================================= */}
          {/* CONTACTO */}
          {/* ================================= */}

          <Route
            path="/contacto"
            element={<Contacto />}
          />

          {/* ================================= */}
          {/* LOGIN */}
          {/* ================================= */}

          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/recuperar-password"
            element={<RecoverPassword />}
          />

          {/* ================================= */}
          {/* RECUPERAR CONTRASEÑA */}
          {/* ================================= */}

          <Route
            path="/recover-password"
            element={<RecoverPassword />}
          />

          {/* ================================= */}
          {/* CLIENTE */}
          {/* ================================= */}

          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute requiredRole="customer">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* ================================= */}
          {/* ADMINISTRADOR */}
          {/* ================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/empleados"
            element={
              <ProtectedRoute requiredRole="admin">
                <EmployeeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empleado"
            element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>

      </main>

      {!isPanelRoute && <Footer />}

      {/* ================================= */}
      {/* BOTÓN FLOTANTE DE WHATSAPP */}
      {/* ================================= */}

      {!isPanelRoute && (
        <WhatsAppButton
          phoneNumber="573044697238"
          message="Hola, quisiera obtener información sobre sus servicios."
        />
      )}

      {/* ================================= */}
      {/* CHATBOT FLOTANTE (solo en la página pública) */}
      {/* ================================= */}

      {!isPanelRoute && <Chatbot />}

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CarritoProvider>
          <Router>
            <AppContent />
          </Router>
        </CarritoProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;