import React from 'react';
import DashboardPanel from '../components/DashboardPanel';

/**
 * Panel del Cliente. Usa el mismo componente que el panel del administrador
 * (mismo diseño, sidebar y barra superior); la diferencia son las funciones
 * disponibles: perfil, pedidos, carrito, facturas y PQR.
 */
const ClientDashboard = () => <DashboardPanel role="customer" />;

export default ClientDashboard;