





import { User } from '../modules/User'; // Adjust the path according to your project structure

declare global {
  namespace Express {
    interface Request {
      user?: User; // Assuming `User` is the type for your user object
    }
  }
}
