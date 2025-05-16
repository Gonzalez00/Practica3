import { Card, Col, Button } from "react-bootstrap";

const TarjetaProducto = ({ producto, openEditModal }) => {
  return (
    <Col lg={3} md={4} sm={12} className="mb-4">
      <Card>
       {producto.imagen && (
          <Card.Img variant="top" src={producto.imagen} alt={producto.nombre} style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
            borderTopLeftRadius: "0.25rem",
            borderTopRightRadius: "0.25rem",
          }} />
        )}
        <Card.Body>
          <Card.Title>{producto.nombre}</Card.Title>
          <Card.Text>
            Precio: C${producto.precio} <br />
            Categoría: {producto.categoria}
          </Card.Text>
          <Button variant="primary" onClick={() => openEditModal(producto)}>
            Editar
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default TarjetaProducto;
