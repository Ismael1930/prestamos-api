# Prestamos API - Sistema de Gestión de Préstamos

API REST desarrollada con NestJS que implementa un sistema completo de gestión de préstamos con autenticación JWT, documentación Swagger y base de datos PostgreSQL.

## Características Implementadas

### ✅ Requisitos Técnicos
- **Framework**: NestJS
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación**: Swagger UI
- **Base de Datos**: PostgreSQL con TypeORM
- **Validaciones**: DTOs con class-validator
- **Prefijo Global**: `/api`
- **Versionado**: URI Versioning (v1.0, v2.0)

### ✅ Funcionalidades

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

## Instalación

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm

### Pasos de Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar base de datos**
   - Crear una base de datos PostgreSQL:
   ```sql
   CREATE DATABASE prestamos_db;
   ```

3. **Configurar variables de entorno**
   
   Editar el archivo `.env` con tus credenciales:
   ```env
   PORT=3000

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=tu_password
   DB_DATABASE=prestamos_db

   # JWT Configuration
   JWT_SECRET=tu-secret-key-super-seguro
   JWT_EXPIRATION=24h
   ```

4. **Iniciar la aplicación**
   ```bash
   # Modo desarrollo
   npm run start:dev

   # Modo producción
   npm run build
   npm run start:prod
   ```

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

## Uso de la API

### 1. Crear Usuario

```bash
POST http://localhost:3000/api/v1.0/user
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2. Autenticarse

```bash
POST http://localhost:3000/api/v1.0/auth
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### 3. Crear Solicitud de Préstamo

```bash
POST http://localhost:3000/api/v1.0/loan
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "amount": 10000,
  "termMonths": 12,
  "interestRate": 5.5,
  "amortizationType": "FIXED"
}
```

### 4. Calcular Amortización

```bash
POST http://localhost:3000/api/v1.0/loan/amor
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "loanId": "uuid-del-prestamo"
}
```

## Tipos de Amortización

### Cuota Fija (FIXED - Método Francés)
- La cuota mensual permanece constante durante todo el plazo
- Los intereses disminuyen y el capital aumenta progresivamente

### Cuota Variable (VARIABLE - Método Alemán)
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

## Seguridad

- Todos los endpoints (excepto registro y login) requieren autenticación JWT
- Las contraseñas se almacenan hasheadas con bcrypt
- Validación de datos con DTOs y class-validator
- Los usuarios solo pueden acceder a sus propios préstamos

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
npm run test:cov
```

## Tecnologías Utilizadas

- **NestJS**: Framework progresivo de Node.js
- **TypeScript**: Superset tipado de JavaScript
- **PostgreSQL**: Base de datos relacional
- **TypeORM**: ORM para TypeScript
- **Passport JWT**: Autenticación con tokens
- **Swagger**: Documentación de API
- **class-validator**: Validación de DTOs
- **bcrypt**: Hash de contraseñas

---

**Desarrollado con NestJS** 🚀
