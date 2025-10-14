"""
Paquete de controladores del juego de Solitario.

Este paquete contiene los controladores que gestionan la lógica de negocio:
- GestorPartidas: Manejo de CRUD de partidas
"""

from .gestor_partidas import GestorPartidas

__all__ = ['GestorPartidas']
