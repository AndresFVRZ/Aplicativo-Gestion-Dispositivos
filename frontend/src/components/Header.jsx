import logoEmtra from '../assets/LOGO_EMTRA.webp'

function Header() {
  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '10px 20px',
      backgroundColor: '#0a1b3d',
      color: 'white'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <img 
          src={logoEmtra} 
          alt="Logo EMTRA" 
          style={{ height: '100px', width: 'auto' }}
        />
      </div>
      
      <nav>
        <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li style={{ cursor: 'pointer' }}>Inicio</li>
          <li style={{ cursor: 'pointer' }}>Acerca de</li>
          <li style={{ cursor: 'pointer' }}>Contacto</li>
        </ul>
      </nav>
    </header>
  )
}

export default Header