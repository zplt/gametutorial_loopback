import {
  Getter,
  /* inject, */
  globalInterceptor, inject,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {AuthenticationBindings, AuthenticationMetadata} from '@loopback/authentication';
import {MyAuthBindings} from '../authorization/keys';
import {MyUserProfile, RequiredPermissions, UserPermissionsFn} from '../authorization/types';
import {HttpErrors} from '@loopback/rest';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor('', {tags: {name: 'authorize'}})
export class AuthorizeInterceptor implements Provider<Interceptor> {

  constructor(
    @inject(AuthenticationBindings.METADATA)
    public metadata: AuthenticationMetadata,
    @inject(MyAuthBindings.USER_PERMISSIONS)
    protected checkPermissons: UserPermissionsFn,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    public getCurrentUser: Getter<MyUserProfile>,
  ) {}


  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value() {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param invocationCtx - Invocation context
   * @param next - A function to invoke next interceptor or the target method
   */
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {

    if (!this.metadata) return await next();

    const result=await next();

    const requiredPermissions= this.metadata.options as RequiredPermissions;
    const user= await this.getCurrentUser();
    if(!this.checkPermissons(user.permissions, requiredPermissions)){
      throw new HttpErrors.Forbidden('INVALID_ACCESS_PERMISSION');
    }
    return result;
  }
}
