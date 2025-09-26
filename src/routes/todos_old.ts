import { Hono } from 'hono';
import { TodoService } from '../services/todo-service';
import type { CreateTodoRequest, UpdateTodoRequest, TodoFilters } from '../types/todo';

const todoRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Helper para validar userId
const getUserId = (c: any): string => {
  const userId = c.req.header('X-User-ID') || c.req.query('userId');
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// GET /api/todos - Obtener todos los todos del usuario con filtros
todoRoutes.get('/', async (c) => {
  try {
    const userId = getUserId(c);
    const service = new TodoService(c.env.KVT);

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

    const todos = await service.getUserTodos(userId, filters);
    return c.json({ success: true, data: todos });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// GET /api/todos/search - Buscar todos
todoRoutes.get('/search', async (c) => {
  try {
    const userId = getUserId(c);
    const query = c.req.query('q');

    if (!query) {
      return c.json({ success: false, error: 'Query parameter "q" is required' }, 400);
    }

    const service = new TodoService(c.env.KVT);
    const results = await service.searchTodos(userId, query);

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// GET /api/todos/stats - Estadísticas de todos
todoRoutes.get('/stats', async (c) => {
  try {
    const userId = getUserId(c);
    const service = new TodoService(c.env.KVT);
    const stats = await service.getTodosStats(userId);

    return c.json({ success: true, data: stats });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// GET /api/todos/:id - Obtener un todo específico
todoRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new TodoService(c.env.KVT);
    const todo = await service.getTodo(id);

    if (!todo) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, data: todo });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// POST /api/todos - Crear un nuevo todo
todoRoutes.post('/', async (c) => {
  try {
    const userId = getUserId(c);
    const body = await c.req.json<CreateTodoRequest>();

    // Validación básica
    if (!body.task || body.task.trim() === '') {
      return c.json({ success: false, error: 'Task is required' }, 400);
    }

    const service = new TodoService(c.env.KVT);
    const todo = await service.createTodo({
      ...body,
      userId,
    });

    return c.json({ success: true, data: todo }, 201);
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// PATCH /api/todos/:id - Actualizar un todo
todoRoutes.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateTodoRequest>();

    const service = new TodoService(c.env.KVT);
    const updatedTodo = await service.updateTodo(id, body);

    if (!updatedTodo) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, data: updatedTodo });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// PATCH /api/todos/:id/toggle - Alternar estado completed
todoRoutes.patch('/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new TodoService(c.env.KVT);
    const updatedTodo = await service.toggleTodo(id);

    if (!updatedTodo) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, data: updatedTodo });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

// DELETE /api/todos/:id - Eliminar un todo
todoRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = getUserId(c);
    const service = new TodoService(c.env.KVT);
    const success = await service.deleteTodo(userId, id);

    if (!success) {
      return c.json({ success: false, error: 'Todo not found' }, 404);
    }

    return c.json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 400);
  }
});

export { todoRoutes };
