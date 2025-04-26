import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import { db } from "../Database/FirebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";

// Componentes personalizados
import TablaCategorias from "../Components/Categorias/TablaCategorias";
import ModalRegistroCategoria from "../Components/Categorias/ModalRegistroCategoria";
import ModalEdicionCategoria from "../Components/Categorias/ModalEdicionCategoria";
import ModalEliminacionCategoria from "../Components/Categorias/ModalEliminacionCategoria";
import CuadroBusquedas from "../Components/Busqueda/CuadroBusquedas";
import Paginacion from "../Components/Ordenamiento/Paginacion";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", descripcion: "" });
  const [categoriaEditada, setCategoriaEditada] = useState(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const itemsPerPage = 5;
  const categoriasCollection = collection(db, "categorias");

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(categoriasCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setCategorias(data);
      setCategoriasFiltradas(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSearchChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    const filtradas = categorias.filter(
      (cat) =>
        cat.nombre.toLowerCase().includes(text) ||
        cat.descripcion.toLowerCase().includes(text)
    );
    setCategoriasFiltradas(filtradas);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria({ ...nuevaCategoria, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCategoriaEditada({ ...categoriaEditada, [name]: value });
  };

  const handleAddCategoria = async () => {
    if (!nuevaCategoria.nombre || !nuevaCategoria.descripcion) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setShowModal(false);
    const tempId = `temp_${Date.now()}`;
    const nueva = { ...nuevaCategoria, id: tempId };

    setCategorias([...categorias, nueva]);
    setCategoriasFiltradas([...categoriasFiltradas, nueva]);

    try {
      await addDoc(categoriasCollection, nuevaCategoria);
    } catch (err) {
      alert("Error al agregar la categoría. Se agregará localmente.");
    }

    setNuevaCategoria({ nombre: "", descripcion: "" });
  };

  const handleEditCategoria = async () => {
    if (!categoriaEditada.nombre || !categoriaEditada.descripcion) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setShowEditModal(false);

    const nuevas = categorias.map((cat) =>
      cat.id === categoriaEditada.id ? categoriaEditada : cat
    );
    setCategorias(nuevas);
    setCategoriasFiltradas(nuevas);

    try {
      const docRef = doc(db, "categorias", categoriaEditada.id);
      await updateDoc(docRef, categoriaEditada);
    } catch (err) {
      alert("Error al editar la categoría. Se actualizará localmente.");
    }
  };

  const handleDeleteCategoria = async () => {
    setShowDeleteModal(false);
    const nuevas = categorias.filter((cat) => cat.id !== categoriaAEliminar.id);
    setCategorias(nuevas);
    setCategoriasFiltradas(nuevas);

    try {
      const docRef = doc(db, "categorias", categoriaAEliminar.id);
      await deleteDoc(docRef);
    } catch (err) {
      alert("Error al eliminar la categoría. Se eliminará localmente.");
    }
  };

  const paginatedCategorias = categoriasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Container className="mt-5">
      <h4>Gestión de Categorías</h4>
      <Button className="mb-3" onClick={() => setShowModal(true)}>
        Agregar categoría
      </Button>

      <CuadroBusquedas
        searchText={searchText}
        handleSearchChange={handleSearchChange}
      />

      <TablaCategorias
        categorias={paginatedCategorias}
        openEditModal={(cat) => {
          setCategoriaEditada(cat);
          setShowEditModal(true);
        }}
        openDeleteModal={(cat) => {
          setCategoriaAEliminar(cat);
          setShowDeleteModal(true);
        }}
      />

      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={categoriasFiltradas.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <ModalRegistroCategoria
        showModal={showModal}
        setShowModal={setShowModal}
        nuevaCategoria={nuevaCategoria}
        handleInputChange={handleInputChange}
        handleAddCategoria={handleAddCategoria}
      />

      <ModalEdicionCategoria
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        categoriaEditada={categoriaEditada}
        handleEditInputChange={handleEditInputChange}
        handleEditCategoria={handleEditCategoria}
      />

      <ModalEliminacionCategoria
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteCategoria={handleDeleteCategoria}
      />
    </Container>
  );
};

export default Categorias;
