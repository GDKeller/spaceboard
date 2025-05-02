import React, { useEffect, useState } from 'react';
import Astronaut from './Astronaut';

interface AstronautData {
  name: string;
  craft: string;
}

const AstronautGrid: React.FC = () => {
  const [astronauts, setAstronauts] = useState<AstronautData[]>([]);

  useEffect(() => {
    fetch('http://api.open-notify.org/astros.json')
      .then(response => response.json())
      .then(data => setAstronauts(data.people))
      .catch(error => console.error('Error fetching astronaut data:', error));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {astronauts.map((astronaut, index) => (
        <Astronaut key={index} name={astronaut.name} craft={astronaut.craft} />
      ))}
    </div>
  );
};

export default AstronautGrid;
