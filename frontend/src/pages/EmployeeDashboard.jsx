import React from 'react';
import DashboardPanel from '../components/DashboardPanel';

/**
 * Panel del Empleado: exactamente el mismo componente y diseño que el panel
 * del administrador (inicio con cards y gráficos, usuarios, productos,
 * pedidos, ventas, facturas, reportes, PQR y vista de usuario).
 */
const EmployeeDashboard = () => <DashboardPanel role="employee" />;

export default EmployeeDashboard;
