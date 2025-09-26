import { Context, Next } from 'hono';
import { TodoService } from '../services/todo-service';

import { createMiddleware } from 'hono/factory';

export const injectTodoService = createMiddleware<{ Bindings: CloudflareBindings }>(async (c: Context, next: Next) => {
  // Obtener la instancia singleton del servicio
  const todoService = TodoService.getInstance(c.env.KVT);
  // Inyectar el servicio en el contexto
  c.set('todoService', todoService);
  await next();
});

// // Extender el contexto de Hono
// declare module 'hono' {
//   interface ContextVariableMap {
//     todoService: TodoService;
//   }
// }

// export const injectTodoService = () => {
//   return async (c: Context, next: Next) => {
//     // Obtener la instancia singleton del servicio
//     const todoService = TodoService.getInstance(c.env.KVT);

//     // Inyectar el servicio en el contexto
//     c.set('todoService', todoService);

//     await next();
//   };
// };
