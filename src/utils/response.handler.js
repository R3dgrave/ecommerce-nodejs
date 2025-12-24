/**
 * Utilidad para estandarizar las respuestas de la API
 */
const sendResponse = (res, statusCode, data = null, message = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
  };

  if (message) response.message = message;
  if (data) response.data = data;

  return res.status(statusCode).json(response);
};

module.exports = sendResponse;