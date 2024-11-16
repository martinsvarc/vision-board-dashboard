// Custom fetch-based database client for browser environment
class DatabaseClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  async query(sql: string, params: any[] = []) {
    try {
      const response = await fetch(`${this.baseUrl}/api/db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Database query failed');
      }

      const data = await response.json();
      return { rows: data.rows };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}

export const db = new DatabaseClient();
