"""
Módulo que define la clase Carta.

Este módulo contiene la clase Carta que representa una carta de juego
con sus propiedades y comportamientos. Incluye encapsulación de atributos.
"""

from typing import Tuple, Optional


class Carta:
    """
    Representa una carta de juego con sus propiedades.
    
    Esta es la clase principal del sistema con 5 atributos, uno de ellos
    encapsulado (__posicion). Incluye validación y métodos getter/setter.
    
    Attributes:
        palo (str): El palo de la carta (Corazones, Diamantes, Tréboles, Picas)
        valor (str): El valor de la carta (A, 2-10, J, Q, K)
        numero (int): Valor numérico para comparaciones (1-13)
        boca_arriba (bool): Indica si la carta está visible
        __posicion (Tuple[int, int]): Posición encapsulada (columna, índice)
    """
    
    # Constantes de clase
    PALOS_VALIDOS = ['Corazones', 'Diamantes', 'Tréboles', 'Picas']
    VALORES_VALIDOS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    PALOS_ROJOS = ['Corazones', 'Diamantes']
    PALOS_NEGROS = ['Tréboles', 'Picas']
    
    def __init__(self, palo: str, valor: str, boca_arriba: bool = False):
        """
        Inicializa una nueva carta.
        
        Args:
            palo (str): El palo de la carta
            valor (str): El valor de la carta
            boca_arriba (bool): Si la carta está boca arriba (default: False)
            
        Raises:
            ValueError: Si el palo o valor no son válidos
        """
        # Validación de entradas
        if palo not in self.PALOS_VALIDOS:
            raise ValueError(f"Palo inválido: {palo}. Debe ser uno de {self.PALOS_VALIDOS}")
        if valor not in self.VALORES_VALIDOS:
            raise ValueError(f"Valor inválido: {valor}. Debe ser uno de {self.VALORES_VALIDOS}")
        
        # Atributo 1: Palo de la carta
        self.palo = palo
        
        # Atributo 2: Valor de la carta
        self.valor = valor
        
        # Atributo 3: Número para comparaciones
        self.numero = self._calcular_numero(valor)
        
        # Atributo 4: Estado de visibilidad
        self.boca_arriba = boca_arriba
        
        # Atributo 5 (ENCAPSULADO): Posición en el tablero
        self.__posicion: Optional[Tuple[int, int]] = None
    
    def _calcular_numero(self, valor: str) -> int:
        """
        Calcula el valor numérico de la carta.
        
        Método privado que convierte el valor de la carta a un número
        para facilitar comparaciones.
        
        Args:
            valor (str): El valor de la carta
            
        Returns:
            int: Valor numérico (1-13)
        """
        mapeo = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
            '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
        }
        return mapeo[valor]
    
    # GETTERS Y SETTERS PARA ATRIBUTO ENCAPSULADO
    
    def get_posicion(self) -> Optional[Tuple[int, int]]:
        """
        Obtiene la posición de la carta (getter).
        
        Returns:
            Optional[Tuple[int, int]]: Tupla (columna, índice) o None
        """
        return self.__posicion
    
    def set_posicion(self, columna: int, indice: int) -> None:
        """
        Establece la posición de la carta (setter).
        
        Args:
            columna (int): Número de columna (0-6)
            indice (int): Índice dentro de la columna
            
        Raises:
            ValueError: Si la columna es inválida
        """
        if columna < 0 or columna > 6:
            raise ValueError(f"Columna inválida: {columna}. Debe estar entre 0 y 6")
        self.__posicion = (columna, indice)
    
    def limpiar_posicion(self) -> None:
        """
        Limpia la posición de la carta.
        """
        self.__posicion = None
    
    # MÉTODOS DE UTILIDAD
    
    def es_roja(self) -> bool:
        """
        Verifica si la carta es roja.
        
        Returns:
            bool: True si la carta es roja (Corazones o Diamantes)
        """
        return self.palo in self.PALOS_ROJOS
    
    def es_negra(self) -> bool:
        """
        Verifica si la carta es negra.
        
        Returns:
            bool: True si la carta es negra (Tréboles o Picas)
        """
        return self.palo in self.PALOS_NEGROS
    
    def voltear(self) -> None:
        """
        Voltea la carta (cambia su estado boca_arriba).
        """
        self.boca_arriba = not self.boca_arriba
    
    def puede_ir_sobre(self, otra: 'Carta') -> bool:
        """
        Verifica si esta carta puede colocarse sobre otra en las columnas.
        
        En el solitario Klondike, una carta puede ir sobre otra si:
        - Es de color opuesto
        - Es exactamente un valor menor
        
        Args:
            otra (Carta): La carta sobre la que se quiere colocar
            
        Returns:
            bool: True si el movimiento es válido
        """
        # Debe ser de color opuesto
        colores_diferentes = (self.es_roja() and otra.es_negra()) or \
                            (self.es_negra() and otra.es_roja())
        
        # Debe ser exactamente un valor menor
        valor_correcto = self.numero == otra.numero - 1
        
        return colores_diferentes and valor_correcto
    
    def serializar(self) -> dict:
        """
        Convierte la carta a un diccionario serializable.
        
        Returns:
            dict: Diccionario con los atributos de la carta
        """
        return {
            'palo': self.palo,
            'valor': self.valor,
            'numero': self.numero,
            'boca_arriba': self.boca_arriba,
            'posicion': self.__posicion
        }
    
    @classmethod
    def deserializar(cls, datos: dict) -> 'Carta':
        """
        Crea una carta desde un diccionario.
        
        Args:
            datos (dict): Diccionario con los datos de la carta
            
        Returns:
            Carta: Nueva instancia de Carta
        """
        carta = cls(datos['palo'], datos['valor'], datos['boca_arriba'])
        if datos.get('posicion'):
            carta.set_posicion(*datos['posicion'])
        return carta
    
    def __str__(self) -> str:
        """
        Representación en string de la carta.
        
        Returns:
            str: Descripción de la carta
        """
        estado = "↑" if self.boca_arriba else "↓"
        return f"{self.valor}{self._simbolo_palo()} {estado}"
    
    def _simbolo_palo(self) -> str:
        """
        Obtiene el símbolo del palo.
        
        Returns:
            str: Símbolo unicode del palo
        """
        simbolos = {
            'Corazones': '♥',
            'Diamantes': '♦',
            'Tréboles': '♣',
            'Picas': '♠'
        }
        return simbolos[self.palo]
    
    def __repr__(self) -> str:
        """
        Representación técnica de la carta.
        
        Returns:
            str: Representación para debugging
        """
        return f"Carta(palo='{self.palo}', valor='{self.valor}', boca_arriba={self.boca_arriba})"
