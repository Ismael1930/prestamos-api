# Prestamos API - Sistema de Gestión de Préstamos

API REST desarrollada con NestJS que implementa un sistema completo de gestión de préstamos con autenticación JWT, documentación Swagger y base de datos PostgreSQL.

## Características Implementadas

### Requisitos Técnicos
- **Framework**: NestJS
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación**: Swagger UI
- **Base de Datos**: PostgreSQL con TypeORM
- **Validaciones**: DTOs con class-validator
- **Prefijo Global**: `/api`
- **Versionado**: URI Versioning (v1.0, v2.0)

### Funcionalidades

#### 1. Autenticación de Usuario
- `POST /api/v1.0/user` - Crear nuevo usuario
- `POST /api/v1.0/auth` - Autenticación (login)
- `GET /api/v1.0/auth` - Obtener perfil del usuario autenticado

#### 2. Gestión de Préstamos
- `POST /api/v1.0/loan` - Registrar solicitud de préstamo
- `GET /api/v1.0/loan` - Listar solicitudes del usuario
- `GET /api/v1.0/loan/:id` - Obtener préstamo sin amortización
- `GET /api/v2.0/loan/:id` - Obtener préstamo con amortización

#### 3. Aprobación de Préstamos
- `POST /api/v1.0/loan/approval` - Aprobar o rechazar solicitud

#### 4. Amortización
- `POST /api/v1.0/loan/amor` - Calcular tabla de amortización
- Soporta dos tipos:
  - **FIXED**: Cuota fija (método francés)
  - **VARIABLE**: Cuota variable (método alemán)

#### 5. Pagos de Cuotas
- `POST /api/v1.0/loan/payment` - Registrar pago de cuota
- Validaciones contra pagos duplicados
- Actualización automática del saldo pendiente

#### 6. Abonos a Capital
- `POST /api/v1.0/loan/abono` - Realizar abono adicional
- Recálculo automático de cuotas para préstamos de cuota fija

## Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- Docker y Docker Compose (recomendado)
- npm o yarn

### Pasos para Clonar y Ejecutar

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Ismael1930/prestamos-api.git
   cd prestamos-api
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   
   Crear un archivo `.env` en la raíz del proyecto (copia de `.env.example`):
   ```bash
   cp .env.example .env
   ```
   
   Editar el archivo `.env` con tus configuraciones:
   ```env
   PORT=3000

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=prestamos_db
   DB_NAME=prestamos_db

   # JWT Configuration
   JWT_SECRET=tu-secret-key-super-seguro-cambiar-en-produccion
   JWT_EXPIRATION=24h
   ```

4. **Iniciar la base de datos con Docker**
   ```bash
   docker compose up -d
   ```
   
   Esto creará automáticamente:
   - Contenedor de PostgreSQL
   - Base de datos `prestamos_db`
   - Puerto 5432 expuesto

5. **Iniciar la aplicación**
   ```bash
   # Modo desarrollo (con hot-reload)
   npm run start:dev
   
   ```

6. **Verificar que funciona**
   - API: http://localhost:3000/api
   - Swagger UI: http://localhost:3000/api/docs



## Documentación de la API

Una vez iniciada la aplicación, accede a la documentación Swagger en:

```
http://localhost:3000/api/docs
```

## Estructura del Proyecto

```
src/
├── auth/                      # Módulo de autenticación
│   ├── dto/                   # DTOs de autenticación
│   ├── guards/                # Guards JWT
│   ├── strategies/            # Estrategias Passport
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                     # Módulo de usuarios
│   ├── dto/                   # DTOs de usuarios
│   ├── entities/              # Entidad User
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── loans/                     # Módulo de préstamos
│   ├── dto/                   # DTOs de préstamos
│   ├── entities/              # Entidades (Loan, Payment, Abono)
│   ├── services/              # Servicio de amortización
│   ├── loans.controller.v1.ts # Endpoints v1.0
│   ├── loans.controller.v2.ts # Endpoints v2.0
│   ├── loans.service.ts
│   └── loans.module.ts
├── config/                    # Configuraciones
│   └── database.config.ts
├── app.module.ts
└── main.ts
```


## Tipos de Amortización

### Cuota Fija (FIXED)
- La cuota mensual permanece constante durante todo el plazo
- Los intereses disminuyen y el capital aumenta progresivamente

### Cuota Variable (VARIABLE)
- El capital se amortiza de forma constante
- Los intereses varían según el saldo pendiente
- Las cuotas iniciales son más altas y van disminuyendo

## Estados del Préstamo

- `PENDING`: Solicitud pendiente de aprobación
- `APPROVED`: Préstamo aprobado (transiciona a DISBURSED)
- `REJECTED`: Solicitud rechazada
- `DISBURSED`: Préstamo desembolsado (activo)
- `PAID`: Préstamo totalmente pagado

## Validaciones Implementadas

### Préstamos
- Monto: 1,000 - 1,000,000
- Plazo: 1 - 360 meses
- Tasa de interés: 0% - 100%

### Usuarios
- Email único
- Password mínimo 6 caracteres

### Pagos
- No se permiten pagos duplicados
- El monto debe ser igual o mayor a la cuota calculada

### Abonos
- No puede exceder el saldo pendiente


