import { useState, useRef } from 'react';
import CanvasEditor from '../components/CanvasEditor';
import type { CanvasElement } from '../types';
import styled from 'styled-components';

const Container = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bg-dark);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin-bottom: 1rem;
  padding: 0 1rem;
`;

const Title = styled.h1`
  color: white;
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s;
  
  background: ${props => props.$primary 
    ? 'linear-gradient(45deg, #2ecc71, #27ae60)' 
    : 'rgba(255,255,255,0.1)'};
  color: white;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const CanvasWrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  aspect-ratio: 16/10;
  background: #1a1a2e;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:hover {
    border-color: var(--accent-primary);
  }
`;

const Placeholder = styled.div`
  text-align: center;
  color: var(--text-secondary);
  
  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  p {
    margin: 0;
    font-size: 1.1rem;
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const TacticalBoard = () => {
  const [showCanvas, setShowCanvas] = useState(false);
  const [boardImage, setBoardImage] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const handleSaveCanvas = (dataUrl: string) => {
    setBoardImage(dataUrl);
    setShowCanvas(false);
  };

  const handleDownload = () => {
    if (!boardImage) return;
    
    const link = document.createElement('a');
    link.download = `pizarra-tactica-${Date.now()}.png`;
    link.href = boardImage;
    link.click();
  };

  const handleClear = () => {
    setBoardImage(null);
    setElements([]);
  };

  return (
    <Container>
      <Header>
        <Title>
          🎯 Pizarra Táctica
        </Title>
        
        <Actions>
          {boardImage && (
            <>
              <ActionButton onClick={handleClear}>
                🗑️ Limpiar
              </ActionButton>
              <ActionButton $primary onClick={handleDownload}>
                📥 Descargar PNG
              </ActionButton>
            </>
          )}
        </Actions>
      </Header>

      <CanvasWrapper onClick={() => setShowCanvas(true)}>
        {boardImage ? (
          <PreviewImage src={boardImage} alt="Pizarra táctica" />
        ) : (
          <Placeholder>
            <div className="icon">⚽</div>
            <p>Haz clic para abrir la pizarra</p>
          </Placeholder>
        )}
      </CanvasWrapper>

      {showCanvas && (
        <CanvasEditor
          onSave={handleSaveCanvas}
          onClose={() => setShowCanvas(false)}
          initialElements={elements}
          onUpdateElements={setElements}
        />
      )}
      
      <a ref={downloadRef} style={{ display: 'none' }} />
    </Container>
  );
};

export default TacticalBoard;
