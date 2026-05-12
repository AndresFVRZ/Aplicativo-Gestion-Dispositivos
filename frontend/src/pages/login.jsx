import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Importar logos de todas las empresas
import logoEmtra from '../assets/Emtra.png';
import logoAccesalud from '../assets/Accesalud.png';
import logoEmtrasur from '../assets/EmtraSur.png';
import logoInprosalud from '../assets/InprosaludPlus.png';
import logoSertti from '../assets/Sertti.png';
import logoSiMadrid from '../assets/simadrid.png';
import logoSoluciones from '../assets/solucionescorp.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Todos los logos (repetidos para mayor densidad)
  const todosLosLogos = [
    logoEmtra, logoAccesalud, logoEmtrasur, logoInprosalud,
    logoSertti, logoSiMadrid, logoSoluciones,
    logoEmtra, logoAccesalud, logoEmtrasur, logoInprosalud,
    logoSertti, logoSiMadrid, logoSoluciones,
    logoEmtra, logoAccesalud, logoEmtrasur, logoInprosalud,
    logoSertti, logoSiMadrid, logoSoluciones
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Credenciales inválidas');
    }
    setCargando(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1b3d 0%, #1a3a6e 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Fondo con todos los logos (más claros) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '60px',
        padding: '50px  20px  50px 20px',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0,
        alignItems: 'center',
        justifyItems: 'center'
      }}>
        {todosLosLogos.slice(0, 16).map((logo, index) => (
          <img
            key={index}
            src={logo}
            alt="Logo empresa"
            style={{
              width: '200px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
          />
        ))}
      </div>

      {/* Segunda capa de logos (desplazada) */}
      <div style={{
        position: 'absolute',
        top: -50,
        left: 0,
        right: 0,
        bottom: -50,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '60px',
        padding: '50px',
        opacity: 0.12,
        pointerEvents: 'none',
        zIndex: 0,
        alignItems: 'center',
        justifyItems: 'center',
        transform: 'translateY(30px)'
      }}>
        {todosLosLogos.slice(8, 24).map((logo, index) => (
          <img
            key={index + 100}
            src={logo}
            alt="Logo empresa"
            style={{
              width: '200px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
          />
        ))}
      </div>

      {/* Tercera capa de logos (más desplazada) */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: 0,
        right: 0,
        bottom: -100,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '60px',
        padding: '50px',
        opacity: 0.1,
        pointerEvents: 'none',
        zIndex: 0,
        alignItems: 'center',
        justifyItems: 'center',
        transform: 'translateY(60px)'
      }}>
        {todosLosLogos.slice(16, 32).map((logo, index) => (
          <img
            key={index + 200}
            src={logo}
            alt="Logo empresa"
            style={{
              width: '200px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
          />
        ))}
      </div>

      {/* Formulario de login */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', color: '#0a1b3d', margin: 0 }}>Sistema de Gestión de Equipos</h1>
          <p style={{ color: '#666', marginTop: '5px', fontSize: '13px' }}>Acceso unificado para todas las empresas</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
              placeholder="usuario@empresa.com"
              required
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #f39200, #e07e00)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;