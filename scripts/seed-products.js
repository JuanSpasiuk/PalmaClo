import { pool } from '../src/config/database.js';

const products = [
  { nombre: 'Remera rayada verde', descripcion: 'Remera de manga corta con franjas verdes, azul marino y crudo. Inspiración retro y calce relajado.', precio: 28900, imagen: 'producto1.jpg' },
  { nombre: 'Remera gráfica verde', descripcion: 'Remera verde de calce amplio con estampa frontal y mangas en contraste.', precio: 32900, imagen: 'producto2.jpg' },
  { nombre: 'Pantalón relajado crudo', descripcion: 'Pantalón de pierna amplia en tono crudo para un look urbano y cómodo.', precio: 42900, imagen: 'producto3.jpg' },
  { nombre: 'Remera oversized chocolate', descripcion: 'Remera de manga corta en tono chocolate y silueta amplia.', precio: 31900, imagen: 'producto4.jpg' },
  { nombre: 'Pantalón amplio oscuro', descripcion: 'Pantalón oscuro de pierna ancha y caída relajada.', precio: 48900, imagen: 'producto5.jpg' },
  { nombre: 'Campera beige con cierre', descripcion: 'Campera beige de líneas limpias, cierre frontal y bolsillos laterales.', precio: 68900, imagen: 'producto6.jpg' },
  { nombre: 'Campera a cuadros', descripcion: 'Campera con cierre frontal y patrón a cuadros en blanco y negro.', precio: 74900, imagen: 'producto7.jpg' },
  { nombre: 'Jean recto negro', descripcion: 'Jean negro de corte recto y estilo urbano.', precio: 48900, imagen: 'producto8.jpg' },
  { nombre: 'Pack de 3 remeras negras', descripcion: 'Pack de tres remeras negras básicas de manga corta.', precio: 55900, imagen: 'producto9.jpg' },
  { nombre: 'Bandolera negra compacta', descripcion: 'Bandolera negra compacta con correa larga y bolsillo frontal de red.', precio: 28900, imagen: 'producto10.jpg' },
  { nombre: 'Pulsera de cadena plateada', descripcion: 'Pulsera metálica de eslabones con cierre.', precio: 19900, imagen: 'producto11.jpg' },
  { nombre: 'Pack de medias blancas', descripcion: 'Medias blancas de caña media presentadas en pack.', precio: 9900, imagen: 'producto12.jpg' },
  { nombre: 'Remera neutra Nace una flor', descripcion: 'Remera blanca boxy fit de algodón premium, con recortes y estampa frontal. Ficha de muestra local; stock de demostración.', precio: 67275, imagen: 'khalua-personal-01.webp' },
  { nombre: 'Remera negra Refresh', descripcion: 'Remera negra boxy fit de algodón premium con estampas en el frente y la espalda. Ficha de muestra local; stock de demostración.', precio: 67275, imagen: 'khalua-personal-02.webp' },
  { nombre: 'Remera negra Madonna', descripcion: 'Remera negra de calce regular con estampas en el frente y la espalda. Ficha de muestra local; stock de demostración.', precio: 67275, imagen: 'khalua-personal-03.webp' },
  { nombre: 'Jort camuflada Dark El Hit', descripcion: 'Jort de calce baggy con estampa camuflada y cuatro bolsillos. Ficha de muestra local; stock de demostración.', precio: 108675, imagen: 'khalua-personal-04.webp' },
  { nombre: 'Camisa escocesa Tape', descripcion: 'Camisa de manga corta a cuadros con estampa frontal. Ficha de muestra local; stock de demostración.', precio: 101430, imagen: 'khalua-personal-05.webp' },
  { nombre: 'Remera polo blanca Warhol', descripcion: 'Polo blanca de algodón piqué con estampa frontal. Ficha de muestra local; stock de demostración.', precio: 72450, imagen: 'khalua-personal-06.webp' },
  { nombre: 'Remera neutra Banana 3', descripcion: 'Remera blanca boxy fit con estampa en la espalda. Ficha de muestra local; stock de demostración.', precio: 67275, imagen: 'khalua-personal-07.webp' },
  { nombre: 'Remera blanca Heated Up', descripcion: 'Remera blanca con estampa frontal y detalles en contraste. Ficha de muestra local; stock de demostración.', precio: 67275, imagen: 'khalua-personal-08.webp' },
  { nombre: 'Camisa Kye Sigil crudo', descripcion: 'Camisa de manga corta en tono crudo, de la línea Kye Sigil. Ficha de muestra local; stock de demostración.', precio: 77475, imagen: 'khalua-personal-09.webp' },
  { nombre: 'Bermuda negra Mix Print', descripcion: 'Bermuda negra con cintura elastizada y estampa. Ficha de muestra local; stock de demostración.', precio: 108675, imagen: 'khalua-personal-10.webp' },
  { nombre: 'Bermuda melange BMB Sport', descripcion: 'Bermuda melange con cintura elastizada y estilo deportivo. Ficha de muestra local; stock de demostración.', precio: 93150, imagen: 'khalua-personal-11.webp' },
  { nombre: 'Sweater crudo BMBProject', descripcion: 'Sweater crudo de silueta boxy con detalles desgastados. Ficha de muestra local; stock de demostración.', precio: 150000, imagen: 'khalua-personal-12.webp' },
  { nombre: 'Camisa Kye Sigil negra', descripcion: 'Camisa negra de manga corta, modelo Kye Sigil. Ficha de muestra local; stock de demostración.', precio: 77475, imagen: 'khalua-personal-13.webp' },
  { nombre: 'Camisa Kye Impact navy', descripcion: 'Camisa de manga corta azul navy, modelo Kye Impact. Ficha de muestra local; stock de demostración.', precio: 77475, imagen: 'khalua-personal-14.webp' },
  { nombre: 'Camisa JYX Ambition', descripcion: 'Camisa negra de manga corta, modelo JYX Ambition. Ficha de muestra local; stock de demostración.', precio: 77475, imagen: 'khalua-personal-15.webp' },
  { nombre: 'Camisa Fey Grit gris', descripcion: 'Camisa gris de manga corta, modelo Fey Grit. Ficha de muestra local; stock de demostración.', precio: 77475, imagen: 'khalua-personal-16.webp' },
  { nombre: 'Camisa Fey Grit negra', descripcion: 'Camisa negra de manga corta, modelo Fey Grit. Ficha de muestra local; stock de demostración.', precio: 77475, imagen: 'khalua-personal-17.webp' },
  { nombre: 'Camisa Kye Impact crudo', descripcion: 'Camisa de manga corta en tono crudo, modelo Kye Impact. Ficha de muestra local; stock de demostración.', precio: 77475, imagen: 'khalua-personal-18.webp' },
  { nombre: 'Remera Gabo Dept azul', descripcion: 'Remera azul boxy fit con paneles, detalles en contraste y cuello rib. Ficha de muestra local; stock de demostración.', precio: 54975, imagen: 'khalua-personal-19.webp' },
  { nombre: 'Remera Gabo Dept blanca', descripcion: 'Remera blanca boxy fit con paneles, detalles en contraste y cuello rib. Ficha de muestra local; stock de demostración.', precio: 54975, imagen: 'khalua-personal-20.webp' },
  { nombre: 'Pantalón Swan Washed', descripcion: 'Pantalón Swan Washed de estilo urbano. Ficha de muestra local; stock de demostración.', precio: 115000, imagen: 'khalua-pantalon-01.webp' },
  { nombre: 'Jean Biggie Cation', descripcion: 'Jean Biggie Cation de calce relajado. Ficha de muestra local; stock de demostración.', precio: 100000, imagen: 'khalua-pantalon-02.webp' },
  { nombre: 'Jean Baggy Tronk Oxid Black', descripcion: 'Jean Baggy Tronk en tono Oxid Black. Ficha de muestra local; stock de demostración.', precio: 92475, imagen: 'khalua-pantalon-03.webp' },
  { nombre: 'Jean Mom Turb celeste', descripcion: 'Jean Mom Turb en tono celeste. Ficha de muestra local; stock de demostración.', precio: 82475, imagen: 'khalua-pantalon-04.webp' },
  { nombre: 'Jean Straight 2 Massive', descripcion: 'Jean Straight 2 Massive de corte recto. Ficha de muestra local; stock de demostración.', precio: 155000, imagen: 'khalua-pantalon-05.webp' },
  { nombre: 'Pantalón Custom azul', descripcion: 'Pantalón Custom en tono azul. Ficha de muestra local; stock de demostración.', precio: 89990, imagen: 'khalua-pantalon-06.webp' },
  { nombre: 'Jogger VDV beige', descripcion: 'Jogger VDV en tono beige. Ficha de muestra local; stock de demostración.', precio: 77990, imagen: 'khalua-pantalon-07.webp' },
  { nombre: 'Pantalón Kruz negro', descripcion: 'Pantalón Kruz en tono negro. Ficha de muestra local; stock de demostración.', precio: 89990, imagen: 'khalua-pantalon-08.webp' },
  { nombre: 'Pantalón cargo Fincher', descripcion: 'Pantalón cargo Fincher de estilo utilitario. Ficha de muestra local; stock de demostración.', precio: 83900, imagen: 'khalua-pantalon-09.webp' },
  { nombre: 'Pantalón Wide Leg Denim claro', descripcion: 'Pantalón Wide Leg Denim en tono claro. Ficha de muestra local; stock de demostración.', precio: 92600, imagen: 'khalua-pantalon-10.webp' },
];

async function seedProducts() {
  const connection = await pool.getConnection();
  let added = 0;
  let skipped = 0;

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT nombre FROM productos');
    const existingNames = new Set(rows.map((row) => row.nombre));

    for (const product of products) {
      if (existingNames.has(product.nombre)) {
        skipped += 1;
        continue;
      }

      await connection.execute(
        'INSERT INTO productos (nombre, descripcion, precio, stock, imagen, activo) VALUES (?, ?, ?, ?, ?, 1)',
        [product.nombre, product.descripcion, product.precio, 10, product.imagen],
      );
      existingNames.add(product.nombre);
      added += 1;
    }

    await connection.commit();
    console.info('Carga inicial terminada. Productos agregados: ' + added + '; ya existentes, sin cambios: ' + skipped + '.');
    console.info('Los precios ARS y el stock de 10 unidades son valores de demostración; revísalos en Administrar antes de vender.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

try {
  await seedProducts();
} catch (error) {
  console.error('No se pudieron cargar los productos: ' + error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
