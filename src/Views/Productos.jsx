// Importaciones
import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import {db} from "../Database/FirebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import TablaProductos from "../Components/Productos/TablaProductos";
import ModalRegistroProducto from "../Components/Productos/ModalRegistroProducto";
import ModalEdicionProducto from "../Components/Productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../Components/Productos/ModalEliminacionProducto";
import CuadroBusquedas from "../Components/Busqueda/CuadroBusquedas";
import Paginacion from "../Components/Ordenamiento/Paginacion";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", precio: "", categoria: "", imagen: "" });
  const [productoEditado, setProductoEditado] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const itemsPerPage = 5;
  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = fetchData();
    return unsubscribe;
  }, []);

  const fetchData = () => {
    const unsubscribeProductos = onSnapshot(productosCollection, (snapshot) => {
      const fetchedProductos = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setProductos(fetchedProductos);
      setProductosFiltrados(fetchedProductos);
      if (isOffline) console.log("Offline: Productos cargados desde caché local.");
    }, (error) => {
      console.error("Error al escuchar productos:", error);
      if (isOffline) console.log("Offline: Mostrando datos desde caché local.");
      else alert("Error al cargar productos: " + error.message);
    });

    const unsubscribeCategorias = onSnapshot(categoriasCollection, (snapshot) => {
      const fetchedCategorias = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setCategorias(fetchedCategorias);
      if (isOffline) console.log("Offline: Categorías cargadas desde caché local.");
    }, (error) => {
      console.error("Error al escuchar categorías:", error);
      if (isOffline) console.log("Offline: Mostrando categorías desde caché local.");
      else alert("Error al cargar categorías: " + error.message);
    });

    return () => {
      unsubscribeProductos();
      unsubscribeCategorias();
    };
  };

  const handleSearchChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    const filtrados = productos.filter((producto) => 
      producto.nombre.toLowerCase().includes(text) ||
      producto.precio.toString().toLowerCase().includes(text) ||
      producto.categoria.toLowerCase().includes(text)
    );
    setProductosFiltrados(filtrados);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setProductoEditado((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNuevoProducto((prev) => ({ ...prev, imagen: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductoEditado((prev) => ({ ...prev, imagen: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio || !nuevoProducto.categoria || !nuevoProducto.imagen) {
      alert("Por favor, completa todos los campos, incluyendo la imagen.");
      return;
    }
    setShowModal(false);
    const tempId = `temp_${Date.now()}`;
    const productoConId = { ...nuevoProducto, id: tempId, precio: parseFloat(nuevoProducto.precio) };
    try {
      setProductos((prev) => [...prev, productoConId]);
      setProductosFiltrados((prev) => [...prev, productoConId]);
      if (isOffline) {
        console.log("Producto agregado localmente (sin conexión).");
        alert("Sin conexión: Producto agregado localmente. Se sincronizará al reconectar.");
      } else {
        console.log("Producto agregado exitosamente en la nube.");
      }
      await addDoc(productosCollection, {
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio),
        categoria: nuevoProducto.categoria,
        imagen: nuevoProducto.imagen,
      });
      setNuevoProducto({ nombre: "", precio: "", categoria: "", imagen: "" });
    } catch (error) {
      console.error("Error al agregar el producto:", error);
      if (!isOffline) {
        setProductos((prev) => prev.filter((prod) => prod.id !== tempId));
        setProductosFiltrados((prev) => prev.filter((prod) => prod.id !== tempId));
        alert("Error al agregar el producto: " + error.message);
      }
    }
  };

  const handleEditProducto = async () => {
    if (!productoEditado.nombre || !productoEditado.precio || !productoEditado.categoria || !productoEditado.imagen) {
      alert("Por favor, completa todos los campos, incluyendo la imagen.");
      return;
    }
    setShowEditModal(false);
    const productoRef = doc(db, "productos", productoEditado.id);
    try {
      setProductos((prev) => prev.map((prod) => prod.id === productoEditado.id ? { ...productoEditado, precio: parseFloat(productoEditado.precio) } : prod));
      setProductosFiltrados((prev) => prev.map((prod) => prod.id === productoEditado.id ? { ...productoEditado, precio: parseFloat(productoEditado.precio) } : prod));
      if (isOffline) {
        console.log("Producto actualizado localmente (sin conexión).");
        alert("Sin conexión: Producto actualizado localmente. Se sincronizará al reconectar.");
      } else {
        console.log("Producto actualizado exitosamente en la nube.");
      }
      await updateDoc(productoRef, {
        nombre: productoEditado.nombre,
        precio: parseFloat(productoEditado.precio),
        categoria: productoEditado.categoria,
        imagen: productoEditado.imagen,
      });
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      if (!isOffline) {
        alert("Error al actualizar el producto: " + error.message);
      }
    }
  };

  const handleDeleteProducto = async () => {
    if (!productoAEliminar) return;
    setShowDeleteModal(false);
    try {
      setProductos((prev) => prev.filter((prod) => prod.id !== productoAEliminar.id));
      setProductosFiltrados((prev) => prev.filter((prod) => prod.id !== productoAEliminar.id));
      if (isOffline) {
        console.log("Producto eliminado localmente (sin conexión).");
        alert("Sin conexión: Producto eliminado localmente. Se sincronizará al reconectar.");
      } else {
        console.log("Producto eliminado exitosamente en la nube.");
      }
      const productoRef = doc(db, "productos", productoAEliminar.id);
      await deleteDoc(productoRef);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      if (!isOffline) {
        setProductos((prev) => [...prev, productoAEliminar]);
        setProductosFiltrados((prev) => [...prev, productoAEliminar]);
        alert("Error al eliminar el producto: " + error.message);
      }
    }
  };

  const openEditModal = (producto) => {
    setProductoEditado({ ...producto });
    setShowEditModal(true);
  };

  const openDeleteModal = (producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  const paginatedProductos = productosFiltrados.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage);


  const handleCopy = (producto) => {
    const rowData = `Nombre: ${producto.nombre}\nPrecio: C$${producto.precio}\nCategoría: ${producto.categoria}`;
    navigator.clipboard
      .writeText(rowData)
      .then(() => {
        console.log("Datos copiados al portapapeles:\n" + rowData);
      })
      .catch((err) => {
        console.error("Error al copiar al portapapeles:", err);
      });
  };

  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Productos</h4>
      <Button className="mb-3" onClick={() => setShowModal(true)}>
        Agregar producto
      </Button>
      <CuadroBusquedas 
      searchText={searchText} 
      handleSearchChange={handleSearchChange} 
      />
      <TablaProductos 
      openEditModal={openEditModal} 
      openDeleteModal={openDeleteModal} 
      productos={paginatedProductos} 
      totalItems={productos.length} 
      itemsPerPage={itemsPerPage} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      handleCopy={handleCopy} 
      />
      <Paginacion 
      itemsPerPage={itemsPerPage} 
      totalItems={productosFiltrados.length} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage} 
      />
      <ModalRegistroProducto 
      showModal={showModal} 
      setShowModal={setShowModal} 
      nuevoProducto={nuevoProducto} 
      handleInputChange={handleInputChange} 
      handleImageChange={handleImageChange} 
      handleAddProducto={handleAddProducto} 
      categorias={categorias} 
      />
      <ModalEdicionProducto 
      showEditModal={showEditModal} 
      setShowEditModal={setShowEditModal}
      productoEditado={productoEditado} 
      handleEditInputChange={handleEditInputChange} 
      handleEditImageChange={handleEditImageChange} 
      handleEditProducto={handleEditProducto} 
      categorias={categorias} 
      />
      <ModalEliminacionProducto 
      showDeleteModal={showDeleteModal} 
      setShowDeleteModal={setShowDeleteModal} 
      handleDeleteProducto={handleDeleteProducto} 
      />
    </Container>
  );
};

export default Productos;
