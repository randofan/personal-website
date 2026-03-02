import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { hc } from 'hono/client';
import type { AppType } from '@api/index';

const client = hc<AppType>('/');

@customElement('system-status')
export default class SystemStatus extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #888;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .dot.online  { color: #22c55e; }
    .dot.offline { color: #ef4444; }
    .dot.loading { color: #94a3b8; }
  `;

  @state() private label = 'Checking…';
  @state() private dotClass = 'loading';

  async connectedCallback() {
    super.connectedCallback();
    try {
      const res = await client.api.health.$get();
      if (res.ok) {
        const data = await res.json();
        this.label    = data.status === 'ok' ? 'Online' : 'Degraded';
        this.dotClass = data.status === 'ok' ? 'online'  : 'offline';
      } else {
        this.label    = 'Offline';
        this.dotClass = 'offline';
      }
    } catch {
      this.label    = 'Offline';
      this.dotClass = 'offline';
    }
  }

  render() {
    return html`
      <span class="dot ${this.dotClass}"></span>
      API: ${this.label}
    `;
  }
}
