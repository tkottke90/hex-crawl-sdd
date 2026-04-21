/**
 * Toast — lightweight Tailwind notification.
 * Auto-dismisses after `duration` ms (default 4000).
 * Call destroy() to dismiss early.
 */
export class Toast {
  private el: HTMLDivElement;
  private timer: ReturnType<typeof setTimeout>;

  constructor(
    message: string,
    type: 'info' | 'error' | 'success' = 'info',
    duration = 4000,
  ) {
    const colorClass = {
      info: 'bg-gray-800 border-gray-600 text-white',
      error: 'bg-red-900 border-red-600 text-red-100',
      success: 'bg-green-900 border-green-600 text-green-100',
    }[type];

    this.el = document.createElement('div');
    this.el.className = [
      'fixed bottom-6 left-1/2 -translate-x-1/2',
      'px-5 py-3 rounded-lg border shadow-xl text-sm font-medium',
      'z-50 pointer-events-none transition-opacity duration-300',
      colorClass,
    ].join(' ');
    this.el.textContent = message;
    document.body.appendChild(this.el);

    this.timer = setTimeout(() => this.destroy(), duration);
  }

  destroy(): void {
    clearTimeout(this.timer);
    this.el.remove();
  }

  static show(
    message: string,
    type: 'info' | 'error' | 'success' = 'info',
    duration = 4000,
  ): Toast {
    return new Toast(message, type, duration);
  }
}
