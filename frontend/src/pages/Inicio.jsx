import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Inicio() {
  const { usuario, token } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const API_URL = 'http://localhost:5000/api';

  // Mapeo de empresas
  const empresasInfo = {
    2: { nombre: 'EMTRA', logo: '/src/assets/Emtra.png', descripcion: 'Gestión de equipos tecnológicos' },
    8: { nombre: 'Soluciones Corp', logo: '/src/assets/solucionescorp.png', descripcion: 'Gestión de equipos de soluciones corporativas' }
  };

  const empresaActual = empresasInfo[usuario?.empresa_id] || { 
    nombre: usuario?.empresa_nombre || 'Mi Empresa', 
    logo: null, 
    descripcion: 'Gestión de equipos' 
  };

  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        const response = await fetch(`${API_URL}/equipos?empresa_id=${usuario?.empresa_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setEquipos(data.data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setCargando(false);
      }
    };
    
    if (usuario && token) {
      cargarEquipos();
    } else {
      setCargando(false);
    }
  }, [usuario, token]);

  // Estadísticas (solo las 4 que se muestran)
  const total = equipos.length;
  const desktops = equipos.filter(e => e.tipo === 'Desktop').length;
  const laptops = equipos.filter(e => e.tipo === 'Laptop').length;
  const disponibles = equipos.filter(e => e.estado === 'Disponible' || !e.asignado_a || e.asignado_a === '').length;

  if (cargando) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando información...</div>;
  }

  return (
    <div style={{ padding: '32px', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      
      {/* Tarjeta de bienvenida */}
      <div style={{
        background: 'linear-gradient(135deg, #0a1b3d, #1a2a4a)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {empresaActual.logo && (
            <img src={empresaActual.logo} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'white', borderRadius: '12px', padding: '8px' }} />
          )}
          <div>
            <h1 style={{ fontSize: '28px', margin: '0 0 8px 0' }}>{empresaActual.nombre}</h1>
            <p style={{ opacity: 0.9, margin: 0 }}>{empresaActual.descripcion}</p>
            <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
              Bienvenido, <strong>{usuario?.nombre}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas principales (solo 4) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Total Equipos */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #0a1b3d' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0a1b3d' }}>{total}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>Total Equipos</div>
        </div>

        {/* Desktops */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #007bff' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007bff' }}>{desktops}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}> Desktops</div>
        </div>

        {/* Laptops */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #17a2b8' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#17a2b8' }}>{laptops}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}> Laptops</div>
        </div>

        {/* Disponibles */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #28a745' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>{disponibles}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}> Disponibles</div>
        </div>
      </div>

      {/* Últimos equipos agregados */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1a1a2e' }}>Últimos equipos agregados</h3>
        {equipos.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No hay equipos registrados</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Código</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Estado</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Asignado a</th>
                </tr>
              </thead>
              <tbody>
                {equipos.slice(0, 5).map(eq => (
                  <tr key={eq.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}><strong>{eq.codigo}</strong></td>
                    <td style={{ padding: '12px' }}>{eq.nombre_equipo}</td>
                    <td style={{ padding: '12px' }}>{eq.tipo === 'Desktop' ? ' Desktop' : eq.tipo === 'Laptop' ? ' Laptop' : eq.tipo}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: eq.estado === 'Activo' ? '#d4edda' : 
                                  eq.estado === 'Disponible' ? '#cce5ff' : '#fff3cd',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        color: eq.estado === 'Activo' ? '#155724' : 
                               eq.estado === 'Disponible' ? '#004085' : '#856404'
                      }}>
                        {eq.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{eq.asignado_a || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inicio;