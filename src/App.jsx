import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Database/Authcontext";
import ProtectedRoute from "./Components/ProtectedRoute"; 
import Login from './Views/Login'
import Encabezado from "./Components/Encabezado";
import Inicio from "./Views/Inicio";
import Categorias from "./Views/Categorias"; //Importación de Categorias
import Productos from "./Views/Productos";

import './App.css'

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
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </>
  )
}

export default App