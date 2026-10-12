import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const NotificationsView: React.FC = () => {
  const { notifications, markAllNotificationsAsRead, markNotificationAsRead, addNotification, setCurrentView } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'tip' | 'room' | 'comment' | 'checkin'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTestNotification = () => {
    addNotification({
      type: 'tip',
      title: 'Ledger Synced & Verified',
      message: 'Your cryptographic token ledger, channel metrics, and watch sessions have been synced successfully.',
      actorName: 'RiseUp System',
    });
    showToast('Test notification generated!');
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-black text-white py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-mono font-semibold shadow-2xl border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Title and Global Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                Activity & Alerts
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase font-mono">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-black font-mono font-bold text-xs">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans">
              Real-time alerts for token tips, community comments, and focus room check-ins.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-colors border border-neutral-800 cursor-pointer"
            >
              Test Alert
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  markAllNotificationsAsRead();
                  showToast('All notifications marked as read.');
                }}
                className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black rounded-xl text-xs font-mono font-bold transition-colors shadow-sm cursor-pointer"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'tip', label: 'Token Tips' },
            { id: 'comment', label: 'Comments' },
            { id: 'room', label: 'Focus Rooms' },
            { id: 'checkin', label: 'Check-ins' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                activeFilter === tab.id
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="p-16 text-center bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3 shadow-md">
              <span className="material-symbols-outlined text-[44px] text-neutral-600">
                notifications_off
              </span>
              <h3 className="font-mono font-bold text-base uppercase text-white">
                All Caught Up
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto font-sans">
                You have no active notifications in this section. When creators tip tokens, viewers comment, or rooms start, you will receive updates here.
              </p>
              <button
                type="button"
                onClick={handleTestNotification}
                className="mt-3 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold border border-neutral-800 transition-colors"
              >
                Generate Test Notification
              </button>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.read
                    ? 'bg-neutral-950 border-neutral-700 shadow-lg'
                    : 'bg-black border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                    {notif.actorAvatar || notif.avatar ? (
                      <img
                        src={notif.actorAvatar || notif.avatar}
                        alt="Actor"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[20px] text-white">
                        {notif.type === 'tip'
                          ? 'payments'
                          : notif.type === 'room'
                          ? 'groups'
                          : notif.type === 'comment'
                          ? 'chat_bubble'
                          : 'bolt'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs uppercase text-white truncate">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 font-sans line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 pt-0.5">
                      <span>{notif.actorName || 'System'}</span>
                      <span>•</span>
                      <span>{notif.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {notif.type === 'tip' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentView('wallet');
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold border border-neutral-800 transition-colors"
                    >
                      View Wallet
                    </button>
                  )}
                  {notif.type === 'room' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentView('rooms');
                      }}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-mono font-bold border border-neutral-800 transition-colors"
                    >
                      Enter Room
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
