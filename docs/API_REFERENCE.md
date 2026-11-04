# KASPI POS (كسب) — Complete REST API Reference Manual
**API Base:** `/api/v1`
**Authentication:** Cookie Session (`authjs.session-token`) or Bearer JWT Token
**Content-Type:** `application/json`

---

## 1. Authentication & Profile

### `GET /api/v1/me`
Retrieves the authenticated user profile, active tenant context, and memberships.
- **Response 200 OK:**
  ```json
  {
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "fullName": "Manager",
        "isSuperAdmin": false
      },
      "currentTenant": {
        "id": "uuid",
        "displayName": "Mon Épicerie",
        "maxDevices": 2,
        "currency": "MAD"
      },
      "role": "owner"
    }
  }
  ```

---

## 2. Sales & Checkout

### `POST /api/v1/sales`
Registers a finalized point of sale transaction with atomic inventory decrement and DGI invoice numbering.
- **Request Body:**
  ```json
  {
    "clientSaleId": "550e8400-e29b-41d4-a716-446655440000",
    "idempotencyKey": "sale_550e8400-e29b-41d4-a716-446655440000",
    "storeId": "uuid",
    "customerId": "uuid", // optional
    "subtotal": 100.00,
    "taxTotal": 20.00,
    "discountTotal": 0.00,
    "grandTotal": 120.00,
    "paidTotal": 120.00,
    "changeDue": 0.00,
    "paymentMethod": "cash", // cash | card | credit | transfer
    "items": [
      {
        "productId": "uuid",
        "quantity": 2,
        "unitPrice": 50.00,
        "taxRate": 20.00,
        "discountAmount": 0
      }
    ]
  }
  ```

---

## 3. Products & Inventory

### `GET /api/v1/products`
Lists products for the active tenant with stock levels and categories.
- **Query Params:** `categoryId`, `search`, `limit`, `offset`.

### `POST /api/v1/products`
Creates a new catalog item.

---

## 4. Customers & Credit Ledger (كريديت)

### `GET /api/v1/customers`
Lists store customers with loyalty point balances and outstanding credit debt.

### `POST /api/v1/customers/[id]/credit`
Records a debt repayment or credit line extension.

---

## 5. KASPI AI Advisor & Tools

### `POST /api/ai/chat`
Streaming SSE endpoint powering the conversational AI advisor.
- **Domain Guard:** Refuses off-topic questions.
- **Tools:** `getTodaySales`, `getLowStockProducts`, `getTopSellingProducts`.
