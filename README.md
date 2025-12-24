# E-Commerce Backend

Backend robusto para una plataforma de E-Commerce, construido con Node.js, Express y MongoDB. Implementa una arquitectura limpia, inyección de dependencias y un flujo de pagos real con Stripe.

## 🚀 Indice

1. Árbol de Directorios
2. Características principales
3. Tecnologías utilizadas
4. Arquitectura y Patrones
5. Endpoints disponibles
6. Configuración del Entorno
7. Ejecución de Tests
8. Enlaces Útiles
9. Autor

## 🌲 Árbol de Directorios

```bash
├── config/                # Configuración global y validación de variables (Joi)
├── src/
│   ├── app.js             # Configuración de Express y registro de rutas
│   ├── server.js          # Punto de entrada y arranque del servidor
│   ├── loaders/           # Inicialización (Base de datos, Dependency Injector Container)
│   ├── api/
│   │   ├── routes/        # Definición de endpoints
│   │   └── validators/    # Esquemas de validación (Express-Validator)
│   │   └── controllers/   # Orquestadores de la solicitud HTTP    
│   ├── services/          # Lógica de negocio pura
│   ├── repositories/      # Capa de persistencia (Patrón Repository)
│   ├── models/            # Esquemas de Mongoose
│   ├── providers/         # Integraciones externas (Stripe, JWT)
│   ├── middlewares/       # Seguridad, Errores y Auth
│   └── utils/             # Clases de error personalizadas y helpers
│   └── docs/              
│   │   ├── openapi.yaml   # Documentación Swagger/OpenAPI
├── tests/                 # Suite de pruebas Unitarias y E2E (Jest + Supertest)
│   │   ├── e2e/
│   │   └── unit/      
│   │   └── middleware/      
```

## 🛠 Características principales

- **Gestión de Usuarios & Perfil:** Registro, Login, y gestión de direcciones de envío.
- **Catálogo Completo:** CRUD de productos, categorías y marcas con filtrado avanzado.
- **Carrito de Compras:** Persistencia por usuario y validación de stock en tiempo real.
- **Flujo de Pedidos:** Creación de órdenes con selección de dirección por defecto.
- **Pagos con Stripe:** Integración con Stripe API (Payment Intents) y manejo de Webhooks.
- **Wishlist:** Lista de deseos con lógica de no duplicidad.
- **Seguridad:** Autenticación JWT y autorización basada en roles (User/Admin).
- **Arquitectura Limpia:** Desacoplamiento total mediante Inyección de Dependencias.

## 🛠 Tecnologías utilizadas

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Base de Datos:** MongoDB & Mongoose
- **Pagos:** Stripe SDK
- **Validación:** Express-Validator & Joi
- **Pruebas:** Jest & Supertest
- **Documentación:** Swagger / OpenAPI 3.0

## 🏗 Arquitectura y Patrones

El proyecto destaca por su alta mantenibilidad gracias a:

- **Patrón Repository:** Abstracción total de Mongoose para facilitar el testing.
- **Inyección de Dependencias (DI):** Las clases reciben sus dependencias por constructor, facilitando el uso de Mocks.
- **Global Error Handling:** Middleware centralizado para capturar y formatear errores.
- **Base Repository:** Clase genérica para operaciones CRUD comunes, reduciendo la duplicidad de código.

## 🧑‍💻 Endpoints disponibles

🔐 Autenticación & Cliente

- POST /auth/register | POST /auth/login
- GET /customer/profile - Ver perfil y direcciones.
- POST /customer/address - Gestionar direcciones de envío.

🛍️ Tienda (Público/Admin)

- GET /product - Listar con filtros.
- GET /category | GET /brand
- POST /product - (Admin) Crear producto.

🛒 Compra & Deseos

- POST /cart/add - Gestionar carrito.
- GET /wishlist - Ver lista de deseos.
- POST /wishlist/add - Guardar para después.

💳 Pedidos & Pagos

- POST /order - Generar pedido desde el carrito.
- PATCH /order/:id/cancel - Cancelar pedido pendiente y devolver stock.
- POST /payment/create-intent - Iniciar pago con Stripe.
- POST /payment/webhook - Confirmación automática de pago.

## ⚙️ Configuración del Entorno

Crea un archivo .env en la raíz del proyecto y agrega las siguientes variables de entorno:

```bash
PORT=5000
MONGODB_URL=mongodb://...
JWT_SECRET=tu_secreto_super_seguro
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

## 🧪 Ejecución de Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests individual
npm test product.e2e.test.js
```

## 🔗 Enlaces Útiles

- Documentación Interactiva: http://localhost:5000/api-docs (Swagger)

## 👤 Autor

- Nombre: Diego Abanto Mendoza
- Email: diegoabm.dev@gmail.com
- Portafolio: https://diegoam-dev.vercel.app/
