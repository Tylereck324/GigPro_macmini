import type { NextApiRequest, NextApiResponse } from 'next';

export async function getAuthenticatedUser(req: NextApiRequest, res: NextApiResponse) {
  // In Single User Mode, we bypass actual token verification
  // and always return a consistent mock user.
  
  return {
    id: 'single-user-mode',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'user@gigpro.local',
    // Add any other properties expected by the User type if strictly typed elsewhere
  };
}