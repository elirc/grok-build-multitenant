export function decide(context,organizationId,action) {
  if(!context)return {allowed:false,reason:'unauthenticated'};
  if(context.organizationId!==organizationId)return {allowed:false,reason:'scope'};
  const actions={MEMBER:['read','writeTask'],ADMIN:['read','writeTask','writeProject'],OWNER:['read','writeTask','writeProject']};
  const allowed=Object.hasOwn(actions,context.role)&&actions[context.role].includes(action);
  return {allowed,reason:allowed?'allowed':'capability'};
}
