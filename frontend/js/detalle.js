const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const API_URL = `http://localhost:5501/api/ejercicios/${id}`;
const contenedor = document.getElementById("detalle-ejercicio");

fetch(API_URL)
  .then(res => res.json())
  .then(e => {
    contenedor.innerHTML = `
      <h2>${e.titulo}</h2>
      <img src="${e.archivoUrl}" alt="imagen del ejercicio" style="width:100%; max-width:600px;" />
      <p><strong>Tipo:</strong> ${e.tipo}</p>
      <p><strong>Descripción:</strong> ${e.descripcion}</p>
      <p><strong>Objetivos:</strong> ${e.objetivos?.join(', ')}</p>
      <p><strong>Edad recomendada:</strong> ${e.edadRecomendada}</p>
      <p><strong>Dificultad:</strong> ${e.dificultad}</p>
      <p><strong>Duración:</strong> ${e.duracion}</p>
      <p><strong>Material:</strong> ${e.material?.join(', ')}</p>
      <p><strong>Número de jugadores:</strong> ${e.numeroJugadores}</p>
    `;
  })
  .catch(err => {
    contenedor.innerHTML = "<p>Error al cargar el ejercicio.</p>";
    console.error(err);
  });
