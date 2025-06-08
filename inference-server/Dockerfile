FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

# 환경 설정
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Seoul

# 필수 패키지 설치
RUN apt update && \
    apt install -y tzdata git wget unzip libglib2.0-0 libsm6 libxext6 libgl1 && \
    rm -rf /var/lib/apt/lists/*

# requirements.txt 설치
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# 전체 소스 복사
COPY . /app
WORKDIR /app

# 기본 실행 명령어
CMD ["python", "tools/inference.py", "--config=config/adni.yaml"]
