const API_URL = 'http://localhost:5000/api';

export const getEmpresas = async () => {
    try {
        const response = await fetch(`${API_URL}/empresas`);
        const data = await response.json();
        console.log('Empresas:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { success: false, data: [] };
    }
};

export const getEquipos = async () => {
    try {
        const response = await fetch(`${API_URL}/equipos`);
        const data = await response.json();
        console.log('Equipos:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { success: false, data: [] };
    }
};

export const getMantenimientos = async () => {
    try {
        const response = await fetch(`${API_URL}/mantenimientos`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { success: false, data: [] };
    }
};

export const getResumen = async () => {
    try {
        const response = await fetch(`${API_URL}/resumen`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { success: false, data: [] };
    }
};

// ==========================================
// NUEVAS FUNCIONES PARA EXPORTAR
// ==========================================

// Obtener información completa de una empresa (como Excel)
export const getEmpresaCompleta = async (id) => {
    try {
        const response = await fetch(`${API_URL}/empresas/${id}/exportar`);
        const data = await response.json();
        console.log('Empresa completa:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { success: false, data: null };
    }
};

// Exportar a CSV (para descargar como Excel)
export const exportarEmpresaAExcel = async (id, nombreEmpresa) => {
    try {
        const response = await fetch(`${API_URL}/empresas/${id}/exportar`);
        const data = await response.json();
        
        if (data.success) {
            // Crear contenido CSV
            const csvData = convertirACSV(data.data);
            
            // Descargar archivo
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${nombreEmpresa}_equipos_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return { success: true };
        }
        
        return { success: false };
    } catch (error) {
        console.error('Error:', error);
        return { success: false };
    }
};

// Convertir datos a formato CSV
function convertirACSV(data) {
    const rows = [];
    
    // Encabezados
    rows.push([
        'Código',
        'Nombre Equipo',
        'Tipo',
        'Marca',
        'Modelo',
        'Serial',
        'Estado',
        'Ubicación',
        'Asignado a',
        'Procesador',
        'RAM',
        'Disco Duro',
        'Sistema Operativo',
        'Fecha Compra',
        'Especificaciones'
    ]);
    
    // Datos de equipos
    data.equipos.forEach(eq => {
        rows.push([
            eq.codigo || '',
            eq.nombre_equipo || '',
            eq.tipo || '',
            eq.marca || '',
            eq.modelo || '',
            eq.serial || '',
            eq.estado || '',
            eq.ubicacion || '',
            eq.asignado_a || '',
            eq.procesador || '',
            eq.ram || '',
            eq.disco_duro || '',
            eq.sistema_operativo || '',
            eq.fecha_compra || '',
            eq.especificaciones || ''
        ]);
    });
    
    return rows.map(row => row.join(',')).join('\n');
}

// Obtener equipos por empresa específica
export const getEquiposPorEmpresa = async (empresaId) => {
    try {
        const response = await fetch(`${API_URL}/equipos/empresa/${empresaId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { success: false, data: [] };
    }
};

// Obtener equipos por tipo
export const getEquiposPorTipo = async (tipo) => {
    try {
        const response = await fetch(`${API_URL}/equipos/tipo/${tipo}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return { success: false, data: [] };
    }
};