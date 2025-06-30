// Global event bus for immediate UI updates across components
class EventBus {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();

// Event types
export const EVENTS = {
  AGENT_ICON_CHANGED: 'agent_icon_changed',
  AGENT_UPDATED: 'agent_updated',
  FORCE_REFRESH_AGENTS: 'force_refresh_agents'
} as const;