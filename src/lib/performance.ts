import React from 'react';

// Performance monitoring utility for the restaurant management system

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
  };
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  // Start timing an operation
  startTimer(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  // End timing an operation
  endTimer(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log slow operations in development
    if (metric.duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric.duration;
  }

  // Get a specific metric
  getMetric(name: string): PerformanceMetric | null {
    return this.metrics.get(name) || null;
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    const metrics = this.getAllMetrics();
    const completedMetrics = metrics.filter(m => m.duration !== undefined);

    if (completedMetrics.length === 0) {
      return {
        metrics: [],
        summary: {
          totalMetrics: 0,
          averageDuration: 0,
          slowestOperation: null,
          fastestOperation: null
        }
      };
    }

    const durations = completedMetrics.map(m => m.duration!);
    const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    
    const slowestOperation = completedMetrics.reduce((slowest, current) => 
      current.duration! > slowest.duration! ? current : slowest
    );
    
    const fastestOperation = completedMetrics.reduce((fastest, current) => 
      current.duration! < fastest.duration! ? current : fastest
    );

    return {
      metrics: completedMetrics,
      summary: {
        totalMetrics: completedMetrics.length,
        averageDuration,
        slowestOperation,
        fastestOperation
      }
    };
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Check if monitoring is enabled
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common performance measurements

// Measure database operation performance
export const measureDatabaseOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  performanceMonitor.startTimer(`db_${operationName}`, metadata);
  
  try {
    const result = await operation();
    performanceMonitor.endTimer(`db_${operationName}`);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(`db_${operationName}`);
    throw error;
  }
};

// Measure component render performance
export const measureComponentRender = (componentName: string, metadata?: Record<string, any>) => {
  performanceMonitor.startTimer(`render_${componentName}`, metadata);
  
  return () => {
    performanceMonitor.endTimer(`render_${componentName}`);
  };
};

// Measure API call performance
export const measureApiCall = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  performanceMonitor.startTimer(`api_${endpoint}`, metadata);
  
  try {
    const result = await apiCall();
    performanceMonitor.endTimer(`api_${endpoint}`);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(`api_${endpoint}`);
    throw error;
  }
};

// Measure user interaction performance
export const measureUserInteraction = (
  interactionName: string,
  callback: () => void | Promise<void>,
  metadata?: Record<string, any>
) => {
  return async () => {
    performanceMonitor.startTimer(`interaction_${interactionName}`, metadata);
    
    try {
      await callback();
    } finally {
      performanceMonitor.endTimer(`interaction_${interactionName}`);
    }
  };
};

// React hook for measuring component performance
export const usePerformanceMeasurement = (componentName: string) => {
  const startRender = React.useCallback(() => {
    performanceMonitor.startTimer(`render_${componentName}`);
  }, [componentName]);

  const endRender = React.useCallback(() => {
    performanceMonitor.endTimer(`render_${componentName}`);
  }, [componentName]);

  React.useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, [startRender, endRender]);
};

// Performance decorator for class methods
export const measureMethod = (methodName?: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = methodName || `${target.constructor.name}_${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startTimer(`method_${name}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTimer(`method_${name}`);
        return result;
      } catch (error) {
        performanceMonitor.endTimer(`method_${name}`);
        throw error;
      }
    };

    return descriptor;
  };
};

// Performance monitoring middleware for API routes
export const performanceMiddleware = (handler: Function) => {
  return async (req: any, res: any) => {
    const startTime = performance.now();
    
    try {
      await handler(req, res);
    } finally {
      const duration = performance.now() - startTime;
      
      if (duration > 1000) {
        console.warn(`Slow API call: ${req.url} took ${duration.toFixed(2)}ms`);
      }
      
      // Add performance header
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    }
  };
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  } else {
    // Node.js environment
    const usage = process.memoryUsage();
    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers
    };
  }
};

// Network performance monitoring
export const measureNetworkRequest = async <T>(
  url: string,
  options: RequestInit = {},
  metadata?: Record<string, any>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    const duration = performance.now() - startTime;
    
    performanceMonitor.startTimer(`network_${url}`, { ...metadata, status: response.status });
    performanceMonitor.endTimer(`network_${url}`);
    
    if (duration > 2000) {
      console.warn(`Slow network request: ${url} took ${duration.toFixed(2)}ms`);
    }
    
    return data;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Network request failed: ${url} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

// Bundle size monitoring
export const getBundleSize = () => {
  if (typeof window !== 'undefined') {
    // This would need to be implemented with webpack bundle analyzer
    // For now, return null
    return null;
  }
  return null;
};

// Export performance utilities
export {
  PerformanceMonitor,
  type PerformanceMetric,
  type PerformanceReport
}; 