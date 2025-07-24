const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const dpr = window.devicePixelRatio || 1;
ctx.imageSmoothingEnabled = true;

// Función para redimensionar el canvas
// Función para redimensionar el canvas

//ctx.scale(dpr, dpr);
//ctx.imageSmoothingEnabled = true;
// Elementos del campo (objetos y textos)
let elementos = [];
let currentDragged = null;
let elementoSeleccionado = null;
let offsetX = 0;
let offsetY = 0;
let arrastrando = false;
let mouseDown = false;
const btnEliminar = document.getElementById('eliminar-objeto');

// Fondo del campo
let background = new Image();
const tipoCampo = "campo";
function setBackground(tipo) {
  background.src = `img/${tipo}.png`;
  background.onload = () => {
    resizeCanvas(); // Redimensiona el canvas al cargar el fondo
    dibujarTodo();
    actualizarMiniatura();
  };
}
setBackground(tipoCampo);

function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // ¡IMPORTANTE! Restablece la matriz de transformación del contexto antes de aplicar la escala.
    // Esto evita la acumulación de escalas.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Volver a dibujar todo el contenido para que se adapte al nuevo tamaño
    dibujarTodo();
    actualizarMiniatura();
}

// Llama a resizeCanvas inicialmente para establecer el tamaño correcto al cargar
//resizeCanvas();

// Añade un event listener para que el canvas se redimensione cada vez que la ventana cambie de tamaño
//window.addEventListener('resize', resizeCanvas);



// Arrastrar imágenes
document.querySelectorAll('.tools img').forEach(img => {
  img.addEventListener('dragstart', e => {
    currentDragged = img;
  });
});

canvas.addEventListener('dragover', e => e.preventDefault());

canvas.addEventListener('drop', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
    
  if (currentDragged) {
    const img = new Image();
    img.src = currentDragged.src;
    img.onload = () => {
        const url = img.src;
        let drawWidth = 60, drawHeight = 60;

        if (url.includes("jugador")) {
        drawWidth = 70; drawHeight = 80;
        } else if (url.includes("balon")) {
        drawWidth = 30; drawHeight = 30;
        } else if (url.includes("cono")) {
        drawWidth = 40; drawHeight = 40;
        } else if (url.includes("cono-chincheta")) {
        drawWidth = 30; drawHeight = 30;
        } else if (url.includes("flecha-recta")) {
        drawWidth = 0; drawHeight = 0;
        }

        const nuevo = {
            tipo: 'imagen',
            img,
            x,
            y,
            width: drawWidth,
            height: drawHeight
        };
        elementos.push(nuevo);
        dibujarTodo();
    };
    }

});

document.getElementById('add-text-btn').addEventListener('click', () => {
  crearCajaDeTexto(); // crea una nueva caja de texto
});


function dibujarTodo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, 0, 0, canvas.width / dpr, canvas.height / dpr);

  elementos.forEach(el => {
    if (el.tipo === 'imagen') {
      ctx.drawImage(el.img, el.x - el.width / 2, el.y - el.height / 2, el.width, el.height);
    } else if (el.tipo === 'texto') {
      ctx.font = `${el.fontSize}px Arial`;
      ctx.fillStyle = el.color;
      ctx.fillText(el.texto, el.x, el.y);
    }
  });
}

// Selección y movimiento
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  mouseDown = true;
  arrastrando = false;
  elementoSeleccionado = null;

  for (let i = elementos.length - 1; i >= 0; i--) {
    const el = elementos[i];
    if (el.tipo === 'imagen') {
      if (
        x >= el.x - el.width / 2 && x <= el.x + el.width / 2 &&
        y >= el.y - el.height / 2 && y <= el.y + el.height / 2
      ) {
        elementoSeleccionado = el;
        offsetX = x - el.x;
        offsetY = y - el.y;
        break;
      }
    } else if (el.tipo === 'texto') {
      ctx.font = `${el.fontSize}px Arial`;
      const w = ctx.measureText(el.texto).width;
      const h = el.fontSize;
      if (
        x >= el.x && x <= el.x + w &&
        y >= el.y - h && y <= el.y
      ) {
        elementoSeleccionado = el;
        offsetX = x - el.x;
        offsetY = y - el.y;
        break;
      }
    }
  }

  if (elementoSeleccionado) {
    btnEliminar.style.display = 'block';
    btnEliminar.style.left = `${x + 10}px`;
    btnEliminar.style.top = `${y - 10}px`;
  } else {
    btnEliminar.style.display = 'none';
  }
});

