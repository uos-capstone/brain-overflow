package com.brainoverflow.server.common.auth

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import java.security.Key
import java.util.*

@Component
class JwtProvider(
    @Value("\${jwt.secret}") secretKey: String,              // application.yml 등에서 주입
    @Value("\${jwt.expiration-ms}") val validityInMs: Long   // 만료시간(ms)
) {
    private val key: Key = Keys.hmacShaKeyFor(secretKey.toByteArray())

    // JWT 토큰 생성
    fun generateToken(authentication: Authentication): String {
        val now = Date()
        val expiry = Date(now.time + validityInMs)

        return Jwts.builder()
            .setSubject(authentication.name)           // username
            .setIssuedAt(now)
            .setExpiration(expiry)
            .signWith(key, SignatureAlgorithm.HS256)
            .compact()
    }

    // 토큰에서 username 추출
    fun getUsernameFromToken(token: String): String {
        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .body
            .subject
    }

    // 토큰 유효성 검사
    fun validateToken(token: String): Boolean {
        return try {
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
            true
        } catch (ex: Exception) {
            false
        }
    }
}
