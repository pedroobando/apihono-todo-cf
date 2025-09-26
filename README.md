# apihono-todo-cf

API RESTful para gestión de tareas (TODO) usando [Hono](https://hono.dev/) y Node.js, diseñada para ejecutarse en Cloudflare.

## Características

- CRUD de tareas (crear, leer, actualizar, eliminar)
- Implementación con Hono y Cloudflare Workers
- Estructura modular y fácil de mantener
- Respuestas en formato JSON
- Utiliza Workers KV, como almacenamiento
- Todo se centra en las tareas del usuario `(userId)`.

## UserId

El usuario puede ser pasado en los header o como un query.

### header

Como la variable 'X-User-ID'

### query del fetch

c.req.query('userId');

## Instalación

```bash
git clone https://github.com/tuusuario/apirh-todo-cf.git
cd apihono-todo-cf
npm install
```

## Uso

```bash
npm run dev
```

## Endpoints

- `GET /todos` - Lista todas las tareas
- `POST /todos` - Crea una nueva tarea
- `GET /todos/:id` - Obtiene una tarea por ID
- `PUT /todos/:id` - Actualiza una tarea por ID
- `DELETE /todos/:id` - Elimina una tarea por ID

## Ejemplo de tarea

```json
{
  "id": "1",
  "title": "Aprender Hono",
  "completed": false
}
```

## Despliegue en Cloudflare

Consulta la documentación oficial de Cloudflare Workers para desplegar la aplicación.

## Licencia

MIT
