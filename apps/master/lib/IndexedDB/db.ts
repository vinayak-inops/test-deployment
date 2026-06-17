// src/lib/db.ts
import Dexie, { Table } from 'dexie';

// Define types for your database tables
export interface Task {
  id?: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  username: string;
}

// Create a class extending Dexie to define the database schema
class AppDatabase extends Dexie {
  // Define tables
  tasks!: Table<Task, number>; // number is the type of the primary key
  users!: Table<User, number>;

  constructor() {
    super('myAppDatabase');
    
    // Define schema with types
    this.version(1).stores({
      tasks: '++id, title, completed, createdAt',
      users: '++id, name, email, &username' // & means unique index
    });
  }
}

// Create and export a database instance
const db = new AppDatabase();

export default db;