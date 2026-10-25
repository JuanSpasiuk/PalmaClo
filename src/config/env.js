import 'dotenv/config';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('Falta la variable de entorno ' + name + '.');
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = required('JWT_SECRET');

if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 bytes aleatorios.');
}

const trustProxyValue = process.env.TRUST_PROXY || '0';
if (!/^\d+$/.test(trustProxyValue)) {
  throw new Error('TRUST_PROXY debe ser un número de saltos de proxy confiables.');
}

const port = Number(process.env.PORT || 3000);
const dbPort = Number(process.env.DB_PORT || 3306);
const dbConnectionLimit = Number(process.env.DB_CONNECTION_LIMIT || 10);

for (const [name, value] of Object.entries({ PORT: port, DB_PORT: dbPort, DB_CONNECTION_LIMIT: dbConnectionLimit })) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(name + ' debe ser un entero positivo.');
}

export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port,
  jwtSecret,
  trustProxy: Number(trustProxyValue),
  database: Object.freeze({
    host: required('DB_HOST'),
    port: dbPort,
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    name: required('DB_NAME'),
    connectionLimit: dbConnectionLimit,
  }),
});
