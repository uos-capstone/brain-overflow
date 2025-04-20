package com.brainoverflow.server.common.ws

import com.brainoverflow.server.common.auth.JwtProvider
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.http.server.ServletServerHttpRequest
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.server.HandshakeInterceptor
import org.springframework.web.util.UriComponentsBuilder

class JwtHandshakeInterceptor(
    private val jwtProvider: JwtProvider
) : HandshakeInterceptor {

    override fun beforeHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        attributes: MutableMap<String, Any>
    ): Boolean {
        // SockJS info/xhr 요청은 건너뛰기
        val upgrade = request.headers.getFirst("Upgrade")
        if (!upgrade.equals("websocket", ignoreCase = true)) {
            return true
        }

        // 1) Authorization 헤더에서 token 꺼내기
        val authHeader = request.headers.getFirst("Authorization")
        var token = authHeader
            ?.takeIf { it.startsWith("Bearer ") }
            ?.removePrefix("Bearer ")
            ?.trim()

        // 2) 헤더에 없으면 query param (?token=…) 에서 꺼내기
        if (token.isNullOrBlank() && request is ServletServerHttpRequest) {
            val params = UriComponentsBuilder.fromUri(request.uri)
                .build()
                .queryParams
            token = params.getFirst("token")
        }

        if (token.isNullOrBlank()) {
            println("JWT 토큰을 찾을 수 없습니다.")
            return false
        }

        return try {
            if (!jwtProvider.validateToken(token)) {
                return false
            }
            val userId = jwtProvider.getUserIdFromToken(token)
            attributes["userId"] = userId
            true
        } catch (ex: Exception) {
            println("JWT 검증 실패: ${ex.message}")
            false
        }
    }

    override fun afterHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        exception: Exception?
    ) {
        // 필요 시 로그 남기기
    }
}
