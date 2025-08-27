# Asuna - A blazing-fast, progressive microservice framework.
# SPDX-License-Identifier: BSD-3-Clause (https://ncurl.xyz/s/mI23sevHR)

FROM oven/bun:alpine

ENV TRUST_PROXY="uniquelocal"
ENV HTTP_HOSTNAME="0.0.0.0"
ENV RUNTIME_ENV="container"

RUN addgroup \
    -g 3000 \
    scarlet
RUN adduser -HD \
    -u 3000 \
    -G scarlet \
    -h /app \
    flandre

RUN mkdir -p /app
WORKDIR /app
ADD . /app

RUN chown -R \
    3000:3000 \
    /app

USER 3000
RUN bun install

EXPOSE 3000
CMD ["bun", "start"]
