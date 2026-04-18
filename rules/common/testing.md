# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, utilities, components
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Critical user flows (framework chosen per language)

## Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

## Troubleshooting Test Failures

1. Use **tdd-guide** agent
2. Check test isolation
3. Verify mocks are correct
4. Fix implementation, not tests (unless tests are wrong)

## Agent Support

- **tdd-guide** — Use PROACTIVELY for new features, enforces write-tests-first
- **pr-test-analyzer** — Evaluate whether tests catch real regressions, not just hit coverage numbers
- **pytorch-build-resolver** — Runtime failures inside PyTorch test runs (CUDA OOM, device mismatch, shape errors, AMP/autograd)

## Test Structure (AAA Pattern)

Prefer Arrange-Act-Assert structure for tests:

```python
def test_cosine_similarity_orthogonal_returns_zero():
    # Arrange
    vector_a = [1, 0, 0]
    vector_b = [0, 1, 0]

    # Act
    similarity = cosine_similarity(vector_a, vector_b)

    # Assert
    assert similarity == 0
```

### Test Naming

Use descriptive names that explain the behavior under test:

```python
def test_returns_empty_list_when_no_markets_match_query(): ...
def test_raises_value_error_when_api_key_missing(): ...
def test_falls_back_to_substring_search_when_redis_unavailable(): ...
```
