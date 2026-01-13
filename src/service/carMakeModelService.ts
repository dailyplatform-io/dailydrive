import { CarMake, CarModel } from '../models/CarMakeModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch all car makes from the API
 */
export const fetchCarMakes = async (): Promise<CarMake[]> => {
  const response = await fetch(`${API_BASE_URL}/carmakes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch car makes: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch all models for a specific car make
 */
export const fetchCarModelsByMake = async (makeId: number): Promise<CarModel[]> => {
  const response = await fetch(`${API_BASE_URL}/carmakes/${makeId}/models`);
  if (!response.ok) {
    throw new Error(`Failed to fetch car models for make ${makeId}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch all car models
 */
export const fetchAllCarModels = async (): Promise<CarModel[]> => {
  const response = await fetch(`${API_BASE_URL}/carmodels`);
  if (!response.ok) {
    throw new Error(`Failed to fetch car models: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch a specific car make by ID
 */
export const fetchCarMakeById = async (id: number): Promise<CarMake> => {
  const response = await fetch(`${API_BASE_URL}/carmakes/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch car make ${id}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Fetch a specific car model by ID
 */
export const fetchCarModelById = async (id: number): Promise<CarModel> => {
  const response = await fetch(`${API_BASE_URL}/carmodels/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch car model ${id}: ${response.statusText}`);
  }
  return response.json();
};