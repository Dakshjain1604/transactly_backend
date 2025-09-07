## BACKEND FOR Transactly -Payments App
<h1>Load and Concurrent User testing using Apache Bench </h1>

## /user/signin 
**latency Distribution Before Improvements**

  50%    197
  66%    202
  75%    204
  80%    204
  90%    211
  95%    266
  98%    270
  99%    273
 100%    273 (longest request)

**latency distribution after Improvements** 

 Percentage of the requests served within a certain time (ms)
  50%    140
  66%    164
  75%    165
  80%    167
  90%    171
  95%    189
  98%    189
  99%    192
 100%    192 (longest request)

**Result**
✅ Median latency improved from 197 ms → 140 ms (~29% faster)
✅ P95 latency dropped from 266 ms → 189 ms (~29% faster under load)
✅ Requests per second increased from ~65 → ~71 (stable throughput)