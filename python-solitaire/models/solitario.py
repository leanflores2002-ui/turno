"""
Módulo que implementa el juego de Solitario Klondike.

Este módulo contiene la clase SolitarioKlondike que hereda de Juego
e implementa todas las reglas específicas del solitario.
Utiliza los módulos: random, deque, datetime
"""

import random
from collections import deque
from datetime import datetime
from typing import List, Dict, Any, Optional, Deque
from .juego import Juego
from .carta import Carta


class SolitarioKlondike(Juego):
    """
    Implementación concreta del juego Solitario Klondike.
    
    Hereda de la clase abstracta Juego e implementa todas las reglas
    específicas del solitario Klondike clásico.
    
    Attributes:
        mazo (Deque[Carta]): Mazo de cartas disponibles para robar
        descarte (List[Carta]): Cartas descartadas del mazo
        columnas (List[List[Carta]]): 7 columnas del tablero
        fundaciones (Dict[str, List[Carta]]): 4 pilas de fundación por palo
        cartas_totales (List[Carta]): Referencia a todas las cartas del juego
    """
    
    def __init__(self, nombre: str):
        """
        Inicializa un nuevo juego de Solitario Klondike.
        
        Args:
            nombre (str): Nombre identificador de la partida
        """
        super().__init__(nombre)
        
        # Estructuras de datos del juego
        self.mazo: Deque[Carta] = deque()  # Uso de deque para eficiencia
        self.descarte: List[Carta] = []
        self.columnas: List[List[Carta]] = [[] for _ in range(7)]
        self.fundaciones: Dict[str, List[Carta]] = {
            'Corazones': [],
            'Diamantes': [],
            'Tréboles': [],
            'Picas': []
        }
        self.cartas_totales: List[Carta] = []
        
        # Inicializar el juego automáticamente
        self.iniciar_juego()
    
    def iniciar_juego(self) -> None:
        """
        Inicializa el juego creando y repartiendo las cartas.
        
        Implementación del método abstracto de Juego.
        Crea un mazo estándar de 52 cartas, lo baraja y reparte.
        """
        # Crear mazo completo de 52 cartas
        self.cartas_totales = self._crear_mazo()
        
        # Barajar usando random.shuffle
        random.shuffle(self.cartas_totales)
        
        # Repartir cartas a las columnas (1, 2, 3... 7 cartas)
        indice_carta = 0
        for columna_num in range(7):
            for posicion in range(columna_num + 1):
                carta = self.cartas_totales[indice_carta]
                
                # La última carta de cada columna va boca arriba
                if posicion == columna_num:
                    carta.boca_arriba = True
                
                # Establecer posición encapsulada
                carta.set_posicion(columna_num, posicion)
                
                self.columnas[columna_num].append(carta)
                indice_carta += 1
        
        # Cartas restantes van al mazo
        for i in range(indice_carta, 52):
            self.mazo.append(self.cartas_totales[i])
        
        print(f"✅ Juego '{self.nombre}' iniciado con {len(self.mazo)} cartas en el mazo")
    
    def _crear_mazo(self) -> List[Carta]:
        """
        Crea un mazo estándar de 52 cartas.
        
        Método privado que genera todas las combinaciones de palos y valores.
        
        Returns:
            List[Carta]: Lista con 52 cartas
        """
        mazo = []
        for palo in Carta.PALOS_VALIDOS:
            for valor in Carta.VALORES_VALIDOS:
                mazo.append(Carta(palo, valor))
        return mazo
    
    def robar_carta(self) -> Optional[Carta]:
        """
        Roba una carta del mazo.
        
        Saca una carta del mazo (deque) y la coloca en el descarte.
        Si el mazo está vacío, recicla el descarte.
        
        Returns:
            Optional[Carta]: La carta robada o None si no hay cartas
        """
        # Si el mazo está vacío, reciclar el descarte
        if not self.mazo:
            if not self.descarte:
                return None
            
            # Voltear todas las cartas del descarte
            for carta in self.descarte:
                carta.voltear()
            
            # Mover descarte al mazo (en orden inverso)
            self.mazo = deque(reversed(self.descarte))
            self.descarte = []
        
        # Robar carta del mazo usando popleft (eficiente con deque)
        if self.mazo:
            carta = self.mazo.popleft()
            carta.boca_arriba = True
            self.descarte.append(carta)
            return carta
        
        return None
    
    def validar_movimiento(self, origen: str, destino: str) -> bool:
        """
        Valida si un movimiento es permitido.
        
        Implementación del método abstracto de Juego.
        
        Args:
            origen (str): Identificador del origen (ej: "col_0", "descarte", "fund_Corazones")
            destino (str): Identificador del destino
            
        Returns:
            bool: True si el movimiento es válido
        """
        try:
            carta_origen = self._obtener_carta_movible(origen)
            if not carta_origen:
                return False
            
            # Validar según tipo de destino
            if destino.startswith("col_"):
                columna_dest = int(destino.split("_")[1])
                return self._validar_movimiento_columna(carta_origen, columna_dest)
            
            elif destino.startswith("fund_"):
                palo_dest = destino.split("_")[1]
                return self._validar_movimiento_fundacion(carta_origen, palo_dest)
            
            return False
            
        except Exception as e:
            print(f"❌ Error validando movimiento: {e}")
            return False
    
    def realizar_movimiento(self, origen: str, destino: str) -> bool:
        """
        Ejecuta un movimiento en el juego.
        
        Implementación del método abstracto de Juego.
        
        Args:
            origen (str): Identificador del origen
            destino (str): Identificador del destino
            
        Returns:
            bool: True si el movimiento se realizó exitosamente
        """
        if not self.validar_movimiento(origen, destino):
            return False
        
        try:
            # Obtener carta(s) a mover
            cartas_mover = self._extraer_cartas(origen)
            
            # Mover a destino
            if destino.startswith("col_"):
                columna_dest = int(destino.split("_")[1])
                for carta in cartas_mover:
                    self.columnas[columna_dest].append(carta)
                    carta.set_posicion(columna_dest, len(self.columnas[columna_dest]) - 1)
            
            elif destino.startswith("fund_"):
                palo_dest = destino.split("_")[1]
                self.fundaciones[palo_dest].append(cartas_mover[0])
                cartas_mover[0].limpiar_posicion()
            
            # Incrementar contador de movimientos
            self.movimientos += 1
            
            # Voltear carta superior de columna origen si quedó boca abajo
            if origen.startswith("col_"):
                columna_orig = int(origen.split("_")[1])
                if self.columnas[columna_orig] and not self.columnas[columna_orig][-1].boca_arriba:
                    self.columnas[columna_orig][-1].voltear()
            
            return True
            
        except Exception as e:
            print(f"❌ Error realizando movimiento: {e}")
            return False
    
    def _validar_movimiento_columna(self, carta: Carta, columna_destino: int) -> bool:
        """
        Valida si una carta puede moverse a una columna.
        
        Args:
            carta (Carta): Carta a mover
            columna_destino (int): Índice de columna destino (0-6)
            
        Returns:
            bool: True si el movimiento es válido
        """
        columna = self.columnas[columna_destino]
        
        # Si la columna está vacía, solo acepta Reyes
        if not columna:
            return carta.valor == 'K'
        
        # La carta debe poder ir sobre la última carta de la columna
        return carta.puede_ir_sobre(columna[-1])
    
    def _validar_movimiento_fundacion(self, carta: Carta, palo: str) -> bool:
        """
        Valida si una carta puede moverse a una fundación.
        
        Args:
            carta (Carta): Carta a mover
            palo (str): Palo de la fundación destino
            
        Returns:
            bool: True si el movimiento es válido
        """
        # La carta debe ser del mismo palo
        if carta.palo != palo:
            return False
        
        fundacion = self.fundaciones[palo]
        
        # Si la fundación está vacía, solo acepta Ases
        if not fundacion:
            return carta.valor == 'A'
        
        # Debe ser el siguiente número en secuencia
        return carta.numero == fundacion[-1].numero + 1
    
    def _obtener_carta_movible(self, origen: str) -> Optional[Carta]:
        """
        Obtiene la carta movible desde un origen.
        
        Args:
            origen (str): Identificador del origen
            
        Returns:
            Optional[Carta]: La carta movible o None
        """
        if origen == "descarte":
            return self.descarte[-1] if self.descarte else None
        
        elif origen.startswith("col_"):
            columna = int(origen.split("_")[1])
            if self.columnas[columna]:
                return self.columnas[columna][-1]
        
        elif origen.startswith("fund_"):
            palo = origen.split("_")[1]
            if self.fundaciones[palo]:
                return self.fundaciones[palo][-1]
        
        return None
    
    def _extraer_cartas(self, origen: str) -> List[Carta]:
        """
        Extrae carta(s) de un origen.
        
        Args:
            origen (str): Identificador del origen
            
        Returns:
            List[Carta]: Lista de cartas extraídas
        """
        if origen == "descarte":
            return [self.descarte.pop()]
        
        elif origen.startswith("col_"):
            columna = int(origen.split("_")[1])
            return [self.columnas[columna].pop()]
        
        elif origen.startswith("fund_"):
            palo = origen.split("_")[1]
            return [self.fundaciones[palo].pop()]
        
        return []
    
    def verificar_victoria(self) -> bool:
        """
        Verifica si el jugador ha ganado.
        
        Implementación del método abstracto de Juego.
        El juego se gana cuando todas las 52 cartas están en las fundaciones.
        
        Returns:
            bool: True si se ha ganado el juego
        """
        total_en_fundaciones = sum(len(f) for f in self.fundaciones.values())
        return total_en_fundaciones == 52
    
    def serializar(self) -> Dict[str, Any]:
        """
        Convierte el estado del juego a diccionario.
        
        Implementación del método abstracto de Juego.
        Utiliza json-serializable data.
        
        Returns:
            Dict[str, Any]: Estado completo del juego
        """
        return {
            'nombre': self.nombre,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'movimientos': self.movimientos,
            'mazo': [carta.serializar() for carta in self.mazo],
            'descarte': [carta.serializar() for carta in self.descarte],
            'columnas': [[carta.serializar() for carta in col] for col in self.columnas],
            'fundaciones': {
                palo: [carta.serializar() for carta in cartas]
                for palo, cartas in self.fundaciones.items()
            }
        }
    
    def deserializar(self, datos: Dict[str, Any]) -> None:
        """
        Restaura el estado del juego desde un diccionario.
        
        Implementación del método abstracto de Juego.
        
        Args:
            datos (Dict[str, Any]): Diccionario con estado del juego
        """
        self.nombre = datos['nombre']
        self.fecha_creacion = datetime.fromisoformat(datos['fecha_creacion'])
        self.movimientos = datos['movimientos']
        
        # Restaurar mazo
        self.mazo = deque(Carta.deserializar(c) for c in datos['mazo'])
        
        # Restaurar descarte
        self.descarte = [Carta.deserializar(c) for c in datos['descarte']]
        
        # Restaurar columnas
        self.columnas = [
            [Carta.deserializar(c) for c in col]
            for col in datos['columnas']
        ]
        
        # Restaurar fundaciones
        self.fundaciones = {
            palo: [Carta.deserializar(c) for c in cartas]
            for palo, cartas in datos['fundaciones'].items()
        }
    
    def obtener_estadisticas(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas extendidas del juego.
        
        Extiende el método base de Juego con estadísticas específicas.
        
        Returns:
            Dict[str, Any]: Estadísticas completas
        """
        stats = super().obtener_estadisticas()
        stats.update({
            'cartas_en_fundaciones': sum(len(f) for f in self.fundaciones.values()),
            'cartas_en_mazo': len(self.mazo),
            'cartas_en_descarte': len(self.descarte),
            'victoria': self.verificar_victoria()
        })
        return stats
