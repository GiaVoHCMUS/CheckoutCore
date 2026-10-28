# Orders Query Optimization Benchmark

## Mục tiêu

Đo ảnh hưởng của từng cấu hình index lên query lấy 51 orders mới nhất. Mỗi cấu hình có 5 lần chạy `EXPLAIN (ANALYZE, BUFFERS)`; bảng dưới đây dùng median của `Execution Time` làm số đại diện.

## 1. Query lấy 51 orders mới nhất

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status, total_amount, created_at, updated_at, cancelled_at
FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 51;
```

### Cấu hình index

Mỗi cấu hình chỉ có các index thử nghiệm được ghi ở dòng đó. Primary key của bảng vẫn tồn tại.

### 1. Không có index thử nghiệm

```sql
DROP INDEX IF EXISTS idx_orders_created_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_status_created_id;

ANALYZE orders;
```

### 2. Chỉ index `(created_at, id)`

```sql
CREATE INDEX idx_orders_created_id
ON orders (created_at, id);

ANALYZE orders;
```

### 3. Chỉ index `(status)`

```sql
DROP INDEX IF EXISTS idx_orders_created_id;

CREATE INDEX idx_orders_status
ON orders (status);

ANALYZE orders;
```

### 4. Chỉ index `(status, created_at, id)`

```sql
DROP INDEX IF EXISTS idx_orders_status;

CREATE INDEX idx_orders_status_created_id
ON orders (status, created_at, id);

ANALYZE orders;
```

### Kết quả

Thời gian tính bằng milliseconds. Mỗi dãy là 5 giá trị `Execution Time` theo thứ tự đã đo.

| Cấu hình | Execution Time từng lần (ms) | Median (ms) | Plan được chọn | Buffers | Nhận xét |
|---|---:|---:|---|---:|---|
| Không có index thử nghiệm | 62.255, 66.440, 58.520, 57.063, 71.377 | **62.255** | `Parallel Seq Scan` → `Sort` → `Gather Merge` | 5,876 shared hit | Quét khoảng 600K orders rồi sort để lấy 51 rows. Sort dùng `top-N heapsort`. |
| Chỉ `(created_at, id)` | 0.154, 0.153, 0.164, 0.183, 0.179 | **0.164** | `Index Scan Backward` trên `idx_orders_created_id` | 54 shared hit | Index cung cấp thứ tự cần thiết; không cần quét toàn bảng hoặc sort. |
| Chỉ `(status)` | 56.699, 56.146, 92.289, 51.741, 58.100 | **56.699** | `Parallel Seq Scan` → `Sort` → `Gather Merge` | 5,876 shared hit | Query không lọc theo `status`, nên planner không dùng index này. |
| Chỉ `(status, created_at, id)` | 59.528, 62.316, 54.238, 64.172, 57.889 | **59.528** | `Parallel Seq Scan` → `Sort` → `Gather Merge` | 5,876 shared hit | Query không có điều kiện `status`; cột đầu index không được ràng buộc nên planner không dùng index này. |

### Kết luận riêng

- Với query này, index `(created_at, id)` giảm median từ **62.255 ms xuống 0.164 ms**, khoảng **380 lần** trong lần benchmark local này.
- Buffers giảm từ 5,876 xuống 54 shared hits; plan chuyển từ quét/sort toàn bảng sang đọc các entries cần thiết từ index.
- Index `(status)` và `(status, created_at, id)` không cải thiện query này vì query không lọc theo status. Thời gian giữa các cấu hình đó dao động quanh baseline và cùng dùng `Parallel Seq Scan` cùng `Sort`.
- Kết quả áp dụng cho query và dataset khoảng 600K orders này. Thời gian local có thể thay đổi theo cache, tải máy và cấu hình PostgreSQL; cần benchmark riêng cho query lọc status và HTTP API.

### Ghi chú

- Query trả 51 rows để phục vụ cursor pagination với page size 50: ứng dụng cần thêm một row để biết còn trang tiếp theo hay không.
- Buffers `shared hit` là các trang đã có trong PostgreSQL shared buffer cache; số này không tương đương trực tiếp với bytes đọc từ ổ đĩa.
- Index có lợi cho query đọc nhưng cũng tốn dung lượng và làm tăng chi phí ghi/cập nhật. Cần chọn index theo các query thực tế.

## 2. Query lấy 51 orders cancelled mới nhất

### Query được benchmark

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status, total_amount, created_at, updated_at, cancelled_at
FROM orders
WHERE status = 'cancelled'
ORDER BY created_at DESC, id DESC
LIMIT 51;
```

