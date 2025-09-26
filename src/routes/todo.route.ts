import { Hono, Context } from 'hono';
import { TodoService } from '../services/todo-service';
import { injectTodoService } from '../middlewares/todo-service';
import type { CreateTodoRequest, UpdateTodoRequest, TodoFilters } from '../types/todo';

const todoRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Aplicar el middleware a todas las rutas
todoRoutes.use('*', injectTodoService);

// Helper para validar userId
const getUserId = (c: Context): string => {
  const userId = c.req.header('X-User-ID') || c.req.query('userId');
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Helper para obtener el servicio del contexto
const getTodoService = (c: Context): TodoService => {
  return c.get('todoService');
};

// GET /api/todos - Obtener todos los todos del usuario con filtros
todoRoutes.get('/', async (c: Context) => {
  try {
    const userId = getUserId(c);
    const todoService = getTodoService(c);

    // Parsear filtros de query parameters
    const filters: TodoFilters = {
      completed: c.req.query('completed') ? c.req.query('completed') === 'true' : undefined,
      priority: c.req.query('priority') as 'low' | 'medium' | 'high' | undefined,
      tags: c.req.query('tags') ? c.req.query('tags')?.split(',') : undefined,
    };

    // Parsear fechas si están presentes
    if (c.req.query('dueBefore')) {
      filters.dueBefore = new Date(c.req.query('dueBefore') as string);
    }
    if (c.req.query('dueAfter')) {
      filters.dueAfter = new Date(c.req.query('dueAfter') as string);
    }

    const todos = await todoService.getUserTodos(userId, filters);
    return c.json({ success: true, data: todos });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// GET /api/todos/search - Buscar todos
todoRoutes.get('/search', async (c: Context) => {
  try {
    const userId = getUserId(c);
    const query = c.req.query('q');
    const todoService = getTodoService(c);

    if (!query) {
      return c.json({ success: false, error: 'Query parameter "q" is required' }, 400);
    }

    const results = await todoService.searchTodos(userId, query);
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// GET /api/todos/stats - Estadísticas de todos
todoRoutes.get('/stats', async (c: Context) => {
  try {
    const userId = getUserId(c);
    const todoService = getTodoService(c);
    const stats = await todoService.getTodosStats(userId);

    return c.json({ success: true, data: stats });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// GET /api/todos/:id - Obtener un todo específico
todoRoutes.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const todoService = getTodoService(c);
    const todo = await todoService.getTodo(id);

    if (!todo) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, data: todo });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// POST /api/todos - Crear un nuevo todo
todoRoutes.post('/', async (c: Context) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json<CreateTodoRequest>();
    const todoService = getTodoService(c);

    // Validación básica
    if (!body.task || body.task.trim() === '') {
      return c.json({ success: false, error: 'Task is required' }, 400);
    }

    const todo = await todoService.createTodo({
      ...body,
      userId,
    });

    return c.json({ success: true, data: todo }, 201);
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// PATCH /api/todos/:id - Actualizar un todo
todoRoutes.patch('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTodoRequest>();
    const todoService = getTodoService(c);

    const updatedTodo = await todoService.updateTodo(id, body);

    if (!updatedTodo) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, data: updatedTodo });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// PATCH /api/todos/:id/toggle - Alternar estado completed
todoRoutes.patch('/:id/toggle', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const todoService = getTodoService(c);
    const updatedTodo = await todoService.toggleTodo(id);

    if (!updatedTodo) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, data: updatedTodo });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// DELETE /api/todos/:id - Eliminar un todo
todoRoutes.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const userId = getUserId(c);
    const todoService = getTodoService(c);
    const success = await todoService.deleteTodo(userId, id);

    if (!success) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

export { todoRoutes };
