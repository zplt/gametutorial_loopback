export const enum PermissionKey{

  ViewOwnUser='ViewOwnUser',

  CreateUser='CreateUser',

// For updating own (logged in user) profile
  UpdateOwnUser = 'UpdateOwnUser',
  // For deleting a user
  DeleteOwnUser = 'DeleteOwnUser',

  //admin
  // For updating other users profile
  UpdateAnyUser = 'UpdateAnyUser',
  // For accessing other users profile.
  ViewAnyUser = 'ViewAnyUser',
  // For deleting a user
  DeleteAnyUser = 'DeleteAnyUser',
}