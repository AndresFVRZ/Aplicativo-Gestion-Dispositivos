import { useState } from 'react';

function AcceSalud({ equipos }) {
  const [busqueda, setBusqueda] = useState('');
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  // Filtrar equipos de AcceSalud
  const equiposEmpresa = equipos.filter(eq => eq.empresa_nombre === 'AcceSalud');

  const equiposFiltrados = equiposEmpresa.filter(eq => 
    eq.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    eq.nombre_equipo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (eq.asignado_a && eq.asignado_a.toLowerCase().includes(busqueda.toLowerCase())) ||
    (eq.tipo && eq.tipo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const handleVerDetalle = (equipo) => setEquipoSeleccionado(equipo);
  const cerrarDetalle = () => setEquipoSeleccionado(null);

  return (
    <div style={{ padding: '20px' }}>
      <h1>AcceSalud - Equipos</h1>
      <p>Total de equipos: {equiposEmpresa.length}</p>

      {/* Buscador */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold' }}>🔍 Buscar:</label>
          <input
            type="text"
            placeholder="Buscar por código, nombre, asignado a, tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={{ padding: '8px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Limpiar
            </button>
          )}
        </div>
        {busqueda && <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>Resultados: {equiposFiltrados.length}</p>}
      </div>

      {/* Tabla */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#0a1b3d', color: 'white' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Código</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nombre Equipo</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tipo</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Marca</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Estado</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Asignado a</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {equiposFiltrados.map(eq => (
            <tr key={eq.id}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>{eq.codigo}</strong></td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{eq.nombre_equipo}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{eq.tipo}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{eq.marca}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                <span style={{ padding: '4px 8px', borderRadius: '12px', backgroundColor: eq.estado === 'Activo' ? '#d4edda' : '#f8d7da', color: eq.estado === 'Activo' ? '#155724' : '#721c24' }}>
                  {eq.estado}
                </span>
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{eq.asignado_a}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                <button onClick={() => handleVerDetalle(eq)} style={{ padding: '5px 10px', backgroundColor: '#f39200', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Ver Detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de Detalle */}
      {equipoSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Información Completa</h2>
              <button onClick={cerrarDetalle} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cerrar</button>
            </div>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr><td style={{ fontWeight: 'bold' }}>Código:</td><td>{equipoSeleccionado.codigo}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Nombre Equipo:</td><td>{equipoSeleccionado.nombre_equipo}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Tipo:</td><td>{equipoSeleccionado.tipo}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Marca:</td><td>{equipoSeleccionado.marca || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Modelo:</td><td>{equipoSeleccionado.modelo || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Serial:</td><td>{equipoSeleccionado.serial || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Estado:</td><td>{equipoSeleccionado.estado}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Ubicación:</td><td>{equipoSeleccionado.ubicacion || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Asignado a:</td><td>{equipoSeleccionado.asignado_a || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Procesador:</td><td>{equipoSeleccionado.procesador || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>RAM:</td><td>{equipoSeleccionado.ram || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Disco Duro:</td><td>{equipoSeleccionado.disco_duro || 'N/A'}</td></tr>
                <tr><td style={{ fontWeight: 'bold' }}>Sistema Operativo:</td><td>{equipoSeleccionado.sistema_operativo || 'N/A'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcceSalud;