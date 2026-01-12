export interface UserRequest {  
  name: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  stateId: string;
  email: string;
  cep: string;
  password?: string;
  neighborhood: string;
}