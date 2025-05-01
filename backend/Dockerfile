FROM gradle:8.12.0-jdk21-corretto AS builder
WORKDIR /build

COPY build.gradle.kts settings.gradle.kts /build/
RUN gradle build -x test --parallel --continue > /dev/null 2>&1 || true

COPY . /build
RUN gradle build -x test --parallel

FROM amazoncorretto:21-alpine AS production
WORKDIR /app

# 1️⃣  uploads 폴더 생성 + 퍼미션 변경 (USER 전환 전에!)
RUN mkdir -p /app/mri-uploads && chown -R nobody:nobody /app/mri-uploads

COPY --from=builder /build/build/libs/server-*.jar app.jar

EXPOSE 8080

USER nobody
ENTRYPOINT ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "-Dsun.net.inetaddr.ttl=0", "app.jar"]