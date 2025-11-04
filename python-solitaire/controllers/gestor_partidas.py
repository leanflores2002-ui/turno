"""
Módulo que gestiona el CRUD de partidas.

Este módulo implementa el CRUD completo (Create, Read, Update, Delete)
para las partidas de solitario, utilizando JSON para persistencia.
Utiliza los módulos: json, re, datetime
"""

import json
import re
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from models.solitario import SolitarioKlondike


class GestorPartidas:
    """
    Gestor de partidas con operaciones CRUD completas.
    
    Esta clase maneja la persistencia de partidas en un archivo JSON,
    proporcionando operaciones de Create, Read, Update y Delete.
    
    Attributes:
        archivo_datos (str): Ruta al archivo JSON de almacenamiento
        partidas (Dict[str, Dict]): Cache en memoria de las partidas
    """
    
    def __init__(self, archivo_datos: str = "data/partidas.json"):
        """
        Inicializa el gestor de partidas.
        
        Args:
            archivo_datos (str): Ruta al archivo de datos JSON
        """
        self.archivo_datos = archivo_datos
        self.partidas: Dict[str, Dict[str, Any]] = {}
        
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(archivo_datos), exist_ok=True)
        
        # Cargar partidas existentes
        self._cargar_partidas()
    
    # ============ CREATE ============
    
    def crear_partida(self, nombre: str) -> Optional[SolitarioKlondike]:
        """
        Crea una nueva partida (CREATE).
        
        Valida el nombre, crea un nuevo juego de solitario y lo guarda.
        
        Args:
            nombre (str): Nombre único para la partida
            
        Returns:
            Optional[SolitarioKlondike]: La partida creada o None si hay error
            
        Raises:
            ValueError: Si el nombre no es válido o ya existe
        """
        # Validar nombre usando regex
        if not self._validar_nombre(nombre):
            raise ValueError(
                "Nombre inválido. Debe contener solo letras, números, "
                "espacios y guiones, entre 3 y 30 caracteres."
            )
        
        # Verificar que no exista
        if nombre in self.partidas:
            raise ValueError(f"Ya existe una partida con el nombre '{nombre}'")
        
        try:
            # Crear nueva partida
            juego = SolitarioKlondike(nombre)
            
            # Serializar y guardar
            self.partidas[nombre] = juego.serializar()
            self._guardar_partidas()
            
            print(f"✅ Partida '{nombre}' creada exitosamente")
            return juego
            
        except Exception as e:
            print(f"❌ Error creando partida: {e}")
            return None
    
    # ============ READ ============
    
    def leer_partida(self, nombre: str) -> Optional[SolitarioKlondike]:
        """
        Lee una partida existente (READ).
        
        Carga una partida desde el almacenamiento y la deserializa.
        
        Args:
            nombre (str): Nombre de la partida a cargar
            
        Returns:
            Optional[SolitarioKlondike]: La partida cargada o None si no existe
        """
        if nombre not in self.partidas:
            print(f"❌ No existe una partida con el nombre '{nombre}'")
            return None
        
        try:
            # Crear nuevo juego y deserializar datos
            juego = SolitarioKlondike.__new__(SolitarioKlondike)
            juego.deserializar(self.partidas[nombre])
            
            print(f"✅ Partida '{nombre}' cargada exitosamente")
            return juego
            
        except Exception as e:
            print(f"❌ Error cargando partida: {e}")
            return None
    
    def listar_partidas(self) -> List[Dict[str, Any]]:
        """
        Lista todas las partidas guardadas (READ).
        
        Retorna información resumida de todas las partidas.
        
        Returns:
            List[Dict[str, Any]]: Lista con información de cada partida
        """
        lista = []
        for nombre, datos in self.partidas.items():
            # Calcular progreso
            total_fundaciones = sum(
                len(f) for f in datos.get('fundaciones', {}).values()
            )
            progreso = (total_fundaciones / 52) * 100
            
            lista.append({
                'nombre': nombre,
                'fecha_creacion': datos.get('fecha_creacion', ''),
                'movimientos': datos.get('movimientos', 0),
                'progreso': f"{progreso:.1f}%",
                'cartas_fundacion': total_fundaciones
            })
        
        # Ordenar por fecha de creación (más reciente primero)
        lista.sort(key=lambda x: x['fecha_creacion'], reverse=True)
        return lista
    
    # ============ UPDATE ============
    
    def actualizar_partida(self, juego: SolitarioKlondike) -> bool:
        """
        Actualiza una partida existente (UPDATE).
        
        Guarda el estado actual de una partida en el almacenamiento.
        
        Args:
            juego (SolitarioKlondike): Instancia del juego a actualizar
            
        Returns:
            bool: True si se actualizó correctamente
        """
        nombre = juego.nombre
        
        if nombre not in self.partidas:
            print(f"❌ No existe una partida con el nombre '{nombre}'")
            return False
        
        try:
            # Serializar estado actual
            self.partidas[nombre] = juego.serializar()
            self._guardar_partidas()
            
            print(f"✅ Partida '{nombre}' actualizada exitosamente")
            return True
            
        except Exception as e:
            print(f"❌ Error actualizando partida: {e}")
            return False
    
    def guardar_partida_auto(self, juego: SolitarioKlondike) -> bool:
        """
        Guarda automáticamente una partida (UPDATE o CREATE).
        
        Si la partida existe, la actualiza; si no, la crea.
        
        Args:
            juego (SolitarioKlondike): Instancia del juego a guardar
            
        Returns:
            bool: True si se guardó correctamente
        """
        if juego.nombre in self.partidas:
            return self.actualizar_partida(juego)
        else:
            try:
                self.partidas[juego.nombre] = juego.serializar()
                self._guardar_partidas()
                return True
            except:
                return False
    
    # ============ DELETE ============
    
    def eliminar_partida(self, nombre: str) -> bool:
        """
        Elimina una partida (DELETE).
        
        Borra permanentemente una partida del almacenamiento.
        
        Args:
            nombre (str): Nombre de la partida a eliminar
            
        Returns:
            bool: True si se eliminó correctamente
        """
        if nombre not in self.partidas:
            print(f"❌ No existe una partida con el nombre '{nombre}'")
            return False
        
        try:
            # Eliminar del diccionario
            del self.partidas[nombre]
            self._guardar_partidas()
            
            print(f"✅ Partida '{nombre}' eliminada exitosamente")
            return True
            
        except Exception as e:
            print(f"❌ Error eliminando partida: {e}")
            return False
    
    def eliminar_todas_partidas(self) -> bool:
        """
        Elimina todas las partidas (DELETE masivo).
        
        Borra todas las partidas del almacenamiento.
        PRECAUCIÓN: Esta operación no se puede deshacer.
        
        Returns:
            bool: True si se eliminaron correctamente
        """
        try:
            self.partidas = {}
            self._guardar_partidas()
            
            print("✅ Todas las partidas eliminadas exitosamente")
            return True
            
        except Exception as e:
            print(f"❌ Error eliminando partidas: {e}")
            return False
    
    # ============ MÉTODOS PRIVADOS ============
    
    def _validar_nombre(self, nombre: str) -> bool:
        """
        Valida el nombre de una partida usando regex.
        
        El nombre debe:
        - Contener solo letras, números, espacios y guiones
        - Tener entre 3 y 30 caracteres
        
        Args:
            nombre (str): Nombre a validar
            
        Returns:
            bool: True si el nombre es válido
        """
        # Patrón regex: letras, números, espacios, guiones, 3-30 caracteres
        patron = r'^[a-zA-Z0-9\s\-]{3,30}$'
        return re.match(patron, nombre) is not None
    
    def _cargar_partidas(self) -> None:
        """
        Carga las partidas desde el archivo JSON.
        
        Si el archivo no existe, crea uno vacío.
        """
        try:
            if os.path.exists(self.archivo_datos):
                with open(self.archivo_datos, 'r', encoding='utf-8') as archivo:
                    self.partidas = json.load(archivo)
                print(f"✅ {len(self.partidas)} partida(s) cargada(s)")
            else:
                # Crear archivo vacío
                self.partidas = {}
                self._guardar_partidas()
                print("📝 Archivo de partidas creado")
                
        except json.JSONDecodeError as e:
            print(f"⚠️ Error decodificando JSON: {e}. Iniciando con datos vacíos.")
            self.partidas = {}
        except Exception as e:
            print(f"❌ Error cargando partidas: {e}")
            self.partidas = {}
    
    def _guardar_partidas(self) -> None:
        """
        Guarda las partidas en el archivo JSON.
        
        Utiliza indentación para mejor legibilidad.
        """
        try:
            with open(self.archivo_datos, 'w', encoding='utf-8') as archivo:
                json.dump(
                    self.partidas,
                    archivo,
                    ensure_ascii=False,
                    indent=2
                )
        except Exception as e:
            print(f"❌ Error guardando partidas: {e}")
            raise
    
    def obtener_estadisticas_globales(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas globales de todas las partidas.
        
        Returns:
            Dict[str, Any]: Estadísticas generales
        """
        if not self.partidas:
            return {
                'total_partidas': 0,
                'total_movimientos': 0,
                'partidas_ganadas': 0
            }
        
        total_movimientos = sum(p.get('movimientos', 0) for p in self.partidas.values())
        
        partidas_ganadas = sum(
            1 for p in self.partidas.values()
            if sum(len(f) for f in p.get('fundaciones', {}).values()) == 52
        )
        
        return {
            'total_partidas': len(self.partidas),
            'total_movimientos': total_movimientos,
            'promedio_movimientos': total_movimientos / len(self.partidas),
            'partidas_ganadas': partidas_ganadas,
            'tasa_victoria': (partidas_ganadas / len(self.partidas)) * 100
        }
