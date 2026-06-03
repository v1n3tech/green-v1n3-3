-- Migration 033: let an assigned delivery executive read the marketplace order
-- tied to their delivery_request (so the product title etc. show on their
-- assignment card). Scoped strictly to orders they have been delegated.

DROP POLICY IF EXISTS orders_select_assigned_executive ON public.marketplace_orders;
CREATE POLICY orders_select_assigned_executive ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.delivery_requests dr
      WHERE dr.order_id = marketplace_orders.id
        AND dr.assigned_executive_id = auth.uid()
    )
  );
