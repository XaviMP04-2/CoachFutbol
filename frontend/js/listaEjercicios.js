const API_URL = 'http://localhost:5501/api/ejercicios';
let todosLosEjercicios = [];

async function cargarEjercicios() {
  const contenedor = document.getElementById('lista-ejercicios');
  contenedor.innerHTML = 'Cargando ejercicios...';

  try {
    const respuesta = await fetch(API_URL);
    todosLosEjercicios = await respuesta.json();
    mostrarEjercicios(todosLosEjercicios);
  } catch (error) {
    contenedor.innerHTML = 'Error cargando ejercicios. ' + error.message;
    console.error(error);
  }
}

function mostrarEjercicios(lista) {
  const contenedor = document.getElementById('lista-ejercicios');
  contenedor.innerHTML = '';

  if (lista.length === 0) {
    contenedor.innerHTML = '<p>No hay ejercicios que coincidan con los filtros.</p>';
    return;
  }

  lista.forEach(e => {
    const div = document.createElement('div');
    div.classList.add('ejercicio');
    div.innerHTML = `
      <div class="ejercicio-contenido">
        <div class="ejercicio-texto">
          <h3>${e.titulo}</h3>
          <p><strong>Tipo:</strong> ${e.tipo}</p>
          <p><strong>Objetivos:</strong> ${e.objetivos?.slice(0, 2).join(", ") || '-'}</p>
        </div>
        <div class="ejercicio-imagen">
          ${e.archivoUrl ? `<img src="${e.archivoUrl}" alt="imagen del ejercicio">` : ''}
        </div>
      </div>
    `;

    div.onclick = () => window.location.href = `detalle.html?id=${e._id}`;
    contenedor.appendChild(div);
  });
}

document.getElementById('aplicar-filtros').addEventListener('click', () => {
  const tipo = document.getElementById('filtro-tipo').value;
  const dificultad = document.getElementById('filtro-dificultad').value;
  const edad = document.getElementById('filtro-edad').value.trim().toLowerCase();
  const jugadoresMin = parseInt(document.getElementById('filtro-jugadores').value);


  const filtrados = todosLosEjercicios.filter(e => {
    const coincideTipo = !tipo || e.tipo === tipo;
    const coincideDificultad = !dificultad || e.dificultad === dificultad;
    const coincideEdad = !edad || (e.edadRecomendada && e.edadRecomendada.toLowerCase().includes(edad));
    const coincideJugadores = !jugadoresMin || (e.numeroJugadores >= jugadoresMin);
    return coincideTipo && coincideDificultad && coincideEdad && coincideJugadores;
  });

  mostrarEjercicios(filtrados);
});

cargarEjercicios();
