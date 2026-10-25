# PalmaClo

Aplicación de catálogo y administración con Node.js, Express y MySQL. Esta entrega conserva los datos y las imágenes del proyecto recibido, y reemplaza la autenticación insegura y el acceso estático a páginas privadas.

## Requisitos

- Node.js 20 o posterior.
- MySQL 8.0.16 o posterior.
- Las tablas existentes \`usuarios\` y \`productos\`, o una base nueva creada desde \`db/schema.sql\`.
- El usuario MySQL de la aplicación debe tener solo los permisos necesarios: lectura y actualización de \`usuarios\`, y lectura, alta, actualización y archivo lógico de \`productos\`.

## Puesta en marcha

1. Instala las dependencias con \`npm ci\`.
2. Copia \`.env.example\` a \`.env\`.
3. Genera un secreto con \`npm run security:secret\` y pega el resultado en \`JWT_SECRET\`. No publiques ni compartas ese valor.
4. Completa en \`.env\` la conexión MySQL y configura un usuario de base de datos de aplicación. No uses \`root\`.
5. Para una instalación nueva, revisa y ejecuta \`db/schema.sql\` en la base elegida.
6. Si \`usuarios.password\` no es \`VARCHAR(255)\`, respalda la base y ejecuta el SQL de \`db/migrations/001-password-column.sql\`.
7. Respalda la base y migra las contraseñas actuales con \`npm run migrate:passwords\`. El proceso deja intactas las contraseñas que ya tienen el formato scrypt de esta aplicación y actualiza las antiguas en una transacción.
8. En una base nueva, crea la primera cuenta administradora con npm run admin:create. Las contraseñas se ingresan en la terminal y no se guardan.
9. Para crear una cuenta normal de cliente, ejecuta npm run customer:create. La contraseña de cliente y la de MySQL root se ingresan ocultas y no se guardan.
10. Para mostrar el catálogo inicial, ejecuta npm run products:seed. Agrega solo imágenes que aún no estén asociadas a un producto.
    Los precios ARS y el stock son de demostración; revísalos antes de vender.
   Los precios ARS y el stock son de demostración; revísalos antes de vender.
11. Inicia en desarrollo con npm run dev o en producción con npm start.

La app escucha en el puerto indicado por \`PORT\` y verifica la conexión a MySQL antes de aceptar solicitudes. Las páginas privadas están en \`/home\` y \`/admin\`; las rutas \`.html\` antiguas redirigen a las rutas protegidas.

## Estructura de datos esperada

La app conserva los nombres de tablas del proyecto original:

- \`usuarios\`: \`id\`, \`nombre\`, \`email\`, \`password\`, \`rol\`.
- \`productos\`: \`id\`, \`nombre\`, \`descripcion\`, \`precio\`, \`stock\`, \`imagen\`, \`activo\`.

Los roles permitidos para iniciar sesión son \`admin\` y \`cliente\`. Las imágenes de producto se cargan desde \`public/images/images\`; la API solo acepta nombres de archivo sencillos con extensiones de imagen permitidas.

## Seguridad y operación

- Las contraseñas se guardan con scrypt, sal aleatoria y comparación de tiempo constante. Los registros en texto plano se actualizan tras un login correcto; la migración permite convertirlos en lote antes del despliegue.
- La sesión usa un JWT firmado, de 30 minutos, en una cookie \`HttpOnly\`, \`SameSite=Strict\` y \`Secure\` en producción. El token no lleva correo ni nombre.
- Cambios de estado requieren un origen coincidente. Las páginas protegidas y las operaciones de administración se validan en el servidor.
- Las respuestas incluyen encabezados de seguridad, límites de tamaño de JSON, límites de intentos de inicio de sesión por IP y errores sin detalles internos para el cliente.
- El límite de login vive en memoria del proceso. En una instalación con varias instancias, reemplázalo por un almacén compartido como Redis antes de exponer el servicio.
- Los JWT son stateless y pueden seguir siendo válidos hasta 30 minutos después de un cierre de sesión si alguien ya copió el token. Para revocación inmediata se necesita una tabla de sesiones o una lista de revocación compartida.
- En producción usa HTTPS. Configura \`TRUST_PROXY\` solo con el número de proxies inversos que realmente controles; no lo habilites a ciegas.

## Alcance de esta entrega

La interfaz se actualizó para móvil y escritorio, con formularios etiquetados, estados de carga, mensajes accesibles, paginación del catálogo y renderizado de texto seguro. La base de datos y sus datos no se incluyen. Este paquete no contiene el \`.env\`, \`node_modules\` ni el historial Git original.
