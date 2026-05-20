interface Props {
  state: 'connecting' | 'connected' | 'error';
  error: string | null;
}

export function ConnectionStatus({ state, error }: Props) {
  if (state === 'connected') return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-3 bg-ha-surface border-b border-ha-border">
      {state === 'connecting' && (
        <span className="flex items-center gap-2 text-ha-muted text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Connecting to Home Assistant…
        </span>
      )}
      {state === 'error' && (
        <span className="flex items-center gap-2 text-red-400 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
          Connection failed: {error}
        </span>
      )}
    </div>
  );
}