canvas.addEventListener('mousemove', e => {
  if (!mouseDown || !elementoSeleccionado) return;

  arrastrando = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  elementoSeleccionado.x = x - offsetX;
  elementoSeleccionado.y = y - offsetY;

  dibujarTodo();

  btnEliminar.style.left = `${x + 10}px`;
  btnEliminar.style.top = `${y - 10}px`;
});

canvas.addEventListener('mouseup', () => {
  mouseDown = false;
  arrastrando = false;
});

btnEliminar.addEventListener('click', () => {
  if (!elementoSeleccionado) return;
  const index = elementos.indexOf(elementoSeleccionado);
  if (index !== -1) {
    elementos.splice(index, 1);
    dibujarTodo();
  }
  elementoSeleccionado = null;
  btnEliminar.style.display = 'none';
});

// Miniatura
function actualizarMiniatura() {
  const miniCanvas = document.getElementById('mini-canvas');
  const miniCtx = miniCanvas.getContext('2d');
  miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
  if (background.complete) {
    miniCtx.drawImage(background, 0, 0, miniCanvas.width, miniCanvas.height);
  }
  const escalaX = miniCanvas.width / canvas.width;
  const escalaY = miniCanvas.height / canvas.height;
  elementos.forEach(el => {
    if (el.tipo === 'imagen') {
      const img = new Image();
      img.src = el.img.src;
      miniCtx.drawImage(
        img,
        el.x * escalaX - (el.width * escalaX) / 2,
        el.y * escalaY - (el.height * escalaY) / 2,
        el.width * escalaX,
        el.height * escalaY
      );
    } else if (el.tipo === 'texto') {
      miniCtx.font = `${el.fontSize * escalaX}px Arial`;
      miniCtx.fillStyle = el.color;
      miniCtx.fillText(el.texto, el.x * escalaX, el.y * escalaY);
    }
  });
}

// Mostrar grupo
function mostrarGrupo(nombre) {
  document.querySelectorAll('.tools').forEach(div => {
    div.classList.add('hidden');
  });
  const grupo = document.getElementById('grupo-' + nombre);
  if (grupo) grupo.classList.remove('hidden');
}

function crearCajaDeTexto(x = 825, y = 650, contenido = "") {
  const overlay = document.getElementById('text-overlays');
  const caja = document.createElement('div');
  caja.className = 'text-box';
  caja.contentEditable = true;
  caja.innerText = contenido;
  caja.style.left = `${x}px`;
  caja.style.top = `${y}px`;

  // Crear botón de eliminar
  const btnEliminar = document.createElement('button');
  btnEliminar.className = 'delete-text-btn';
  btnEliminar.innerHTML = '×';

  btnEliminar.addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.removeChild(caja);
  });

  caja.appendChild(btnEliminar);

  // Movimiento
  let offsetX, offsetY, moviendo = false;
  caja.addEventListener('mousedown', e => {
    if (e.target === btnEliminar) return;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    moviendo = true;
  });
  window.addEventListener('mousemove', e => {
    if (!moviendo) return;
    caja.style.left = `${e.pageX - offsetX}px`;
    caja.style.top = `${e.pageY - offsetY}px`;
  });
  window.addEventListener('mouseup', () => moviendo = false);

  overlay.appendChild(caja);
}

