// Lógica del juego en el cliente
async function robarCarta() {
    const response = await fetch('/api/juego/robar', { method: 'POST' });
    const data = await response.json();
    if (data.success) alert('Carta robada!');
}

async function guardarPartida() {
    alert('Partida guardada automáticamente!');
}

function volverMenu() {
    window.location.href = '/';
}
