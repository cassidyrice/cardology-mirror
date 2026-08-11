import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";

import type {
  D1DatabaseLike,
  D1PreparedStatementLike,
} from "../../lib/my-question/orders";

export class SqliteD1 implements D1DatabaseLike {
  constructor(readonly db: Database) {}

  prepare(sql: string): D1PreparedStatementLike {
    return new SqliteD1Statement(this.db, sql);
  }
}

class SqliteD1Statement implements D1PreparedStatementLike {
  private values: unknown[] = [];

  constructor(
    private readonly db: Database,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]): D1PreparedStatementLike {
    const statement = new SqliteD1Statement(this.db, this.sql);
    statement.values = values;
    return statement;
  }

  async first<T>(): Promise<T | null> {
    return (this.db.query(this.sql).get(...this.values) as T | null) ?? null;
  }

  async all<T>(): Promise<{ success: boolean; results: T[] }> {
    return {
      success: true,
      results: this.db.query(this.sql).all(...this.values) as T[],
    };
  }

  async run(): Promise<{
    success: boolean;
    meta: { changes: number };
  }> {
    const result = this.db.query(this.sql).run(...this.values);
    return { success: true, meta: { changes: result.changes } };
  }
}

export function createMyQuestionTestDb(): {
  db: SqliteD1;
  close: () => void;
} {
  const sqlite = new Database(":memory:");
  sqlite.exec(
    readFileSync(
      new URL("../../migrations/0001_my_question_orders.sql", import.meta.url),
      "utf8",
    ),
  );
  return {
    db: new SqliteD1(sqlite),
    close: () => sqlite.close(),
  };
}
