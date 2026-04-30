function Formulario() {
  const handleSubmit = (e) => {
    e.preventDefault()
    const dato = e.target.dato.value
    alert(`Dato enviado: ${dato}`)
    e.target.reset()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        name="dato" 
        placeholder="Ingresa un dato"
        required
      />
      <button type="submit">
        Enviar
      </button>
    </form>
  )
}

export default Formulario