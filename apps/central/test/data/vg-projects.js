import { standardRoles } from './roles';

export const verbsForUserAndRole = (extendedUser, roleSystem) => {
  const verbs = new Set(extendedUser.verbs);

  if (roleSystem !== 'none') {
    const role = standardRoles.sorted().find(r => r.system === roleSystem);
    if (role == null) throw new Error('role not found');
    for (const verb of role.verbs)
      verbs.add(verb);
  }

  return Array.from(verbs);
};
