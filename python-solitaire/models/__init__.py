"""
Paquete de modelos del juego de Solitario.

Este paquete contiene todas las clases del modelo de datos:
- Juego: Clase abstracta base
- Carta: Representación de una carta de juego
- SolitarioKlondike: Implementación concreta del juego
"""

from .juego import Juego
from .carta import Carta
from .solitario import SolitarioKlondike

__all__ = ['Juego', 'Carta', 'SolitarioKlondike']
