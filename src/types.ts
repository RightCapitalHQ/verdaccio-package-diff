import type { Config } from '@verdaccio/types';

export interface ICustomConfig extends Config {
  enabled: boolean;
}
