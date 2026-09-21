import React from 'react';
import DashboardPanel from '../components/DashboardPanel';

/**
 * Panel del Administrador. Usa el mismo componente que el panel del
 * empleado (mismo diseño y mismas secciones); la diferencia son las
 * acciones exclusivas del rol: cambiar roles, eliminar usuarios y crear
 * empleados.
 */
const AdminDashboard = () => <DashboardPanel role="admin" />;

export default AdminDashboard;
