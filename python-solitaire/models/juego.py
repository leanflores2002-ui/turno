"""
Módulo que define la clase abstracta Juego.

Este módulo contiene la clase base abstracta para todos los tipos de juegos.
Define la interfaz que deben implementar los juegos concretos.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime


class Juego(ABC):
    """
    Clase abstracta base para juegos de cartas.
    
    Esta clase define la estructura común que deben seguir todos los juegos.
    Implementa el patrón Template Method, donde algunos métodos tienen
    implementación base y otros deben ser implementados por las subclases.
    
    Attributes:
        nombre (str): Nombre identificador del juego
        fecha_creacion (datetime): Timestamp de creación de la partida
        movimientos (int): Contador de movimientos realizados
    """
    
    def __init__(self, nombre: str):
        """
        Inicializa un nuevo juego.
        
        Args:
            nombre (str): Nombre identificador para la partida
        """
        self.nombre = nombre
        self.fecha_creacion = datetime.now()
        self.movimientos = 0
    
    @abstractmethod
    def iniciar_juego(self) -> None:
        """
        Inicializa el estado del juego.
        
        Método abstracto que debe ser implementado por cada juego específico
        para configurar su estado inicial (barajar, repartir, etc.).
        """
        pass
    
    @abstractmethod
    def validar_movimiento(self, origen: Any, destino: Any) -> bool:
        """
        Valida si un movimiento es permitido según las reglas.
        
        Args:
            origen: Ubicación de origen del movimiento
            destino: Ubicación de destino del movimiento
            
        Returns:
            bool: True si el movimiento es válido, False en caso contrario
        """
        pass
    
    @abstractmethod
    def realizar_movimiento(self, origen: Any, destino: Any) -> bool:
        """
        Ejecuta un movimiento en el juego.
        
        Args:
            origen: Ubicación de origen del movimiento
            destino: Ubicación de destino del movimiento
            
        Returns:
            bool: True si el movimiento se realizó exitosamente
        """
        pass
    
    @abstractmethod
    def verificar_victoria(self) -> bool:
        """
        Verifica si el juego ha sido ganado.
        
        Returns:
            bool: True si se cumplieron las condiciones de victoria
        """
        pass
    
    @abstractmethod
    def serializar(self) -> Dict[str, Any]:
        """
        Convierte el estado del juego a un diccionario serializable.
        
        Returns:
            Dict[str, Any]: Diccionario con el estado completo del juego
        """
        pass
    
    @abstractmethod
    def deserializar(self, datos: Dict[str, Any]) -> None:
        """
        Restaura el estado del juego desde un diccionario.
        
        Args:
            datos (Dict[str, Any]): Diccionario con el estado del juego
        """
        pass
    
    def obtener_estadisticas(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas básicas del juego.
        
        Método concreto que proporciona información común a todos los juegos.
        Las subclases pueden extender este método para agregar más estadísticas.
        
        Returns:
            Dict[str, Any]: Diccionario con estadísticas del juego
        """
        return {
            'nombre': self.nombre,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'movimientos': self.movimientos,
            'tiempo_transcurrido': str(datetime.now() - self.fecha_creacion)
        }
