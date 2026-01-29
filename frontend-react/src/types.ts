export interface Exercise {
  _id: string;
  titulo: string;
  descripcion: string;
  tipo: 'técnico' | 'táctico' | 'físico';
  objetivos: string[];
  edadRecomendada: string;
  dificultad: 'Fácil' | 'Media' | 'Difícil';
  duracion: string;
  material: string[];
  numeroJugadores: number;
  autor: string;
  archivoUrl?: string;
}

export interface CanvasElement {
  id: string;
  tipo: 'imagen' | 'texto' | 'flecha' | 'jugador' | 'zona' | 'linea' | 'circulo';
  img?: HTMLImageElement;
  x: number;
  y: number;
  width?: number;
  height?: number;
  texto?: string;
  fontSize?: number;
  color?: string;     // Jersey color for players, text/stroke color for others
  textColor?: string; // Number color for players
  number?: string;    // Player number
  // Image transformations
  rotation?: number;  // Rotation angle in radians
  flipped?: boolean;  // Horizontal flip
  // Arrow/Line specific
  x2?: number;
  y2?: number;
  arrowType?: 'solid' | 'curved' | 'dashed' | 'zigzag';
  cpX?: number; // Control point X for curved arrows
  cpY?: number; // Control point Y for curved arrows
  // Shape specific (zona, circulo)
  fillColor?: string;   // Fill color for shapes
  opacity?: number;     // Transparency 0-1
  strokeWidth?: number; // Line thickness
}
