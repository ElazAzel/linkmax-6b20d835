-- Автоматическая нумерация инвойсов для каждой зоны
-- Начинает отсчет с 1 для каждой новой зоны

CREATE OR REPLACE FUNCTION set_next_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    -- Если номер уже задан вручную, не меняем его
    IF NEW.invoice_number IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Находим максимальный номер для этой зоны
    SELECT COALESCE(MAX(invoice_number), 0) + 1
    INTO next_num
    FROM zone_invoices
    WHERE zone_id = NEW.zone_id;

    NEW.invoice_number := next_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер срабатывает ПЕРЕД вставкой
DROP TRIGGER IF EXISTS tr_set_invoice_number ON zone_invoices;
CREATE TRIGGER tr_set_invoice_number
BEFORE INSERT ON zone_invoices
FOR EACH ROW
EXECUTE FUNCTION set_next_invoice_number();
