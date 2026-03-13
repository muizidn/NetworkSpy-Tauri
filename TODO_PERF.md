Below is a **practical engineering task list** you can give to an AI coding agent (or developer) to refactor your current traffic storage into a **high-performance proxy recorder architecture**.

The tasks are ordered in **implementation phases**, so you can merge them gradually without breaking your app.

---

# Phase 1 — SQLite Performance Foundation

Goal: Make the database fast and safe for heavy write workloads.

### Task 1.1 — Enable SQLite Performance Pragmas

Update database initialization.

Add:

```
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA temp_store=MEMORY;
PRAGMA cache_size=100000;
PRAGMA mmap_size=30000000000;
```

Acceptance criteria:

* WAL mode enabled
* Writes no longer block reads
* No database locking errors

---

### Task 1.2 — Add Indexes for Query Performance

Add indexes:

```
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic(timestamp);
CREATE INDEX IF NOT EXISTS idx_traffic_uri ON traffic(uri);
CREATE INDEX IF NOT EXISTS idx_traffic_method ON traffic(method);
```

Acceptance criteria:

* UI queries remain fast even with **100k+ rows**

---

### Task 1.3 — Remove `INSERT OR REPLACE`

Replace:

```
INSERT OR REPLACE INTO traffic
```

With:

```
INSERT INTO traffic
```

Responses should still be updated via:

```
UPDATE traffic SET ...
```

Acceptance criteria:

* Requests insert successfully
* Responses update correctly
* No accidental row deletion

---

# Phase 2 — Remove Mutex Bottleneck

Goal: Eliminate lock contention from hot proxy path.

### Task 2.1 — Introduce Traffic Event Type

Create enum:

```
enum TrafficEvent {
    Request(RequestData),
    Response(ResponseData),
}
```

Acceptance criteria:

* Request and response data represented as events.

---

### Task 2.2 — Create Channel-Based Queue

Add async queue using:

```
crossbeam_channel
```

or

```
tokio::mpsc
```

Structure:

```
Proxy threads
   ↓
channel.send(event)
   ↓
DB writer thread
```

Acceptance criteria:

* Proxy code no longer directly accesses SQLite.

---

### Task 2.3 — Implement Database Writer Thread

Create a dedicated thread that:

1. Receives events
2. Stores them in memory buffer
3. Writes them to database in batches

Acceptance criteria:

* Only **one thread touches SQLite**
* No mutex needed

---

# Phase 3 — Batch Database Writes

Goal: Reduce disk operations.

### Task 3.1 — Implement Write Buffer

Add buffer:

```
Vec<TrafficEvent>
```

Flush conditions:

```
buffer.len() >= 200
OR
flush interval >= 100ms
```

Acceptance criteria:

* Events accumulate before writing

---

### Task 3.2 — Insert Requests in Transaction Batch

Use:

```
BEGIN TRANSACTION
INSERT ...
INSERT ...
INSERT ...
COMMIT
```

Acceptance criteria:

* Batch writes happen inside a single transaction.

---

### Task 3.3 — Use Prepared Statements

Cache prepared statements for:

```
INSERT traffic
UPDATE response
```

Acceptance criteria:

* Statements reused for batch execution

---

# Phase 4 — In-Memory Traffic Cache for UI

Goal: Avoid disk reads for recent traffic.

### Task 4.1 — Implement Ring Buffer

Add memory cache:

```
VecDeque<TrafficSummary>
```

Capacity:

```
10,000 entries
```

Acceptance criteria:

* Old entries automatically removed.

---

### Task 4.2 — Push Events to Memory Cache

When events arrive:

```
proxy -> channel -> memory cache -> db writer
```

Acceptance criteria:

* UI can read from memory instead of SQLite.

---

### Task 4.3 — Expose Recent Traffic API

Create method:

```
get_recent_traffic(limit: usize)
```

Source:

```
ring buffer
```

Acceptance criteria:

* UI loads instantly without DB query.

---

# Phase 5 — Optimize Body Storage

Goal: Prevent database bloat.

### Task 5.1 — Separate Body Table

Create:

```
traffic
   id
   uri
   method
   timestamp

body
   traffic_id
   req_body
   res_body
```

Acceptance criteria:

* Traffic metadata loads fast
* Bodies fetched only when needed.

---

### Task 5.2 — Add Body Compression

Compress bodies with:

```
zstd
```

Acceptance criteria:

* Stored body size reduced significantly.

---

### Task 5.3 — Lazy Load Bodies

Modify API so bodies load only when:

```
user clicks request
```

Acceptance criteria:

* Traffic list view stays fast.

---

# Phase 6 — Large Body Optimization

Goal: Support very large responses.

### Task 6.1 — Add Body Size Threshold

If body size > 1MB:

Store in file instead of DB.

Directory:

```
traffic_data/bodies/
```

Acceptance criteria:

* Large responses no longer inflate database.

---

### Task 6.2 — Store File Reference in DB

Example:

```
res_body_path TEXT
```

Acceptance criteria:

* Body file can be retrieved when viewing request.

---

# Phase 7 — Observability & Stability

Goal: Make the system production-grade.

### Task 7.1 — Add Database Metrics

Track:

```
write_queue_size
batch_size
write_latency
```

Acceptance criteria:

* Metrics available for debugging.

---

### Task 7.2 — Add Graceful Shutdown

On app exit:

```
flush write buffer
commit transaction
close db
```

Acceptance criteria:

* No lost traffic events.

---

# Phase 8 — Performance Testing

Goal: Ensure system scales.

### Task 8.1 — Create Traffic Load Test

Simulate:

```
10k requests/sec
```

Acceptance criteria:

* No dropped events.

---

### Task 8.2 — Validate DB Growth

Test:

```
1M requests
```

Acceptance criteria:

* Query performance remains acceptable.

---

# Final Architecture After Tasks

```
Proxy threads
      │
      ▼
lock-free channel
      │
      ▼
memory ring buffer
      │
      ▼
writer thread
      │
      ▼
batch transaction
      │
      ▼
SQLite (WAL mode)
```

Result:

* Extremely low latency capture
* Scales to **tens of thousands of requests/sec**
* Smooth UI

---

If you'd like, I can also produce a **“Claude Code / Cursor / Copilot prompt version” of these tasks** so your coding agent can implement them **autonomously in stages without breaking your build.**
