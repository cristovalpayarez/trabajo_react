import React from 'react';
import Carrito from './Carrito';

const CarritoModal = ({ onClose }) => {
  return <Carrito show={true} onClose={onClose} />;
};

export default CarritoModal;
