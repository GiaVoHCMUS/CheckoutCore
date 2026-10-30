import http from 'k6/http';
import { check } from 'k6';

const baseUrl = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const virtualUsers = Number(__ENV.VUS || 20);
const holdDuration = __ENV.HOLD_DURATION || '2m';

export const options = {
  stages: [
    { duration: '30s', target: virtualUsers },
    { duration: holdDuration, target: virtualUsers },
    { duration: '30s', target: 0 },
  ],
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99']
  },
};

export default function () {
  // The API fetches one extra row internally to determine whether another page exists.
  // Keep the request identical for both runs: once without the test index, once with it.
  const response = http.get(`${baseUrl}/api/v1/orders?limit=50`, {
    headers: { Accept: 'application/json' },
    tags: { endpoint: 'orders-list', experiment: __ENV.EXPERIMENT || 'unspecified' },
  });

  check(response, {
    'GET /api/v1/orders returns 200': (res) => res.status === 200,
    'response contains paginated items': (res) => {
      try {
        const body = res.json();
        return Array.isArray(body.data) && body.meta !== undefined;
      } catch {
        return false;
      }
    },
  });
}
