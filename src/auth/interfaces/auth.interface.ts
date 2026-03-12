import { UserRole } from '../../users/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  login: string;
  role: UserRole;
  mustChangePassword: boolean;
  fullName: string;
}

export interface AuthenticatedUser {
  id: string;
  login: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
}