Mỗi cấu hình index được chạy 5 lần. Các cấu hình dưới đây là độc lập; mỗi lần thử chỉ giữ index được nêu (ngoài primary key có sẵn). Median tính từ `Execution Time` PostgreSQL báo cáo.

| Cấu hình | Execution Time từng lần (ms) | Median (ms) | Plan được chọn | Buffers tiêu biểu | Nhận xét |
|---|---:|---:|---|---:|---|
| Không có index thử nghiệm | 32.176, 38.604, 33.233, 32.094, 31.244 | **32.176** | `Parallel Seq Scan` → `Sort` → `Gather Merge` | khoảng 5,876 pages (`shared hit` + `read`) | Quét toàn bộ orders; loại khoảng 190,002 rows mỗi worker rồi sort kết quả phù hợp. |
| Chỉ `(created_at, id)` | 1.559, 1.123, 1.108, 0.981, 0.976 | **1.108** | `Index Scan Backward` trên `idx_orders_created_id` | 1,018 shared hit | Đọc theo thứ tự thời gian, nhưng phải lọc status; bỏ qua 954 rows trước khi đủ 51 kết quả. |
| Chỉ `(status)` | 18.774, 17.828, 13.601, 16.974, 13.075 | **16.974** | `Bitmap Index Scan` → `Bitmap Heap Scan` → `Sort` | 5,795 shared hit | Tìm rows `cancelled` qua index, nhưng vẫn đọc 30,000 rows và sort để lấy 51 rows mới nhất. |
| `(status, created_at, id)` | 0.217, 0.162, 0.191, 0.157, 0.145 | **0.162** | `Index Scan Backward` trên `idx_orders_status_created_id` | 52–56 shared hit; lần đầu có 4 read | Dùng status làm điều kiện index và lấy sẵn theo thứ tự cần thiết; không cần lọc thêm hay sort. |

### Kết luận riêng

- Với query lọc `status = 'cancelled'`, index ghép `(status, created_at, id)` có median thấp nhất: **0.162 ms**, so với **32.176 ms** khi không có index thử nghiệm (xấp xỉ **199 lần** trong lần benchmark local này).
- Index `(created_at, id)` cũng nhanh đáng kể (**1.108 ms**) vì hỗ trợ thứ tự và dừng sau khi tìm đủ 51 kết quả; tuy nhiên vẫn phải đọc qua 954 orders không phù hợp.
- Index riêng `(status)` tìm được 30,000 orders phù hợp nhưng không cung cấp thứ tự `created_at, id`, nên PostgreSQL phải đọc các row đó rồi sort. Trong lần đo này median là **16.974 ms**.
- Kết quả minh họa thứ tự cột trong index ghép phù hợp với query: equality filter `status` trước, tiếp theo là các cột sắp xếp `created_at, id`.
- Đây là kết quả trên dataset và máy local hiện tại. Cache và trạng thái hệ thống làm thời gian từng lần dao động; nên so sánh cả execution plan và buffers, không chỉ một lần chạy.

## Kết luận chung từ hai query

| Query | Index phù hợp nhất trong các cấu hình đã thử | Median không có index thử nghiệm | Median tốt nhất | Cải thiện xấp xỉ |
|---|---|---:|---:|---:|
| Lấy 51 orders mới nhất, không lọc status | `(created_at, id)` | 62.255 ms | 0.164 ms | 380 lần |
| Lấy 51 orders `cancelled` mới nhất | `(status, created_at, id)` | 32.176 ms | 0.162 ms | 199 lần |

Hai kết quả cho thấy index cần khớp với điều kiện lọc và thứ tự của từng query:

- Query không lọc status cần index `(created_at, id)` để đọc theo thứ tự mới nhất và dừng sau 51 rows.
- Query có `WHERE status = ...` cần index ghép `(status, created_at, id)`: cột lọc bằng được đặt trước, hai cột sắp xếp theo sau. Plan dùng `Index Cond` và không cần sort.
- Index riêng `(status)` giúp tìm các orders cần lọc, nhưng vẫn phải đọc khoảng 30,000 rows rồi sort; nó không thay thế được index khớp cả filter lẫn ordering.
- Không có một index duy nhất thắng cho cả hai query: index `(status, created_at, id)` không giúp query không lọc status trong benchmark trước đó, còn `(created_at, id)` phải lọc thêm status ở query thứ hai.
- Đây là kết luận cho hai query, dữ liệu khoảng 600K orders và môi trường local đã đo. Trước khi quyết định giữ cả hai index trong ứng dụng, cần cân nhắc dung lượng index và chi phí ghi/cập nhật; sau đó benchmark API dưới tải để kiểm tra kết quả thực tế.
