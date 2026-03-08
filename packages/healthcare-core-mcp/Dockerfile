# Stage 1: Build dependencies on the NATIVE platform (x86_64)
# This avoids the "exec format error" since we're running native code
FROM --platform=$BUILDPLATFORM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
# Install into a specific folder
RUN pip install --target=/app/package -r requirements.txt

# Stage 2: Final image for AgentCore (ARM64)
FROM python:3.12-slim

# Set environment to include our custom package folder
ENV PYTHONPATH=/app/package

WORKDIR /app
# Copy the pre-installed packages from the builder stage
COPY --from=builder /app/package /app/package
# Copy the source code
COPY . .

EXPOSE 8000
CMD ["python", "main.py", "sse", "--port", "8000"]
