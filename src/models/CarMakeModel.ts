export interface CarMake {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarModel {
  id: number;
  name: string;
  carMakeId: number;
  carMakeName: string;
  createdAt: string;
  updatedAt: string;
}