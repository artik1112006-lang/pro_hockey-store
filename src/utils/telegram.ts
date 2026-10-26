import { Order, TelegramConfig } from '../types';

export async function sendTelegramOrderNotification(
  order: Order,
  config: TelegramConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, message: 'Telegram уведомления отключены в настройках' };
  }

  const itemsFormatted = order.detailedItems && order.detailedItems.length > 0
    ? order.detailedItems.map(item => {
        const specs = [item.selectedHand, item.selectedCurve, item.selectedVariant]
          .filter(Boolean)
          .join(', ');
        const specStr = specs ? ` [${specs}]` : '';
        return `• ${item.name}${specStr} — ${item.quantity} шт. x ${item.price} BYN`;
      }).join('\n')
    : order.items;

  const text = `<b>🚨 НОВЫЙ ЗАКАЗ В PRO HOCKEY STORE!</b>\n\n` +
    `👤 <b>Покупатель:</b> ${order.customerName}\n` +
    `📞 <b>Телефон:</b> ${order.phone}\n` +
    (order.city ? `📍 <b>Город / Адрес:</b> ${order.city}\n` : '') +
    (order.comment ? `💬 <b>Комментарий:</b> ${order.comment}\n` : '') +
    `\n📦 <b>Товары:</b>\n${itemsFormatted}\n\n` +
    `💰 <b>Итого к оплате:</b> ${order.total.toFixed(2)} BYN\n` +
    `🕒 <b>Время:</b> ${order.createdAt}`;

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: 'Уведомление успешно отправлено в Telegram!' };
    } else {
      console.warn('Telegram API error:', data);
      return { success: false, message: `Ошибка Telegram API: ${data.description || 'Не удалось отправить'}` };
    }
  } catch (error) {
    console.warn('Telegram fetch error:', error);
    return { success: false, message: 'Сетевая ошибка при отправке в Telegram' };
  }
}

export async function testTelegramMessage(
  config: TelegramConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.botToken || !config.chatId) {
    return { success: false, message: 'Укажите токен бота и ID чата' };
  }

  const text = `<b>🏒 Проверка связи с PRO HOCKEY STORE</b>\n\nБот успешно подключен и готов отправлять заказы!`;

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: 'Тестовое сообщение успешно получено в Telegram!' };
    } else {
      return { success: false, message: `Ошибка: ${data.description || 'Неверный токен или chat_id'}` };
    }
  } catch (error) {
    return { success: false, message: 'Сетевая ошибка: ' + (error instanceof Error ? error.message : 'Сбой сети') };
  }
}
