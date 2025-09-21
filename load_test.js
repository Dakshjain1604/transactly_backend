import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 5 },   // ramp up to 5 virtual users
        { duration: '1m', target: 5 },    // stay at 5 users
        { duration: '30s', target: 0 },   // ramp down
    ],
};

export default function () {
    let url = 'http://localhost:3000/Account/balance';

    let params = {
        headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDAwYzIzODUyYTI4ZTlhMjdhZTRiZSIsImlhdCI6MTc1ODQ2OTMwMSwiZXhwIjoxNzU4NDcyOTAxfQ.pTZ0ly4pBvjALPiaNmy-a5ET0WzijjD71GSwNJX83xs"', // replace with your token
            'Content-Type': 'application/json',
        },
    };

    let res = http.get(url, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has body': (r) => r.body.length > 0,
    });

    sleep(1); // simulate user think time
}
