/**
 * Base service class providing common functionality for all services
 */

export interface ServiceEvent {
  type: string;
  data?: any;
  timestamp: Date;
}

export interface ServiceOptions {
  name: string;
  autoStart?: boolean;
  dependencies?: string[];
}

export abstract class BaseService {
  protected name: string;
  protected isInitialized = false;
  protected isStarted = false;
  protected listeners: Map<string, Set<(event: ServiceEvent) => void>> = new Map();
  protected dependencies: string[] = [];

  constructor(options: ServiceOptions) {
    this.name = options.name;
    this.dependencies = options.dependencies || [];

    if (options.autoStart) {
      this.init().then(() => this.start());
    }
  }

  // Abstract methods to be implemented by child services
  protected abstract doInit(): Promise<void>;
  protected abstract doStart(): Promise<void>;
  protected abstract doStop(): Promise<void>;
  protected abstract doDestroy(): Promise<void>;

  // Lifecycle methods
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.doInit();
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', { error, stage: 'initialization' });
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.isStarted) return;

    try {
      await this.doStart();
      this.isStarted = true;
      this.emit('started');
    } catch (error) {
      this.emit('error', { error, stage: 'start' });
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isStarted) return;

    try {
      await this.doStop();
      this.isStarted = false;
      this.emit('stopped');
    } catch (error) {
      this.emit('error', { error, stage: 'stop' });
      throw error;
    }
  }

  async destroy(): Promise<void> {
    if (this.isStarted) {
      await this.stop();
    }

    try {
      await this.doDestroy();
      this.isInitialized = false;
      this.emit('destroyed');
      this.listeners.clear();
    } catch (error) {
      this.emit('error', { error, stage: 'destroy' });
      throw error;
    }
  }

  // Event system
  on(eventType: string, listener: (event: ServiceEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  off(eventType: string, listener: (event: ServiceEvent) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  protected emit(eventType: string, data?: any): void {
    const event: ServiceEvent = {
      type: eventType,
      data,
      timestamp: new Date(),
    };

    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }

    // Also emit to global 'all' listeners
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in global event listener:`, error);
        }
      });
    }
  }

  // Health check
  getHealth(): { isHealthy: boolean; details: Record<string, any> } {
    return {
      isHealthy: this.isInitialized && this.isStarted,
      details: {
        name: this.name,
        initialized: this.isInitialized,
        started: this.isStarted,
        listenerCount: Array.from(this.listeners.values()).reduce(
          (sum, set) => sum + set.size,
          0
        ),
      },
    };
  }

  // Utility methods
  protected async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected createWorker(script: string): Worker {
    const blob = new Blob([script], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }

  protected validateDependencies(services: Map<string, BaseService>): boolean {
    return this.dependencies.every((dep) => {
      const service = services.get(dep);
      return service && service.isInitialized && service.isStarted;
    });
  }

  // Getters
  get serviceName(): string {
    return this.name;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  get started(): boolean {
    return this.isStarted;
  }

  get healthy(): boolean {
    return this.getHealth().isHealthy;
  }
}