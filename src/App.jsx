import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Database/Authcontext";
import ProtectedRoute from "./Components/ProtectedRoute"; 
import Login from './Views/Login'
import Encabezado from "./Components/Encabezado";
import Inicio from "./Views/Inicio";
import Categorias from "./Views/Categorias"; //Importación de Categorias
import Productos from "./Views/Productos";
import Clima from "./Views/Clima";

import './App.css'
import Catalogo from "./Views/Catalogo";
import Libros from "./Views/Libros";

function App() {

  return (
    <>
      <AuthProvider>
        <Router>
          <div className="App">
            <Encabezado />
            <main>
              <Routes>
                
                <Route path="/" element={<Login />} />
                <Route path="/Inicio" element={<ProtectedRoute element={<Inicio />} />} />
                <Route path="/Categorias" element={<ProtectedRoute element={<Categorias />} />}/> //Ruta de Categorias protegida
                <Route path="/Productos" element={<ProtectedRoute element={<Productos />} />}/>
                <Route path="/Catalogo" element={<ProtectedRoute element={<Catalogo />} />}/>
                <Route path="/Clima" element={<ProtectedRoute element={<Clima />} />}/>
                <Route path="/Libros" element={<ProtectedRoute element={<Libros />} />}/>
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </>
  )
}

export default App