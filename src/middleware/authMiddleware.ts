import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/UserModel';
import asyncHandler from 'express-async-handler';

interface AuthRequest extends Request {
  user?: IUser;
}

const protect = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decode: any = jwt.verify(token, `${process.env.JWT_SECRET}`);
        req.user = await User.findById(decode.id).select('-password') as IUser;
        next();
      } catch (error) {
        res.status(401).json({
            message:'Not Authorized, Invalid admin credentials',
            error: error
        });
      }
    }
    if (!token) {
        res.status(401).json({message:'Not Authorized, Admin can only access this route'});
    }
  }
);

export { protect };