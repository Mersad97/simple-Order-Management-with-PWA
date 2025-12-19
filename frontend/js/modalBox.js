let escBound = false;
let uid = 0;

export function openModal(message, type = "success", timeout = 3000, title = "وضعیت درخواست") {
  function hasDOM() {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }
  if (!hasDOM()) {
    // اینجا فقط لاگ کن، چون در SW/worker هستیم
    console.warn("openModal called without DOM. Ignored.", { message, type, title });
    return null;
  }

  const modalBox = document?.getElementById("modal-container");
  const stackEl = document?.getElementById("modal-stack");

  if (!modalBox || !stackEl) throw new Error("modal container/stack not found");

  // کانتینر را نمایش بده
  modalBox.classList.remove("close");

  const id = `m_${Date.now()}_${++uid}`;

  // ساخت آیتم
  const item = document.createElement("div");
  item.className = "modal-content modal-item";
  item.dataset.id = id;

  const header = document.createElement("div");
  header.className = "modal-header";

  const h3 = document.createElement("h3");
  h3.className = "modal-title";
  h3.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "بستن");
  closeBtn.textContent = "✕";

  header.append(h3, closeBtn);

  const msg = document.createElement("div");
  msg.className = "modal-message";
  msg.classList.add(type === "error" ? "error" : "success");
  msg.textContent = message || "";

  item.append(header, msg);

  // افزودن به استک
  stackEl.appendChild(item);

  // انیمیشن ورود
  requestAnimationFrame(() => item.classList.add("in"));

  // بستن آیتم
  const remove = () => closeModal(id);
  closeBtn.addEventListener("click", remove, { once: true });

  // تایمر مستقل برای همین آیتم
  const t = window.setTimeout(remove, timeout);
  item.dataset.timer = String(t);

  // ESC: آخرین پیام را ببند
  if (!escBound) {
    document.addEventListener("keydown", handleEsc);
    escBound = true;
  }

  return id;
}

export function closeModal(id) {
  const modalBox = document?.getElementById("modal-container");
  const stackEl = document?.getElementById("modal-stack");
  if (!stackEl || !modalBox) return;

  const el = id ? stackEl.querySelector(`[data-id="${id}"]`) : stackEl.lastElementChild;

  if (!el) return;

  const t = Number(el.dataset.timer);
  if (t) clearTimeout(t);

  // انیمیشن خروج
  el.classList.remove("in");
  el.classList.add("out");

  const finalize = () => {
    el.remove();

    // اگر هیچ پیامی نمانده، کانتینر را ببند
    if (stackEl.childElementCount === 0) {
      modalBox.classList.add("close");
      document.removeEventListener("keydown", handleEsc);
      escBound = false;
    }
  };

  el.addEventListener("transitionend", finalize, { once: true });

  // فالبک اگر transitionend به هر دلیلی نیامد
  setTimeout(() => {
    if (el.isConnected) finalize();
  }, 260);
}

export function handleEsc(e) {
  if (e.key === "Escape") closeModal(); // آخرین پیام
}
