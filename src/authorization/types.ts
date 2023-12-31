import {PermissionKey} from './permission-key';
import {Principal} from '@loopback/security/src/types';

export interface UserPermissionsFn {
  (
    userPermissions: PermissionKey[],
    requiredPermissions: RequiredPermissions,
  ): boolean;
}

export interface RequiredPermissions {
  required: PermissionKey[];
}

export interface MyUserProfile extends Principal{
  id: string;
  email: string;
  name: string;
  permissions: PermissionKey[];
}

export const UserProfileSchema = {
  type: 'object',
  required: ['email', 'password', 'name'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLenght: 8,
    },
    name: {type: 'string'},
  },
};

export const UserRequestBody = {
  description: 'The input of create user function',
  required: true,
  content: {
    'application/json': {schema: UserProfileSchema},
  },
};

export interface Credential {
  email: string,
  password: string,
  permissions: PermissionKey[]
}

export const CredentialsSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

export const CredentialsRequestBody={
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
}