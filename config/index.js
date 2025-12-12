const dotenv = require("dotenv");
const Joi = require("joi");
dotenv.config();

const envSchema = Joi.object({
  FRONTEND_URL: Joi.string()
    .required()
    .description("La URL del frontend es Obligatoria"),
    
  // Configuración general y entorno
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(3000),

  // Configuración de la Base de Datos
  MONGODB_URI: Joi.string()
    .required()
    .description(
      "La URI de conexión a la base de datos MongoDB es obligatoria."
    ),

  // Configuración de Seguridad (JWT)
  JWT_SECRET: Joi.string()
    .required()
    .description("La clave secreta de JWT es obligatoria."),
  JWT_EXPIRES_IN: Joi.string()
    .default("1h")
    .description("Tiempo de expiración de JWT (ej. 1h, 7d)."),

  // Variables opcionales o con valores por defecto
  LOG_LEVEL: Joi.string().default("info"),
}).unknown(); // Permite otras variables de entorno que no estén en el esquema

// Validar el esquema contra las variables de entorno actuales (process.env)
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Error de validación de configuración: ${error.message}`);
}

// Exportar la configuración con los tipos correctos
module.exports = {
  frontend_URL: envVars.FRONTEND_URL,
  env: envVars.NODE_ENV,
  port: envVars.PORT,

  // Base de Datos
  databaseURL: envVars.MONGODB_URI,

  // Seguridad
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiration: envVars.JWT_EXPIRES_IN,

  // Logs
  logs: {
    level: envVars.LOG_LEVEL,
  },
};
