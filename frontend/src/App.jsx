import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import RutaProtegida from './components/RutaProtegida'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import './App.css'

// Importar páginas
import Inicio from './pages/Inicio'
import AcceSalud from './pages/AcceSalud'
import Emtra from './pages/Emtra'
import Emtrasur from './pages/Emtrasur'
import InprosaludPlus from './pages/InprosaludPlus'
import Sertti from './pages/Sertti'
import SiMadrid from './pages/SiMadrid'
import Soluciones from './pages/Soluciones'
import Papelera from './pages/Papelera'
import Historial from './pages/Historial'

const API_URL = 'http://localhost:5000/api'

// Componente con las rutas protegidas
function AppRoutes() {
  const { usuario, token, cargando } = useAuth()
  const [empresas, setEmpresas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [resumen, setResumen] = useState([])
  const [cargandoDatos, setCargandoDatos] = useState(true)

  // ✅ Función para recargar equipos desde el backend (sincronización global)
  const recargarEquipos = async () => {
    try {
      const response = await fetch(`${API_URL}/equipos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setEquipos(data.data)
      }
    } catch (error) {
      console.error('Error al recargar equipos:', error)
    }
  }

  useEffect(() => {
    if (usuario && token) {
      const cargarDatos = async () => {
        setCargandoDatos(true)
        
        try {
          // Cargar empresas
          const resEmpresas = await fetch(`${API_URL}/empresas`)
          const dataEmpresas = await resEmpresas.json()
          if (dataEmpresas.success) setEmpresas(dataEmpresas.data)
          
          // Cargar equipos con token
          const resEquipos = await fetch(`${API_URL}/equipos`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const dataEquipos = await resEquipos.json()
          if (dataEquipos.success) setEquipos(dataEquipos.data)
          
          // Cargar resumen
          const resResumen = await fetch(`${API_URL}/resumen`)
          const dataResumen = await resResumen.json()
          if (dataResumen.success) setResumen(dataResumen.data)
          
        } catch (error) {
          console.error('Error al cargar datos:', error)
        } finally {
          setCargandoDatos(false)
        }
      }
      
      cargarDatos()
    } else if (!cargando) {
      setCargandoDatos(false)
    }
  }, [usuario, token, cargando])

  // Función para actualizar un equipo
  const handleActualizarEquipo = async (equipoActualizado) => {
    try {
      const response = await fetch(`${API_URL}/equipos/${equipoActualizado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(equipoActualizado),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setEquipos(prevEquipos =>
          prevEquipos.map(equipo =>
            equipo.id === equipoActualizado.id ? data.data : equipo
          )
        )
        return { success: true, message: 'Equipo actualizado correctamente' }
      } else {
        return { success: false, message: data.message || 'Error al actualizar' }
      }
    } catch (error) {
      console.error('Error:', error)
      return { success: false, message: 'Error de conexión con el servidor' }
    }
  }

  // Mostrar carga mientras se verifica autenticación
  if (cargando || cargandoDatos) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Cargando datos del sistema...</h2>
      </div>
    )
  }

  // Si no hay usuario, mostrar solo login
  if (!usuario) {
    return <Login />
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, minHeight: '100vh', background: '#f0f2f5' }}>
        <Routes>
          <Route path="/" element={<Inicio empresas={empresas} resumen={resumen} />} />
          <Route path="/accesalud" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion', 'visualizador']}>
              <AcceSalud equipos={equipos} token={token} />
            </RutaProtegida>
          } />
          <Route path="/emtra" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion', 'visualizador']}>
              <Emtra 
                equipos={equipos} 
                setEquipos={setEquipos}
                onActualizarEquipo={handleActualizarEquipo}
                token={token}
              />
            </RutaProtegida>
          } />
          <Route path="/emtrasur" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion', 'visualizador']}>
              <Emtrasur equipos={equipos} token={token} />
            </RutaProtegida>
          } />
          <Route path="/inprosalud-plus" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion', 'visualizador']}>
              <InprosaludPlus equipos={equipos} token={token} />
            </RutaProtegida>
          } />
          <Route path="/sertti" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion', 'visualizador']}>
              <Sertti equipos={equipos} token={token} />
            </RutaProtegida>
          } />
          <Route path="/simadrid" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion', 'visualizador']}>
              <SiMadrid equipos={equipos} token={token} />
            </RutaProtegida>
          } />
          <Route path="/soluciones" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion', 'visualizador']}>
              <Soluciones equipos={equipos} setEquipos={setEquipos} token={token} />
            </RutaProtegida>
          } />
          {/* ✅ Ruta para la PAPELERA */}
          <Route path="/papelera" element={
            <RutaProtegida rolesPermitidos={['super_admin']}>
              <Papelera onRecargarEquipos={recargarEquipos} token={token} />
            </RutaProtegida>
          } />
          {/* ✅ Ruta para el HISTORIAL */}
          <Route path="/historial" element={
            <RutaProtegida rolesPermitidos={['super_admin', 'gestion']}>
              <Historial token={token} />
            </RutaProtegida>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

// Componente principal con AuthProvider
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App