package com.brainoverflow.server.domain.exception

enum class ReturnCode(val code: String, val message: String) {
    // 성공 Response
    SUCCESS("1000", "요청에 성공하셨습니다."),

    // 토큰 관련
    NOT_EXIST_BEARER_SUFFIX("1100", "Bearer 접두사가 포함되지 않았습니다."),
    WRONG_JWT_TOKEN("1101", "잘못된 jwt 토큰입니다."),
    EXPIRED_JWT_TOKEN("1102", "만료된 jwt 토큰입니다"),

    // 유저 관련
    NOT_EXIST_USER("1202", "존재하지 않는 회원 입니다."),
    WRONG_PASSWORD("1203", "잘못된 패스워드 입니다."),

    // MRI 관련
    NOT_EXIST_IMAGE("1300", "존재하지 않는 MRI 이미지입니다."),
    NOT_EXIST_RESULT("1301", "존재하지 않는 MRI 결과 입니다."),

    // 채팅 관련
    USER_NOT_IN_ROOM("1400", "채팅방에 속하지 않은 유저는 초대할 수 없습니다."),
    ROOM_NOT_EXIST("1401", "채팅방이 존재하지 않습니다."),

    // 프로필 관련
    NOT_EXIST_PROFILE("1250", "존재하지 않는 프로필입니다."),

    // 클라이언트 에러
    WRONG_PARAMETER("8000", "잘못된 파라미터 입니다."),
    METHOD_NOT_ALLOWED("8001", "허용되지 않은 메소드 입니다."),

    // 서버 에러
    INTERNAL_SERVER_ERROR("9998", "내부 서버 에러 입니다."),
    EXTERNAL_SERVER_ERROR("9999", "외부 서버 에러 입니다."),
}
