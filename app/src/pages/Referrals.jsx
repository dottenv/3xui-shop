export default function Referrals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Рефералы</h1>
        <p className="text-muted text-sm mt-1">Приглашайте друзей и получайте бонусы</p>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 rounded-2xl p-6 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold">Пригласите друга</h2>
        <p className="text-sm text-muted">Получите <strong className="text-primary">50 ₽</strong> за каждого приглашённого друга, который купит подписку</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Ваша реферальная ссылка</h2>
        <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-4 py-3">
          <input
            type="text" readOnly value="https://cwim.ru/ref/your-code"
            className="flex-1 bg-transparent text-sm text-white outline-none"
          />
          <button className="text-primary text-sm font-medium hover:underline shrink-0">Копировать</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-5 text-center space-y-1">
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted">Приглашено</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 text-center space-y-1">
          <p className="text-2xl font-bold">0 ₽</p>
          <p className="text-xs text-muted">Заработано</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold">Как это работает</h2>
        <div className="space-y-3">
          {[
            { step: '01', text: 'Отправьте другу вашу реферальную ссылку' },
            { step: '02', text: 'Друг регистрируется и покупает любую подписку' },
            { step: '03', text: 'Вы получаете 50 ₽ на баланс' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-primary font-bold text-sm w-6 shrink-0">{item.step}</span>
              <p className="text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
