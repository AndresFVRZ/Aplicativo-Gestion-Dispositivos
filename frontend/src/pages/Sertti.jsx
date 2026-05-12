import logoSertti from '../assets/Sertti.png'

function Sertti() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '80vh' 
    }}>
      <img 
        src={logoSertti} 
        alt="Sertti" 
        style={{ maxWidth: '500px', width: '100%' }}
      />
    </div>
  )
}
export default Sertti