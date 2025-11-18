# Prestamos API - Sistema de Gestión de Préstamos

API REST desarrollada con NestJS que implementa un sistema completo de gestión de préstamos con autenticación JWT, documentación Swagger y base de datos PostgreSQL.

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- Docker Desktop
- TablePlus o pgAdmin (opcional, para gestión de base de datos)
- Git

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd prestamos-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea o verifica el archivo `.env` en la raíz del proyecto:

```env
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=MySecr3tPassWord@as2
DB_DATABASE=prestamosdb

# JWT Configuration
JWT_SECRET=Est3EsMISE3Dsecreto32s
JWT_EXPIRATION=24h
```

### 4. Iniciar Docker Desktop

- Abre Docker Desktop y espera a que esté completamente iniciado
- Verifica que el ícono de Docker en la barra de tareas esté activo

### 5. Levantar la base de datos PostgreSQL

```bash
docker-compose up -d
```

**Verificar que el contenedor esté corriendo:**

```bash
docker ps
```

Deberías ver algo como:
```
CONTAINER ID   IMAGE                COMMAND                  STATUS         PORTS                    NAMES
xxxxx          postgres:16-alpine   "docker-entrypoint..."   Up 2 minutes   0.0.0.0:5432->5432/tcp   prestamosdb
```

### 6. Iniciar la aplicación

```bash
npm run start:dev
```

**La aplicación debería:**
- Conectarse a PostgreSQL
- Crear automáticamente las tablas (users, loans, loan_payments, loan_abonos)
- Mostrar logs de las queries SQL
- Estar disponible en: `http://localhost:3000`

### 7. Verificar tablas creadas

Desde la terminal:

```bash
docker exec -it prestamosdb psql -U postgres -d prestamosdb -c "\dt"
```

Deberías ver las tablas:
- `users`
- `loans`
- `loan_payments`
- `loan_abonos`

### 8. Acceder a la documentación Swagger

Abre en tu navegador:

```
http://localhost:3000/api/docs
```

## 📦 Estructura del Proyecto

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

## 🔑 Endpoints Principales

### Autenticación

- **POST** `/api/v1.0/user` - Crear usuario
- **POST** `/api/v1.0/auth` - Login (obtener token JWT)
- **GET** `/api/v1.0/auth` - Perfil del usuario autenticado

### Préstamos

- **POST** `/api/v1.0/loan` - Crear solicitud de préstamo
- **GET** `/api/v1.0/loan` - Listar préstamos
- **GET** `/api/v1.0/loan/:id` - Obtener préstamo (sin amortización)
- **GET** `/api/v2.0/loan/:id` - Obtener préstamo (con amortización)
- **POST** `/api/v1.0/loan/approval` - Aprobar/rechazar préstamo
- **POST** `/api/v1.0/loan/amor` - Calcular tabla de amortización
- **POST** `/api/v1.0/loan/payment` - Registrar pago de cuota
- **POST** `/api/v1.0/loan/abono` - Realizar abono a capital

## 🧪 Prueba Rápida

### 1. Crear usuario

```bash
curl -X POST http://localhost:3000/api/v1.0/user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1.0/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123"
  }'
```

**Copia el `access_token` de la respuesta**

### 3. Crear préstamo

```bash
curl -X POST http://localhost:3000/api/v1.0/loan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "amount": 10000,
    "termMonths": 12,
    "interestRate": 5.5,
    "amortizationType": "FIXED"
  }'
```

## 🛠️ Comandos Útiles

### Docker

```bash
# Iniciar contenedor
docker-compose up -d

# Detener contenedor
docker-compose down

# Ver logs del contenedor
docker logs prestamosdb

# Acceder a PostgreSQL
docker exec -it prestamosdb psql -U postgres -d prestamosdb

# Eliminar todo (contenedor + volumen)
docker-compose down -v
```

### Aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test

# Linting
npm run lint
```

## 🔧 Conectar con TablePlus

**Configuración:**
- **Type**: PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **User**: postgres
- **Password**: MySecr3tPassWord@as2
- **Database**: prestamosdb

## ❗ Solución de Problemas

### No se crean las tablas

1. Verifica que la aplicación esté corriendo: `npm run start:dev`
2. Revisa los logs para ver errores de conexión
3. Confirma que `synchronize: true` esté en `database.config.ts`
4. Verifica que `logging: true` para ver las queries SQL

### Error de conexión a base de datos

1. Verifica que Docker esté corriendo: `docker ps`
2. Reinicia el contenedor: `docker-compose restart`
3. Verifica las credenciales en `.env`

### Docker no inicia

1. Abre Docker Desktop
2. Si no funciona, reinicia WSL: `wsl --shutdown`
3. Habilita virtualización en la BIOS (AMD-V o Intel VT-x)

## 📝 Características Implementadas

✅ Autenticación JWT  
✅ Prefijo global `/api`  
✅ Versionado por URI (v1.0, v2.0)  
✅ Validaciones con DTOs  
✅ Documentación Swagger  
✅ Base de datos PostgreSQL con TypeORM  
✅ Cálculo de amortización (cuota fija y variable)  
✅ Gestión de pagos y abonos a capital  
✅ Protección de endpoints con guards

## 🤝 Contribución

[Instrucciones de contribución]

## 📄 Licencia

[Tipo de licencia]

---

**Desarrollado con NestJS + PostgreSQL + Docker** 🚀
