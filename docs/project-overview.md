# TurnoPlus - Sistema de Gestión de Turnos Médicos

## 📋 Resumen del Proyecto

TurnoPlus es una aplicación web completa para la gestión de turnos médicos que permite a pacientes, doctores y administradores interactuar de manera eficiente. El sistema está diseñado con una arquitectura moderna de microservicios, separando el backend (FastAPI + Python) del frontend (Angular + TypeScript).

## 🎯 Objetivo Principal

Facilitar la gestión integral de turnos médicos mediante una plataforma web que conecte pacientes, doctores y administradores, permitiendo:
- Reserva y cancelación de turnos
- Gestión de disponibilidad médica
- Administración de fichas clínicas
- Control administrativo del sistema

## 🏗️ Arquitectura del Sistema

### Backend (FastAPI + Python)
- **Framework**: FastAPI 0.115.0+
- **Base de Datos**: MySQL con SQLAlchemy 2.0.35+
- **Migraciones**: Alembic 1.13.1+
- **Autenticación**: JWT tokens
- **ORM**: SQLAlchemy con modelos tipados
- **Gestión de Dependencias**: uv (Python 3.13+)

### Frontend (Angular + TypeScript)
- **Framework**: Angular 20.3.0+
- **UI Framework**: Angular Material 20.2.9+
- **Styling**: SCSS con diseño responsive
- **HTTP Client**: Angular HttpClient con interceptors
- **Routing**: Lazy loading por módulos de funcionalidad
- **Testing**: Jasmine + Karma + ESLint

## 👥 Roles de Usuario

### 🧍‍♂️ Pacientes (USR)
- Registro e inicio de sesión
- Modificación de datos personales
- Solicitud y cancelación de turnos
- Consulta de turnos agendados
- Visualización de ficha clínica

### 🩺 Doctores (DOC)
- Inicio de sesión
- Gestión de disponibilidad
- Modificación de fichas clínicas
- Consulta de fichas clínicas

### 🧑‍💼 Administradores (ADMIN)
- Inicio de sesión
- Alta y baja de doctores
- Creación y eliminación de consultorios
- Gestión general del sistema

## 🗄️ Modelos de Datos

### Entidades Principales
- **User**: Usuario base con autenticación
- **Patient**: Perfil de paciente
- **Doctor**: Perfil de doctor
- **Admin**: Perfil de administrador
- **Appointment**: Turnos médicos
- **Availability**: Disponibilidad de doctores
- **MedicalRecord**: Fichas clínicas
- **Office**: Consultorios

### Relaciones
- Un usuario puede tener un perfil de paciente, doctor o admin
- Los turnos conectan pacientes con doctores
- Las fichas clínicas pertenecen a pacientes y doctores
- Los doctores tienen disponibilidad en consultorios

## 🔧 Tecnologías y Herramientas

### Backend Stack
```python
# Dependencias principales
fastapi>=0.115.0          # Framework web
sqlalchemy>=2.0.35        # ORM
alembic>=1.13.1           # Migraciones
pymysql>=1.1.1            # Driver MySQL
pydantic[email]>=2.11.7   # Validación de datos
uvicorn>=0.30.0           # Servidor ASGI
python-dotenv>=1.0.1      # Variables de entorno
```

### Frontend Stack
```json
{
  "@angular/core": "^20.3.0",
  "@angular/material": "^20.2.9",
  "@angular/cdk": "^20.2.9",
  "rxjs": "~7.8.0",
  "typescript": "~5.9.2"
}
```

### Herramientas de Desarrollo
- **Linting**: ESLint + Prettier
- **Testing**: Jasmine + Karma (Frontend)
- **Versionado**: Git
- **Gestión de Dependencias**: 
  - Backend: uv
  - Frontend: npm

## 📁 Estructura del Proyecto

