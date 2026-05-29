import { Link } from 'react-router-dom'

export default function Support() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Поддержка</h1>
        <p className="text-muted text-sm mt-1">Мы всегда на связи</p>
      </div>

      <div className="space-y-3">
        <a href="https://t.me/cwim_support" className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-5 hover:border-primary transition-colors">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 text-xl">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.499.087.499s.269 1.395.38 2.327c.11.932.22 2.24.22 2.24s.05.462-.273.68c-.195.13-.464.106-.464.106s-5.763-2.328-5.85-2.543c-.087-.215-.06-.28.058-.371.117-.09.31-.26.31-.26s3.36-3.003 3.572-3.175c.212-.172.247-.057.072.042-.176.1-3.597 2.278-4.021 2.52-.424.24-.75.234-.75.234s-4.109-.777-4.564-.837c-.453-.06-.588-.28-.588-.28s-.128-.334.26-.497c.388-.164 5.366-2.106 6.3-2.472.934-.366 1.49-.168 1.49-.168z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Telegram</p>
            <p className="text-xs text-muted mt-0.5">@cwim_support</p>
          </div>
          <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>

        <a href="mailto:support@cwim.ru" className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-5 hover:border-primary transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Email</p>
            <p className="text-xs text-muted mt-0.5">support@cwim.ru</p>
          </div>
          <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Частые вопросы</h2>
        {[
          { q: 'Как подключиться к VPN?', a: 'Установите приложение из инструкций, скопируйте ключ и подключитесь к любому серверу.' },
          { q: 'Сколько устройств можно подключить?', a: 'Количество устройств зависит от тарифа — от 1 до 10.' },
          { q: 'Есть ли гарантия возврата?', a: 'Да, мы возвращаем средства в течение 24 часов после оплаты, если сервис вам не подошёл.' },
        ].map((faq, i) => (
          <details key={i} className="group">
            <summary className="flex items-center justify-between text-sm font-medium cursor-pointer list-none py-2">
              {faq.q}
              <svg className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="text-sm text-muted mt-2 leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>

      <Link to="/guides" className="block bg-surface border border-border rounded-2xl p-5 text-center hover:border-primary transition-colors">
        <p className="font-medium">Инструкции по настройке</p>
        <p className="text-xs text-muted mt-1">iOS, Android, Windows, Mac</p>
      </Link>
    </div>
  )
}
