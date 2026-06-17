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
  folderIds?: string[];
  tags?: string[];
  viewCount?: number;
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
  color?: string;
  textColor?: string;
  number?: string;
  rotation?: number;
  flipped?: boolean;
  x2?: number;
  y2?: number;
  arrowType?: 'solid' | 'curved' | 'dashed' | 'zigzag';
  cpX?: number;
  cpY?: number;
  fillColor?: string;
  opacity?: number;
  strokeWidth?: number;
}

export interface Comment {
  _id: string;
  exerciseId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface SessionExercise {
  exerciseId: Exercise | string;
  duration: number;
  order: number;
  notes: string;
}

export interface TrainingSession {
  _id: string;
  name: string;
  description: string;
  userId: string;
  exercises: SessionExercise[];
  shareToken: string;
  createdAt: string;
}

export interface PizarraTemplate {
  _id: string;
  name: string;
  preview?: string;
  createdAt: string;
  elements?: CanvasElement[];
}
