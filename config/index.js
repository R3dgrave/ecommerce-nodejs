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

  MONGODB_URI_TEST: Joi.string().description(
    "URI de conexión específica para el entorno de prueba (E2E/Integration)."
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

function getTestDatabaseURI(originalURI) {
  if (envVars.NODE_ENV !== 'test') {
    return originalURI;
  }

  try {
    const testURI = originalURI.replace(/(\/[a-zA-Z0-9_-]+)(\?|$)/, (match, dbName, suffix) => {
      if (dbName.endsWith('-test')) {
        return match;
      }
      return `${dbName}-test${suffix}`;
    });

    console.log(`🟡 Usando DB de Test: ${testURI}`);
    return testURI;

  } catch (e) {
    console.warn("⚠️ Fallo al modificar la URI de MongoDB para test. Usando la URI original.", e);
    return originalURI;
  }
}

// Exportar la configuración con los tipos correctos
module.exports = {
  frontend_URL: envVars.FRONTEND_URL,
  env: envVars.NODE_ENV,
  port: envVars.PORT,

  // Base de Datos
  databaseURL: envVars.NODE_ENV === 'test' && envVars.MONGODB_URI_TEST
    ? envVars.MONGODB_URI_TEST
    : envVars.MONGODB_URI,

  // Seguridad
  jwtSecret: envVars.JWT_SECRET,
  jwtExpiration: envVars.JWT_EXPIRES_IN,

  // Logs
  logs: {
    level: envVars.LOG_LEVEL,
  },
};
