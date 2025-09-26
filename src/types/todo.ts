// src/types/todo.ts
export interface Todo {
  id: string;
  task: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface CreateTodoRequest {
  task: string;
  userId: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface UpdateTodoRequest {
  task?: string;
  completed?: boolean;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface TodoFilters {
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  userId?: string;
  tags?: string[];
  dueBefore?: Date;
  dueAfter?: Date;
}
