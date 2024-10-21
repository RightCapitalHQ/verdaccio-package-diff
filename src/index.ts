import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  IBasicAuth,
  IPluginMiddleware,
  Logger,
  PluginOptions,
  RemoteUser,
} from '@verdaccio/types';
import {
  type Application,
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { InvalidTokenError, jwtDecode } from 'jwt-decode';

import type { ICustomConfig } from './types';

const htmlFilePath = path.resolve(__dirname, '../src/index.html');

const missingRequiredParamsResponse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(400);
  res.type('text');
  res.send('Missing required params');
  next();
};

const unauthorizedResponse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(401).send();
  next();
};

const textTypeResponse =
  (req: Request, res: Response, next: NextFunction) => (text: string) => {
    res.type('text');
    res.send(text);
    next();
  };

const internalServerErrorResponse =
  (req: Request, res: Response, next: NextFunction) => (error: Error) => {
    res.status(500).send({ error: String(error) });
    next();
  };

export default class VerdaccioMiddlewarePlugin
  implements IPluginMiddleware<ICustomConfig>
{
  public logger: Logger;

  public enabled: boolean = false;

  public constructor(
    config: ICustomConfig,
    options: PluginOptions<ICustomConfig>,
  ) {
    this.logger = options.logger;
    this.enabled = config.enabled;
  }

  public register_middlewares(
    app: Application,
    auth: IBasicAuth<ICustomConfig>,
  ) {
    if (!this.enabled) {
      return;
    }

    const router = Router();

    router.get('/data', (req: Request, res: Response, next: NextFunction) => {
      const { name, from, to, filter = '.' } = req.query;
      const authorizationToken = req.get('Authorization');

      if (!name || !from || !to) {
        missingRequiredParamsResponse(req, res, next);
      }

      if (!authorizationToken) {
        unauthorizedResponse(req, res, next);
      }

      try {
        const remoteUser: RemoteUser = jwtDecode(authorizationToken as string);

        auth.allow_access(
          { packageName: name as string },
          remoteUser,
          (error, canAccess) => {
            if (error) {
              unauthorizedResponse(req, res, next);
            }
            if (!canAccess) {
              unauthorizedResponse(req, res, next);
            } else {
              const controller = new AbortController();
              const { signal } = controller;

              const npmDiff = spawn(
                'npm',
                [
                  'diff',
                  filter as string,
                  `--diff=${name as string}@${from as string}`,
                  `--diff=${name as string}@${to as string}`,
                ],
                { signal },
              );
              let outputData = '';
              let errorData = '';

              npmDiff.stdout.on('data', (data: Buffer) => {
                outputData += data.toString();
              });

              npmDiff.stderr.on('data', (data: Buffer) => {
                errorData += data.toString();
              });

              npmDiff.on('close', (code) => {
                if (code !== 0) {
                  textTypeResponse(req, res, next)(errorData);
                } else {
                  textTypeResponse(req, res, next)(outputData);
                }
              });

              npmDiff.on('error', (npmDiffUnexpectedError) => {
                internalServerErrorResponse(
                  req,
                  res,
                  next,
                )(npmDiffUnexpectedError);
              });
            }
          },
        );
      } catch (unexpectedError) {
        if (unexpectedError instanceof InvalidTokenError) {
          unauthorizedResponse(req, res, next);
        } else {
          internalServerErrorResponse(req, res, next)(unexpectedError as Error);
        }
      }
    });

    router.get(
      '/viewer',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (req: Request, res: Response, next: NextFunction) => {
        const htmlContent = await fs.readFile(htmlFilePath);
        res.type('html');
        res.send(htmlContent);
        next();
      },
    );

    app.use('/-/npm/package-diff', router);
  }
}
