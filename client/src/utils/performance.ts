import React from 'react';

// Frontend Performance Monitoring and Optimization
class PerformanceMonitor {
  private metrics: Map<string, number[]>;
  private observers: Map<string, PerformanceObserver>;

  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.initializeObservers();
  }

  private initializeObservers() {
    // Measure navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
            this.recordMetric('page_load', navEntry.loadEventEnd - navEntry.loadEventStart);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
    }

    // Measure resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`resource_${this.getResourceType(resourceEntry.name)}`, resourceEntry.duration);
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  private getResourceType(url: string): string {
    if (url.includes('/api/')) return 'api';
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'style';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    return 'other';
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetricSummary(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      average: values.reduce((a, b) => a + b, 0) / values.length,
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  getAllMetrics() {
    const summary: Record<string, any> = {};
    for (const [name] of this.metrics) {
      summary[name] = this.getMetricSummary(name);
    }
    return summary;
  }

  timeComponent<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.recordMetric(`component_${name}`, duration);
    return result;
  }

  async timeAsyncComponent<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.recordMetric(`async_component_${name}`, duration);
    return result;
  }

  recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric('memory_used', memory.usedJSHeapSize);
      this.recordMetric('memory_total', memory.totalJSHeapSize);
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
    }
  }

  cleanup() {
    const cutoff = Date.now() - 300000; // 5 minutes
    for (const [name, values] of this.metrics) {
      if (values.length > 100) {
        this.metrics.set(name, values.slice(-50)); // Keep last 50 measurements
      }
    }
  }
}

// Component optimization utilities
export const optimizeComponent = {
  memo: <T extends React.ComponentType<any>>(Component: T) => React.memo(Component),
  
  lazyLoad: (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
    return React.lazy(importFn);
  }
};

export const performanceMonitor = new PerformanceMonitor();