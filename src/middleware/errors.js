export function notFound(_req, res) {
  res.status(404).json({ error: 'No encontramos ese recurso.' });
}

export function errorHandler(error, req, res, _next) {
  console.error(JSON.stringify({
    level: 'error',
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    message: error.message,
    code: error.code,
  }));

  if (res.headersSent) return;
  const status = error.type === 'entity.parse.failed' ? 400 : (error.statusCode || 500);
  res.status(status).json({
    error: status < 500 ? 'La solicitud no tiene un formato válido.' : 'Ocurrió un error inesperado.',
    requestId: req.requestId,
  });
}
