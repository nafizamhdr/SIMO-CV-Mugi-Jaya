import { api, unwrap } from "./api";
import type { ApiSuccess, Role } from "../types";

/**
 * Manajemen Akun API (khusus OWNER).
 */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export async function getUsers(): Promise<UserDto[]> {
  const { data } = await api.get<ApiSuccess<UserDto[]>>("/users");
  return unwrap(data);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<UserDto> {
  const { data } = await api.post<ApiSuccess<UserDto>>("/users", input);
  return unwrap(data);
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: Role; isActive?: boolean },
): Promise<UserDto> {
  const { data } = await api.patch<ApiSuccess<UserDto>>(`/users/${id}`, input);
  return unwrap(data);
}

export async function resetPassword(id: string, password: string): Promise<void> {
  const { data } = await api.patch<ApiSuccess<null>>(`/users/${id}/password`, { password });
  if (!data.success) throw new Error("Gagal mereset kata sandi");
}
