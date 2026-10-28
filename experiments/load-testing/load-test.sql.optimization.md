# Load test: SQL optimization của API orders

## Mục tiêu

So sánh latency và throughput của API lấy trang orders khi chưa có index sắp xếp và khi có index phù hợp, trên cùng dataset và cùng cấu hình tải.

## Endpoint và điều kiện thử

- Endpoint: `GET /api/v1/orders?limit=50`
- API dùng cursor pagination và truy vấn thêm một row để xác định `hasNext` (tối đa 51 rows cho mỗi request).
- API hiện chưa nhận filter `status`; vì vậy phép đo này tương ứng với query lấy orders mới nhất, không phải query chỉ lấy `cancelled`.
- K6 script: [`k6/orders-list.load.js`](../../k6/orders-list.load.js)
- Giữ nguyên dataset, cấu hình máy, log SQL, số VU và thời lượng giữa hai lần chạy. Chỉ thay đổi index thử nghiệm.

## Cấu hình index

Chạy trong database local dùng cho benchmark. Không chạy lệnh `DROP INDEX` nếu index đó đang được ứng dụng hoặc môi trường khác sử dụng.

### A. Không có index thử nghiệm

```sql
DROP INDEX IF EXISTS idx_orders_created_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_status_created_id;
ANALYZE orders;
```

### B. Có index `(created_at, id)`

```sql
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_status_created_id;

CREATE INDEX idx_orders_created_id
ON orders (created_at, id);

ANALYZE orders;
```

Primary key và các index nền tảng khác giữ nguyên ở cả hai lượt; chỉ bật/tắt index thử nghiệm này.

## Chạy k6

Khởi động API trỏ tới đúng database benchmark trước. Chạy hai lượt với tham số giống nhau; chỉ đổi `EXPERIMENT` để dễ nhận diện kết quả.

```powershell
k6 run -e BASE_URL=http://localhost:3000 -e VUS=20 -e HOLD_DURATION=2m -e EXPERIMENT=no-index .\k6\orders-list.load.js
```

Sau đó tạo index và chạy lại:

```powershell
k6 run -e BASE_URL=http://localhost:3000 -e VUS=20 -e HOLD_DURATION=2m -e EXPERIMENT=created-at-id-index .\k6\orders-list.load.js
```

Mỗi lượt gồm 30 giây tăng tải, 2 phút giữ tải ở mức 20 VU, rồi 30 giây giảm tải. Các giá trị `VUS` và `HOLD_DURATION` có thể đổi, nhưng phải giống nhau giữa hai lượt. Không chạy hai lượt đồng thời.

## Kết quả

Điền số liệu từ summary của k6 sau khi chạy cả hai lượt. So sánh `http_req_duration` p50/p90/p95/p99, `http_reqs` (request rate), `http_req_failed` và số lượng request. Ghi lại thêm dataset, phiên bản PostgreSQL, cấu hình máy và thời điểm chạy.

| Cấu hình | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Requests/s | Failed (%) | Tổng requests |
|---|---:|---:|---:|---:|---:|---:|---:|
| Không có index thử nghiệm | 831.12 | 1,320 | 1,490 | — | 20.05 | 0.00% | 3,610 |
| Có `(created_at, id)` | 48.85 | 69.41 | 76.52 | — | 357.17 | 0.00% | 64,291 |

`p99` không có trong output k6 đã lưu nên chưa điền. Các requests đều trả HTTP 200 và cả hai lượt có 100% checks thành công. Lượt không index vượt threshold `p(95)<1000ms` (p95 thực tế 1.49s); lượt có index đạt threshold (76.52ms).

### Ghi chú lần chạy

- Dataset / số orders: khoảng 600K orders (theo benchmark SQL trước đó; cần xác nhận DB không thay đổi giữa các lượt)
- VU / thời gian giữ tải: 20 / 2 phút
- Máy chạy API và PostgreSQL: —
- Cấu hình log SQL: —
- Mỗi cấu hình chỉ có một lượt đo trong output hiện có; chạy lại nhiều lần sẽ giúp giảm ảnh hưởng của cache và dao động tải máy.

## Diễn giải

Trong hai lượt đơn lẻ này, index `(created_at, id)` đi cùng p95 thấp hơn khoảng 19.5 lần (1,490 ms xuống 76.52 ms), p50 thấp hơn khoảng 17 lần (831.12 ms xuống 48.85 ms), và request rate cao hơn khoảng 17.8 lần (20.05 lên 357.17 requests/s). Đây là mối liên hệ quan sát được trong lần chạy này, chưa đủ để tách riêng ảnh hưởng của index khỏi cache và các yếu tố thời điểm chạy. API còn chịu ảnh hưởng của NestJS, connection pool, logging, cache hệ điều hành/PostgreSQL và tài nguyên máy; nên chạy nhiều lượt luân phiên trước khi xem đây là kết quả ổn định. Đây là benchmark local, không đại diện trực tiếp cho production.
