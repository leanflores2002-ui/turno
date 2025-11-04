"""
Punto de entrada principal del Juego de Solitario.

Este módulo inicia la aplicación Flask y configura el servidor web.
Importa la aplicación desde el módulo views.app y la ejecuta.

Autor: Proyecto Académico
Fecha: 2025
"""

from views.app import app

def main():
    """
    Función principal que inicia el servidor Flask.
    
    El servidor se ejecuta en modo debug para desarrollo,
    permitiendo recarga automática y mensajes de error detallados.
    """
    print("=" * 50)
    print("🎴 SOLITARIO KLONDIKE - Servidor Iniciado")
    print("=" * 50)
    print("\n📍 Accede al juego en: http://localhost:5000")
    print("🔄 Presiona Ctrl+C para detener el servidor\n")
    
    # Iniciar el servidor Flask
    app.run(
        debug=True,      # Modo desarrollo con recarga automática
        host='0.0.0.0',  # Accesible desde cualquier IP
        port=5000        # Puerto del servidor
    )

if __name__ == "__main__":
    main()
