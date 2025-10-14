# Juego de Solitario - Proyecto Python

## Descripción
Implementación completa de un juego de Solitario Klondike con interfaz web usando Flask, HTML y CSS.
Cumple con todos los requisitos de programación orientada a objetos y buenas prácticas.

## Requisitos Académicos Implementados

### 1. Clases y Herencia
- **Clase Abstracta**: `Juego` (en `models/juego.py`)
- **Clase que Hereda**: `SolitarioKlondike` (en `models/solitario.py`)
- **Clase Principal**: `Carta` con 5 atributos (en `models/carta.py`)
  - `palo` (str)
  - `valor` (str)
  - `numero` (int)
  - `boca_arriba` (bool)
  - `__posicion` (tuple) - **Atributo encapsulado**

### 2. Módulos Python Utilizados
- `json`: Persistencia de partidas (guardar/cargar)
- `deque`: Gestión eficiente de pilas de cartas
- `datetime`: Timestamps de partidas
- `random`: Barajar cartas
- `re`: Validación de nombres de partidas

### 3. CRUD Completo
- **Create**: Crear nueva partida
- **Read**: Listar y cargar partidas guardadas
- **Update**: Actualizar estado de partida
- **Delete**: Eliminar partidas guardadas

### 4. Interfaz Gráfica
- Frontend: HTML5 + CSS3
- Backend: Flask (micro-framework Python)
- Comunicación: AJAX para interactividad

## Instalación

### Requisitos
```bash
Python 3.8 o superior
```

### Instalar Dependencias
```bash
pip install flask
```

**Nota**: Los módulos `json`, `deque`, `datetime`, `random` y `re` son parte de la biblioteca estándar de Python.

## Estructura del Proyecto

```
python-solitaire/
│
├── main.py                 # Punto de entrada principal
├── README.md              # Este archivo
├── requirements.txt       # Dependencias del proyecto
│
├── models/                # Modelos y lógica del juego
│   ├── __init__.py
│   ├── juego.py          # Clase abstracta Juego
│   ├── carta.py          # Clase Carta (5 atributos)
│   └── solitario.py      # Clase SolitarioKlondike
│
├── controllers/           # Controladores y gestión de datos
│   ├── __init__.py
│   └── gestor_partidas.py # CRUD de partidas
│
├── views/                 # Interfaz gráfica (Flask)
│   └── app.py            # Aplicación Flask
│
├── templates/             # Templates HTML
│   ├── index.html        # Página principal
│   └── juego.html        # Interfaz del juego
│
├── static/               # Archivos estáticos
│   ├── css/
│   │   └── styles.css   # Estilos del juego
│   └── js/
│       └── game.js      # Lógica del cliente
│
└── data/                 # Almacenamiento de partidas
    └── partidas.json    # Base de datos JSON
```

## Uso

### Iniciar el Servidor
```bash
python main.py
```

### Acceder al Juego
Abrir navegador en: `http://localhost:5000`

## Características del Juego

### Reglas del Solitario Klondike
- 7 columnas con cartas progresivas (1, 2, 3... 7 cartas)
- 4 pilas de fundación (una por palo)
- Mazo de robo con cartas restantes
- Objetivo: Ordenar todas las cartas por palo de As a Rey

### Funcionalidades
- Crear nueva partida
- Guardar partida en cualquier momento
- Cargar partidas anteriores
- Eliminar partidas
- Mover cartas entre columnas
- Validación automática de movimientos

## Documentación del Código

Todo el código incluye:
- **Docstrings** en todas las funciones, clases y métodos
- **Comentarios** explicativos en lógica compleja
- **Type hints** para mejor legibilidad
- **Nombres descriptivos** siguiendo PEP 8

## Buenas Prácticas Implementadas

1. **Separación de responsabilidades**: MVC (Model-View-Controller)
2. **Encapsulación**: Atributos privados con getters/setters
3. **Herencia y polimorfismo**: Clase abstracta con implementación concreta
4. **Modularización**: Código separado en múltiples archivos
5. **Manejo de errores**: Try-except en operaciones críticas
6. **Validación de datos**: Entrada del usuario siempre validada
7. **Código limpio**: PEP 8, nombres descriptivos, funciones pequeñas

## Autor
Proyecto académico - Implementación de Solitario Klondike

## Licencia
Proyecto educativo - Uso libre para fines académicos
