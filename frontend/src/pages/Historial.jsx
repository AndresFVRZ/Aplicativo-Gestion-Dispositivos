import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importar logos (mismas rutas que en Sidebar)
import logoAccesalud from '../assets/Accesalud.png';
import logoEmtra from '../assets/Emtra.png';
import logoEmtrasur from '../assets/EmtraSur.png';
import logoInprosalud from '../assets/InprosaludPlus.png';
import logoSertti from '../assets/Sertti.png';
import logoSiMadrid from '../assets/simadrid.png';
import logoSoluciones from '../assets/solucionescorp.png';

function Historial() {
  const { usuario, token } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [total, setTotal] = useState(0);
  const API_URL = 'http://localhost:5000/api';

  // Obtener logo según la empresa
  const getLogo = () => {
    switch (usuario?.empresa_id) {
      case 1: return logoAccesalud;
      case 2: return logoEmtra;
      case 3: return logoEmtrasur;
      case 4: return logoInprosalud;
      case 5: return logoSertti;
      case 6: return logoSiMadrid;
      case 7: return logoSoluciones;
      default: return logoEmtra;
    }
  };

  // Obtener nombre de la empresa
  const getEmpresaNombre = () => {
    const empresas = {
      1: 'Accesalud',
      2: 'EMTRA',
      3: 'Emtrasur',
      4: 'Inprosalud Plus',
      5: 'Sertti',
      6: 'Si Madrid',
      7: 'Soluciones Corp'
    };
    return empresas[usuario?.empresa_id] || 'EMTRA';
  };

  const cargarHistorial = async () => {
    setCargando(true);
    try {
      let url = `${API_URL}/historial?limite=500`;
      if (filtroAccion !== 'todos') url += `&accion=${filtroAccion}`;
      if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
      if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistorial(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setCargando(false);
    }
  };

  // Descargar PDF - COLUMNAS OPTIMIZADAS para ver toda la información
  const descargarPDF = async () => {
    const doc = new jsPDF('landscape');
    const empresaNombre = getEmpresaNombre();
    const fechaActual = new Date().toLocaleString();
    const logo = getLogo();
    
    // Función para cargar el logo y convertirlo a base64 SIN REDIMENSIONAR
    const cargarLogoBase64 = (src) => {
      return new Promise((resolve) => {
        if (!src) {
          resolve(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        };
        img.onerror = () => {
          console.error('Error cargando logo:', src);
          resolve(null);
        };
        img.src = src;
      });
    };

    // Esperar a que el logo cargue
    const logoDataUrl = await cargarLogoBase64(logo);
    
    // Agregar logo
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 10, 35, 0);
    }
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(10, 27, 61);
    doc.text(`Historial de Acciones - ${empresaNombre}`, 60, 20);
    
    // Subtítulo
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de generación: ${fechaActual}`, 60, 30);
    doc.text(`Total de registros: ${total}`, 60, 37);
    
    // Filtros aplicados
    let filtrosTexto = 'Filtros: ';
    if (filtroAccion !== 'todos') filtrosTexto += `Acción: ${filtroAccion} | `;
    if (fechaDesde) filtrosTexto += `Desde: ${fechaDesde} | `;
    if (fechaHasta) filtrosTexto += `Hasta: ${fechaHasta}`;
    if (filtrosTexto === 'Filtros: ') filtrosTexto = 'Filtros: Ninguno';
    
    doc.setFontSize(9);
    doc.text(filtrosTexto, 14, 48);
    
    // Tabla con columnas más anchas (sin límite de caracteres)
    const tableData = historial.map(h => [
      new Date(h.fecha).toLocaleString(),
      h.usuario_nombre || '-',
      h.usuario_email || '-',
      h.usuario_rol === 'super_admin' ? 'Administrador' : h.usuario_rol === 'gestion' ? 'Gestión' : 'Visualizador',
      h.accion === 'CREAR' ? 'Creación' :
      h.accion === 'EDITAR' ? 'Edición' :
      h.accion === 'ELIMINAR' ? 'Papelera' :
      h.accion === 'RESTAURAR' ? 'Restauración' :
      h.accion === 'ELIMINAR_PERMANENTE' ? 'Eliminación permanente' : h.accion,
      h.equipo_codigo || '-',
      h.equipo_nombre || '-',
      h.detalles || '-',  // Sin límite de caracteres
      h.ip_address || '-'
    ]);
    
    autoTable(doc, {
      startY: 55,
      head: [['Fecha', 'Usuario', 'Email', 'Rol', 'Acción', 'Código', 'Equipo', 'Detalles', 'IP']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [10, 27, 61], textColor: 255, fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 35 }, // Fecha
        1: { cellWidth: 30 }, // Usuario
        2: { cellWidth: 40 }, // Email
        3: { cellWidth: 22 }, // Rol
        4: { cellWidth: 22 }, // Acción
        5: { cellWidth: 25 }, // Código
        6: { cellWidth: 40 }, // Equipo
        7: { cellWidth: 'auto' }, // Detalles (ocupa el espacio restante)
        8: { cellWidth: 20 }, // IP
      },
      margin: { left: 14, right: 14 }
    });
    
    // Guardar PDF
    doc.save(`historial_${empresaNombre}_${new Date().toISOString().slice(0, 19)}.pdf`);
  };

  useEffect(() => {
    cargarHistorial();
  }, [filtroAccion, fechaDesde, fechaHasta]);

  const getColorAccion = (accion) => {
    switch (accion) {
      case 'CREAR': return { bg: '#d4edda', color: '#155724' };
      case 'EDITAR': return { bg: '#cce5ff', color: '#004085' };
      case 'ELIMINAR': return { bg: '#fff3cd', color: '#856404' };
      case 'RESTAURAR': return { bg: '#d1ecf1', color: '#0c5460' };
      case 'ELIMINAR_PERMANENTE': return { bg: '#f8d7da', color: '#721c24' };
      default: return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  const getTextoAccion = (accion) => {
    switch (accion) {
      case 'CREAR': return 'Creación';
      case 'EDITAR': return 'Edición';
      case 'ELIMINAR': return 'Papelera';
      case 'RESTAURAR': return 'Restauración';
      case 'ELIMINAR_PERMANENTE': return 'Eliminación permanente';
      default: return accion;
    }
  };

  if (cargando) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Cargando historial...</div>;
  }

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Segoe UI, Roboto, sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a2e', margin: 0 }}>
            Historial de Acciones
          </h1>
          <p style={{ color: '#666', marginTop: '6px' }}>
            Total de registros: <strong style={{ color: '#f39200' }}>{total}</strong>
          </p>
        </div>
        {historial.length > 0 && (
          <button
            onClick={descargarPDF}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📄 Descargar PDF
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontWeight: '500', marginRight: '8px' }}>Acción:</label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', background: 'white' }}
            >
              <option value="todos">Todos</option>
              <option value="CREAR">Creación</option>
              <option value="EDITAR">Edición</option>
              <option value="ELIMINAR">Papelera</option>
              <option value="RESTAURAR">Restauración</option>
              <option value="ELIMINAR_PERMANENTE">Eliminación permanente</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: '500', marginRight: '8px' }}>Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: '500', marginRight: '8px' }}>Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
          {(filtroAccion !== 'todos' || fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFiltroAccion('todos'); setFechaDesde(''); setFechaHasta(''); }}
              style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0a1b3d', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>Usuario</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>Rol</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>Acción</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>Equipo</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>Código</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>Detalles</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'left' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h, idx) => {
                const estilo = getColorAccion(h.accion);
                return (
                  <tr key={h.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(h.fecha).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {h.usuario_nombre || '-'}<br/>
                      <span style={{ fontSize: '11px', color: '#888' }}>{h.usuario_email || '-'}</span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        background: h.usuario_rol === 'super_admin' ? '#f39200' : '#6c757d',
                        color: 'white'
                      }}>
                        {h.usuario_rol === 'super_admin' ? 'Administrador' : h.usuario_rol === 'gestion' ? 'Gestión' : 'Visualizador'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: estilo.bg,
                        color: estilo.color
                      }}>
                        {getTextoAccion(h.accion)}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{h.equipo_nombre || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}><strong>{h.equipo_codigo || '-'}</strong></td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', maxWidth: '300px' }}>{h.detalles || '-'}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{h.ip_address || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {historial.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            No hay registros en el historial
          </div>
        )}
      </div>
    </div>
  );
}

export default Historial;