// ====== Flechas con LeaderLine ======
let puntosFlecha = [];
let flechas = [];
/*
function crearFlecha(x, y) {
  const contenedor = document.getElementById('flecha-puntos-container');

  const punto1 = document.createElement('div');
  punto1.className = 'punto-flecha';
  punto1.style.left = `${x}px`;
  punto1.style.top = `${y}px`;

  const punto2 = document.createElement('div');
  punto2.className = 'punto-flecha';
  punto2.style.left = `${x + 100}px`;
  punto2.style.top = `${y}px`;

  
  //contenedor.appendChild(punto1);
  //contenedor.appendChild(punto2);
    
  document.querySelector('#canvas-container').appendChild(punto1);
  document.querySelector('#canvas-container').appendChild(punto2);

  const flecha = new LeaderLine(punto1, punto2, {
    color: '#ff4c4c',
    size: 4,
    path: 'straight',
    startPlug: 'disc',
    endPlug: 'arrow3',
    endPlugSize: 1.5
  });

  puntosFlecha.push(punto1, punto2);
  flechas.push(flecha);

  hacerArrastrableFlecha(punto1, flecha);
  hacerArrastrableFlecha(punto2, flecha);
}*/
function crearFlecha(x, y) {
  const canvasContainer = document.getElementById('canvas-container');
  const containerRect = canvasContainer.getBoundingClientRect();

  // Convertimos coordenadas de ventana a relativas al contenedor
  const offsetX = x - containerRect.left;
  const offsetY = y - containerRect.top;

  // Creamos los puntos
  const punto1 = document.createElement('div');
  punto1.className = 'punto-flecha';
  punto1.style.position = 'absolute';
  punto1.style.left = `${offsetX}px`;
  punto1.style.top = `${offsetY}px`;

  const punto2 = document.createElement('div');
  punto2.className = 'punto-flecha';
  punto2.style.position = 'absolute';
  punto2.style.left = `${offsetX + 100}px`;
  punto2.style.top = `${offsetY}px`;

  // Añadimos los puntos al contenedor del campo

  canvasContainer.appendChild(punto1);
  canvasContainer.appendChild(punto2);
  
  // Creamos la flecha entre ambos puntos
  const flecha = new LeaderLine(punto1, punto2, {
    color: '#ff4c4c',
    size: 4,
    path: 'straight',
    startPlug: 'disc',
    endPlug: 'arrow3',
    endPlugSize: 1.5
  });

  // Guardamos los puntos y la flecha para futuras referencias
  puntosFlecha.push(punto1, punto2);
  flechas.push(flecha);

  // Hacemos que los puntos puedan arrastrarse
  hacerArrastrableFlecha(punto1, flecha);
  hacerArrastrableFlecha(punto2, flecha);
}


function hacerArrastrableFlecha(punto, flecha) {
  let offsetX = 0, offsetY = 0, moviendo = false;

  punto.addEventListener('mousedown', e => {
    moviendo = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    e.stopPropagation();
  });

  window.addEventListener('mousemove', e => {
    if (!moviendo) return;
    const contenedor = document.getElementById('flecha-puntos-container');
    const rect = contenedor.getBoundingClientRect();
    punto.style.left = `${e.clientX - rect.left - offsetX}px`;
    punto.style.top = `${e.clientY - rect.top - offsetY}px`;
    flecha.position();
  });

  window.addEventListener('mouseup', () => {
    moviendo = false;
  });
}

// Detectar flecha arrastrada
document.querySelectorAll('.tools img').forEach(img => {
  img.addEventListener('dragstart', e => {
    currentDragged = img;
  });
});


canvas.addEventListener('drop', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentDragged && currentDragged.dataset.tipo === "flecha") {
    crearFlecha(x, y);
    return;
  }

  // resto de tu código drop ya lo tienes bien
});
function ocultarFlechas() {
  flechas.forEach(f => f.hide());
}

function cerrarPizarra() {
  document.getElementById('canvas-container').style.display = 'none';
  ocultarFlechas();
}

document.querySelector('.miniatura-campo').addEventListener('click', () => {
  const container = document.getElementById('canvas-container');
  container.style.display = 'flex';

  // Esperar al próximo frame para asegurar que el canvas tiene tamaño visible
  requestAnimationFrame(() => {
    resizeCanvas();      // ← ahora funciona porque el canvas es visible
    dibujarTodo();
    flechas.forEach(f => f.show());
  });
});


