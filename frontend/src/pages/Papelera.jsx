import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Papelera({ onRecargarEquipos }) {  // ← Recibir la función
  const [equiposEliminados, setEquiposEliminados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [equipoAEliminar, setEquipoAEliminar] = useState(null);
  const { token } = useAuth();
  const API_URL = 'http://localhost:5000/api';

  const cargarPapelera = async () => {
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/equipos/papelera`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEquiposEliminados(data.data);
      }
    } catch (error) {
      console.error('Error al cargar papelera:', error);
    } finally {
      setCargando(false);
    }
  };

  const restaurarEquipo = async (id) => {
    try {
      const response = await fetch(`${API_URL}/equipos/${id}/restaurar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('Equipo restaurado correctamente');
        await cargarPapelera();      // Recargar papelera
        if (onRecargarEquipos) {
          await onRecargarEquipos();  // ✅ Sincronizar lista principal
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const confirmarEliminarPermanente = (equipo) => {
    setEquipoAEliminar(equipo);
    setMostrarModalEliminar(true);
  };

  const ejecutarEliminarPermanente = async () => {
    if (!equipoAEliminar) return;
    try {
      const response = await fetch(`${API_URL}/equipos/${equipoAEliminar.id}/permanente`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert('Equipo eliminado permanentemente');
        setMostrarModalEliminar(false);
        setEquipoAEliminar(null);
        await cargarPapelera();      // Recargar papelera
        if (onRecargarEquipos) {
          await onRecargarEquipos();  // ✅ Sincronizar lista principal
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const cancelarEliminar = () => {
    setMostrarModalEliminar(false);
    setEquipoAEliminar(null);
  };

  const getDiasEnPapelera = (fecha) => {
    if (!fecha) return 0;
    const eliminado = new Date(fecha);
    const ahora = new Date();
    const diffTime = Math.abs(ahora - eliminado);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    cargarPapelera();
  }, []);

  if (cargando) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e', marginBottom: '24px' }}>
        Papelera de Reciclaje
      </h1>

      {equiposEliminados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
          No hay equipos en la papelera
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #aaa' }}>
            <thead>
              <tr style={{ background: '#0a1b3d', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Código</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Nombre Equipo</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Tipo</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Marca</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Eliminado el</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Días</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposEliminados.map((eq, idx) => {
                const bgColor = idx % 2 === 0 ? 'white' : '#fafafa';
                const dias = getDiasEnPapelera(eq.eliminado_en);
                const esAntiguo = dias > 15;
                return (
                  <tr key={eq.id} style={{ background: bgColor, opacity: esAntiguo ? 0.6 : 1 }}>
                    <td style={{ padding: '10px', border: '1px solid #aaa', fontWeight: 500 }}>{eq.codigo}</td>
                    <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.nombre_equipo}</td>
                    <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.tipo || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.marca || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #aaa' }}>
                      {eq.eliminado_en ? new Date(eq.eliminado_en).toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #aaa', textAlign: 'center' }}>
                      <span style={{ color: esAntiguo ? '#dc3545' : '#666', fontWeight: esAntiguo ? 'bold' : 'normal' }}>
                        {dias} días
                      </span>
                      {esAntiguo && <span style={{ marginLeft: '8px', color: '#dc3545', fontSize: '11px' }}>(&gt;15)</span>}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #aaa', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => restaurarEquipo(eq.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginRight: '8px'
                        }}
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => confirmarEliminarPermanente(eq)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación para eliminar permanentemente */}
      {mostrarModalEliminar && equipoAEliminar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', textAlign: 'center',
            boxShadow: '0 20px 35px rgba(0,0,0,0.2)'
          }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc3545', fontSize: '20px' }}>Confirmar eliminación</h3>
            <p style={{ marginBottom: '24px', color: '#555', lineHeight: '1.5' }}>
              ¿Estás seguro de eliminar permanentemente el equipo?<br />
              <strong style={{ color: '#f39200', fontSize: '16px' }}>{equipoAEliminar.nombre_equipo}</strong>
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={cancelarEliminar} style={{ padding: '10px 28px', backgroundColor: '#f8f9fa', color: '#495057', border: '1px solid #dee2e6', borderRadius: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Cancelar</button>
              <button onClick={ejecutarEliminarPermanente} style={{ padding: '10px 28px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Eliminar Permanentemente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Papelera;