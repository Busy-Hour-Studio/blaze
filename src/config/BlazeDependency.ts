import { BlazeError } from '../errors/BlazeError';
import { require } from '../utils/common';

export class BlazeDependency {
  private $runTime: 'node' | 'other';
  private $nodeAdapter: typeof import('@hono/node-server') | null;
  public nodeAdapterExist: boolean;

  constructor() {
    const node = this.loadNodeAdapter();
    this.$nodeAdapter = node.adapter;
    this.nodeAdapterExist = node.isExist;
    this.$runTime = this.getRunTime();
  }

  public load<T>(pkg: string) {
    return require(pkg) as T;
  }

  private getRunTime() {
    if (process.versions.node) return 'node';

    return 'other';
  }

  private loadNodeAdapter() {
    try {
      return {
        isExist: true,
        adapter:
          this.load<typeof import('@hono/node-server')>('hono/node-server'),
      } as const;
    } catch {
      return {
        isExist: false,
        adapter: null,
      } as const;
    }
  }

  public get nodeAdapter() {
    if (!this.$nodeAdapter) {
      throw new BlazeError('Node Adapter is not installed');
    }

    return this.$nodeAdapter;
  }

  public get runTime() {
    return this.$runTime;
  }
}
