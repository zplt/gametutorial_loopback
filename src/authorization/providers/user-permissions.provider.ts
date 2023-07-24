import {Provider} from '@loopback/core';
import {UserPermissionsFn,RequiredPermissions} from '../types';
import {PermissionKey} from '../permission-key';
import {intersection} from 'lodash';


export class UserPermissionsProvider implements Provider<UserPermissionsFn>{

  value(): UserPermissionsFn {
    return (userPermissions, requiredPermissions) =>
      this.action(userPermissions, requiredPermissions)

  }

    action(
      userPermissions:PermissionKey[],
      requiredPermissions:RequiredPermissions,
    ):boolean{
       return intersection(userPermissions, requiredPermissions.required).length
         === requiredPermissions.required.length;
    }

//Please Continue******* {Strategies}

}