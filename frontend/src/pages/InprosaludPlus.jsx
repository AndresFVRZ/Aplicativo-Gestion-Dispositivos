import logoImproSaludPlus from '../assets/InprosaludPlus.png'

function InprosaludPlus() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '80vh' 
    }}>
      <img 
        src={logoImproSaludPlus} 
        alt="ImproSaludPlus" 
        style={{ maxWidth: '500px', width: '100%' }}
      />
    </div>
  )
}
export default InprosaludPlus