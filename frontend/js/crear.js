const API_URL = 'http://localhost:5501/api/ejercicios';

document.getElementById('form-ejercicio').addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value;
  const descripcion = document.getElementById('descripcion').value;
  const tipo = document.getElementById('tipo').value;
  const campo = document.getElementById('campo').value;
  const autor = document.getElementById('autor').value;
  const objetivos = document.getElementById('objetivos').value.split(',').map(e => e.trim());
  const edadRecomendada = document.getElementById('edadRecomendada').value;
  const dificultad = document.getElementById('dificultad').value;
  const duracion = document.getElementById('duracion').value;
  const material = document.getElementById('material').value.split(',').map(e => e.trim());
  const numeroJugadores = parseInt(document.getElementById('numeroJugadores').value);

  const datos = {
    titulo,
    descripcion: `(${campo}) ${descripcion}`, // añadimos el campo como parte de la descripción
    tipo,
    objetivos,
    edadRecomendada,
    dificultad,
    duracion,
    material,
    numeroJugadores,
    autor,
    archivoUrl: document.getElementById('imagen-ejercicio').value
};

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const respuesta = await res.json();

    if (res.ok) {
      document.getElementById('mensaje').innerText = '✅ Ejercicio guardado correctamente';
      document.getElementById('form-ejercicio').reset();
    } else {
      document.getElementById('mensaje').innerText = `❌ Error: ${respuesta.error || 'no se pudo guardar'}`;
    }
  } catch (err) {
    document.getElementById('mensaje').innerText = '❌ Error de red o servidor';
    console.error(err);
  }
});
function guardarDiseno() {
  const imagenBase64 = canvas.toDataURL('image/png');
  document.getElementById('imagen-ejercicio').value = imagenBase64;

  //alert('✅ Imagen del tablero capturada correctamente');
  document.getElementById('canvas-container').style.display = 'none';
  actualizarMiniatura(); 
  ocultarFlechas();

}
