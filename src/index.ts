import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  Logger,
  IPluginMiddleware,
  IBasicAuth,
  PluginOptions,
  RemoteUser,
} from '@verdaccio/types';
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type Application,
} from 'express';
import { jwtDecode, InvalidTokenError } from 'jwt-decode';
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
  res.status(401);
  next();
};

const textTypeResponse =
  (req: Request, res: Response, next: NextFunction) => (text: string) => {
    res.type('text');
    res.send(text);
    next();
  };

const internalServerErrorResponse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(500);
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
      const { name, from, to } = req.query;
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

              const npmDiff = spawnSync(
                'npm',
                [
                  'diff',
                  `--diff=${name as string}@${from as string}`,
                  `--diff=${name as string}@${to as string}`,
                ],
                { signal },
              );

              if (npmDiff.status !== 0) {
                textTypeResponse(req, res, next)(npmDiff.stderr.toString());
              } else {
                textTypeResponse(req, res, next)(npmDiff.stdout.toString());
              }
            }
          },
        );
      } catch (error) {
        if (error instanceof InvalidTokenError) {
          unauthorizedResponse(req, res, next);
        }
        internalServerErrorResponse(req, res, next);
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
