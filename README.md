# E-Commerce Backend

Este es el backend del proyecto **E-Commerce**, desarrollado como parte de un proyecto de aprendizaje utilizando (MongoDB, Express, Node.js). Este backend proporciona una API RESTful para manejar funcionalidades como la gestión de productos, usuarios, autenticación y pedidos.

---

## 🚀 Indice

1. Descripción del proyecto
2. Tecnologías utilizadas
3. Requisitos previos
4. Instalación y configuración
5. Endpoints disponibles
6. Autenticación y autorización
7. Despliegue
8. Enlaces útiles
9. Autor

## 🚀 Descripción

Este backend gestiona los productos, categorías, marcas, pedidos y usuarios a través de una API segura. Además, se incluye un sistema de autenticación basado en **JWT** para proteger las rutas de administración.

### Características principales:

- **Autenticación de usuarios** usando JWT.
- **Gestión de productos**: CRUD para productos.
- **Gestión de categorías y marcas**: CRUD para categorías y marcas.
- **Gestión de pedidos**: CRUD de pedidos y cambios de estado (e.g. Despachado, Enviado, Entregado).
- **Filtrado de productos**: Filtra productos por categorías y marcas.
- **Protección de rutas**: Acceso restringido a rutas de administrador.

---

## 🛠 Tecnologías utilizadas

- **Node.js**: Entorno de ejecución para JavaScript.
- **Express**: Framework de Node.js para manejar rutas y solicitudes HTTP.
- **MongoDB**: Base de datos NoSQL para almacenar los datos del sistema (productos, usuarios, pedidos, etc.).
- **Mongoose**: Librería para interactuar con MongoDB a través de un modelo de datos estructurado.
- **JWT**: JSON Web Tokens para la autenticación de usuarios y protección de rutas.

---

## 🏗 Arquitectura y Patrones Implementados

El sistema está diseñado siguiendo principios de programación modular y de responsabilidad única (SRP), lo que garantiza un código limpio, desacoplado y altamente testeable.

### Patrones clave:

- **Patrón Repository (Capa de Datos)**:
  - La carpeta `repositories` (ej: `user-repository.js`) aísla la lógica de acceso a la base de datos (MongoDB/Mongoose).
  - **Beneficio**: Permite cambiar la base de datos (ej. de MongoDB a PostgreSQL) sin modificar la lógica de negocio.
- **Patrón Service (Capa de Negocio)**:
  - La carpeta `services` (ej: `auth-service.js`) contiene toda la lógica de negocio (validación de contraseñas, _hashing_, gestión de flujos de registro).
  - **Beneficio**: Mantiene los controladores de ruta ligeros y facilita el testing unitario de la lógica central.
- **Patrón Provider (Capa de Terceros)**:
  - La carpeta `providers` (ej: `token-provider.js`) encapsula la lógica de librerías externas o servicios específicos (como la generación y verificación de JWT con `jsonwebtoken`).
  - **Beneficio**: El servicio de autenticación no interactúa directamente con JWT, sino con una abstracción.
- **Inyección de Dependencias (DI)**:
  - La aplicación se ensambla en `app.js` y `server.js`, donde las dependencias (Repository, Provider) se inyectan en el constructor de las clases (Service).
  - **Beneficio**: Esto permite inyectar **mocks** durante las pruebas E2E y unitarias, logrando un control total sobre el comportamiento del sistema sin depender de la red o la base de datos real.

---

## ⚙ Requisitos previos

Asegúrate de tener lo siguiente antes de ejecutar el proyecto:

- **Node.js v18 o superior**: [Descargar Node.js](https://nodejs.org/)
- **MongoDB**: Puedes usar una instancia local de MongoDB o un servicio en la nube como [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

---

## 🛠 Instalación y configuración

Sigue estos pasos para configurar el backend de manera local.

### 1️⃣ Clonar el repositorio

Clona este repositorio en tu máquina local:

```bash
git clone https://github.com/R3dgrave/E-Commerce-Backend.git
cd E-Commerce-Backend
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Configurar variables de entorno

Crea un archivo .env en la raíz del proyecto y agrega las siguientes variables de entorno:

```bash
MONGODB_URL=mongodb://localhost:27017/ecommerce_db  # O la URL de tu base de datos MongoDB
JWT_SECRET=tu_clave_secreta
PORT=5000
```

### 4️⃣ Ejecutar el proyecto localmente

```bash
npm start
```

---

## 🧑‍💻 Endpoints disponibles

1️⃣ Autenticación

- POST /auth/login: Inicia sesión de usuario.
- POST /auth/register: Registra un nuevo usuario.

2️⃣ Productos

- GET /product: Obtiene todos los productos.
- POST /product: Crea un nuevo producto (requiere autenticación de administrador).
- GET /product/:id: Obtiene un producto por ID.
- PUT /product/:id: Actualiza un producto por ID (requiere autenticación de administrador).
- DELETE /products/:id: Elimina un producto por ID (requiere autenticación de administrador).

3️⃣ Categorías

- GET /category: Obtiene todas las categorías.
- POST /category: Crea una nueva categoría (requiere autenticación de administrador).
- GET /category/:id: Obtiene una categoría por ID.
- PUT /category/:id: Actualiza una categoría por ID (requiere autenticación de administrador).
- DELETE /category/:id: Elimina una categoría por ID (requiere autenticación de administrador).

4️⃣ Marcas

- GET /brand: Obtiene todas las marcas.
- POST /brand: Crea una nueva marca (requiere autenticación de administrador).
- GET /brand/:id: Obtiene una marca por ID.
- PUT /brand/:id: Actualiza una marca por ID (requiere autenticación de administrador).
- DELETE /brand/:id: Elimina una marca por ID (requiere autenticación de administrador).

5️⃣ Pedidos

- GET /orders: Obtiene todos los pedidos (requiere autenticación de administrador).
- POST /orders: Crea un nuevo pedido.
- GET /orders/:id: Obtiene un pedido por ID.
- PUT /orders/:id: Actualiza el estado de un pedido (requiere autenticación de administrador).

---

## 🔐 Autenticación y Autorización Detallada

- La seguridad se implementa a través de dos middlewares clave en la capa de Authorization:

1. **verifyToken**:
    - Verifica la validez y la firma del JWT.
    - Si es válido, adjunta el payload decodificado (ej: user.id, user.isAdmin) a req.user.
    - Si es inválido, retorna 401 Unauthorized.

2. **isAdmin**:
    -Se ejecuta después de verifyToken.
    -Revisa req.user.isAdmin. Si es false o si el usuario no existe, retorna 403 Forbidden.
    -Solo permite el paso a las rutas críticas del negocio (CRUD de productos, categorías, marcas, y gestión de pedidos).

-Para obtener un token, los usuarios deben iniciar sesión a través del endpoint /auth/login. Este token debe ser enviado en el encabezado Authorization como Bearer <token> para acceder a las rutas protegidas.

---


## 🌍 Despliegue

- Este backend está diseñado para ser desplegado en un entorno en la nube. Se puede usar servicios como Render, Heroku o AWS. Asegúrate de configurar correctamente las variables de entorno, especialmente la URL de la base de datos y el JWT Secreto.

---

## 🔗 Enlaces útiles

- Frontend del proyecto: E-Commerce Frontend
- Documentación de Node.js: https://nodejs.org/en/docs/
- Documentación de Express: https://expressjs.com/
- Documentación de MongoDB: https://www.mongodb.com/docs/
- Documentación de JWT: https://jwt.io/

---

## 👤 Autor

- Nombre: Diego Abanto Mendoza
- Email: diegoabm.dev@gmail.com
- Portafolio: https://diegoam-dev.vercel.app/
