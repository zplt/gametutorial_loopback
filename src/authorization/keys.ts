import {BindingKey} from '@loopback/core';
import {UserPermissionsFn} from './types';
import {TokenService} from '@loopback/authentication';

export namespace MyAuthBindings{
  export const USER_PERMISSIONS=BindingKey.create<UserPermissionsFn>('userAuthorization.actions.userPermissions');

  export const TOKEN_SERVICE=BindingKey.create<TokenService>('services.authentication.jwt.tokenservice');
}

export namespace TokenServiceConstants{

  export const TOKEN_SECRET_VALUE='myjwtS@r@t';
  export const TOKEN_EXPIRES_IN_VALUE='600';

}
