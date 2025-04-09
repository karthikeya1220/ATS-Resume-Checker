import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email: string;
        role?: string;
        [key: string]: any;
    };
}
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const isAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
