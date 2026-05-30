/**
 * Middleware de validación con Zod.
 * Reemplaza req.body / req.query / req.params con los datos parseados y tipados.
 */

function formatZodError(error) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'body';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: formatZodError(result.error)
      });
    }
    req[source] = result.data;
    return next();
  };
}

module.exports = { validate, formatZodError };
