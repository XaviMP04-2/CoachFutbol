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
  tipo: 'imagen' | 'texto' | 'flecha';
  img?: HTMLImageElement;
  x: number;
  y: number;
  width?: number;
  height?: number;
  texto?: string;
  fontSize?: number;
  color?: string;
  // Arrow specific
  x2?: number;
  y2?: number;
}
