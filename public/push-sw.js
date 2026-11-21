// ফোনে নোটিফিকেশন দেখানো আর চাপলে ম্যাচের পাতা খোলা (Workbox-এর service worker এটা যোগ করে নেয়)
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "খেলা কখন?", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "খেলা কখন?", {
    body: d.body || "", tag: d.tag, renotify: true, icon: self.location.origin + "/icon-192x192.png", badge: self.location.origin + "/badge-96.png?v=5",
    data: { url: d.url || "/" }, lang: "bn",
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.startsWith(self.location.origin) && "focus" in c) { c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
