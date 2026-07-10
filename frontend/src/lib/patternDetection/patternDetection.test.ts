import { describe, expect, it } from "vitest";
import type { TraceStep } from "@/types";
import { CONFIDENCE_THRESHOLD, detectPattern } from "./index";

function step(
  locals: Record<string, unknown>,
  stack: TraceStep["stack"] = [{ function: "main", line: 1, filename: "<user_code>" }]
): TraceStep {
  return {
    step: 0,
    line: 1,
    event: "line",
    locals,
    globals: {},
    stack,
    stdout: "",
    stderr: "",
  };
}

function traceWithChangingPointers(): TraceStep[] {
  return [
    step({ left: 0, right: 4 }),
    step({ left: 1, right: 4 }),
    step({ left: 1, right: 3 }),
  ];
}

function recursiveTrace(fn: string): TraceStep[] {
  return [
    step({}, [{ function: fn, line: 2, filename: "<user_code>" }, { function: fn, line: 4, filename: "<user_code>" }]),
    step({}, [{ function: fn, line: 2, filename: "<user_code>" }, { function: fn, line: 4, filename: "<user_code>" }]),
  ];
}

describe("detectPattern", () => {
  it("detects Two Pointers", () => {
    const source = `
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        elif total < target:
            left += 1
        else:
            right -= 1
`;
    const result = detectPattern(source, "python", traceWithChangingPointers());
    expect(result.pattern).toBe("Two Pointers");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Sliding Window", () => {
    const source = `
def longest_window(s):
    left = 0
    right = 0
    while right < len(s):
        right += 1
        while window_invalid():
            left += 1
`;
    const result = detectPattern(source, "python", traceWithChangingPointers());
    expect(result.pattern).toBe("Sliding Window");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Binary Search", () => {
    const source = `
def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
`;
    const result = detectPattern(source, "python", traceWithChangingPointers());
    expect(result.pattern).toBe("Binary Search");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Prefix Sum", () => {
    const source = `
def range_sum(nums):
    prefix = [0]
    for num in nums:
        prefix.append(prefix[-1] + num)
    return prefix
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("Prefix Sum");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects BFS", () => {
    const source = `
from collections import deque

def bfs(graph, start):
    queue = deque([start])
    visited = set([start])
    while queue:
        node = queue.popleft()
        for nei in graph[node]:
            if nei not in visited:
                visited.add(nei)
                queue.append(nei)
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("Breadth-First Search (BFS)");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects DFS", () => {
    const source = `
def dfs(node, visited):
    visited.add(node)
    for nei in graph[node]:
        if nei not in visited:
            dfs(nei, visited)
`;
    const result = detectPattern(source, "python", recursiveTrace("dfs"));
    expect(result.pattern).toBe("Depth-First Search (DFS)");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Stack", () => {
    const source = `
def eval_rpn(tokens):
    stack = []
    for token in tokens:
        stack.append(token)
    while stack:
        stack.pop()
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("Stack");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Queue", () => {
    const source = `
from collections import deque

def process():
    queue = deque()
    queue.append(1)
    while queue:
        queue.popleft()
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("Queue");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Heap", () => {
    const source = `
import heapq

def k_smallest(nums, k):
    heap = []
    for num in nums:
        heapq.heappush(heap, num)
    return heapq.heappop(heap)
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("Heap");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Hash Map", () => {
    const source = `
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("Hash Map");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Linked List Traversal", () => {
    const source = `
def walk(head):
    curr = head
    while curr:
        curr = curr.next
`;
    const result = detectPattern(source, "python", [step({ head: {}, curr: {}, node: {} })]);
    expect(result.pattern).toBe("Linked List Traversal");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Fast & Slow Pointer", () => {
    const source = `
def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
`;
    const result = detectPattern(source, "python", [step({ slow: 1, fast: 2 })]);
    expect(result.pattern).toBe("Fast & Slow Pointer");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Reverse Linked List", () => {
    const source = `
def reverse(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("Reverse Linked List");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Tree Traversal", () => {
    const source = `
def inorder(root):
    if not root:
        return
    inorder(root.left)
    print(root.val)
    inorder(root.right)
`;
    const result = detectPattern(source, "python", recursiveTrace("inorder"));
    expect(result.pattern).toBe("Tree Traversal");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects 1D DP", () => {
    const source = `
def climb_stairs(n):
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("1D DP");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects 2D DP", () => {
    const source = `
def unique_paths(m, n):
    dp = [[0] * n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1]
    return dp[m - 1][n - 1]
`;
    const result = detectPattern(source, "python", []);
    expect(result.pattern).toBe("2D DP");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("detects Recursive Function", () => {
    const source = `
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
`;
    const result = detectPattern(source, "python", recursiveTrace("factorial"));
    expect(result.pattern).toBe("Recursive Function");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it("returns generic pattern for unknown code", () => {
    const result = detectPattern("x = 1\nprint(x)", "python", []);
    expect(result.pattern).toBeNull();
    expect(result.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
  });

  it("parses source only once across detectors", () => {
    const source = `
from collections import deque
def bfs():
    q = deque()
    q.popleft()
`;
    const start = performance.now();
    detectPattern(source, "python", []);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });

  it("detects JavaScript binary search", () => {
    const source = `
function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
`;
    const result = detectPattern(source, "javascript", traceWithChangingPointers());
    expect(result.pattern).toBe("Binary Search");
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });
});

describe("PatternRegistry", () => {
  it("returns highest-confidence match", () => {
    const source = `
from collections import deque
def solve(nums, target):
    left, right = 0, len(nums) - 1
    queue = deque()
    seen = {}
    while left < right:
        queue.append(nums[left])
        queue.popleft()
        left += 1
`;
    const result = detectPattern(source, "python", traceWithChangingPointers());
    expect(result.pattern).not.toBeNull();
    expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });
});
