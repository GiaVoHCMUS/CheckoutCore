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

## Điều kiện đo

- Nguồn số liệu: [`benchmark.txt`](./benchmark.txt). File hiện ghi **3 cặp đo, tức 3 lượt mỗi cấu hình (6 lượt tổng cộng)**, theo thứ tự không index → có index trong từng cặp.
- K6 chạy local, gọi `http://localhost:3000/api/v1/orders?limit=50`. Mỗi iteration gửi một GET tới trang đầu; không thử các cursor ở trang sâu.
- Kịch bản: tăng dần tới 20 VU trong 30 giây, giữ 20 VU trong 2 phút, giảm về 0 trong 30 giây; mỗi lượt chạy khoảng 3 phút. Đây là mô hình VU lặp liên tục, nên số requests/s thay đổi theo tốc độ phản hồi của API.
- Mỗi response được kiểm tra HTTP 200 và có `data` dạng mảng cùng `meta`. Threshold: `checks > 99%`, `http_req_failed < 1%`, `http_req_duration p95 < 1.000 ms`.
- Dataset: khoảng 600K orders theo thí nghiệm SQL trước; output k6 không tự xác nhận số row hoặc việc dataset giữ nguyên suốt 6 lượt.
- Code hiện tại đã comment cấu hình TypeORM `logging: ['query', 'error']`; output k6 không chứng minh trạng thái log của process API trong từng lượt. Thông tin phiên bản PostgreSQL, cấu hình máy và thời điểm đo cụ thể chưa được ghi trong file nguồn.

## Kết quả từng lượt

Tất cả thời gian dưới đây là `http_req_duration` theo milliseconds; `requests/s` và tổng requests lấy từ `http_reqs`. Đơn vị giây trong output gốc đã được đổi sang ms.

| Cặp | Cấu hình | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Requests/s | Tổng requests | HTTP failed | Checks |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Không index | 849,94 | 1.310 | 1.430 | 1.760 | 19,84 | 3.572 | 0% | 100% |
| 1 | Có `(created_at, id)` | 36,43 | 65,98 | 91,12 | 143,27 | 412,44 | 74.242 | 0% | 100% |
| 2 | Không index | 914,14 | 1.440 | 1.670 | 2.120 | 18,02 | 3.244 | 0% | 100% |
| 2 | Có `(created_at, id)` | 37,85 | 51,45 | 61,25 | 99,96 | 449,29 | 80.874 | 0% | 100% |
| 3 | Không index | 855,05 | 1.340 | 1.500 | 1.910 | 19,48 | 3.507 | 0% | 100% |
| 3 | Có `(created_at, id)` | 34,56 | 44,20 | 50,04 | 89,16 | 507,62 | 91.372 | 0% | 100% |

### Median giữa các lượt

Median ở bảng này được tính **trên 3 giá trị của từng cấu hình**, không gộp toàn bộ requests của nhiều lượt thành một phân phối.

| Cấu hình | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Requests/s | Tổng requests/lượt |
|---|---:|---:|---:|---:|---:|---:|
| Không index | 855,05 | 1.340 | 1.500 | 1.910 | 19,48 | 3.507 |
| Có `(created_at, id)` | 36,43 | 51,45 | 61,25 | 99,96 | 449,29 | 80.874 |

### So sánh theo cặp

| Cặp | p95 không index → có index | p95 thấp hơn | Requests/s không index → có index | Requests/s cao hơn |
|---:|---:|---:|---:|---:|
| 1 | 1.430 → 91,12 ms | 15,69 lần | 19,84 → 412,44 | 20,78 lần |
| 2 | 1.670 → 61,25 ms | 27,27 lần | 18,02 → 449,29 | 24,94 lần |
| 3 | 1.500 → 50,04 ms | 29,98 lần | 19,48 → 507,62 | 26,06 lần |

## Kết luận

- Cả 3 lượt không index đều vượt ngưỡng p95 < 1.000 ms; cả 3 lượt có index đều đạt ngưỡng. Tất cả 6 lượt có 0% HTTP failed và 100% checks thành công. Dòng `ERRO` ở lượt không index là do **threshold latency**, không phải request HTTP lỗi.
- Tính theo median của 3 lượt mỗi cấu hình, p95 giảm từ **1.500 ms xuống 61,25 ms** (khoảng **24,49 lần**) và throughput tăng từ **19,48 lên 449,29 requests/s** (khoảng **23,06 lần**). p99 giảm từ **1.910 ms xuống 99,96 ms**.
- Trong cả 3 cặp, cấu hình có index đều có p95 thấp hơn và requests/s cao hơn rõ rệt. Kết quả phù hợp với benchmark SQL của query lấy orders mới nhất: index `(created_at, id)` hỗ trợ thứ tự `ORDER BY created_at DESC, id DESC` và `LIMIT 51`.
- Đây là kết quả local cho trang đầu của API với 20 VU. Chưa có thông tin đầy đủ về máy, trạng thái cache và các yếu tố tải khác; vì vậy các tỷ lệ trên mô tả **lần thử này**, không phải cam kết hiệu năng production.
