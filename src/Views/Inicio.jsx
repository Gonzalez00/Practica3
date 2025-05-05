import { useNavigate } from "react-router-dom";
import ModalInstalacionIOS from "../Components/Inicio/ModalInstalacionIOS";

const Inicio = () => {
    const [solicitudInstalacion, setSolicitudInstalacion] = useState(null);
    const [mostrarBotonInstalacion, setMostrarBotonInstalacion] = useState(false);
    const [esDispositivoIOS, setEsDispositivoIOS] = useState(false);
    const [mostrarModalInstrucciones, setMostrarModalInstrucciones] = useState(false);

    const abrirModalInstrucciones = () => setMostrarModalInstrucciones(true);
    const cerrarModalInstrucciones = () => setMostrarModalInstrucciones(false);

    // Detectar dispositivo iOS
    useEffect(() => {
    const esIOS = /iPad iPhone iPod/.test(navigator.userAgent) && !window.MSStream;
    setEsDispositivoIOS(esIOS);
    }, []);

    // Manejar evento beforeinstallprompt
    useEffect(() => {
    const manejarSolicitudInstalacion = (evento) => {
    evento.preventDefault();
    setSolicitudInstalacion (evento);
    setMostrarBotonInstalacion(true);

    };

    window.addEventListener("beforeinstallprompt", manejarSolicitudInstalacion);
    return () => {
    window.removeEventListener("beforeinstallprompt", manejarSolicitudInstalacion);
    };
    }, []);

    const instalacion = async() => {
    if (!solicitudInstalacion) return;

    try {
    await solicitudInstalacion.prompt();
    const { outcome } = await solicitudInstalacion.userChoice;
    console.log(outcome == "accepted"? "Instalación aceptada": "Instalación rechazada");
    } catch (error) {
    console.error("Error al intentar instalar la PWA:", error);
    } finally {
    setSolicitudInstalacion (null);
    setMostrarBotonInstalacion(false);
    }

    };

  return (
    <div>
      <h1>Inicio</h1>
    {!esDispositivoIOS && mostrarBotonInstalacion && (

      <div className="my-4">

      <Button className="sombra" variant="primary" onClick={instalacion}>
      Instalar app Coffe Shop G³ <i className="bi-download"></i>
      </Button>
      </div>

      )}

      {esDispositivoIOS && (
        <div className="text-center my-4">
        <Button className="sombra" variant="primary" onClick={abrirModalInstrucciones}>
        Cómo instalar Coffe Shop G³ en iPhone <i className="bi-phone"></i>
        </Button>
      </div>
      )}

        <ModalInstalacionIOS
        mostrar={mostrarModalInstrucciones}
        cerrar={cerrarModalInstrucciones}
        />
      </div>
  
  )
}

export default Inicio;