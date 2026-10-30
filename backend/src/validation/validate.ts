import type { RequestHandler, Response } from "express";
import type { z } from "zod";

type AnySchema = z.ZodType;

export function validateBody(schema: AnySchema): RequestHandler {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            next(result.error);
            return;
        }

        req.body = result.data;
        next();
    };
}

export function validateParams(schema: AnySchema): RequestHandler {
    return (req, _res, next) => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            next(result.error);
            return;
        }

        req.params = result.data as typeof req.params;
        next();
    };
}

export function validateQuery(schema: AnySchema): RequestHandler {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            next(result.error);
            return;
        }

        res.locals.validatedQuery = result.data;
        next();
    };
}

export function getValidatedQuery<T>(res: Response): T {
    return res.locals.validatedQuery as T;
}
