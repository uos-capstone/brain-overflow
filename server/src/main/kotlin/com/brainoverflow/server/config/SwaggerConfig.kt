package com.brainoverflow.server.config

import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.security.SecurityScheme
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.SecurityRequirement as OASSecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme as OASSecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * Swagger UI에 JWT Bearer 입력 필드를 추가하는 설정
 */
@Configuration
@SecurityScheme(
    name = "BearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    `in` = SecuritySchemeIn.HEADER,
    paramName = "Authorization"
)
class SwaggerConfig {

    @Bean
    fun openApi(): OpenAPI {
        // API 기본 정보
        val info = Info()
            .title("BrainOverflow API")
            .version("v1")
            .description("BrainOverflow 서버 API 문서")

        // Components에 SecurityScheme 등록
        val securityScheme = OASSecurityScheme()
            .type(OASSecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .`in`(OASSecurityScheme.In.HEADER)
            .name("Authorization")

        val components = Components()
            .addSecuritySchemes("BearerAuth", securityScheme)

        // 전체 API에 SecurityRequirement 추가 (BearerAuth 필수)
        val securityItem = OASSecurityRequirement()
            .addList("BearerAuth")

        return OpenAPI()
            .components(components)
            .addSecurityItem(securityItem)
            .info(info)
    }
}
