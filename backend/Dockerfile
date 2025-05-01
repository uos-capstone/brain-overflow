# 1. Java 21 slim 이미지를 사용합니다.
FROM openjdk:21-jdk-slim

# 2. 작업 디렉터리 생성
WORKDIR /app

# 3. 빌드된 JAR 파일을 복사합니다. (예시: target 디렉터리에 생성된 JAR)
COPY build/libs/server-0.0.1-SNAPSHOT.jar app.jar

# 4. 컨테이너가 실행될 포트 설정 (기본적으로 8080 포트를 많이 사용)
EXPOSE 8080

# 5. 컨테이너 실행 시, JAR 파일을 실행하도록 설정
ENTRYPOINT ["java", "-jar", "app.jar"]