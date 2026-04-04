interface Props {
  ok: boolean
  message: string
}

export function StatusBar({ ok, message }: Props) {
  return (
    <div className="status-bar">
      <span className={`status-dot ${ok ? 'ok' : 'err'}`} />
      {message}
    </div>
  )
}
