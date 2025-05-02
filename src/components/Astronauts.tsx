import React, { useEffect, useState } from 'react';

interface Astronaut {
  name: string;
  craft: string;
}

const Astronauts: React.FC = () => {
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://api.open-notify.org/astros.json')
      .then(response => response.json())
      .then(data => {
        setAstronauts(data.people);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading loading-spinner loading-lg"></div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Astronauts Currently in Space</h1>
      <ul className="list-disc pl-5">
        {astronauts.map((astronaut, index) => (
          <li key={index} className="mb-2">
            {astronaut.name} aboard {astronaut.craft}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Astronauts;
