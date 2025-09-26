import { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilters } from '../types/todo';

export class TodoService {
  private readonly kv: KVNamespace;
  private readonly prefix: string = 'todos';

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getKey(id: string): string {
    return `${this.prefix}:${id}`;
  }

  private getUserKey(userId: string): string {
    return `${this.prefix}:user:${userId}`;
  }

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    const id = this.generateId();
    const now = new Date();

    const todo: Todo = {
      id,
      task: data.task,
      completed: false,
      userId: data.userId,
      createdAt: now,
      updatedAt: now,
      dueDate: data.dueDate,
      priority: data.priority || 'medium',
      tags: data.tags || [],
    };

    // Guardar el todo principal
    await this.kv.put(this.getKey(id), JSON.stringify(todo));

    // Agregar a la lista del usuario
    const userTodosKey = this.getUserKey(data.userId);
    const userTodos = await this.getUserTodo(data.userId);
    userTodos.push(id);
    await this.kv.put(userTodosKey, JSON.stringify(userTodos));

    return todo;
  }

  async getTodo(id: string): Promise<Todo | null> {
    const todoStr = await this.kv.get(this.getKey(id));
    if (!todoStr) return null;
    return JSON.parse(todoStr);
  }

  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo | null> {
    const existing = await this.getTodo(id);
    if (!existing) return null;

    const updated: Todo = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    await this.kv.put(this.getKey(id), JSON.stringify(updated));
    return updated;
  }

  async deleteTodo(userId: string, id: string): Promise<boolean> {
    const existing = await this.getTodo(id);
    if (!existing) return false;
    if (existing.userId !== userId) {
      throw new Error(`Todo ${id}, no pertene al usuario`);
    }

    // Eliminar de la lista del usuario
    const userTodos = await this.getUserTodo(existing.userId);
    const updatedUserTodos = userTodos.filter((todoId) => todoId !== id);
    await this.kv.put(this.getUserKey(existing.userId), JSON.stringify(updatedUserTodos));

    // Eliminar el todo
    await this.kv.delete(this.getKey(id));
    return true;
  }

  async getUserTodos(userId: string, filters?: TodoFilters): Promise<Todo[]> {
    const userTodosKey = this.getUserKey(userId);
    const todoIdsStr = await this.kv.get(userTodosKey);

    if (!todoIdsStr) return [];

    const todoIds: string[] = JSON.parse(todoIdsStr);
    const todos: Todo[] = [];

    // Obtener todos los todos en paralelo
    const todoPromises = todoIds.map((id) => this.getTodo(id));
    const todoResults = await Promise.all(todoPromises);

    // Filtrar resultados válidos
    for (const todo of todoResults) {
      if (todo && this.matchesFilters(todo, filters)) {
        todos.push(todo);
      }
    }

    // Ordenar por fecha de creación (más reciente primero)
    // return todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return todos.sort((a, b) => {
      const date_B = new Date(b.createdAt);
      const date_A = new Date(a.createdAt);
      return date_B.getTime() - date_A.getTime();
    });
  }

  private matchesFilters(todo: Todo, filters?: TodoFilters): boolean {
    if (!filters) return true;

    if (filters.completed !== undefined && todo.completed !== filters.completed) {
      return false;
    }

    if (filters.priority && todo.priority !== filters.priority) {
      return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some((tag) => todo.tags?.includes(tag));
      if (!hasMatchingTag) return false;
    }

    if (filters.dueBefore && todo.dueDate) {
      if (todo.dueDate > filters.dueBefore) return false;
    }

    if (filters.dueAfter && todo.dueDate) {
      if (todo.dueDate < filters.dueAfter) return false;
    }

    return true;
  }

  async toggleTodo(id: string): Promise<Todo | null> {
    const existing = await this.getTodo(id);
    if (!existing) return null;

    return this.updateTodo(id, { completed: !existing.completed });
  }

  async searchTodos(userId: string, query: string): Promise<Todo[]> {
    const todos = await this.getUserTodos(userId);
    const searchTerm = query.toLowerCase();

    return todos.filter(
      (todo) =>
        todo.task.toLowerCase().includes(searchTerm) ||
        todo.tags?.some((tag) => tag.toLowerCase().includes(searchTerm)),
    );
  }

  async getTodosStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    byPriority: { low: number; medium: number; high: number };
  }> {
    const todos = await this.getUserTodos(userId);

    return {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      pending: todos.filter((t) => !t.completed).length,
      byPriority: {
        low: todos.filter((t) => t.priority === 'low').length,
        medium: todos.filter((t) => t.priority === 'medium').length,
        high: todos.filter((t) => t.priority === 'high').length,
      },
    };
  }

  private async getUserTodo(userId: string): Promise<string[]> {
    const userTodosKey = this.getUserKey(userId);
    const userTodosStr = await this.kv.get(userTodosKey);
    return userTodosStr ? JSON.parse(userTodosStr) : [];
  }
}
