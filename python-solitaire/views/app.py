"""
Aplicación Flask para el juego de Solitario.

Este módulo contiene la aplicación web Flask que proporciona
la interfaz gráfica HTML/CSS/JavaScript para el juego.
Define todas las rutas y endpoints de la API REST.
"""

from flask import Flask, render_template, jsonify, request
from controllers.gestor_partidas import GestorPartidas
from models.solitario import SolitarioKlondike
from typing import Dict, Any

# Crear instancia de Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'solitaire-secret-key-2025'
app.config['JSON_AS_ASCII'] = False  # Permitir caracteres UTF-8

# Gestor de partidas (singleton)
gestor = GestorPartidas()

# Partida actual en memoria
partida_actual: SolitarioKlondike = None


# ============ RUTAS HTML ============

@app.route('/')
def index():
    """
    Ruta principal - Menú de inicio.
    
    Muestra la página de inicio con opciones para crear,
    cargar o eliminar partidas.
    
    Returns:
        str: Template HTML renderizado
    """
    return render_template('index.html')


@app.route('/juego')
def juego():
    """
    Ruta del juego - Interfaz de juego.
    
    Muestra la interfaz principal del solitario donde
    se puede jugar la partida actual.
    
    Returns:
        str: Template HTML renderizado
    """
    return render_template('juego.html')


# ============ API REST - CRUD PARTIDAS ============

@app.route('/api/partidas', methods=['GET'])
def api_listar_partidas():
    """
    Endpoint GET - Lista todas las partidas (READ).
    
    Returns:
        JSON: Lista de partidas con sus estadísticas
    """
    try:
        partidas = gestor.listar_partidas()
        return jsonify({
            'success': True,
            'partidas': partidas,
            'total': len(partidas)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/partidas', methods=['POST'])
def api_crear_partida():
    """
    Endpoint POST - Crea una nueva partida (CREATE).
    
    Espera JSON con campo 'nombre'.
    
    Returns:
        JSON: Confirmación de creación con datos de la partida
    """
    try:
        datos = request.get_json()
        nombre = datos.get('nombre', '').strip()
        
        if not nombre:
            return jsonify({
                'success': False,
                'error': 'El nombre es requerido'
            }), 400
        
        # Crear partida
        global partida_actual
        partida_actual = gestor.crear_partida(nombre)
        
        if partida_actual:
            return jsonify({
                'success': True,
                'mensaje': f"Partida '{nombre}' creada exitosamente",
                'partida': partida_actual.serializar()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al crear la partida'
            }), 500
            
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/partidas/<nombre>', methods=['GET'])
def api_cargar_partida(nombre: str):
    """
    Endpoint GET - Carga una partida específica (READ).
    
    Args:
        nombre (str): Nombre de la partida a cargar
    
    Returns:
        JSON: Datos completos de la partida
    """
    try:
        global partida_actual
        partida_actual = gestor.leer_partida(nombre)
        
        if partida_actual:
            return jsonify({
                'success': True,
                'partida': partida_actual.serializar()
            })
        else:
            return jsonify({
                'success': False,
                'error': f"Partida '{nombre}' no encontrada"
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/partidas/<nombre>', methods=['PUT'])
def api_actualizar_partida(nombre: str):
    """
    Endpoint PUT - Actualiza una partida existente (UPDATE).
    
    Args:
        nombre (str): Nombre de la partida a actualizar
    
    Returns:
        JSON: Confirmación de actualización
    """
    try:
        if not partida_actual or partida_actual.nombre != nombre:
            return jsonify({
                'success': False,
                'error': 'Partida no cargada en memoria'
            }), 400
        
        if gestor.actualizar_partida(partida_actual):
            return jsonify({
                'success': True,
                'mensaje': f"Partida '{nombre}' guardada exitosamente"
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al guardar la partida'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/partidas/<nombre>', methods=['DELETE'])
def api_eliminar_partida(nombre: str):
    """
    Endpoint DELETE - Elimina una partida (DELETE).
    
    Args:
        nombre (str): Nombre de la partida a eliminar
    
    Returns:
        JSON: Confirmación de eliminación
    """
    try:
        if gestor.eliminar_partida(nombre):
            return jsonify({
                'success': True,
                'mensaje': f"Partida '{nombre}' eliminada exitosamente"
            })
        else:
            return jsonify({
                'success': False,
                'error': f"Partida '{nombre}' no encontrada"
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============ API REST - JUEGO ============

@app.route('/api/juego/estado', methods=['GET'])
def api_estado_juego():
    """
    Endpoint GET - Obtiene el estado actual del juego.
    
    Returns:
        JSON: Estado completo de la partida actual
    """
    try:
        if not partida_actual:
            return jsonify({
                'success': False,
                'error': 'No hay partida activa'
            }), 400
        
        return jsonify({
            'success': True,
            'estado': partida_actual.serializar(),
            'estadisticas': partida_actual.obtener_estadisticas()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/juego/robar', methods=['POST'])
def api_robar_carta():
    """
    Endpoint POST - Roba una carta del mazo.
    
    Returns:
        JSON: Carta robada y estado actualizado
    """
    try:
        if not partida_actual:
            return jsonify({
                'success': False,
                'error': 'No hay partida activa'
            }), 400
        
        carta = partida_actual.robar_carta()
        
        if carta:
            return jsonify({
                'success': True,
                'carta': carta.serializar(),
                'mazo_size': len(partida_actual.mazo),
                'descarte_size': len(partida_actual.descarte)
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No hay más cartas para robar'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/juego/mover', methods=['POST'])
def api_mover_carta():
    """
    Endpoint POST - Realiza un movimiento de carta.
    
    Espera JSON con campos 'origen' y 'destino'.
    
    Returns:
        JSON: Resultado del movimiento
    """
    try:
        if not partida_actual:
            return jsonify({
                'success': False,
                'error': 'No hay partida activa'
            }), 400
        
        datos = request.get_json()
        origen = datos.get('origen')
        destino = datos.get('destino')
        
        if not origen or not destino:
            return jsonify({
                'success': False,
                'error': 'Origen y destino son requeridos'
            }), 400
        
        # Intentar realizar el movimiento
        if partida_actual.realizar_movimiento(origen, destino):
            # Auto-guardar después de cada movimiento
            gestor.guardar_partida_auto(partida_actual)
            
            # Verificar victoria
            victoria = partida_actual.verificar_victoria()
            
            return jsonify({
                'success': True,
                'mensaje': 'Movimiento realizado',
                'estado': partida_actual.serializar(),
                'victoria': victoria
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Movimiento inválido'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/estadisticas', methods=['GET'])
def api_estadisticas_globales():
    """
    Endpoint GET - Obtiene estadísticas globales.
    
    Returns:
        JSON: Estadísticas de todas las partidas
    """
    try:
        stats = gestor.obtener_estadisticas_globales()
        return jsonify({
            'success': True,
            'estadisticas': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============ MANEJADORES DE ERRORES ============

@app.errorhandler(404)
def not_found(error):
    """
    Manejador de error 404.
    
    Args:
        error: Objeto de error
        
    Returns:
        JSON: Mensaje de error
    """
    return jsonify({
        'success': False,
        'error': 'Recurso no encontrado'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """
    Manejador de error 500.
    
    Args:
        error: Objeto de error
        
    Returns:
        JSON: Mensaje de error
    """
    return jsonify({
        'success': False,
        'error': 'Error interno del servidor'
    }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
