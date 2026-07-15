import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in MacCat application:', error, errorInfo);
    // @ts-ignore
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      const backup = localStorage.getItem('maccat_profile');
      if (backup) {
        // Save temporary backup in case of accidents
        localStorage.setItem('maccat_profile_backup', backup);
      }
      localStorage.removeItem('maccat_profile');
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleCopyError = () => {
    const text = `MacCat Error Report:\nError: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Текст ошибки скопирован в буфер обмена!');
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1e1e1e] text-white flex items-center justify-center p-6 font-sans selection:bg-amber-500/30">
          {/* macOS Style Alert Panel */}
          <div className="w-full max-w-md bg-[#2d2d2d] border border-neutral-700 rounded-xl shadow-2xl overflow-hidden p-6 relative">
            {/* Window controls */}
            <div className="flex gap-1.5 absolute top-4 left-4">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]"></span>
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"></span>
              <span className="w-3 h-3 rounded-full bg-[#27c93f]"></span>
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <span className="text-5xl mb-4" role="img" aria-label="crying cat">😿</span>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
                Ой! Что-то пошло не так
              </h2>
              <p className="mt-2 text-sm text-neutral-400 max-w-sm">
                Произошла непредвиденная ошибка в интерфейсе MacCat. Не волнуйтесь, ваш прогресс зарезервирован!
              </p>

              {/* Error Details Accordion */}
              <div className="mt-4 w-full text-left bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-amber-400 overflow-x-auto max-h-40">
                <p className="font-bold text-neutral-300">Ошибка:</p>
                <p className="mt-1 break-words">{this.state.error?.message || 'Неизвестная ошибка'}</p>
                {this.state.error?.stack && (
                  <p className="mt-2 text-neutral-500 text-[10px] whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </p>
                )}
              </div>

              {/* Interactive buttons */}
              <div className="mt-6 w-full flex flex-col gap-2.5">
                <button
                  id="error-btn-reload"
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-neutral-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Обновить страницу
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="error-btn-copy"
                    onClick={this.handleCopyError}
                    className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-300 text-xs font-medium rounded-lg transition-colors border border-neutral-700 cursor-pointer"
                  >
                    Скопировать лог 📋
                  </button>

                  <button
                    id="error-btn-reset"
                    onClick={this.handleReset}
                    className="py-2 px-3 bg-red-950/40 hover:bg-red-900/40 active:bg-red-800/40 text-red-400 text-xs font-medium rounded-lg transition-colors border border-red-900/50 cursor-pointer"
                    title="Удалит локальные файлы игры и загрузит заново. Прогресс на сервере останется!"
                  >
                    Сбросить кэш ⚠️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
