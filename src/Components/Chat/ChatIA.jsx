import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../Database/FirebaseConfig";
import { Button, Form, ListGroup, Spinner, Modal } from "react-bootstrap";

const ChatIA = ({ showChatModal, setShowChatModal }) => {
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [intencion, setIntencion] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  const chatCollection = collection(db, "chat");
  const categoriasCollection = collection(db, "categorias");

  useEffect(() => {
    const q = query(chatCollection, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajesObtenidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMensajes(mensajesObtenidos);
    });
    return () => unsubscribe();
  }, []);

  const obtenerCategorias = async () => {
    const snapshot = await getDocs(categoriasCollection);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const obtenerRespuestaIA = async (promptUsuario) => {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    const prompt = `
      Analiza el mensaje del usuario: "${promptUsuario}".
      Determina la intención del usuario respecto a operaciones con categorías (crear, listar, actualizar, eliminar, seleccionar_categoria, actualizar_datos).
      Devuelve un JSON con la intención y los datos relevantes, por ejemplo:
      { "intencion": "crear", "datos": {"nombre": "Nombre", "descripcion": "Descripción"} }
      { "intencion": "listar" }, etc.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" },
          }),
        }
      );

      if (response.status === 429) return { intencion: "error", error: "Límite de solicitudes alcanzado." };

      const data = await response.json();
      const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(respuesta);
    } catch (error) {
      console.error("Error IA:", error);
      return { intencion: "error", error: "Error al conectar con la IA." };
    }
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
    const nuevoMensaje = { texto: mensaje, emisor: "usuario", timestamp: new Date() };
    setCargando(true);
    setMensaje("");

    try {
      await addDoc(chatCollection, nuevoMensaje);
      const respuestaIA = await obtenerRespuestaIA(mensaje);
      const categorias = await obtenerCategorias();

      switch (respuestaIA.intencion) {
        case "listar":
          if (categorias.length === 0) {
            await addDoc(chatCollection, { texto: "No hay categorías registradas.", emisor: "ia", timestamp: new Date() });
          } else {
            const lista = categorias.map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`).join("\n");
            await addDoc(chatCollection, { texto: `Categorías disponibles:\n${lista}`, emisor: "ia", timestamp: new Date() });
          }
          break;

        case "crear":
          const datosCrear = respuestaIA.datos;
          if (datosCrear?.nombre && datosCrear?.descripcion) {
            await addDoc(categoriasCollection, datosCrear);
            await addDoc(chatCollection, { texto: `Categoría "${datosCrear.nombre}" registrada.`, emisor: "ia", timestamp: new Date() });
          } else {
            await addDoc(chatCollection, { texto: "Faltan datos para crear la categoría.", emisor: "ia", timestamp: new Date() });
          }
          break;

        case "eliminar":
          if (respuestaIA.seleccion) {
            const encontrada = categorias.find((cat, i) => cat.nombre.toLowerCase() === respuestaIA.seleccion.toLowerCase() || parseInt(respuestaIA.seleccion) === i + 1);
            if (encontrada) {
              await deleteDoc(doc(db, "categorias", encontrada.id));
              await addDoc(chatCollection, { texto: `Categoría "${encontrada.nombre}" eliminada.`, emisor: "ia", timestamp: new Date() });
            } else {
              await addDoc(chatCollection, { texto: "No se encontró la categoría especificada.", emisor: "ia", timestamp: new Date() });
            }
          } else {
            setIntencion("eliminar");
            const lista = categorias.map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`).join("\n");
            await addDoc(chatCollection, { texto: `Selecciona una categoría para eliminar:\n${lista}`, emisor: "ia", timestamp: new Date() });
          }
          break;

        case "actualizar":
          if (respuestaIA.seleccion) {
            const encontrada = categorias.find((cat, i) => cat.nombre.toLowerCase() === respuestaIA.seleccion.toLowerCase() || parseInt(respuestaIA.seleccion) === i + 1);
            if (encontrada) {
              setCategoriaSeleccionada(encontrada);
              setIntencion("actualizar");
              await addDoc(chatCollection, { texto: `Seleccionaste "${encontrada.nombre}". Proporciona los nuevos datos.`, emisor: "ia", timestamp: new Date() });
            } else {
              await addDoc(chatCollection, { texto: "Categoría no encontrada.", emisor: "ia", timestamp: new Date() });
            }
          } else {
            setIntencion("actualizar");
            const lista = categorias.map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`).join("\n");
            await addDoc(chatCollection, { texto: `Selecciona una categoría para actualizar:\n${lista}`, emisor: "ia", timestamp: new Date() });
          }
          break;

        case "actualizar_datos":
          if (categoriaSeleccionada && respuestaIA.datos) {
            const ref = doc(db, "categorias", categoriaSeleccionada.id);
            await updateDoc(ref, {
              nombre: respuestaIA.datos.nombre || categoriaSeleccionada.nombre,
              descripcion: respuestaIA.datos.descripcion || categoriaSeleccionada.descripcion,
            });
            await addDoc(chatCollection, { texto: `Categoría actualizada exitosamente.`, emisor: "ia", timestamp: new Date() });
            setCategoriaSeleccionada(null);
            setIntencion(null);
          }
          break;

        case "seleccionar_categoria":
          if (intencion === "eliminar" || intencion === "actualizar") {
            const encontrada = categorias.find((cat, i) => cat.nombre.toLowerCase() === mensaje.toLowerCase() || parseInt(mensaje) === i + 1);
            if (encontrada) {
              if (intencion === "eliminar") {
                await deleteDoc(doc(db, "categorias", encontrada.id));
                await addDoc(chatCollection, { texto: `Categoría "${encontrada.nombre}" eliminada.`, emisor: "ia", timestamp: new Date() });
              } else {
                setCategoriaSeleccionada(encontrada);
                await addDoc(chatCollection, { texto: `Seleccionaste "${encontrada.nombre}". Proporciona nuevos datos.`, emisor: "ia", timestamp: new Date() });
              }
              setIntencion(null);
            } else {
              await addDoc(chatCollection, { texto: "Selección inválida.", emisor: "ia", timestamp: new Date() });
            }
          }
          break;

        case "desconocida":
        default:
          await addDoc(chatCollection, { texto: "No entendí tu solicitud. Usa crear, listar, actualizar o eliminar.", emisor: "ia", timestamp: new Date() });
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      await addDoc(chatCollection, { texto: "Error al procesar la solicitud.", emisor: "ia", timestamp: new Date() });
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal show={showChatModal} onHide={() => setShowChatModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chat con IA</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup style={{ maxHeight: "300px", overflowY: "auto" }}>
          {mensajes.map((msg) => (
            <ListGroup.Item key={msg.id} variant={msg.emisor === "ia" ? "light" : "primary"}>
              <strong>{msg.emisor === "ia" ? "IA: " : "Tú: "}</strong>{msg.texto}
            </ListGroup.Item>
          ))}
        </ListGroup>
        <Form.Control
          className="mt-3"
          type="text"
          placeholder="Escribe tu mensaje..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowChatModal(false)}>Cerrar</Button>
        <Button onClick={enviarMensaje} disabled={cargando}>
          {cargando ? <Spinner size="sm" animation="border" /> : "Enviar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatIA;
