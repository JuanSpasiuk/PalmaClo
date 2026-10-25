import express from 'express';
import { pool } from '../config/db.js';
import { verificarLogin, soloAdmin } from '../middlewares/auth.js';

const router = express.Router();


router.get('/', verificarLogin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM productos WHERE activo = 1'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});


router.post('/', verificarLogin, soloAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, imagen } = req.body;

    // Verificar que todos los campos sean proporcionados
    if (!nombre || !precio || !stock || !imagen) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    
    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, imagen, activo) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre, descripcion, precio, stock, imagen]
    );

 
    res.status(201).json({ message: 'Producto agregado exitosamente', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});


router.put('/:id', verificarLogin, soloAdmin, async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;
    const { id } = req.params;

    if (!nombre || !precio || !stock) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    await pool.query(
      `UPDATE productos 
       SET nombre = ?, precio = ?, stock = ?
       WHERE id = ?`,
      [nombre, precio, stock, id]
    );

    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al editar producto' });
  }
});


router.delete('/:id', verificarLogin, soloAdmin, async (req, res) => {
  try {
    await pool.query(
      'UPDATE productos SET activo = 0 WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'Producto eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;






