import { useState, useEffect } from 'react';
import { 
  Bell, Check, Calendar, ClipboardCheck, Briefcase, 
  Wallet, Settings, Smartphone, CheckSquare2, BellOff, Info
} from 'lucide-react';
import { NotificationItem } from '../types';
import { fetchNotifications, markRead, markAllRead, getMobileSession } from '../apiBridge';

export default function NotificationsScreen() {
  useEffect(() => { const s = getMobileSession(); if (s) fetchNotifications(s.userId).then(setItems); }, []);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const handleMarkAllRead = () => {
    setItems(items.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkItemRead = (id: string) => {
    setItems(items.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = items.filter(n => !n.isRead).length;

  return (
    <div className="flex-1 overflow-y-auto pb-24 text-[#111827] font-sans animate-fade-in" id="notifications-container">
      {/* Title Header */}
      <div className="p-4 flex justify-between items-center" id="notifications-title">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">Notifications</h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Inbox messages, alerts, and system updates</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-[10px] bg-[#FFF] hover:bg-slate-50 text-[#2563EB] font-black px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="mx-4 mt-2.5 space-y-2.5" id="notifications-list">
        {items.map((n) => {
          let leftColor = 'border-l-emerald-500';
          let CategoryIcon = Bell;
          let categoryBg = 'bg-emerald-50 text-emerald-600';

          if (n.category === 'leave') {
            leftColor = 'border-l-amber-500';
            CategoryIcon = Briefcase;
            categoryBg = 'bg-amber-50 text-[#D97706] border border-amber-100';
          } else if (n.category === 'task') {
            leftColor = 'border-l-purple-500';
            CategoryIcon = ClipboardCheck;
            categoryBg = 'bg-purple-50 text-purple-700 border border-purple-100';
          } else if (n.category === 'payroll') {
            leftColor = 'border-l-blue-500';
            CategoryIcon = Wallet;
            categoryBg = 'bg-blue-50 text-[#2563EB] border border-blue-100';
          } else if (n.category === 'attendance') {
            leftColor = 'border-l-emerald-500';
            CategoryIcon = Calendar;
            categoryBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
          }

          return (
            <div 
              key={n.id}
              onClick={() => handleMarkItemRead(n.id)}
              className={`bg-[#FFF] border border-[#E5E7EB] border-l-4 ${leftColor} rounded-2xl p-3.5 flex items-start gap-3 transition cursor-pointer relative shadow-xs ${
                !n.isRead ? 'bg-[#FFF]' : 'opacity-65 bg-slate-50/50'
              }`}
            >
              {/* Category Circle Icon */}
              <div className={`p-2 rounded-xl ${categoryBg} shrink-0`}>
                <CategoryIcon className="w-4 h-4" />
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1 gap-2">
                  <h4 className={`text-xs font-black leading-tight ${!n.isRead ? 'text-[#111827]' : 'text-slate-500'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[8.5px] text-slate-400 font-bold whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-normal font-bold">{n.message}</p>
              </div>

              {/* Unread Blue dot */}
              {!n.isRead && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] absolute top-4 right-2 animate-pulse" />
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-[#FFF] rounded-2xl border border-dashed border-slate-200" id="notifications-empty">
            <BellOff className="w-10 h-10 text-slate-450 mx-auto mb-2" />
            <p className="text-xs font-black">Your inbox is completely clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
