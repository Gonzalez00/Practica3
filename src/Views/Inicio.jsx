import { useNavigate } from "react-router-dom";

const Inicio = () => {

    const navigate = useNavigate();

    // Función de navegación
    const handleNavigate = (path) => {
      navigate(path);
    };

  return (
    <div>
      <br />
      <br />
      <h1>Inicio</h1>
      <button onClick={() => handleNavigate("/Categorias")} >Ir a Categorias</button>
    </div>
  )
}

export default Inicio;