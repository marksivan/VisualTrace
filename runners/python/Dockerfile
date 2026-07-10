FROM python:3.12-slim

WORKDIR /runner

RUN useradd -m -u 1000 runner && chown -R runner:runner /runner
USER runner

# Runner script will be added in Milestone 3 (Execution)
COPY --chown=runner:runner . .

CMD ["echo", "VisualTrace Python runner placeholder"]
