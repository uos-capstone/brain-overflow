package com.brainoverflow.server.external.controller.user

import com.brainoverflow.server.external.dto.request.user.LoginRequest
import com.brainoverflow.server.external.dto.request.user.SignupRequest
import com.brainoverflow.server.external.dto.response.user.TokenResponse
import com.brainoverflow.server.external.controller.auth.JwtProvider
import com.brainoverflow.server.external.controller.response.ApiResponse
import com.brainoverflow.server.service.auth.AuthService
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/auth")
class AuthController(
    val authService: AuthService
) {
    @PostMapping("/login")
    fun login(@RequestBody loginRequest: com.brainoverflow.server.external.dto.request.user.LoginRequest): ApiResponse<TokenResponse> {
        val response = authService.login(loginRequest)
        return ApiResponse.success(response)
    }

    @PostMapping("/signup")
    fun signup(@RequestBody signupRequest: com.brainoverflow.server.external.dto.request.user.SignupRequest): ApiResponse<Void> {
        authService.signup(signupRequest)
        return ApiResponse.success()
    }
}
