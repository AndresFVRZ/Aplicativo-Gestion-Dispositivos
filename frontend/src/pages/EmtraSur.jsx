import logoEmtrasur from '../assets/EmtraSur.png'

function Emtrasur() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '80vh' 
    }}>
      <img 
        src={logoEmtrasur} 
        alt="Emtrasur" 
        style={{ maxWidth: '500px', width: '100%' }}
      />
    </div>
  )
}
export default Emtrasur