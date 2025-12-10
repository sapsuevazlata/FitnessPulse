-- Скрипт для добавления поля inventory_id в таблицу personal_bookings
-- Выполните этот скрипт в вашей базе данных

-- Шаг 1: Проверьте наличие поля equipment (выполните в консоли MySQL):
-- SHOW COLUMNS FROM personal_bookings LIKE 'equipment';

-- Шаг 2: Удаляем старое поле equipment (выполните, если поле существует)
-- Если поле equipment существует, раскомментируйте следующую строку:
-- ALTER TABLE personal_bookings DROP COLUMN equipment;

-- Шаг 3: Добавляем поле inventory_id в таблицу personal_bookings
-- Если поле уже существует, эта команда выдаст ошибку - это нормально
ALTER TABLE personal_bookings 
ADD COLUMN inventory_id INT NULL AFTER subscription_id;

-- Шаг 4: Добавляем внешний ключ для связи с таблицей inventory
-- Если внешний ключ уже существует, эта команда выдаст ошибку - это нормально
ALTER TABLE personal_bookings 
ADD CONSTRAINT fk_booking_inventory 
FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL;

-- Шаг 5: Индекс для быстрого поиска по inventory_id
-- Если индекс уже существует, эта команда выдаст ошибку - это нормально
CREATE INDEX idx_inventory_id ON personal_bookings(inventory_id);
