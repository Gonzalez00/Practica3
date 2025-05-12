import { Card } from "react-bootstrap"
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';


const GraficoProductos = ({ nombres, precios }) => {
  const data = {
    labels: nombres,
    datasets: [
      {
        label: 'Precio (C$)',
        data: precios,
        backgroundColor: 'rgba(51, 29, 113, 0.2)',
        BorderColor: 'rgb(169, 189, 204)',
        BorderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Precios de Productos',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Precio (C$)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Productos',
        },
      },
    },
  };

  
  return (
    <div style={{ width: "100%", height: "400px" }}>
    <Card>
        <Card.Body>
        <Card.Title>Gráfico Productos</Card.Title>
        <Bar data={data} options={options} />
        </Card.Body>
    </Card>
    </div>
  );
};

export default GraficoProductos;