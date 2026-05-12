import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function Soluciones({ equipos, setEquipos, token }) {
  const [busqueda, setBusqueda] = useState('');
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [formData, setFormData] = useState({});
  const [mostrarFormularioAgregar, setMostrarFormularioAgregar] = useState(false);
  const [errores, setErrores] = useState({});
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [equipoAEliminar, setEquipoAEliminar] = useState(null);
  const [nuevoEquipo, setNuevoEquipo] = useState({
    codigo: '', nombre_equipo: '', tipo: 'Desktop', marca: '', modelo: '',
    serial: '', estado: 'Activo', ubicacion: '', asignado_a: '',
    procesador: '', ram: '', disco_duro: '', sistema_operativo: '',
    fecha_asignacion: '', garantia: '', empresa_id: 8
  });
  const [cargando, setCargando] = useState(false);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20);

  const API_URL = 'http://localhost:5000/api';

  // Función para recargar equipos
  const recargarEquipos = async () => {
    try {
      const response = await fetch(`${API_URL}/equipos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setEquipos(data.data);
      }
    } catch (error) {
      console.error('Error al recargar equipos:', error);
    }
  };

  // Función para importar Excel
  const importarExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('El archivo no contiene datos');
          return;
        }

        setCargando(true);
        let importados = 0;
        let errores = [];

        for (const row of jsonData) {
          try {
            const nuevoEquipoData = {
              codigo: row.codigo || row.Codigo || row.CÓDIGO,
              nombre_equipo: row.nombre_equipo || row.NombreEquipo || row.NOMBRE_EQUIPO,
              tipo: row.tipo || row.Tipo || row.TIPO || 'Desktop',
              marca: row.marca || row.Marca || row.MARCA,
              modelo: row.modelo || row.Modelo || row.MODELO,
              serial: row.serial || row.Serial || row.SERIAL,
              estado: row.estado || row.Estado || row.ESTADO || 'Activo',
              ubicacion: row.ubicacion || row.Ubicacion || row.UBICACION,
              asignado_a: row.asignado_a || row.AsignadoA || row.ASIGNADO_A,
              procesador: row.procesador || row.Procesador || row.PROCESADOR,
              ram: row.ram || row.RAM,
              disco_duro: row.disco_duro || row.DiscoDuro || row.DISCO_DURO,
              sistema_operativo: row.sistema_operativo || row.SistemaOperativo || row.SISTEMA_OPERATIVO,
              fecha_asignacion: row.fecha_asignacion || row.FechaAsignacion || row.FECHA_ASIGNACION,
              garantia: row.garantia || row.Garantia || row.GARANTIA,
              empresa_id: 8
            };

            if (!nuevoEquipoData.codigo || !nuevoEquipoData.nombre_equipo) {
              errores.push(`Fila ${importados + 1}: Faltan campos obligatorios (código y nombre)`);
              continue;
            }

            const res = await fetch(`${API_URL}/equipos`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(nuevoEquipoData)
            });
            const result = await res.json();
            
            if (result.success) {
              importados++;
            } else {
              errores.push(`Fila ${importados + 1}: ${result.message}`);
            }
          } catch (error) {
            errores.push(`Fila ${importados + 1}: Error de conexión`);
          }
        }

        await recargarEquipos();
        alert(`✅ Importación completada\n📊 Importados: ${importados}\n❌ Errores: ${errores.length}`);
        if (errores.length > 0 && errores.length <= 10) {
          alert('Detalles de errores:\n' + errores.join('\n'));
        }
      } catch (error) {
        console.error('Error al leer el archivo:', error);
        alert('Error al leer el archivo. Asegúrate de que sea un Excel válido.');
      } finally {
        setCargando(false);
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Calcular estado de garantía con días y meses
  const calcularGarantia = (fechaFinGarantia) => {
    if (!fechaFinGarantia) return null;
    
    const hoy = new Date();
    const fin = new Date(fechaFinGarantia);
    const diffTime = fin - hoy;
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDias < 0) {
      return { texto: 'Vencida', color: '#dc3545', bg: '#f8d7da', dias: Math.abs(diffDias) };
    } else if (diffDias <= 30) {
      return { texto: 'Por vencer', color: '#f39200', bg: '#fff3cd', dias: diffDias };
    } else {
      const meses = Math.floor(diffDias / 30);
      const diasRestantes = diffDias % 30;
      return { texto: 'Vigente', color: '#28a745', bg: '#d4edda', meses: meses, dias: diasRestantes, totalDias: diffDias };
    }
  };

  const formatearGarantia = (fechaFinGarantia) => {
    const garantia = calcularGarantia(fechaFinGarantia);
    if (!garantia) return 'No definida';
    
    if (garantia.texto === 'Vencida') {
      return `Vencida (hace ${garantia.dias} días)`;
    }
    if (garantia.texto === 'Por vencer') {
      return `Vence en ${garantia.dias} días`;
    }
    if (garantia.meses > 0 && garantia.dias > 0) {
      return `Vigente (${garantia.meses} mes${garantia.meses !== 1 ? 'es' : ''} y ${garantia.dias} día${garantia.dias !== 1 ? 's' : ''} restantes)`;
    } else if (garantia.meses > 0) {
      return `Vigente (${garantia.meses} mes${garantia.meses !== 1 ? 'es' : ''} restantes)`;
    } else if (garantia.dias > 0) {
      return `Vigente (${garantia.dias} día${garantia.dias !== 1 ? 's' : ''} restantes)`;
    }
    return 'Vigente';
  };

  const equiposSoluciones = equipos?.filter(eq => eq.empresa_id === 8) || [];
  
  const equiposFiltrados = equiposSoluciones.filter(eq => {
    if (!busqueda) return true;
    const lower = busqueda.toLowerCase();
    return eq.codigo?.toLowerCase().includes(lower) ||
           eq.asignado_a?.toLowerCase().includes(lower);
  });

  // Paginación
  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const equiposPaginados = equiposFiltrados.slice(indicePrimerRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(equiposFiltrados.length / registrosPorPagina);

  const irPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    setEquipoSeleccionado(null);
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
      setEquipoSeleccionado(null);
    }
  };

  const paginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
      setEquipoSeleccionado(null);
    }
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
    setEquipoSeleccionado(null);
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setPaginaActual(1);
    setEquipoSeleccionado(null);
  };

  const validarCampo = (nombre, valor) => {
    if (!valor || valor.trim() === '') {
      setErrores(prev => ({ ...prev, [nombre]: 'Este campo es obligatorio' }));
      return false;
    }
    setErrores(prev => ({ ...prev, [nombre]: '' }));
    return true;
  };

  const handleChange = (campo, valor) => {
    setNuevoEquipo(prev => ({ ...prev, [campo]: valor }));
    validarCampo(campo, valor);
  };

  const validarTodos = () => {
    const campos = ['codigo', 'nombre_equipo', 'tipo', 'marca', 'modelo', 'serial',
      'estado', 'ubicacion', 'asignado_a', 'procesador', 'ram',
      'disco_duro', 'sistema_operativo', 'fecha_asignacion', 'garantia'];
    let valido = true;
    campos.forEach(campo => {
      if (!validarCampo(campo, nuevoEquipo[campo])) valido = false;
    });
    return valido;
  };

  const agregarEquipo = async () => {
    if (!validarTodos()) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/equipos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...nuevoEquipo, empresa_id: 8 })
      });
      const data = await res.json();
      if (data.success) {
        setEquipos(prev => [...prev, data.data]);
        setMostrarFormularioAgregar(false);
        setNuevoEquipo({
          codigo: '', nombre_equipo: '', tipo: 'Desktop', marca: '', modelo: '',
          serial: '', estado: 'Activo', ubicacion: '', asignado_a: '',
          procesador: '', ram: '', disco_duro: '', sistema_operativo: '',
          fecha_asignacion: '', garantia: '', empresa_id: 8
        });
        setErrores({});
        alert('Equipo agregado correctamente');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const editarEquipo = (equipo) => {
    setEquipoEditando(equipo);
    setFormData({ ...equipo });
  };

  const handleEditChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const guardarEdicion = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/equipos/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setEquipos(prev => prev.map(eq => eq.id === formData.id ? data.data : eq));
        setEquipoSeleccionado(data.data);
        setEquipoEditando(null);
        alert('Equipo actualizado correctamente');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const confirmarEliminar = (id, nombre) => {
    setEquipoAEliminar({ id, nombre });
    setMostrarModalEliminar(true);
  };

  const ejecutarEliminar = async () => {
    if (!equipoAEliminar) return;
    setCargando(true);
    setMostrarModalEliminar(false);
    try {
      const res = await fetch(`${API_URL}/equipos/${equipoAEliminar.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEquipos(prev => prev.filter(eq => eq.id !== equipoAEliminar.id));
        if (equipoSeleccionado?.id === equipoAEliminar.id) setEquipoSeleccionado(null);
        alert('Equipo eliminado correctamente');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error de conexión con el servidor');
    } finally {
      setCargando(false);
      setEquipoAEliminar(null);
    }
  };

  const cancelarEliminar = () => {
    setMostrarModalEliminar(false);
    setEquipoAEliminar(null);
  };

  const verDetalle = (equipo) => {
    setEquipoSeleccionado(equipoSeleccionado?.id === equipo.id ? null : equipo);
    setEquipoEditando(null);
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'Activo': return { background: '#d4edda', color: '#155724' };
      case 'Asignado': return { background: '#cce5ff', color: '#004085' };
      case 'Disponible': return { background: '#e2e3e5', color: '#383d41' };
      case 'Préstamo': return { background: '#fff3cd', color: '#856404' };
      case 'Reparación': return { background: '#ffe5b4', color: '#cc7000' };
      case 'Dañado': return { background: '#f8d7da', color: '#721c24' };
      case 'Baja': return { background: '#343a40', color: '#ffffff' };
      default: return { background: '#e2e3e5', color: '#383d41' };
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    return fecha.split('T')[0];
  };

  const styles = {
    btnPrimary: { background: '#2c7a7d', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
    btnSuccess: { background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontWeight: '500', cursor: 'pointer', fontSize: '12px' },
    btnWarning: { background: '#4a5568', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontWeight: '500', cursor: 'pointer', fontSize: '12px' },
    btnDanger: { background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontWeight: '500', cursor: 'pointer', fontSize: '12px' },
    btnSecondary: { background: '#718096', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' },
    btnBlue: { background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontWeight: '500', cursor: 'pointer', fontSize: '12px' },
    inputError: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '2px solid #dc3545', fontSize: '13px', outline: 'none', backgroundColor: '#fff8f8' },
    input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', outline: 'none' },
    selectError: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '2px solid #dc3545', fontSize: '13px', background: 'white' },
    select: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', background: 'white' },
    card: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '20px' },
    errorText: { color: '#dc3545', fontSize: '11px', marginTop: '4px', fontWeight: 500 }
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Segoe UI, Roboto, sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a2e', margin: 0 }}>Equipos Soluciones Corp</h1>
          <p style={{ color: '#666', marginTop: '6px', fontSize: '14px' }}>
            Total: <strong style={{ fontSize: '20px', color: '#2c7a7d' }}>{equiposSoluciones.length}</strong> equipos registrados
          </p>
        </div>
        <button onClick={() => setMostrarFormularioAgregar(true)} style={styles.btnPrimary}>
          Agregar Dispositivo
        </button>
      </div>

      {/* Formulario Agregar */}
      {mostrarFormularioAgregar && (
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px', color: '#333', fontSize: '16px' }}>Nuevo Dispositivo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            <div><input style={errores.codigo ? styles.inputError : styles.input} placeholder="Codigo *" value={nuevoEquipo.codigo} onChange={(e) => handleChange('codigo', e.target.value)} />{errores.codigo && <div style={styles.errorText}>{errores.codigo}</div>}</div>
            <div><input style={errores.nombre_equipo ? styles.inputError : styles.input} placeholder="Nombre Equipo *" value={nuevoEquipo.nombre_equipo} onChange={(e) => handleChange('nombre_equipo', e.target.value)} />{errores.nombre_equipo && <div style={styles.errorText}>{errores.nombre_equipo}</div>}</div>
            <div><select style={errores.tipo ? styles.selectError : styles.select} value={nuevoEquipo.tipo} onChange={(e) => handleChange('tipo', e.target.value)}><option>Desktop</option><option>Laptop</option><option>All-in-One</option></select>{errores.tipo && <div style={styles.errorText}>{errores.tipo}</div>}</div>
            <div><input style={errores.marca ? styles.inputError : styles.input} placeholder="Marca *" value={nuevoEquipo.marca} onChange={(e) => handleChange('marca', e.target.value)} />{errores.marca && <div style={styles.errorText}>{errores.marca}</div>}</div>
            <div><input style={errores.modelo ? styles.inputError : styles.input} placeholder="Modelo *" value={nuevoEquipo.modelo} onChange={(e) => handleChange('modelo', e.target.value)} />{errores.modelo && <div style={styles.errorText}>{errores.modelo}</div>}</div>
            <div><input style={errores.serial ? styles.inputError : styles.input} placeholder="Serial *" value={nuevoEquipo.serial} onChange={(e) => handleChange('serial', e.target.value)} />{errores.serial && <div style={styles.errorText}>{errores.serial}</div>}</div>
            <div><select style={errores.estado ? styles.selectError : styles.select} value={nuevoEquipo.estado} onChange={(e) => handleChange('estado', e.target.value)}><option>Activo</option><option>Asignado</option><option>Disponible</option><option>Préstamo</option><option>Reparación</option><option>Dañado</option><option>Baja</option></select>{errores.estado && <div style={styles.errorText}>{errores.estado}</div>}</div>
            <div><input style={errores.ubicacion ? styles.inputError : styles.input} placeholder="Ubicacion *" value={nuevoEquipo.ubicacion} onChange={(e) => handleChange('ubicacion', e.target.value)} />{errores.ubicacion && <div style={styles.errorText}>{errores.ubicacion}</div>}</div>
            <div><input style={errores.asignado_a ? styles.inputError : styles.input} placeholder="Asignado a *" value={nuevoEquipo.asignado_a} onChange={(e) => handleChange('asignado_a', e.target.value)} />{errores.asignado_a && <div style={styles.errorText}>{errores.asignado_a}</div>}</div>
            <div><input style={errores.procesador ? styles.inputError : styles.input} placeholder="Procesador *" value={nuevoEquipo.procesador} onChange={(e) => handleChange('procesador', e.target.value)} />{errores.procesador && <div style={styles.errorText}>{errores.procesador}</div>}</div>
            <div><input style={errores.ram ? styles.inputError : styles.input} placeholder="RAM *" value={nuevoEquipo.ram} onChange={(e) => handleChange('ram', e.target.value)} />{errores.ram && <div style={styles.errorText}>{errores.ram}</div>}</div>
            <div><input style={errores.disco_duro ? styles.inputError : styles.input} placeholder="Disco Duro *" value={nuevoEquipo.disco_duro} onChange={(e) => handleChange('disco_duro', e.target.value)} />{errores.disco_duro && <div style={styles.errorText}>{errores.disco_duro}</div>}</div>
            <div><input style={errores.sistema_operativo ? styles.inputError : styles.input} placeholder="Sistema Operativo *" value={nuevoEquipo.sistema_operativo} onChange={(e) => handleChange('sistema_operativo', e.target.value)} />{errores.sistema_operativo && <div style={styles.errorText}>{errores.sistema_operativo}</div>}</div>
            <div><input style={errores.fecha_asignacion ? styles.inputError : styles.input} type="date" value={formatFecha(nuevoEquipo.fecha_asignacion)} onChange={(e) => handleChange('fecha_asignacion', e.target.value)} />{errores.fecha_asignacion && <div style={styles.errorText}>{errores.fecha_asignacion}</div>}</div>
            <div><input style={errores.garantia ? styles.inputError : styles.input} placeholder="Garantia *" value={nuevoEquipo.garantia} onChange={(e) => handleChange('garantia', e.target.value)} />{errores.garantia && <div style={styles.errorText}>{errores.garantia}</div>}</div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              id="import-excel-soluciones"
              style={{ display: 'none' }}
              onChange={importarExcel}
            />
            <label htmlFor="import-excel-soluciones" style={styles.btnSecondary}>
              Importar Excel
            </label>
            <button onClick={() => setMostrarFormularioAgregar(false)} style={styles.btnSecondary}>Cancelar</button>
            <button onClick={agregarEquipo} disabled={cargando} style={styles.btnSuccess}>{cargando ? 'Guardando...' : 'Guardar Equipo'}</button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div style={{ ...styles.card, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 500, color: '#555' }}>Buscar:</span>
          <input type="text" placeholder="Código o usuario asignado..." value={busqueda} onChange={handleBusquedaChange} style={{ width: '250px', padding: '8px 14px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} />
          {busqueda && <button onClick={limpiarBusqueda} style={styles.btnSecondary}>Limpiar</button>}
          <span style={{ fontSize: '12px', color: '#888', background: '#f0f2f5', padding: '4px 12px', borderRadius: '20px' }}>
            {busqueda ? `${equiposFiltrados.length} resultados` : `${equiposSoluciones.length} total`}
          </span>
        </div>
      </div>

      {/* Tabla Principal */}
      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #aaa' }}>
            <thead>
              <tr style={{ background: '#0a1b3d', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Código</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Nombre Equipo</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Tipo</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Marca</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Modelo</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Estado</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a' }}>Asignado a</th>
                <th style={{ padding: '12px', border: '1px solid #2a3a5a', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equiposPaginados.map((eq, idx) => {
                const bgColor = equipoSeleccionado?.id === eq.id ? '#eef2ff' : idx % 2 === 0 ? 'white' : '#fafafa';
                return (
                  <React.Fragment key={eq.id}>
                    <tr style={{ background: bgColor }}>
                      <td style={{ padding: '10px', border: '1px solid #aaa', fontWeight: 500 }}>{eq.codigo}</td>
                      <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.nombre_equipo}</td>
                      <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.tipo}</td>
                      <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.marca || '-'}</td>
                      <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.modelo || '-'}</td>
                      <td style={{ padding: '10px', border: '1px solid #aaa' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, ...getEstadoStyle(eq.estado) }}>
                          {eq.estado}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #aaa' }}>{eq.asignado_a || '-'}</td>
                      <td style={{ padding: '10px', border: '1px solid #aaa', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={() => verDetalle(eq)} style={styles.btnWarning}>
                          {equipoSeleccionado?.id === eq.id ? 'Ocultar' : 'Ver'}
                        </button>
                        <button onClick={() => editarEquipo(eq)} style={{ ...styles.btnBlue, marginLeft: '6px' }}>Editar</button>
                        <button onClick={() => confirmarEliminar(eq.id, eq.nombre_equipo)} style={{ ...styles.btnDanger, marginLeft: '6px' }}>Eliminar</button>
                      </td>
                     </tr>

                    {/* Detalle del equipo - Tarjeta encerrada */}
                    {equipoSeleccionado?.id === eq.id && !equipoEditando && (
                      <tr style={{ background: '#fef9f0' }}>
                        <td colSpan="8" style={{ padding: 15, border: '1px solid #aaa', borderTop: '2px solid #2c7a7d' }}>
                          <div style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              background: '#2c7a7d',
                              color: 'white',
                              padding: '10px 15px',
                              fontSize: '13px',
                              fontWeight: 'bold'
                            }}>
                              Información del equipo: {eq.nombre_equipo} ({eq.codigo})
                            </div>
                            <div style={{ padding: '15px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <tbody>
                                  <tr><td style={{ padding: '6px 0', width: '33%' }}><strong>Código:</strong> {eq.codigo || 'N/A'}</td><td style={{ padding: '6px 0', width: '33%' }}><strong>Nombre:</strong> {eq.nombre_equipo || 'N/A'}</td><td style={{ padding: '6px 0', width: '33%' }}><strong>Tipo:</strong> {eq.tipo || 'N/A'}</td></tr>
                                  <tr><td style={{ padding: '6px 0' }}><strong>Marca:</strong> {eq.marca || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>Modelo:</strong> {eq.modelo || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>Serial:</strong> {eq.serial || 'N/A'}</td></tr>
                                  <tr><td style={{ padding: '6px 0' }}><strong>Ubicación:</strong> {eq.ubicacion || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>Asignado a:</strong> {eq.asignado_a || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>Estado:</strong> {eq.estado || 'N/A'}</td></tr>
                                  <tr><td style={{ padding: '6px 0' }}><strong>Procesador:</strong> {eq.procesador || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>RAM:</strong> {eq.ram || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>Disco Duro:</strong> {eq.disco_duro || 'N/A'}</td></tr>
                                  <tr><td style={{ padding: '6px 0' }}><strong>Sistema Operativo:</strong> {eq.sistema_operativo || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>Fecha Asignación:</strong> {eq.fecha_asignacion || 'N/A'}</td><td style={{ padding: '6px 0' }}><strong>Garantía contratada:</strong> {eq.garantia || 'N/A'}</td></tr>
                                  <tr><td colSpan="3" style={{ padding: '8px 0 0 0' }}><strong>Estado de garantía:</strong> {' '}{eq.fecha_fin_garantia ? (<span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: calcularGarantia(eq.fecha_fin_garantia)?.bg || '#e2e3e5', color: calcularGarantia(eq.fecha_fin_garantia)?.color || '#383d41' }}>{formatearGarantia(eq.fecha_fin_garantia)}</span>) : eq.garantia ? 'Por calcular (fecha fin no definida)' : 'Sin garantía'}</td></tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Editar equipo */}
                    {equipoEditando?.id === eq.id && (
                      <tr style={{ background: '#fff8e7' }}>
                        <td colSpan="8" style={{ padding: '20px', borderTop: '2px solid #2c7a7d' }}>
                          <h4 style={{ margin: '0 0 16px', color: '#2c7a7d' }}>Editando: {eq.nombre_equipo}</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                            <div><label>Código:</label><input type="text" name="codigo" value={formData.codigo || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Nombre:</label><input type="text" name="nombre_equipo" value={formData.nombre_equipo || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Tipo:</label><select name="tipo" value={formData.tipo || ''} onChange={handleEditChange} style={styles.select}><option>Desktop</option><option>Laptop</option><option>All-in-One</option></select></div>
                            <div><label>Marca:</label><input type="text" name="marca" value={formData.marca || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Modelo:</label><input type="text" name="modelo" value={formData.modelo || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Serial:</label><input type="text" name="serial" value={formData.serial || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Estado:</label><select name="estado" value={formData.estado || ''} onChange={handleEditChange} style={styles.select}><option>Activo</option><option>Asignado</option><option>Disponible</option><option>Préstamo</option><option>Reparación</option><option>Dañado</option><option>Baja</option></select></div>
                            <div><label>Ubicación:</label><input type="text" name="ubicacion" value={formData.ubicacion || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Asignado a:</label><input type="text" name="asignado_a" value={formData.asignado_a || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Procesador:</label><input type="text" name="procesador" value={formData.procesador || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>RAM:</label><input type="text" name="ram" value={formData.ram || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Disco Duro:</label><input type="text" name="disco_duro" value={formData.disco_duro || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Sistema Operativo:</label><input type="text" name="sistema_operativo" value={formData.sistema_operativo || ''} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Fecha Asignación:</label><input type="date" name="fecha_asignacion" value={formatFecha(formData.fecha_asignacion)} onChange={handleEditChange} style={styles.input} /></div>
                            <div><label>Garantía:</label><input type="text" name="garantia" value={formData.garantia || ''} onChange={handleEditChange} style={styles.input} /></div>
                          </div>
                          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEquipoEditando(null)} style={styles.btnSecondary}>Cancelar</button>
                            <button onClick={guardarEdicion} disabled={cargando} style={styles.btnSuccess}>{cargando ? 'Guardando...' : 'Guardar Cambios'}</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          
          {equiposFiltrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
              {busqueda ? 'No se encontraron equipos con ese código o usuario' : 'No hay equipos registrados'}
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
          borderRadius: '0 0 12px 12px'
        }}>
          <div style={{ fontSize: '13px', color: '#6c757d' }}>
            Mostrando {equiposFiltrados.length === 0 ? 0 : indicePrimerRegistro + 1} a {Math.min(indiceUltimoRegistro, equiposFiltrados.length)} de {equiposFiltrados.length} equipos
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={paginaAnterior} disabled={paginaActual === 1} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dee2e6', backgroundColor: 'white', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', opacity: paginaActual === 1 ? 0.5 : 1 }}>◀ Anterior</button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(totalPaginas)].map((_, i) => {
                const numero = i + 1;
                if (Math.abs(numero - paginaActual) <= 2 || numero === 1 || numero === totalPaginas) {
                  return (<button key={numero} onClick={() => irPagina(numero)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dee2e6', backgroundColor: paginaActual === numero ? '#2c7a7d' : 'white', color: paginaActual === numero ? 'white' : '#333', cursor: 'pointer', fontWeight: paginaActual === numero ? 'bold' : 'normal' }}>{numero}</button>);
                } else if (numero === paginaActual - 3 || numero === paginaActual + 3) {
                  return <span key={numero} style={{ padding: '6px 8px', color: '#6c757d' }}>...</span>;
                }
                return null;
              })}
            </div>
            <button onClick={paginaSiguiente} disabled={paginaActual === totalPaginas} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dee2e6', backgroundColor: 'white', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaActual === totalPaginas ? 0.5 : 1 }}>Siguiente ▶</button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6c757d' }}>Mostrar:</span>
            <select value={registrosPorPagina} onChange={(e) => { setRegistrosPorPagina(Number(e.target.value)); setPaginaActual(1); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #dee2e6', backgroundColor: 'white', cursor: 'pointer' }}>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
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
              <span style={{ fontSize: '32px' }}>🗑️</span>
            </div>
            <h3 style={{ margin: '0 0 12px 0', color: '#e53e3e', fontSize: '20px' }}>Confirmar eliminación</h3>
            <p style={{ marginBottom: '24px', color: '#555', lineHeight: '1.5' }}>
              ¿Estás seguro de eliminar permanentemente el equipo?<br />
              <strong style={{ color: '#2c7a7d', fontSize: '16px' }}>{equipoAEliminar.nombre}</strong>
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={cancelarEliminar} style={{ ...styles.btnSecondary, padding: '10px 28px', borderRadius: '30px' }}>Cancelar</button>
              <button onClick={ejecutarEliminar} style={{ ...styles.btnDanger, padding: '10px 28px', borderRadius: '30px' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Soluciones;