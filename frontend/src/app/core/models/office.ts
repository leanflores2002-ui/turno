export interface Office {
  id: number;
  code: string;
  name?: string;
  address?: string;
}

export interface OfficeCreate {
  code: string;
  name?: string;
  address?: string;
}

export interface OfficeUpdate {
  code?: string;
  name?: string;
  address?: string;
}
