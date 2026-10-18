# CheckoutCore — Kế hoạch dự án

## 1. Mục tiêu

Xây dựng hệ thống checkout bằng NestJS và PostgreSQL nhằm thực hành:

- Transaction và rollback.
- Indexing và tối ưu truy vấn SQL.
- Isolation level.
- Deadlock và cách phòng tránh.
- Race condition và chống overselling.
- Idempotency khi client gửi request trùng.
- Integration testing và load testing.

## 2. Công nghệ

- TypeScript, Node.js, NestJS
- PostgreSQL, TypeORM
- Jest, Supertest
- k6
- Docker Compose

## 3. Phạm vi

Không xây dựng authentication, frontend, payment gateway
hay microservices.

### Database (5 bảng)

- `products`: Thông tin sản phẩm.
- `product_variants`: SKU, size, màu sắc, giá và tồn kho.
- `orders`: Thông tin đơn hàng.
- `order_items`: Chi tiết sản phẩm trong đơn.
- `idempotency_keys`: Chống xử lý request trùng.

### API chính

- `POST /checkout`: Tạo đơn hàng.
- `GET /orders/:id`: Xem đơn hàng.
- `GET /products/:id/variants`: Xem các biến thể sản phẩm.

Có thể dùng seed script để tạo dữ liệu test.

## 4. API cần triển khai

### A. Product & Variant

- [ ] `POST /products` — Tạo sản phẩm.
- [ ] `GET /products/:id` — Xem chi tiết sản phẩm.
- [ ] `GET /products/:id/variants` — Danh sách variant của sản phẩm.
- [ ] `POST /products/:id/variants` — Tạo variant.
- [ ] `PATCH /variants/:id/stock` — Điều chỉnh tồn kho để quản trị và test.

### B. Checkout & Orders

- [ ] `POST /checkout` — Checkout một hoặc nhiều variant.
- [ ] `GET /orders/:id` — Xem chi tiết đơn hàng.
- [ ] `GET /orders` — Danh sách đơn hàng, hỗ trợ phân trang.
- [ ] `POST /orders/:id/cancel` — Hủy đơn và hoàn lại tồn kho.

### C. Idempotency & Testing

- [ ] `POST /checkout` — Hỗ trợ header `Idempotency-Key`.
- [ ] `GET /health` — Kiểm tra trạng thái ứng dụng và database.

### D. Các yêu cầu kỹ thuật

- Checkout phải tạo order, order items và trừ tồn kho trong cùng transaction.
- Không cho phép tồn kho âm hoặc overselling.
- Request checkout trùng không được tạo đơn hoặc trừ kho hai lần.
- Hủy đơn phải hoàn tồn kho đúng một lần.
- Không cho phép hủy đơn đã hủy.
- Giá đơn hàng phải được tính từ database.
- Danh sách đơn hàng phải có pagination ổn định.
- Có integration test cho rollback, race condition, deadlock và idempotency.

### E. Thứ tự triển khai

1. Product & Variant APIs.
2. Checkout và xem đơn hàng.
3. Transaction và chống overselling.
4. Idempotency.
5. Hủy đơn và hoàn tồn kho.
6. Pagination và indexing.
7. Integration tests và k6 load testing.
8. Isolation level và deadlock experiments.

## 5. Kế hoạch triển khai

### Phase 1: Nền tảng

- [ ] Khởi tạo NestJS, PostgreSQL và Docker Compose.
- [ ] Thiết kế schema, migration, constraint và index.
- [ ] Tạo seed data.

### Phase 2: Checkout

- [ ] Xây dựng luồng checkout cơ bản.
- [ ] Dùng transaction để đảm bảo dữ liệu nhất quán.
- [ ] Đảm bảo lỗi giữa chừng sẽ rollback toàn bộ.
- [ ] Lưu giá sản phẩm tại thời điểm đặt hàng.

### Phase 3: Concurrency

- [ ] Tái hiện race condition và overselling.
- [ ] Thử conditional update và `SELECT FOR UPDATE`.
- [ ] Kiểm thử transaction isolation levels.
- [ ] Tái hiện deadlock và thử giải pháp lock ordering.
- [ ] Triển khai idempotency cho checkout.

### Phase 4: Testing và tối ưu

- [ ] Viết unit test và integration test.
- [ ] Kiểm thử nhiều request checkout đồng thời.
- [ ] Dùng `EXPLAIN ANALYZE` để đánh giá index.
- [ ] Dùng k6 đo throughput, p95 latency và error rate.
- [ ] Xác minh tồn kho không âm và không oversell.

### Phase 5: Hoàn thiện

- [ ] Viết README và sơ đồ ERD.
- [ ] Tài liệu hóa các thử nghiệm SQL.
- [ ] Ghi lại kết quả benchmark có thể tái hiện.
- [ ] Hướng dẫn chạy project bằng Docker Compose.

## 6. Tiêu chí hoàn thành

- Checkout đồng thời không làm tồn kho âm hoặc oversell.
- Transaction rollback đúng khi xảy ra lỗi.
- Request trùng không tạo đơn hàng hoặc trừ kho nhiều lần.
- Tái hiện và giải thích được isolation level, deadlock.
- Có bằng chứng tối ưu truy vấn bằng execution plan.
- Có integration test và báo cáo load test.
- Có thể giải thích rõ các quyết định kỹ thuật trong phỏng vấn.

## 7. Nguyên tắc

- Ưu tiên tính đúng đắn trước hiệu năng.
- Tái hiện vấn đề trước khi triển khai giải pháp.
- Đo lường thay vì phỏng đoán.
- Giữ scope nhỏ, tập trung vào chiều sâu SQL và concurrency.