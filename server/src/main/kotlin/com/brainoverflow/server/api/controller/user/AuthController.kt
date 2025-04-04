package com.brainoverflow.server.api.controller.user

import com.brainoverflow.server.api.dto.request.user.LoginRequest
import com.brainoverflow.server.api.dto.request.user.SignupRequest
import com.brainoverflow.server.api.dto.response.user.TokenResponse
import com.brainoverflow.server.common.auth.JwtProvider
import com.brainoverflow.server.common.response.ApiResponse
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
    fun login(@RequestBody loginRequest: LoginRequest): ApiResponse<TokenResponse> {
        val response = authService.login(loginRequest)
        return ApiResponse.success(response)
    }

    @PostMapping("/signup")
    fun signup(@RequestBody signupRequest: SignupRequest): ApiResponse<Void> {
        authService.signup(signupRequest)
        return ApiResponse.success()
    }
}
