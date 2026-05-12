import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Importar logos
import logoAccesalud from '../assets/Accesalud.png';
import logoEmtra from '../assets/Emtra.png';
import logoEmtrasur from '../assets/EmtraSur.png';
import logoInprosalud from '../assets/InprosaludPlus.png';
import logoSertti from '../assets/Sertti.png';
import logoSiMadrid from '../assets/simadrid.png';
import logoSoluciones from '../assets/solucionescorp.png';

const Sidebar = () => {
  const { usuario, logout, tienePermiso } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Obtener el logo según la empresa
  const getLogo = () => {
    switch (usuario?.empresa_id) {
      case 1: return logoAccesalud;
      case 2: return logoEmtra;
      case 3: return logoEmtrasur;
      case 4: return logoInprosalud;
      case 6: return logoSertti;
      case 7: return logoSiMadrid;
      case 8: return logoSoluciones;
      default: return logoEmtra;
    }
  };

  // Obtener la ruta de equipos según la empresa
  const getRutaEquipos = () => {
    switch (usuario?.empresa_id) {
      case 1: return '/accesalud';
      case 2: return '/emtra';
      case 3: return '/emtrasur';
      case 4: return '/inprosalud-plus';
      case 6: return '/sertti';
      case 7: return '/simadrid';
      case 8: return '/soluciones';
      default: return '/emtra';
    }
  };

  // ✅ MENÚ CON LA OPCIÓN HISTORIAL AGREGADA
  const menuItems = [
    { path: '/', nombre: 'Inicio', roles: ['super_admin', 'gestion', 'visualizador'] },
    { path: getRutaEquipos(), nombre: 'Equipos', roles: ['super_admin', 'gestion', 'visualizador'] },
    { path: '/papelera', nombre: 'Papelera', roles: ['super_admin'] },
    { path: '/historial', nombre: 'Historial', roles: ['super_admin', 'gestion'] },  // ✅ NUEVO
  ];

  const menuFiltrado = menuItems.filter(item => 
    tienePermiso(item.roles)
  );

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
      zIndex: 100
    }}>
      {/* Logo solamente - SIN texto de empresa */}
      <div style={{
        padding: '30px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <img 
          src={getLogo()} 
          alt="Logo"
          style={{
            width: '300px',
            height: '100px',
            objectFit: 'contain',
            borderRadius: '12px'
          }}
        />
      </div>

      {/* Información del usuario */}
      <div style={{
        padding: '0 20px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#f39200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '16px',
            color: '#1a1a2e'
          }}>
            {usuario?.nombre?.charAt(0) || 'U'}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: '500', fontSize: '14px', color: '#fff' }}>{usuario?.nombre}</p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>
              {usuario?.rol === 'super_admin' ? 'Administrador' : usuario?.rol === 'gestion' ? 'Gestión' : 'Visualizador'}
            </p>
          </div>
        </div>
      </div>

      {/* Menú */}
      <nav style={{ flex: 1 }}>
        {menuFiltrado.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: '12px 24px',
              margin: '4px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: location.pathname === item.path ? '#f39200' : 'transparent',
              color: location.pathname === item.path ? '#fff' : '#aaa',
              fontWeight: location.pathname === item.path ? '500' : '400'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = 'rgba(243,146,0,0.15)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#aaa';
              }
            }}
          >
            {item.nombre}
          </div>
        ))}
      </nav>

      {/* Botón cerrar sesión */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        marginTop: 'auto'
      }}>
        <div
          onClick={handleLogout}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: '#ff6b6b',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Cerrar Sesión
        </div>
      </div>
    </div>
  );
};

export default Sidebar;