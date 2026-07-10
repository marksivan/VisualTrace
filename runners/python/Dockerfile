FROM python:3.12-slim

WORKDIR /runner

RUN useradd -m -u 1000 runner && chown -R runner:runner /runner
USER runner

COPY --chown=runner:runner requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=runner:runner runner.py .

ENTRYPOINT ["python", "runner.py"]
