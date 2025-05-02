import React from 'react';

interface AstronautProps {
  name: string;
  craft: string;
}

const Astronaut: React.FC<AstronautProps> = ({ name, craft }) => {
  return (
    <div className="card">
      <h2 className="card-title">{name}</h2>
      <p className="card-body">Craft: {craft}</p>
    </div>
  );
};

export default Astronaut;
