const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'EMTRA_SECRET_KEY_2024';

app.use(cors());
app.use(express.json());

// ==========================================
// FUNCIÓN PARA CALCULAR FECHA FIN DE GARANTÍA
// ==========================================
const calcularFechaFinGarantia = (fechaAsignacion, garantiaTexto) => {
    if (!fechaAsignacion || !garantiaTexto) return null;
    
    const match = garantiaTexto.match(/\d+/);
    if (!match) return null;
    
    const meses = parseInt(match[0]);
    if (isNaN(meses) || meses <= 0) return null;
    
    const fecha = new Date(fechaAsignacion);
    fecha.setMonth(fecha.getMonth() + meses);
    return fecha.toISOString().split('T')[0];
};

// ==========================================
// FUNCIÓN PARA REGISTRAR HISTORIAL (CON EMPRESA_ID)
// ==========================================
const registrarHistorial = async (req, accion, equipoId, equipoCodigo, equipoNombre, detalles) => {
    try {
        const usuario = req.usuario;
        if (!usuario) return;
        
        await pool.query(
            `INSERT INTO historial_acciones 
             (usuario_id, usuario_nombre, usuario_email, usuario_rol, accion, 
              equipo_id, equipo_codigo, equipo_nombre, detalles, ip_address, empresa_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                usuario.id, 
                usuario.nombre, 
                usuario.email, 
                usuario.rol,
                accion, 
                equipoId, 
                equipoCodigo, 
                equipoNombre,
                detalles,
                req.ip || req.connection.remoteAddress,
                usuario.empresa_id
            ]
        );
        console.log(`📝 Historial: ${accion} - ${equipoCodigo} por ${usuario.nombre} (empresa: ${usuario.empresa_id})`);
    } catch (error) {
        console.error('Error al registrar historial:', error);
    }
};

// ==========================================
// RUTA DE BIENVENIDA
// ==========================================

app.get('/', (req, res) => {
    res.json({
        message: 'API de Gestión de Equipos EMTRA',
        version: '1.0.0',
        status: 'servidor activo',
        endpoints: {
            empresas: '/api/empresas',
            empresas_por_id: '/api/empresas/:id',
            equipos: '/api/equipos',
            equipos_por_empresa: '/api/equipos/empresa/:empresaId',
            equipos_por_tipo: '/api/equipos/tipo/:tipo',
            papelera: '/api/equipos/papelera',
            restaurar: '/api/equipos/:id/restaurar',
            mantenimientos: '/api/mantenimientos',
            mantenimientos_por_equipo: '/api/mantenimientos/equipo/:equipoId',
            resumen: '/api/resumen',
            exportar: '/api/empresas/:id/exportar',
            login: '/api/auth/login',
            verify: '/api/auth/verify',
            historial: '/api/historial',
            historial_equipo: '/api/historial/equipo/:equipoId',
            historial_resumen: '/api/historial/resumen'
        }
    });
});

// ==========================================
// MIDDLEWARE PARA VERIFICAR ROLES
// ==========================================

const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            if (!rolesPermitidos.includes(decoded.rol)) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para esta acción' });
            }
            req.usuario = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Token inválido' });
        }
    };
};

// ==========================================
// AUTENTICACIÓN
// ==========================================

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            `SELECT u.*, r.nombre as rol_nombre 
             FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.email = $1 AND u.estado = 'activo'`,
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];
        
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email, 
                nombre: usuario.nombre,
                rol: usuario.rol_nombre,
                rol_id: usuario.rol_id,
                empresa_id: usuario.empresa_id 
            },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol_nombre,
                rol_id: usuario.rol_id,
                empresa_id: usuario.empresa_id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Verificar token
app.get('/api/auth/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ success: true, usuario: decoded });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
});

// ==========================================
// ENDPOINTS DE EMPRESAS
// ==========================================

app.get('/api/empresas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empresas ORDER BY id');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/empresas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// ENDPOINTS DE EQUIPOS (CON PROTECCIÓN POR ROLES)
// ==========================================

// GET - Todos ven solo equipos de su empresa (activos, no eliminados)
app.get('/api/equipos', verificarRol(['super_admin', 'gestion', 'visualizador']), async (req, res) => {
    try {
        const empresaId = req.usuario.empresa_id;
        
        if (!empresaId) {
            return res.status(403).json({ success: false, message: 'No tienes una empresa asignada' });
        }
        
        const query = `
            SELECT 
                eq.*,
                e.nombre as empresa_nombre
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.empresa_id = $1 AND eq.eliminado = FALSE
            ORDER BY eq.tipo, eq.codigo
        `;
        
        const result = await pool.query(query, [empresaId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/equipos/empresa/:empresaId', verificarRol(['super_admin', 'gestion', 'visualizador']), async (req, res) => {
    try {
        const { empresaId } = req.params;
        const query = `
            SELECT 
                eq.*,
                e.nombre as empresa_nombre
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.empresa_id = $1 AND eq.eliminado = FALSE
            ORDER BY eq.tipo, eq.codigo
        `;
        const result = await pool.query(query, [empresaId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/equipos/tipo/:tipo', verificarRol(['super_admin', 'gestion', 'visualizador']), async (req, res) => {
    try {
        const { tipo } = req.params;
        const empresaId = req.usuario.empresa_id;
        
        const query = `
            SELECT 
                eq.*,
                e.nombre as empresa_nombre
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.empresa_id = $1 AND eq.tipo = $2 AND eq.eliminado = FALSE
            ORDER BY e.nombre
        `;
        const result = await pool.query(query, [empresaId, tipo]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// PAPELERA (SOLO SUPER_ADMIN)
// ==========================================

// GET - Obtener equipos eliminados (papelera)
app.get('/api/equipos/papelera', verificarRol(['super_admin']), async (req, res) => {
    try {
        const empresaId = req.usuario.empresa_id;
        
        const result = await pool.query(
            `SELECT 
                eq.*,
                u.nombre as eliminado_por_nombre
             FROM equipos eq
             LEFT JOIN usuarios u ON eq.eliminado_por = u.id
             WHERE eq.empresa_id = $1 AND eq.eliminado = TRUE
             ORDER BY eq.eliminado_en DESC`,
            [empresaId]
        );
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Restaurar equipo desde papelera
app.post('/api/equipos/:id/restaurar', verificarRol(['super_admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE equipos SET 
                eliminado = FALSE, 
                eliminado_en = NULL, 
                eliminado_por = NULL 
             WHERE id = $1 AND eliminado = TRUE
             RETURNING *`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado en papelera' });
        }
        
        await registrarHistorial(
            req, 'RESTAURAR', 
            id, 
            result.rows[0].codigo, 
            result.rows[0].nombre_equipo, 
            `Equipo restaurado desde papelera`
        );
        
        res.json({ success: true, message: 'Equipo restaurado correctamente', data: result.rows[0] });
    } catch (error) {
        console.error('Error al restaurar equipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// CRUD DE EQUIPOS (MODIFICADO CON FECHA_ASIGNACION)
// ==========================================

// PUT - Solo super_admin y gestion pueden editar
app.put('/api/equipos/:id', verificarRol(['super_admin', 'gestion']), async (req, res) => {
    const { id } = req.params;
    const {
        codigo,
        nombre_equipo,
        tipo,
        marca,
        modelo,
        serial,
        estado,
        ubicacion,
        asignado_a,
        fecha_asignacion,
        procesador,
        ram,
        disco_duro,
        sistema_operativo,
        garantia,
        especificaciones,
        empresa_id
    } = req.body;

    // Calcular fecha_fin_garantia usando fecha_asignacion
    const fecha_fin_garantia = calcularFechaFinGarantia(fecha_asignacion, garantia);

    try {
        const result = await pool.query(
            `UPDATE equipos SET 
                codigo = $1,
                nombre_equipo = $2,
                tipo = $3,
                marca = $4,
                modelo = $5,
                serial = $6,
                estado = $7,
                ubicacion = $8,
                asignado_a = $9,
                fecha_asignacion = $10,
                procesador = $11,
                ram = $12,
                disco_duro = $13,
                sistema_operativo = $14,
                garantia = $15,
                fecha_fin_garantia = $16,
                especificaciones = $17,
                empresa_id = $18
            WHERE id = $19 AND eliminado = FALSE
            RETURNING *`,
            [
                codigo, nombre_equipo, tipo, marca, modelo, serial,
                estado, ubicacion, asignado_a, fecha_asignacion, procesador, ram,
                disco_duro, sistema_operativo, garantia, fecha_fin_garantia,
                especificaciones, empresa_id, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
        }

        const query = `
            SELECT 
                eq.*,
                e.nombre as empresa_nombre
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.id = $1
        `;
        const equipoCompleto = await pool.query(query, [id]);

        await registrarHistorial(
            req, 'EDITAR', 
            id, 
            codigo, 
            nombre_equipo, 
            `Equipo editado: ${nombre_equipo} (${codigo})`
        );

        res.json({ success: true, data: equipoCompleto.rows[0] });
    } catch (error) {
        console.error('Error al actualizar equipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Solo super_admin y gestion pueden crear
app.post('/api/equipos', verificarRol(['super_admin', 'gestion']), async (req, res) => {
    const {
        codigo,
        nombre_equipo,
        tipo,
        marca,
        modelo,
        serial,
        estado,
        ubicacion,
        asignado_a,
        fecha_asignacion,
        procesador,
        ram,
        disco_duro,
        sistema_operativo,
        garantia,
        especificaciones,
        empresa_id
    } = req.body;

    // Calcular fecha_fin_garantia usando fecha_asignacion
    const fecha_fin_garantia = calcularFechaFinGarantia(fecha_asignacion, garantia);

    try {
        const result = await pool.query(
            `INSERT INTO equipos 
                (codigo, nombre_equipo, tipo, marca, modelo, serial, estado,
                 ubicacion, asignado_a, fecha_asignacion, procesador, ram, disco_duro,
                 sistema_operativo, garantia, fecha_fin_garantia,
                 especificaciones, empresa_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
             RETURNING *`,
            [
                codigo, nombre_equipo, tipo, marca, modelo, serial, estado,
                ubicacion, asignado_a, fecha_asignacion, procesador, ram, disco_duro,
                sistema_operativo, garantia, fecha_fin_garantia,
                especificaciones, empresa_id
            ]
        );

        const query = `
            SELECT 
                eq.*,
                e.nombre as empresa_nombre
            FROM equipos eq
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.id = $1
        `;
        const equipoCompleto = await pool.query(query, [result.rows[0].id]);

        await registrarHistorial(
            req, 'CREAR', 
            result.rows[0].id, 
            codigo, 
            nombre_equipo, 
            `Equipo creado: ${nombre_equipo} (${codigo}) con garantía hasta ${fecha_fin_garantia || 'N/A'}`
        );

        res.status(201).json({ success: true, data: equipoCompleto.rows[0] });
    } catch (error) {
        console.error('Error al crear equipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Soft delete (mover a papelera) - solo super_admin
app.delete('/api/equipos/:id', verificarRol(['super_admin']), async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    try {
        const result = await pool.query(
            `UPDATE equipos SET 
                eliminado = TRUE, 
                eliminado_en = NOW(), 
                eliminado_por = $1 
             WHERE id = $2 AND eliminado = FALSE
             RETURNING *`,
            [usuarioId, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado o ya eliminado' });
        }
        
        await registrarHistorial(
            req, 'ELIMINAR', 
            id, 
            result.rows[0].codigo, 
            result.rows[0].nombre_equipo, 
            `Equipo movido a papelera: ${result.rows[0].nombre_equipo}`
        );
        
        res.json({ success: true, message: 'Equipo movido a papelera', data: result.rows[0] });
    } catch (error) {
        console.error('Error al eliminar equipo:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// ELIMINAR PERMANENTEMENTE
// ==========================================

app.delete('/api/equipos/:id/permanente', verificarRol(['super_admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const equipoAntes = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
        
        const result = await pool.query('DELETE FROM equipos WHERE id = $1 AND eliminado = TRUE RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Equipo no encontrado en la papelera' });
        }
        
        await registrarHistorial(
            req, 'ELIMINAR_PERMANENTE', 
            id, 
            equipoAntes.rows[0].codigo, 
            equipoAntes.rows[0].nombre_equipo, 
            `Equipo eliminado permanentemente`
        );
        
        res.json({ success: true, message: 'Equipo eliminado permanentemente' });
    } catch (error) {
        console.error('Error al eliminar permanentemente:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Limpiar equipos con más de 15 días en la papelera
app.delete('/api/equipos/limpiar-papelera', verificarRol(['super_admin']), async (req, res) => {
    try {
        const empresaId = req.usuario.empresa_id;
        
        const result = await pool.query(
            `DELETE FROM equipos 
             WHERE empresa_id = $1 
             AND eliminado = TRUE 
             AND eliminado_en < NOW() - INTERVAL '15 days'
             RETURNING *`,
            [empresaId]
        );
        
        res.json({ 
            success: true, 
            message: `Se eliminaron permanentemente ${result.rows.length} equipos con más de 15 días en la papelera`,
            cantidad: result.rows.length
        });
    } catch (error) {
        console.error('Error al limpiar papelera:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// ENDPOINTS DE HISTORIAL (FILTRADO POR EMPRESA)
// ==========================================

// GET - Obtener historial filtrado por empresa del usuario
app.get('/api/historial', verificarRol(['super_admin', 'gestion']), async (req, res) => {
    try {
        const { limite = 500, offset = 0, accion, fecha_desde, fecha_hasta } = req.query;
        const usuario = req.usuario;
        
        let query = `
            SELECT 
                h.*,
                CASE 
                    WHEN h.accion = 'CREAR' THEN 'Creación'
                    WHEN h.accion = 'EDITAR' THEN 'Edición'
                    WHEN h.accion = 'ELIMINAR' THEN 'Papelera'
                    WHEN h.accion = 'RESTAURAR' THEN 'Restauración'
                    WHEN h.accion = 'ELIMINAR_PERMANENTE' THEN 'Eliminación permanente'
                    ELSE h.accion
                END as accion_texto
            FROM historial_acciones h
            WHERE h.empresa_id = $1
        `;
        
        const params = [usuario.empresa_id];
        let paramCount = 2;
        
        if (accion && accion !== 'todos') {
            query += ` AND h.accion = $${paramCount}`;
            params.push(accion);
            paramCount++;
        }
        
        if (fecha_desde) {
            query += ` AND h.fecha >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        }
        
        if (fecha_hasta) {
            query += ` AND h.fecha <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }
        
        query += ` ORDER BY h.fecha DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limite, offset);
        
        const result = await pool.query(query, params);
        
        const totalResult = await pool.query(
            'SELECT COUNT(*) as total FROM historial_acciones WHERE empresa_id = $1',
            [usuario.empresa_id]
        );
        
        res.json({
            success: true,
            data: result.rows,
            total: parseInt(totalResult.rows[0].total),
            limite: parseInt(limite),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener historial por equipo
app.get('/api/historial/equipo/:equipoId', verificarRol(['super_admin', 'gestion']), async (req, res) => {
    try {
        const { equipoId } = req.params;
        
        const result = await pool.query(
            `SELECT * FROM historial_acciones 
             WHERE equipo_id = $1 
             ORDER BY fecha DESC`,
            [equipoId]
        );
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener resumen de historial por acción
app.get('/api/historial/resumen', verificarRol(['super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                accion,
                COUNT(*) as cantidad,
                DATE(fecha) as fecha
            FROM historial_acciones
            GROUP BY accion, DATE(fecha)
            ORDER BY fecha DESC, accion
        `);
        
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// ENDPOINTS DE MANTENIMIENTOS
// ==========================================

app.get('/api/mantenimientos', async (req, res) => {
    try {
        const query = `
            SELECT 
                m.*,
                eq.codigo,
                eq.nombre_equipo,
                e.nombre as empresa_nombre
            FROM mantenimientos m
            JOIN equipos eq ON m.equipo_id = eq.id
            JOIN empresas e ON eq.empresa_id = e.id
            WHERE eq.eliminado = FALSE
            ORDER BY m.fecha_mantenimiento DESC
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/mantenimientos/equipo/:equipoId', async (req, res) => {
    try {
        const { equipoId } = req.params;
        const query = `
            SELECT 
                m.*,
                eq.codigo,
                eq.nombre_equipo
            FROM mantenimientos m
            JOIN equipos eq ON m.equipo_id = eq.id
            WHERE m.equipo_id = $1
            ORDER BY m.fecha_mantenimiento DESC
        `;
        const result = await pool.query(query, [equipoId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// RESUMEN GENERAL
// ==========================================

app.get('/api/resumen', async (req, res) => {
    try {
        const query = `
            SELECT 
                e.id,
                e.nombre,
                COUNT(DISTINCT CASE WHEN eq.eliminado = FALSE THEN eq.id END) as total_equipos,
                COUNT(CASE WHEN eq.tipo = 'Desktop' AND eq.eliminado = FALSE THEN 1 END) as desktops,
                COUNT(CASE WHEN eq.tipo = 'Laptop' AND eq.eliminado = FALSE THEN 1 END) as laptops,
                COUNT(CASE WHEN eq.tipo = 'Server' AND eq.eliminado = FALSE THEN 1 END) as servidores,
                COUNT(CASE WHEN eq.estado = 'Activo' AND eq.eliminado = FALSE THEN 1 END) as activos,
                COUNT(CASE WHEN eq.estado = 'Mantenimiento' AND eq.eliminado = FALSE THEN 1 END) as mantenimiento,
                COUNT(CASE WHEN eq.estado = 'Inactivo' AND eq.eliminado = FALSE THEN 1 END) as inactivos,
                COUNT(m.id) as total_mantenimientos
            FROM empresas e
            LEFT JOIN equipos eq ON e.id = eq.empresa_id
            LEFT JOIN mantenimientos m ON eq.id = m.equipo_id
            GROUP BY e.id, e.nombre
            ORDER BY e.nombre
        `;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// EXPORTAR INFORMACIÓN COMPLETA DE EMPRESA
// ==========================================

app.get('/api/empresas/:id/exportar', async (req, res) => {
    try {
        const { id } = req.params;
        
        const empresaResult = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
        
        if (empresaResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
        }
        
        const empresa = empresaResult.rows[0];
        
        const equiposResult = await pool.query(`
            SELECT 
                eq.codigo,
                eq.nombre_equipo,
                eq.tipo,
                eq.marca,
                eq.modelo,
                eq.serial,
                eq.estado,
                eq.ubicacion,
                eq.asignado_a,
                eq.procesador,
                eq.ram,
                eq.disco_duro,
                eq.sistema_operativo,
                TO_CHAR(eq.fecha_asignacion, 'DD/MM/YYYY') as fecha_asignacion,
                eq.garantia,
                TO_CHAR(eq.fecha_fin_garantia, 'DD/MM/YYYY') as fecha_fin_garantia,
                eq.especificaciones
            FROM equipos eq
            WHERE eq.empresa_id = $1 AND eq.eliminado = FALSE
            ORDER BY eq.tipo, eq.codigo
        `, [id]);
        
        const resumenResult = await pool.query(`
            SELECT 
                COUNT(*) as total_equipos,
                COUNT(CASE WHEN eq.tipo = 'Desktop' THEN 1 END) as desktops,
                COUNT(CASE WHEN eq.tipo = 'Laptop' THEN 1 END) as laptops,
                COUNT(CASE WHEN eq.estado = 'Activo' THEN 1 END) as activos
            FROM equipos eq
            WHERE eq.empresa_id = $1 AND eq.eliminado = FALSE
        `, [id]);
        
        res.json({
            success: true,
            data: {
                empresa: {
                    id: empresa.id,
                    nombre: empresa.nombre
                },
                resumen: resumenResult.rows[0],
                equipos: equiposResult.rows,
                total_equipos: equiposResult.rows.length
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('\n📋 Endpoints disponibles:');
    console.log('   GET /');
    console.log('   GET /api/empresas');
    console.log('   GET /api/empresas/:id');
    console.log('   GET /api/equipos (protegido - solo equipos de su empresa)');
    console.log('   GET /api/equipos/empresa/:empresaId (protegido)');
    console.log('   GET /api/equipos/tipo/:tipo (protegido)');
    console.log('   GET /api/equipos/papelera (protegido - solo super_admin)');
    console.log('   POST /api/equipos/:id/restaurar (protegido - solo super_admin)');
    console.log('   PUT /api/equipos/:id (protegido - solo super_admin y gestion)');
    console.log('   POST /api/equipos (protegido - solo super_admin y gestion)');
    console.log('   DELETE /api/equipos/:id (protegido - soft delete, solo super_admin)');
    console.log('   DELETE /api/equipos/:id/permanente (protegido - solo super_admin)');
    console.log('   DELETE /api/equipos/limpiar-papelera (protegido - solo super_admin)');
    console.log('   GET /api/historial (protegido - solo super_admin y gestion)');
    console.log('   GET /api/historial/equipo/:equipoId (protegido)');
    console.log('   GET /api/historial/resumen (protegido - solo super_admin)');
    console.log('   POST /api/auth/login');
    console.log('   GET /api/auth/verify');
    console.log('   GET /api/mantenimientos');
    console.log('   GET /api/mantenimientos/equipo/:equipoId');
    console.log('   GET /api/resumen');
    console.log('   GET /api/empresas/:id/exportar');
});