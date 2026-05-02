import Header from './components/Header.jsx'
import Tarjeta from './components/Tarjeta.jsx'
import Formulario from './components/Formulario.jsx'
import './App.css'

function App() {
  
  return (
    <>
      <Header />
      <Tarjeta 
        titulo="Tarjeta de Ejemplo" 
        contenido="Este es un ejemplo de tarjeta creada con React y Tailwind CSS."
      />
    </>
  )
}

export default App