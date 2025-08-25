export interface UserRequest {  
  name: string;
  lastName: string;
  phone: string;
  address: string;
  number: string;
  city: string;
  stateId: string;
  cpf: string | null; 
  email: string;
  cep: string;
  password?: string;
  neighborhood: string;
}