```
turnoplus/
├── backend/                    # API FastAPI
│   ├── src/app/
│   │   ├── api/               # Endpoints de la API
│   │   ├── controllers/       # Controladores de negocio
│   │   ├── models/            # Modelos de base de datos
│   │   ├── schemas/           # Esquemas Pydantic
│   │   ├── services/          # Lógica de negocio
│   │   ├── repositories/      # Acceso a datos
│   │   ├── routes/            # Definición de rutas
│   │   └── utils/             # Utilidades
│   ├── alembic/               # Migraciones de BD
│   └── pyproject.toml         # Configuración Python
├── frontend/                   # Aplicación Angular
│   ├── src/app/
│   │   ├── core/              # Servicios core, guards, interceptors
│   │   ├── shared/            # Componentes compartidos
│   │   ├── auth/              # Módulo de autenticación
│   │   ├── patient/           # Módulo de pacientes
│   │   ├── doctor/            # Módulo de doctores
│   │   └── admin/             # Módulo de administradores
│   └── package.json           # Configuración Node.js
└── docs/                      # Documentación
```

## 🎨 Convenciones de Código

### Backend (Python)
- **Estilo**: PEP 8 con herramientas automáticas
- **Tipado**: Type hints obligatorios
- **Documentación**: Docstrings en funciones públicas
- **Estructura**: Arquitectura hexagonal (controllers → services → repositories)
- **Naming**: snake_case para variables y funciones, PascalCase para clases

### Frontend (TypeScript/Angular)
- **Estilo**: ESLint + Prettier configurado
- **Tipado**: TypeScript estricto habilitado
- **Estructura**: Feature modules con lazy loading
- **Naming**: camelCase para variables, PascalCase para clases y componentes
- **Convenciones Angular**: 
  - Componentes: `kebab-case` para archivos
  - Servicios: sufijo `.service.ts`
  - Guards: sufijo `.guard.ts`
  - Interceptors: sufijo `.interceptor.ts`

## 🔐 Seguridad

### Autenticación
- JWT tokens para autenticación
- Roles basados en permisos (Patient, Doctor, Admin)
- Guards de Angular para protección de rutas
- Interceptors para inyección automática de tokens

### Validación
- Pydantic para validación de datos en backend
- Validadores de formularios en Angular
- Sanitización de inputs

## 🚀 Configuración y Despliegue

### Variables de Entorno
```env
# Backend
DATABASE_URL=mysql+pymysql://usuario:password@host:3306/turnoplus
DATABASE_ECHO=0
DATABASE_POOL_PRE_PING=1
ALEMBIC_INI_PATH=./alembic.ini

# Frontend
API_BASE_URL=http://localhost:8000/api/v1
```

### Comandos de Desarrollo
```bash
# Backend
cd backend
uv run uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm start  # ng serve en puerto 4200
```

## 📊 Estado del Proyecto

### ✅ Completado
- [x] Arquitectura base del backend (FastAPI + SQLAlchemy)
- [x] Modelos de datos y migraciones
- [x] Sistema de autenticación multi-rol
- [x] API endpoints básicos
- [x] Frontend Angular con Material Design
- [x] Módulo de autenticación completo
- [x] Dashboard de pacientes (perfil, turnos, fichas clínicas)
- [x] Sistema de reserva de turnos

### 🟡 En Progreso
- [ ] Dashboard de doctores
- [ ] Panel de administración
- [ ] Gestión de consultorios

### ⬜ Pendiente
- [ ] Tests end-to-end
- [ ] Optimizaciones de rendimiento
- [ ] Documentación de API (Swagger)
- [ ] Despliegue en producción

## 🔄 Flujo de Desarrollo

1. **Desarrollo Backend**: Implementar endpoints en `backend/src/app/`
2. **Migraciones**: Crear migraciones con Alembic para cambios de BD
3. **Desarrollo Frontend**: Implementar componentes en `frontend/src/app/`
4. **Testing**: Ejecutar tests unitarios y de integración
5. **Documentación**: Actualizar documentación según cambios

## 📈 Próximos Pasos

1. Completar dashboard de doctores
2. Implementar panel de administración
3. Añadir tests end-to-end
4. Optimizar rendimiento y UX
5. Preparar despliegue en producción

---

*Documento generado para referencia del proyecto TurnoPlus - Sistema de Gestión de Turnos Médicos*
