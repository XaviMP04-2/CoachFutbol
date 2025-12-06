import React, { useEffect, useState } from 'react';
import API_URL from '../config';

interface Objective {
  _id: string;
  name: string;
  category: string;
}

interface ObjectiveSelectorProps {
  selectedObjectives: string[];
  onChange: (objectives: string[]) => void;
}

const ObjectiveSelector: React.FC<ObjectiveSelectorProps> = ({ selectedObjectives, onChange }) => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/objectives`)
      .then(res => {
        if (!res.ok) throw new Error('Error fetching objectives');
        return res.json();
      })
      .then(data => {
        setObjectives(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not load objectives');
        setLoading(false);
      });
  }, []);

  const toggleObjective = (name: string) => {
    if (selectedObjectives.includes(name)) {
      onChange(selectedObjectives.filter(o => o !== name));
    } else {
      onChange([...selectedObjectives, name]);
    }
  };

  if (loading) return <div>Cargando objetivos...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // Group by category
  const grouped = objectives.reduce((acc, obj) => {
    const cat = obj.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(obj);
    return acc;
  }, {} as Record<string, Objective[]>);

  return (
    <div className="objective-selector">
      {Object.entries(grouped).map(([category, objs]) => (
        <div key={category} className="objective-category" style={{ marginBottom: '1rem' }}>
          <h5 style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>{category}</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {objs.map(obj => {
              const isSelected = selectedObjectives.includes(obj.name);
              return (
                <button
                  key={obj._id}
                  type="button"
                  onClick={() => toggleObjective(obj.name)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    border: isSelected ? '1px solid #2ecc71' : '1px solid #bdc3c7',
                    backgroundColor: isSelected ? '#2ecc71' : 'white',
                    color: isSelected ? 'white' : '#34495e',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {obj.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ObjectiveSelector;
