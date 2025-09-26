import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { todoRoutes } from './routes/todo.route';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware
app.use('*', requestId()); // Genera UUID para cada request
app.use('*', cors());
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// Health check
app.get('/h', (c) => c.json({ message: 'Todo API is running!' }));

// Routes
app.route('/api/todos', todoRoutes);

export default app;
