import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic CRUD service
export const apiService = {
  async getAll<T>(resource: string): Promise<T[]> {
    const response = await api.get(`/${resource}`);
    return response.data;
  },

  async getOne<T>(resource: string, id: string | number): Promise<T> {
    const response = await api.get(`/${resource}/${id}`);
    return response.data;
  },

  async create<T>(resource: string, data: any): Promise<T> {
    const response = await api.post(`/${resource}`, data);
    return response.data;
  },

  async update<T>(resource: string, id: string | number, data: any): Promise<T> {
    const response = await api.patch(`/${resource}/${id}`, data);
    return response.data;
  },

  async delete(resource: string, id: string | number): Promise<void> {
    await api.delete(`/${resource}/${id}`);
  },
};

export default api;
