import { useEffect, useState, type RefObject } from 'react';
import { LOGICAL_WIDTH } from '../components/canvas/constants';

export function useCanvasScale(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setScale(rect.width / LOGICAL_WIDTH);
      setOffset({ x: rect.left, y: rect.top });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [canvasRef, containerRef]);

  return { scale, offset };
}
